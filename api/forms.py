import re
from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField, BooleanField, ValidationError
from wtforms.validators import DataRequired, Length, Email, EqualTo


class PasswordRequirements(object):
    def __init__(self, message=None):
        if not message:
            message = "Your password must contain:" #base message
        self.message = message
    
    def __call__(self, form, field):
        password = field.data or ""
        errors = []

        # check for minimum length
        if len(password) < 8:
            errors.append("At least 8 characters")
        
        #check the four conditions
        conds_met = 0
        missing_conditions = []
        if re.search(r"[a-z]", password):
            conds_met += 1
        else:
            missing_conditions.append("Lowercase letters (a-z)")
        if re.search(r"[A-Z]", password):
            conds_met += 1
        else:
            missing_conditions.append("Uppercase letters (A-Z)")
        if re.search(r"\d", password):
            conds_met += 1
        else:
            missing_conditions.append("Numbers (0-9)")
        if re.search(r"[!@#$%^&*]", password):
            conds_met += 1
        else:
            missing_conditions.append("Special characters (!@#$%^&*)")

        # if fewer than 3 of the 4 conditions are met, add a message
        if conds_met < 3:
            errors.append("At least 3 of the following: {}".format(", ".join(missing_conditions)))

        if errors:
            raise ValidationError(self.message + " " + ", ".join(errors))
        return True

class RegistrationForm(FlaskForm):
    username = StringField('Username', 
                           validators=[DataRequired(), Length(min=2, max=20)])
    email = StringField('Email', 
                        validators=[DataRequired(), Email()])
    password = PasswordField('Password', validators=[DataRequired(), PasswordRequirements()])
    confirm_password = PasswordField('Confirm Password', 
                                     validators=[DataRequired(), EqualTo('password', message='Passwords must match')])
    submit = SubmitField('Sign Up')

class LoginForm(FlaskForm):
    email = StringField('Email',   
                        validators=[DataRequired(), Email()])
    password = PasswordField('Password', validators=[DataRequired()])
    remember = BooleanField('Remember Me')
    submit = SubmitField('Login')

