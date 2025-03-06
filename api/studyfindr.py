from flask import Flask, render_template, url_for, flash, redirect, jsonify, request
from forms import RegistrationForm, LoginForm
from dotenv import load_dotenv
import os

load_dotenv()


app = Flask(__name__) # we create an instance of this class, "app" is the name of teh application's module or package. __name__ is a convenient shortcut for this that is appropriate for most cases.
# This is needed so that Flask knows where to look for resources such as templates and static files.

app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
# we create a secret key for our application, this is used to protect against modifying cookies and cross-site request forgery attacks


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
    data = request.get_json()
    form = RegistrationForm(data=data, meta={'csrf': False})
    if form.validate():
        # Add any further processing, e.g, saving to the database
        return jsonify({"message": f"Account created for {form.username.data}!"}), 201
    return jsonify({"errors": form.errors}), 400


@app.route("/api/login", methods=['POST'])
def api_login_json():
    #Expect a JSON payload for {email, password}
    data = request.get_json()
    form = LoginForm(data=data, meta={'csrf': False})
    if form.validate():
        if form.email.data == "admin@blog.com" and form.password.data == "password":
            return jsonify({"message": "Login successful"}), 200
        return jsonify({"errors": {"general": "Invalid email or password"}}), 401
    return jsonify({"errors": form.errors}), 400
    
if __name__ == '__main__':
    app.run(debug=True)