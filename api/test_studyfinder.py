import pytest
import bcrypt
from studyfindr import app, mongo

# in \Study-Findr\api> run pytest . to preform test
@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


def test_mongo_storage(client):
    test_user = {
        "username": "testuser",
        "email": "testuser@example.com",
        "password": "TestPass123!"
    }

    mongo.db.users.insert_one(test_user)

    stored_user = mongo.db.users.find_one({"email": test_user["email"]})

    assert stored_user is not None, "User was not stored in MongoDB"
    assert stored_user["username"] == test_user["username"], "Stored username does not match"
    assert stored_user["email"] == test_user["email"], "Stored email does not match"


def test_password_hashing():
    password = "TestPass123!"

    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    assert password != hashed_password, "Hashed password should not match the original"

    assert bcrypt.checkpw(password.encode('utf-8'), hashed_password), "Password verification failed"
