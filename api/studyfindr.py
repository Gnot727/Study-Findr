from flask import Flask, render_template, url_for, flash, redirect, jsonify, request, send_from_directory
from flask_cors import CORS
from forms import RegistrationForm, LoginForm
from dotenv import load_dotenv
from flask_pymongo import PyMongo
import bcrypt
import os
import requests
import json
import pymongo
import hashlib
import secrets
import time
import re
from datetime import datetime as dt
from werkzeug.utils import secure_filename
from pymongo import MongoClient
from gridfs import GridFS
import base64
from bson.objectid import ObjectId
from googlemaps import fetch_and_store_cafes

# Load environment variables from .env file
# Print the current working directory to help debug
print(f"Current working directory: {os.getcwd()}")
# Try to load .env file from both the current directory and parent directory
load_dotenv()
# Print to verify if MONGO_URI was loaded correctly
mongo_uri = os.getenv('MONGO_URI')
print(f"MONGO_URI loaded: {'Yes' if mongo_uri else 'No'}")

# Add configuration for file uploads
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

# Create uploads directory if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app = Flask(__name__) 
CORS(app)

app.config["MONGO_URI"] = os.getenv('MONGO_URI')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload

mongo = PyMongo(app)
users_collection = mongo.db.users
bookmarks_collection = mongo.db.bookmarks

# Create MongoDB client for additional database
mongo_client = MongoClient(mongo_uri)
places_db = mongo_client['places_db']
# Initialize GridFS for file storage
fs = GridFS(mongo.db)

# Migrate existing profile photos to GridFS
def migrate_existing_images():
    try:
        print("Starting migration of existing images to GridFS...")
        # Get all users with profile pictures
        users_with_pics = mongo.db.users.find({"profile_picture": {"$exists": True}})
        
        count = 0
        for user in users_with_pics:
            if "profile_picture" in user and user["profile_picture"].startswith("/uploads/"):
                # Extract the filename from the path
                filename = user["profile_picture"].replace("/uploads/", "")
                file_path = os.path.join(UPLOAD_FOLDER, filename)
                
                # Check if the file exists
                if os.path.exists(file_path):
                    try:
                        # Open and read the file
                        with open(file_path, 'rb') as f:
                            file_data = f.read()
                            
                        # Determine content type based on extension
                        content_type = "image/jpeg"  # Default
                        if filename.lower().endswith('.png'):
                            content_type = "image/png"
                        elif filename.lower().endswith('.gif'):
                            content_type = "image/gif"
                        
                        # Store in GridFS
                        file_id = fs.put(
                            file_data,
                            filename=filename,
                            content_type=content_type
                        )
                        
                        # Update the user record with the new file ID
                        mongo.db.users.update_one(
                            {"_id": user["_id"]},
                            {"$set": {"profile_picture": f"/uploads/{str(file_id)}"}}
                        )
                        
                        count += 1
                        print(f"Migrated image for user {user.get('username', user.get('email'))}")
                    except Exception as e:
                        print(f"Error migrating file {filename}: {str(e)}")
        
        print(f"Migration complete. Migrated {count} images.")
    except Exception as e:
        print(f"Migration error: {str(e)}")

# Helper function to check allowed file extensions
def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Helper function to convert MongoDB objects to JSON serializable format
def mongo_to_json_serializable(obj):
    if isinstance(obj, dict):
        # Handle ObjectId
        if '_id' in obj and not isinstance(obj['_id'], str):
            obj['_id'] = str(obj['_id'])
        
        # Convert all dates to ISO format strings
        for key, value in obj.items():
            if isinstance(value, dt):
                obj[key] = value.isoformat()
            elif isinstance(value, dict):
                obj[key] = mongo_to_json_serializable(value)
    
    return obj

@app.route("/api/register", methods=['POST'])
def api_register_json():
    try:
        data = request.get_json()
        print("Received data:", data)
        
        if not data:
            return jsonify({"errors": {"general": "No data received"}}), 400
            
        form = RegistrationForm(data=data, meta={'csrf': False})
        if form.validate():
            # Check if email already exists
            existing_user = users_collection.find_one({"email": form.email.data})
            if (existing_user):
                return jsonify({"errors": {"email": ["Email already exists"]}}), 400

            # Add user data to MongoDB
            hashed_password = bcrypt.hashpw(form.password.data.encode('utf-8'), bcrypt.gensalt())
            user_data = {
                "username": form.username.data,
                "email": form.email.data,
                "password": hashed_password.decode('utf-8'),  # hashed
                "weekly_goal_hours": 8,
                "current_weekly_hours": 0,
                "bookmarks": []
            }
            users_collection.insert_one(user_data)
            print(f"User registered: {user_data['username']}")

            return jsonify({"message": f"Account created for {form.username.data}!"}), 201
        
        return jsonify({"errors": form.errors}), 400
        
    except Exception as e:
        print(f"Server error: {str(e)}")
        return jsonify({"errors": {"general": f"Server error: {str(e)}"}}), 500


