from flask import Flask, render_template, url_for, flash, redirect, jsonify, request
from flask_cors import CORS
from forms import RegistrationForm, LoginForm
from dotenv import load_dotenv
from flask_pymongo import PyMongo
import bcrypt
import os
from datetime import datetime

load_dotenv()

app = Flask(__name__) 
CORS(app)


app.config["MONGO_URI"] = os.getenv('MONGO_URI')

mongo = PyMongo(app)
users_collection = mongo.db.users
bookmarks_collection = mongo.db.bookmarks


#@app.route('/api/get_google_maps', methods= ['GET'])
#def get_google_maps_api():
 #       api_key = os.getenv('GOOGLE_MAPS_API_KEY')
 #       if api_key:
 #           return jsonify({'api_key': api_key})
 #      else:
 #           return jsonify({'error':'API Key not found'}),404
    


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
            if existing_user:
                return jsonify({"errors": {"email": ["Email already exists"]}}), 400

            # Add user data to MongoDB
            hashed_password = bcrypt.hashpw(form.password.data.encode('utf-8'), bcrypt.gensalt())
            user_data = {
                "username": form.username.data,
                "email": form.email.data,
                "password": hashed_password.decode('utf-8')  # hashed
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
        print(f"Server error: {str(e)}")
        return jsonify({"errors": {"general": f"Server error: {str(e)}"}}), 500

@app.route("/api/add_bookmark", methods=['POST'])
def add_bookmark():
    try:
        data = request.get_json()
        name = data.get("name")
        latitude = data.get("latitude") 
        longitude = data.get("longitude")  

        if not name or latitude is None or longitude is None:
            return jsonify({"errors": {"general": "Missing required fields"}}), 400

        bookmark_data = {
            "name": name,
            "coordinates": {
                "lat": latitude,
                "lng": longitude
            }
        }
        bookmarks_collection.insert_one(bookmark_data)

        return jsonify({"message": "Bookmark (study spot) added successfully!"}), 201

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
        user_email = data.get("user_email")
        location_id = data.get("location_id")
        quietness = data.get("quietness", 0)
        seating = data.get("seating", 0)
        vibes = data.get("vibes", 0)
        crowdedness = data.get("crowdedness", 0)
        internet = data.get("internet", 0)
        comment = data.get("comment", "")

        if not user_email or not location_id:
            return jsonify({"errors": {"general": "Missing required fields: user_email and location_id"}}), 400

        # Get user information
        user = users_collection.find_one({"email": user_email})
        if not user:
            return jsonify({"errors": {"general": "User not found"}}), 404

        # Ensure location_id is an integer
        if isinstance(location_id, str) and location_id.isdigit():
            location_id = int(location_id)

        review_data = {
            "user_email": user_email,
            "user_id": str(user["_id"]),
            "location_id": location_id,
            "quietness": quietness,
            "seating": seating,
            "vibes": vibes,
            "crowdedness": crowdedness,
            "internet": internet,
            "comment": comment,
            "timestamp": datetime.utcnow()
        }

        # Check if user already has a review for this location
        existing_review = mongo.db.reviews.find_one({"user_email": user_email, "location_id": location_id})
        if existing_review:
            # Update existing review
            mongo.db.reviews.update_one({"_id": existing_review["_id"]}, {"$set": review_data})
            message = "Review updated successfully!"
        else:
            # Add review to reviews collection
            review_id = mongo.db.reviews.insert_one(review_data).inserted_id
            
            # Make sure the user has a reviews array
            if "reviews" not in user:
                users_collection.update_one(
                    {"_id": user["_id"]},
                    {"$set": {"reviews": []}}
                )
            
            # Update user's reviews list
            users_collection.update_one(
                {"_id": user["_id"]},
                {"$addToSet": {"reviews": str(review_id)}}
            )
            message = "Review added successfully!"

        # Return the updated review data
        review_data["_id"] = str(existing_review["_id"]) if existing_review else str(review_id)
        return jsonify({"message": message, "review": review_data}), 201

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

if __name__ == '__main__':
    print("Starting Flask server...")
    app.run(debug=True)