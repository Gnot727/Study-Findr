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
    
if __name__ == '__main__':
    print("Starting Flask server...")
    app.run(debug=True)