@app.route("/api/login", methods=['POST'])
def api_login_json():
    try:
        data = request.get_json()
        print("Login attempt:", data)
        
        if not data:
            return jsonify({"errors": {"general": "No data received"}}), 400
            
        form = LoginForm(data=data, meta={'csrf': False})
        if form.validate():
            # Check MongoDB for the user
            user = users_collection.find_one({"email": form.email.data})
            
            if user and bcrypt.checkpw(form.password.data.encode('utf-8'), user["password"].encode('utf-8')):
                return jsonify({"message": "Login successful"}), 200
            
            # Fallback to default admin login for development
            if form.email.data == "admin@blog.com" and form.password.data == "password":
                return jsonify({"message": "Login successful"}), 200
                
            return jsonify({"errors": {"general": "Invalid email or password"}}), 401
            
        return jsonify({"errors": form.errors}), 400
        
    except Exception as e:
        print(f"Server error during login: {str(e)}")
        # Make sure we always return a valid JSON response
        return jsonify({"errors": {"general": f"Server error: {str(e)}"}}), 500

@app.route("/api/add_bookmark", methods=['POST'])
def add_bookmark():
    try:
        data = request.get_json()
        # Optional user email to auto-associate bookmark
        email = data.get("email")
        name = data.get("name")
        latitude = data.get("latitude") 
        longitude = data.get("longitude")
        place_id = data.get("place_id")  # Optional, for MongoDB locations
        description = data.get("description")  # Optional
        address = data.get("address")  # Optional
        rating = data.get("rating")  # Optional
        
        # Validate required fields
        if not name or latitude is None or longitude is None:
            return jsonify({"errors": {"general": "Missing required fields"}}), 400

        # Create bookmark data structure
        bookmark_data = {
            "name": name,
            "coordinates": {
                "lat": latitude,
                "lng": longitude
            },
            "created_at": dt.utcnow()
        }
        
        # Add optional fields if they exist
        if place_id:
            bookmark_data["place_id"] = place_id
        if description:
            bookmark_data["description"] = description
        if address:
            bookmark_data["address"] = address
        if rating:
            bookmark_data["rating"] = rating
        
        # Add user email to bookmark document if provided
        if email:
            bookmark_data["user_email"] = email
        
        # Check if this bookmark already exists
        existing = None
        if place_id:
            # If we have a place_id, search by that first (most reliable)
            existing = bookmarks_collection.find_one({"place_id": place_id})
        
        # If not found by place_id, try by location coordinates
        if not existing:
            existing = bookmarks_collection.find_one({
                "name": name,
                "coordinates.lat": latitude,
                "coordinates.lng": longitude
            })
        
        if existing:
            bookmark_id_str = str(existing["_id"])
            # If an email is provided, add this bookmark to the user's bookmarks
            if email:
                # Make sure the bookmark ID is in the bookmarks array
                users_collection.update_one(
                    {"email": email},
                    {"$addToSet": {"bookmarks": bookmark_id_str}}
                )
                
                # If place_id is provided and the existing bookmark doesn't have it,
                # add it to make future lookups easier
                if place_id and "place_id" not in existing:
                    bookmarks_collection.update_one(
                        {"_id": existing["_id"]},
                        {"$set": {"place_id": place_id}}
                    )
            
            # Return the existing bookmark ID
            return jsonify({
                "message": "This location is already bookmarked",
                "id": bookmark_id_str
            }), 409
         
        # Insert the new bookmark
        result = bookmarks_collection.insert_one(bookmark_data)
        bookmark_id_str = str(result.inserted_id)
        
        # If an email is provided, add this new bookmark to the user's bookmarks
        if email:
            users_collection.update_one(
                {"email": email},
                {"$addToSet": {"bookmarks": bookmark_id_str}}
            )
        
        # Return the new bookmark ID
        return jsonify({
            "message": "Bookmark (study spot) added successfully!",
            "id": bookmark_id_str
        }), 201

    except Exception as e:
        return jsonify({"errors": {"general": f"Server error: {str(e)}"}}), 500
    

