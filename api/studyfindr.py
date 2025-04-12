from flask import Flask, render_template, url_for, flash, redirect, jsonify, request
from flask_cors import CORS
from forms import RegistrationForm, LoginForm
from dotenv import load_dotenv
from flask_pymongo import PyMongo
import bcrypt
import os

load_dotenv()

app = Flask(__name__) 
CORS(app)


app.config["MONGO_URI"] = os.getenv('MONGO_URI')

mongo = PyMongo(app)
users_collection = mongo.db.users
bookmarks_collection = mongo.db.bookmarks
locations_collection = mongo.db.locations

'''
old register method
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
'''

@app.route("/api/register", methods=['POST'])
def api_register_json():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"errors": {"general": "No data received"}}), 400

        form = RegistrationForm(data=data, meta={'csrf': False})
        if form.validate():
            existing_user = users_collection.find_one({"email": form.email.data})
            if existing_user:
                return jsonify({"errors": {"email": ["Email already exists"]}}), 400

            hashed_password = bcrypt.hashpw(form.password.data.encode('utf-8'), bcrypt.gensalt())

            user_data = {
                "username": form.username.data,
                "email": form.email.data,
                "password": hashed_password.decode('utf-8'),
                "weeklyGoalHours": 0,
                "weeklyProgress": 0,
                "bookmarks": [],
                "reviews": []
            }

            users_collection.insert_one(user_data)
            return jsonify({"message": f"Account created for {form.username.data}!"}), 201

        return jsonify({"errors": form.errors}), 400

    except Exception as e:
        return jsonify({"errors": {"general": f"Server error: {str(e)}"}}), 500
    

@app.route("/api/user/<email>/set_goal", methods=["POST"])
def set_weekly_goal(email):
    data = request.get_json()
    new_goal = data.get("weeklyGoalHours")

    if new_goal is None:
        return jsonify({"error": "weeklyGoalHours is required"}), 400

    users_collection.update_one(
        {"email": email},
        {"$set": {"weeklyGoalHours": new_goal}}
    )

    return jsonify({"message": "Goal updated"}), 200

@app.route("/api/user/<email>/add_progress", methods=["POST"])
def add_weekly_progress(email):
    data = request.get_json()
    minutes = data.get("minutes")

    if minutes is None:
        return jsonify({"error": "minutes is required"}), 400

    users_collection.update_one(
        {"email": email},
        {"$inc": {"weeklyProgress": minutes}}
    )

    return jsonify({"message": "Progress added"}), 200

@app.route("/api/user/<email>/reset_progress", methods=["POST"])
def reset_weekly_progress(email):
    users_collection.update_one(
        {"email": email},
        {"$set": {"weeklyProgress": 0}}
    )

    return jsonify({"message": "Weekly progress reset"}), 200

@app.route("/api/user/<email>/add_bookmark", methods=["POST"])
def add_bookmark_to_user(email):
    data = request.get_json()
    required = ["spotId", "spotName"]

    if not all(field in data for field in required):
        return jsonify({"error": "Missing required bookmark fields"}), 400

    bookmark = {
        "spotId": data["spotId"],
        "spotName": data["spotName"],
        "savedAt": data.get("savedAt", None)
    }

    users_collection.update_one(
        {"email": email},
        {"$push": {"bookmarks": bookmark}}
    )

    return jsonify({"message": "Bookmark added"}), 200

@app.route("/api/user/<email>/remove_bookmark", methods=["POST"])
def remove_bookmark(email):
    data = request.get_json()
    spot_id = data.get("spotId")

    if not spot_id:
        return jsonify({"error": "spotId required"}), 400

    users_collection.update_one(
        {"email": email},
        {"$pull": {"bookmarks": {"spotId": spot_id}}}
    )

    return jsonify({"message": "Bookmark removed"}), 200


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

@app.route("/api/add_location", methods=["POST"])
def add_location():
    try:
        data = request.get_json()

        required_fields = ["name", "latitude", "longitude", "opening_hours", "types", "vicinity", "rating", "photos"]
        missing_fields = [field for field in required_fields if field not in data]

        if missing_fields:
            return jsonify({"errors": {"missing": missing_fields}}), 400

        location_data = {
            "name": data["name"],
            "geometry": {
                "location": {
                    "lat": data["latitude"],
                    "lng": data["longitude"]
                }
            },
            "opening_hours": data["opening_hours"],       # need to clarify data types
            "types": data["types"],                      
            "vicinity": data["vicinity"],                
            "rating": data["rating"],               
            "photos": data["photos"]                    
        }

        locations_collection = mongo.db.locations
        locations_collection.insert_one(location_data)

        return jsonify({"message": "Location added successfully!"}), 201

    except Exception as e:
        print(f"Error adding location: {e}")
        return jsonify({"errors": {"general": f"Server error: {str(e)}"}}), 500


@app.route("/api/get_locations", methods=['GET'])
def get_locations():
    try:
        locations_collection = mongo.db.locations
        cursor = locations_collection.find()
        formatted_locations = []

        for index, loc in enumerate(cursor):

            formatted = {
                "id": f"mongo-{index}",
                "position": {
                    "lat": loc.get("geometry", {}).get("location", {}).get("lat"),
                    "lng": loc.get("geometry", {}).get("location", {}).get("lng")
                },

                "name": loc.get("name"),
                "hours": loc.get("opening_hours"),
                "description": ", ".join(loc.get("types", [])),
                "address": loc.get("vicinity"),
                "rating": loc.get("rating"),
                "photos": loc.get("photos")
            }
            formatted_locations.append(formatted)
        return jsonify({"results": formatted_locations}), 200

    except Exception as e:
        print(f"Error fetching locations: {e}")
        return jsonify({"errors": {"general": f"Server error: {str(e)}"}}), 500

    
if __name__ == '__main__':
    print("Starting Flask server...")
    app.run(debug=True)