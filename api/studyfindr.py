from flask import Flask, render_template, url_for, flash, redirect, jsonify, request
from flask_pymongo import PyMongo
from flask_cors import CORS
from forms import RegistrationForm, LoginForm
from dotenv import load_dotenv
import os

load_dotenv()


app = Flask(__name__) # we create an instance of this class, "app" is the name of teh application's module or package. __name__ is a convenient shortcut for this that is appropriate for most cases.
# This is needed so that Flask knows where to look for resources such as templates and static files.
CORS(app)

app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
# we create a secret key for our application, this is used to protect against modifying cookies and cross-site request forgery attacks
app.config["MONGO_URI"] = "mongodb+srv://jdetweiler:oVAllpICOlpuijjF@studyfindr.n8ss9.mongodb.net/studyfindr?retryWrites=true&w=majority"

mongo = PyMongo(app)
users_collection = mongo.db.users

# test for mongoDB
'''
@app.route('/test-insert', methods=['GET'])
def test_insert():
    # test MongoDB by inserting a sample user
    test_user = {
        "username": "user",
        "email": "test@example.com",
        "password": password"
    }
    users_collection.insert_one(test_user)

    return jsonify({"message": "Test user inserted"}), 201


@app.route('/test-fetch', methods=['GET'])
def test_fetch():
    # Fetch all users from MongoDB and return as JSON
    users = list(users_collection.find({}, {"_id": 0}))
    return jsonify(users)
'''

# @app.route("/") # we then use the route() decorator to tell Flask what URL should trigger our function
# @app.route("/home") # we are able to add another route to the home page, so you can have both the / and /home lead to the same thing
# def home():
#     return render_template('home.html')

# @app.route("/about") 
# def about():
#     return render_template('about.html', title='About')

@app.route("/api/register", methods=['POST'])
def api_register_json():
    # expect a JSON payload for {username, email, password, confirm_password}
    # return a JSON response with the same data
    # added data to mongoDB

    data = request.get_json()
    form = RegistrationForm(data=data, meta={'csrf': False})
    if form.validate():
        # Check if email already exists
        existing_user = users_collection.find_one({"email": form.email.data})
        if existing_user:
            return jsonify({"errors": {"email": "Email already exists"}}), 400

        # add user data to data base
        user_data = {
            "username": form.username.data,
            "email": form.email.data,
            "password": form.password.data  # may want to hash passwords in future
        }
        users_collection.insert_one(user_data)

        return jsonify({"message": f"Account created for {form.username.data}!"}), 201
    return jsonify({"errors": form.errors}), 400


@app.route("/api/login", methods=['POST'])
def api_login_json():
    #Expect a JSON payload for {email, password}
    data = request.get_json()
    form = LoginForm(data=data, meta={'csrf': False})



    if form.validate():
        '''
            # idk if the admin stuff below is placeholder or not so i am going to just leave the mongodb intergration here as a comment
           user = users_collection.find_one({"email": form.email.data})

               # Check if user exists and password matches
               if user and user["password"] == form.password.data:  
                   return jsonify({"message": "Login successful"}), 200

               return jsonify({"errors": {"general": "Invalid email or password"}}), 401
           '''

        if form.email.data == "admin@blog.com" and form.password.data == "password":
            return jsonify({"message": "Login successful"}), 200
        return jsonify({"errors": {"general": "Invalid email or password"}}), 401
    return jsonify({"errors": form.errors}), 400
    
if __name__ == '__main__':
    app.run(debug=True)