@app.route("/api/get_study_spot_vectors", methods=['GET'])
def get_study_spot_vectors():
    try:
        bookmarks = bookmarks_collection.find({}, {"_id": 0, "coordinates": 1})
        coordinates_vector = [bookmark["coordinates"] for bookmark in bookmarks]
        return jsonify({"vectors": coordinates_vector}), 200

    except Exception as e:
        return jsonify({"errors": {"general": f"Server error: {str(e)}"}}), 500

# NEW ENDPOINT FOR REVIEWS
@app.route("/api/add_review", methods=['POST'])
def add_review():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ["user_email", "location_id", "quietness", "seating", "vibes", "crowdedness", "internet"]
        errors = {}
        
        for field in required_fields:
            if field not in data or data[field] is None:
                errors[field] = f"Missing required field: {field}"
        
        if errors:
            return jsonify({"errors": errors}), 400
        
        # Add timestamp for creation/update
        data["created_at"] = dt.utcnow()
        
        # Initialize likes and dislikes arrays
        data["likes"] = []
        data["dislikes"] = []
        
        # Check if review already exists
        existing_review = mongo.db.reviews.find_one({
            "user_email": data["user_email"],
            "location_id": data["location_id"]
        })
        
        if existing_review:
            # Update existing review
            result = mongo.db.reviews.update_one(
                {
                    "user_email": data["user_email"],
                    "location_id": data["location_id"]
                },
                {"$set": {
                    "quietness": data["quietness"],
                    "seating": data["seating"],
                    "vibes": data["vibes"],
                    "crowdedness": data["crowdedness"],
                    "internet": data["internet"],
                    "comment": data.get("comment", ""),
                    "updated_at": dt.utcnow()
                    # Don't reset likes/dislikes when updating
                }}
            )
            
            if result.modified_count == 1:
                # Get the updated review
                updated_review = mongo.db.reviews.find_one({
                    "user_email": data["user_email"],
                    "location_id": data["location_id"]
                })
                
                # Convert ObjectId to string
                updated_review["_id"] = str(updated_review["_id"])
                
                return jsonify({
                    "message": "Review updated successfully",
                    "review": updated_review
                }), 200
            else:
                return jsonify({"errors": {"general": "Failed to update review"}}), 500
        else:
            # Insert new review
            result = mongo.db.reviews.insert_one(data)
            
            if result.inserted_id:
                # Get the inserted review
                new_review = mongo.db.reviews.find_one({"_id": result.inserted_id})
                
                # Convert ObjectId to string
                new_review["_id"] = str(new_review["_id"])
                
                return jsonify({
                    "message": "Review added successfully",
                    "review": new_review
                }), 201
            else:
                return jsonify({"errors": {"general": "Failed to add review"}}), 500
                
    except Exception as e:
        return jsonify({"errors": {"general": f"Server error: {str(e)}"}}), 500

# NEW ENDPOINT FOR FETCHING A REVIEW
@app.route("/api/get_review", methods=['GET'])
def get_review():
    try:
        user_email = request.args.get("user_email")
        location_id = request.args.get("location_id")
        if not user_email or not location_id:
            return jsonify({"errors": {"general": "Missing required query parameters: user_email and location_id"}}), 400
        
        # Ensure location_id is in the correct format
        if location_id.isdigit():
            location_id = int(location_id)
        
        review = mongo.db.reviews.find_one({"user_email": user_email, "location_id": location_id})
        if review:
            review["_id"] = str(review["_id"])
            return jsonify({"review": review}), 200
        else:
            return jsonify({"review": None}), 200
    except Exception as e:
        return jsonify({"errors": {"general": f"Server error: {str(e)}"}}), 500

# New endpoint to get all reviews for a user
@app.route("/api/get_user_reviews", methods=['GET'])
def get_user_reviews():
    try:
        user_email = request.args.get("user_email")
        if not user_email:
            return jsonify({"errors": {"general": "Missing required query parameter: user_email"}}), 400
        
        reviews = list(mongo.db.reviews.find({"user_email": user_email}))
        for review in reviews:
            review["_id"] = str(review["_id"])
        
        return jsonify({"reviews": reviews}), 200
    except Exception as e:
        return jsonify({"errors": {"general": f"Server error: {str(e)}"}}), 500

# Endpoint to get all reviews for a location
@app.route("/api/get_location_reviews", methods=['GET'])
def get_location_reviews():
    try:
        location_id = request.args.get("location_id")
        if not location_id:
            return jsonify({"errors": {"general": "Missing required query parameter: location_id"}}), 400
        
        # Get pagination parameters
        page = request.args.get("page", 0, type=int)
        limit = request.args.get("limit", 10, type=int)
        
        # Get sorting parameters
        sort_by = request.args.get("sort_by", "created_at")  # Default sort by creation date
        sort_order = request.args.get("sort_order", "-1")  # Default newest first
        sort_order = int(sort_order)
        
        # Ensure location_id is in the correct format
        if location_id.isdigit():
            location_id = int(location_id)
        
        # Apply pagination
        skip = page * limit
        
        # Find reviews with pagination
        reviews_cursor = mongo.db.reviews.find({"location_id": location_id})
        
        # Apply sorting
        if sort_by == "likes":
            # Sort by number of likes (most liked first if sort_order is -1)
            pipeline = [
                {"$match": {"location_id": location_id}},
                {"$addFields": {"likes_count": {"$size": {"$ifNull": ["$likes", []]}}}},
                {"$sort": {"likes_count": sort_order, "created_at": -1}},  # Secondary sort by date
                {"$skip": skip},
                {"$limit": limit}
            ]
            reviews = list(mongo.db.reviews.aggregate(pipeline))
            
            # Count total documents for pagination
            total_count = mongo.db.reviews.count_documents({"location_id": location_id})
        else:
            # Sort by date or other fields directly
            reviews_cursor = reviews_cursor.sort(sort_by, sort_order)
            
            # Get total count before applying pagination
            total_count = mongo.db.reviews.count_documents({"location_id": location_id})
            
            # Apply pagination
            reviews_cursor = reviews_cursor.skip(skip).limit(limit)
            
            # Convert cursor to list
            reviews = list(reviews_cursor)
        
        # Convert ObjectIds to strings and add user info
        for review in reviews:
            # Convert ObjectId to string
            review["_id"] = str(review["_id"])
            
            # Add likes and dislikes count
            review["likes_count"] = len(review.get("likes", []))
            review["dislikes_count"] = len(review.get("dislikes", []))
            
            # Format dates as ISO strings
            if "created_at" in review:
                if isinstance(review["created_at"], dt):
                    review["created_at"] = review["created_at"].isoformat()
            
            if "updated_at" in review:
                if isinstance(review["updated_at"], dt):
                    review["updated_at"] = review["updated_at"].isoformat()
            
            # Try to get the user's information from the users collection
            if "user_email" in review:
                user = mongo.db.users.find_one({"email": review["user_email"]})
                if user:
                    # Add username
                    if "username" in user:
                        review["user_name"] = user["username"]
                    
                    # Add profile picture if available
                    if "profile_picture" in user:
                        review["profile_picture"] = user["profile_picture"]
        
        return jsonify({
            "reviews": reviews,
            "total_count": total_count,
            "page": page,
            "limit": limit,
            "has_more": skip + len(reviews) < total_count
        }), 200
    except Exception as e:
        return jsonify({"errors": {"general": f"Server error: {str(e)}"}}), 500

# New endpoint to like or dislike a review
@app.route("/api/rate_review", methods=['POST'])
def rate_review():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ["review_id", "user_email", "action"]
        errors = {}
        
        for field in required_fields:
            if field not in data or data[field] is None:
                errors[field] = f"Missing required field: {field}"
        
        if errors:
            return jsonify({"errors": errors}), 400
        
        review_id = data["review_id"]
        user_email = data["user_email"]
        action = data["action"]  # 'like' or 'dislike' or 'remove'
        
        from bson.objectid import ObjectId
        
        # First get the review to check current state
        review = mongo.db.reviews.find_one({"_id": ObjectId(review_id)})
        if not review:
            return jsonify({"errors": {"review_id": "Review not found"}}), 404
        
        # Initialize likes and dislikes if they don't exist
        likes = review.get("likes", [])
        dislikes = review.get("dislikes", [])
        
        # Update based on action
        if action == "like":
            # Remove from dislikes if present
            if user_email in dislikes:
                dislikes.remove(user_email)
            
            # Add to likes if not already there
            if user_email not in likes:
                likes.append(user_email)
        
        elif action == "dislike":
            # Remove from likes if present
            if user_email in likes:
                likes.remove(user_email)
            
            # Add to dislikes if not already there
            if user_email not in dislikes:
                dislikes.append(user_email)
        
        elif action == "remove":
            # Remove from both lists
            if user_email in likes:
                likes.remove(user_email)
            if user_email in dislikes:
                dislikes.remove(user_email)
        
        # Update the review
        result = mongo.db.reviews.update_one(
            {"_id": ObjectId(review_id)},
            {"$set": {
                "likes": likes,
                "dislikes": dislikes
            }}
        )
        
        if result.modified_count == 1:
            return jsonify({
                "message": f"Review {action} successful",
                "likes_count": len(likes),
                "dislikes_count": len(dislikes)
            }), 200
        else:
            return jsonify({"message": "No changes were made"}), 200
            
    except Exception as e:
        return jsonify({"errors": {"general": f"Server error: {str(e)}"}}), 500

# Endpoint to get user data
@app.route("/api/get_user", methods=['GET'])
def get_user():
    try:
        user_email = request.args.get("email")
        if not user_email:
            return jsonify({"errors": {"general": "Missing required query parameter: email"}}), 400
        
        user = mongo.db.users.find_one({"email": user_email})
        if user:
            # Remove sensitive information
            if "_id" in user:
                user["_id"] = str(user["_id"])
            if "password" in user:
                del user["password"]
            
            return jsonify({"user": user}), 200
        else:
            return jsonify({"user": None}), 404
    except Exception as e:
        return jsonify({"errors": {"general": f"Server error: {str(e)}"}}), 500

# Helper function to save file to GridFS
def save_file_to_gridfs(file):
    if file and file.filename and allowed_file(file.filename):
        # Generate a unique filename
        filename = secure_filename(file.filename)
        # Store file in GridFS
        file_id = fs.put(
            file.stream.read(), 
            filename=filename,
            content_type=file.content_type
        )
        return str(file_id)
    return None

# Endpoint to update user profile
@app.route("/api/update_profile", methods=['POST'])
def update_profile():
    try:
        # Get email from form data
        email = request.form.get('email')
        if not email:
            return jsonify({"errors": {"email": "Email is required"}}), 400
        
        # Find the user in the database
        user = mongo.db.users.find_one({"email": email})
        if not user:
            return jsonify({"errors": {"email": "User not found"}}), 404
        
        # Prepare update data
        update_data = {}
        
        # Get username if provided
        username = request.form.get('username')
        
        if username:
            update_data["username"] = username
        
        # Handle profile picture upload
        if 'profile_picture' in request.files:
            file = request.files['profile_picture']
            if file and file.filename and allowed_file(file.filename):
                # Save file to GridFS and get the file ID
                file_id = save_file_to_gridfs(file)
                if file_id:
                    # Store the file ID in the database
                    update_data["profile_picture"] = f"/uploads/{file_id}"
        
        # Update the user if we have data to update
        if update_data:
            mongo.db.users.update_one(
                {"_id": user["_id"]},
                {"$set": update_data}
            )
            
            # Get the updated user data
            updated_user = mongo.db.users.find_one({"_id": user["_id"]})
            if updated_user:
                if "_id" in updated_user:
                    updated_user["_id"] = str(updated_user["_id"])
                if "password" in updated_user:
                    del updated_user["password"]
                
                return jsonify({
                    "message": "Profile updated successfully",
                    "user": updated_user
                }), 200
        
        return jsonify({"message": "No changes to update"}), 200
        
    except Exception as e:
        return jsonify({"errors": {"general": f"Server error: {str(e)}"}}), 500

# Serve uploaded files from GridFS
@app.route('/uploads/<file_id>')
def uploaded_file(file_id):
    try:
        # Try to convert string ID to ObjectId
        obj_id = ObjectId(file_id)
        # Retrieve file from GridFS
        file = fs.get(obj_id)
        # Create a response with the file content
        response = app.response_class(
            response=file.read(),
            status=200,
            mimetype=file.content_type
        )
        return response
    except Exception as e:
        print(f"Error retrieving file: {str(e)}")
        return jsonify({"error": "File not found"}), 404

# Endpoint to get cafes from places_db
@app.route("/api/get_cafes", methods=['GET'])
def get_cafes():
    try:
        # Get all cafes from the cafes collection
        cafes_cursor = places_db.cafes.find({})
        
        # Convert cursor to list and process data
        cafes = []
        for cafe in cafes_cursor:
            # Format the cafe data for frontend use
            location = {
                "id": str(cafe["_id"]),
                "name": cafe.get("name", "Unknown Cafe"),
                "position": {
                    "lat": cafe["geometry"]["location"]["lat"],
                    "lng": cafe["geometry"]["location"]["lng"]
                },
                "type": "cafe",
                "icon": cafe.get("icon", ""),
                "icon_background_color": cafe.get("icon_background_color", ""),
                "place_id": cafe.get("place_id", ""),
                "rating": cafe.get("rating", 0),
                "vicinity": cafe.get("vicinity", ""),
                "business_status": cafe.get("business_status", "")
            }
            cafes.append(location)
        
        return jsonify({"cafes": cafes}), 200
    except Exception as e:
        print(f"Error fetching cafes: {str(e)}")
        return jsonify({"errors": {"general": f"Server error: {str(e)}"}}), 500

@app.route("/api/update_weekly_goal", methods=['POST'])
def update_weekly_goal():
    try:
        data = request.get_json()
        email = data.get("email")
        new_goal = data.get("weekly_goal_hours")

        if not email or new_goal is None:
            return jsonify({"errors": {"general": "Missing email or goal value"}}), 400

        result = users_collection.update_one(
            {"email": email},
            {"$set": {"weekly_goal_hours": new_goal}}
        )

        if result.modified_count == 1:
            return jsonify({"message": "Weekly goal updated successfully"}), 200
        return jsonify({"message": "No changes made"}), 200

    except Exception as e:
        return jsonify({"errors": {"general": f"Server error: {str(e)}"}}), 500

@app.route("/api/update_current_hours", methods=['POST'])
def update_current_hours():
    try:
        data = request.get_json()
        email = data.get("email")
        new_hours = data.get("current_weekly_hours")

        if not email or new_hours is None:
            return jsonify({"errors": {"general": "Missing email or hours"}}), 400

        result = users_collection.update_one(
            {"email": email},
            {"$set": {"current_weekly_hours": new_hours}}
        )

        if result.modified_count == 1:
            return jsonify({"message": "Weekly hours updated successfully"}), 200
        return jsonify({"message": "No changes made"}), 200

    except Exception as e:
        return jsonify({"errors": {"general": f"Server error: {str(e)}"}}), 500

@app.route("/api/reset_current_hours", methods=['POST'])
def reset_current_hours():
    try:
        data = request.get_json()
        email = data.get("email")

        if not email:
            return jsonify({"errors": {"general": "Missing email"}}), 400

        result = users_collection.update_one(
            {"email": email},
            {"$set": {"current_weekly_hours": 0}}
        )

        if result.modified_count == 1:
            return jsonify({"message": "Weekly hours reset to 0"}), 200
        return jsonify({"message": "No changes made"}), 200

    except Exception as e:
        return jsonify({"errors": {"general": f"Server error: {str(e)}"}}), 500
    
@app.route("/api/get_weekly_goal", methods=['GET'])
def get_weekly_goal():
    try:
        email = request.args.get("email")
        if not email:
            return jsonify({"errors": {"general": "Missing email"}}), 400

        user = users_collection.find_one({"email": email})
        if not user:
            return jsonify({"errors": {"general": "User not found"}}), 404

        goal = user.get("weekly_goal_hours", None)
        return jsonify({"weekly_goal_hours": goal}), 200

    except Exception as e:
        return jsonify({"errors": {"general": f"Server error: {str(e)}"}}), 500
    
@app.route("/api/get_current_hours", methods=['GET'])
def get_current_hours():
    try:
        email = request.args.get("email")
        if not email:
            return jsonify({"errors": {"general": "Missing email"}}), 400

        user = users_collection.find_one({"email": email})
        if not user:
            return jsonify({"errors": {"general": "User not found"}}), 404

        current = user.get("current_weekly_hours", None)
        return jsonify({"current_weekly_hours": current}), 200

    except Exception as e:
        return jsonify({"errors": {"general": f"Server error: {str(e)}"}}), 500

@app.route("/api/add_user_bookmark", methods=['POST'])
def add_user_bookmark():
    try:
        data = request.get_json()
        email = data.get("email")
        bookmark_id = data.get("bookmark_id")

        if not email or not bookmark_id:
            return jsonify({"errors": {"general": "Missing email or bookmark_id"}}), 400

        result = users_collection.update_one(
            {"email": email},
            {"$addToSet": {"bookmarks": bookmark_id}}  # Avoid duplicates
        )

        if result.modified_count == 1:
            return jsonify({"message": "Bookmark added to user"}), 200
        return jsonify({"message": "No changes made (maybe already added)"}), 200

    except Exception as e:
        return jsonify({"errors": {"general": f"Server error: {str(e)}"}}), 500   
    

@app.route("/api/remove_user_bookmark", methods=['POST'])
def remove_user_bookmark():
    try:
        data = request.get_json()
        email = data.get("email")
        bookmark_id = data.get("bookmark_id")

        if not email or not bookmark_id:
            return jsonify({"errors": {"general": "Missing email or bookmark_id"}}), 400
            
        print(f"Attempting to remove bookmark {bookmark_id} for user {email}")
        
        # Import ObjectId directly from bson 
        from bson.objectid import ObjectId
        
        # Get the user document
        user = users_collection.find_one({"email": email})
        if not user:
            return jsonify({"errors": {"general": "User not found"}}), 404
            
        # Get the current bookmarks
        current_bookmarks = user.get("bookmarks", [])
        print(f"Current bookmarks: {current_bookmarks}")
        
        # Track if we've removed any bookmarks
        removed = False
        
        # Create a new bookmarks list to keep bookmarks that don't match
        new_bookmarks = []
        for bid in current_bookmarks:
            # Convert both IDs to strings and normalize by stripping any 'place-' prefix
            bid_str = str(bid)
            if bid_str.startswith("place-"):
                bid_str = bid_str.replace("place-", "")
                
            bookmark_id_str = str(bookmark_id)
            if bookmark_id_str.startswith("place-"):
                bookmark_id_str = bookmark_id_str.replace("place-", "")
                
            # Compare normalized strings
            if bid_str != bookmark_id_str:
                new_bookmarks.append(bid)
            else:
                removed = True
                print(f"Matched bookmark to remove: {bid_str} vs {bookmark_id_str}")
                
        # Only update if we actually removed something
        if removed:
            result = users_collection.update_one(
                {"email": email},
                {"$set": {"bookmarks": new_bookmarks}}
            )
            print(f"Updated user bookmarks. Modified count: {result.modified_count}")
            return jsonify({"message": "Bookmark removed from user"}), 200
        else:
            print(f"No matching bookmark found to remove")
            return jsonify({"message": "No changes made - bookmark not found"}), 200

    except Exception as e:
        print(f"Error removing bookmark: {str(e)}")
        return jsonify({"errors": {"general": f"Server error: {str(e)}"}}), 500
    
@app.route("/api/get_user_bookmarks", methods=['GET'])
def get_user_bookmarks():
    try:
        email = request.args.get("email")
        if not email:
            return jsonify({"errors": {"general": "Missing email"}}), 400

        user = users_collection.find_one({"email": email})
        if not user:
            return jsonify({"errors": {"general": "User not found"}}), 404

        # Get bookmark IDs from user document
        bookmark_ids = user.get("bookmarks", [])
        print(f"Found {len(bookmark_ids)} bookmark IDs for user {email}: {bookmark_ids}")
        
        if not bookmark_ids:
            return jsonify({"bookmarks": []}), 200
        
        # Import ObjectId directly from bson to avoid pymongo attribute error
        from bson.objectid import ObjectId
        
        # Convert string IDs to ObjectId only for valid ObjectId strings
        object_ids = []
        non_object_ids = []
        
        for bid in bookmark_ids:
            try:
                # Check if it's a valid ObjectId format
                if bid and len(str(bid)) == 24 and all(c in '0123456789abcdefABCDEF' for c in str(bid)):
                    object_ids.append(ObjectId(bid))
                else:
                    non_object_ids.append(str(bid))
            except Exception as e:
                print(f"Error converting ID {bid} to ObjectId: {str(e)}")
                # If conversion fails, keep as string
                non_object_ids.append(str(bid))
        
        print(f"Object IDs: {object_ids}")
        print(f"Non-Object IDs: {non_object_ids}")
        
        # First, find bookmarks with ObjectIds
        mongo_bookmarks = list(bookmarks_collection.find({"_id": {"$in": object_ids}})) if object_ids else []
        print(f"Found {len(mongo_bookmarks)} bookmarks by ObjectId")
        
        # Also find bookmarks with place_id that matches non-ObjectId strings
        place_id_bookmarks = list(bookmarks_collection.find({"place_id": {"$in": non_object_ids}})) if non_object_ids else []
        print(f"Found {len(place_id_bookmarks)} bookmarks by place_id")
        
        # As a fallback, try to find by _id as string too
        id_string_bookmarks = []
        for bid in non_object_ids:
            bookmark = bookmarks_collection.find_one({"_id": bid})
            if bookmark:
                id_string_bookmarks.append(bookmark)
        
        print(f"Found {len(id_string_bookmarks)} bookmarks by string _id")
        
        # Combine all result sets
        bookmarks = mongo_bookmarks + place_id_bookmarks + id_string_bookmarks
        
        # Process all bookmarks for response
        for b in bookmarks:
            if "_id" in b:
                b["_id"] = str(b["_id"])
            if "coordinates" in b and isinstance(b["coordinates"], dict):
                b["position"] = b["coordinates"]  # Add position for frontend compatibility
            if "created_at" in b and isinstance(b["created_at"], dt):
                b["created_at"] = b["created_at"].isoformat()

        print(f"Returning {len(bookmarks)} total bookmarks")
        return jsonify({"bookmarks": bookmarks}), 200

    except Exception as e:
        print(f"Error in get_user_bookmarks: {str(e)}")
        return jsonify({"errors": {"general": f"Server error: {str(e)}"}}), 500
    

@app.route("/api/get_bookmarks", methods=['GET'])
def get_bookmarks():
    try:
        user_email = request.args.get("user_email")
        
        if user_email:
            # Find the user
            user = users_collection.find_one({"email": user_email})
            if not user:
                return jsonify({"errors": {"general": "User not found"}}), 404
                
            # Query bookmarks collection for this user's bookmarks
            bookmarks = list(bookmarks_collection.find({"user_email": user_email}))
        else:
            # Find all bookmarks if no user email is provided
            bookmarks = list(bookmarks_collection.find({}))
        
        # Convert ObjectIds to strings in the response
        for bookmark in bookmarks:
            if "_id" in bookmark:
                bookmark["_id"] = str(bookmark["_id"])
        
        return jsonify({"bookmarks": bookmarks}), 200
        
    except Exception as e:
        return jsonify({"errors": {"general": f"Server error: {str(e)}"}}), 500

@app.route("/api/remove_bookmark", methods=['POST'])
def remove_bookmark():
    try:
        data = request.get_json()
        bookmark_id = data.get("bookmark_id")

        if not bookmark_id:
            return jsonify({"errors": {"general": "Missing bookmark_id"}}), 400
            
        print(f"Attempting to remove bookmark {bookmark_id} from bookmarks_collection")
        
        # Import ObjectId directly from bson
        from bson.objectid import ObjectId
        
        # Try to convert string ID to ObjectId if it's a valid format
        try:
            if bookmark_id and len(str(bookmark_id)) == 24 and all(c in '0123456789abcdefABCDEF' for c in str(bookmark_id)):
                object_id = ObjectId(bookmark_id)
                # Delete by ObjectId
                result = bookmarks_collection.delete_one({"_id": object_id})
                if result.deleted_count > 0:
                    print(f"Successfully removed bookmark with ObjectId: {bookmark_id}")
                    return jsonify({"message": "Bookmark removed successfully"}), 200
        except Exception as e:
            print(f"Error converting ID to ObjectId or deleting: {str(e)}")
            # Continue with other deletion attempts
        
        # If deletion by ObjectId failed or ID format is invalid, try by place_id
        result = bookmarks_collection.delete_one({"place_id": bookmark_id})
        if result.deleted_count > 0:
            print(f"Successfully removed bookmark with place_id: {bookmark_id}")
            return jsonify({"message": "Bookmark removed successfully"}), 200
            
        # No bookmark was found to remove
        print(f"No bookmark found to remove with ID: {bookmark_id}")
        return jsonify({"message": "No bookmark found with this ID"}), 404

    except Exception as e:
        print(f"Error removing bookmark from collection: {str(e)}")
        return jsonify({"errors": {"general": f"Server error: {str(e)}"}}), 500

# Run migration on app startup
with app.app_context():
    migrate_existing_images()
    
if __name__ == "__main__":
    app.run(debug=True)