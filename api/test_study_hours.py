import pytest
from studyfindr import app, mongo

@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client

def test_register_user_with_study_hours(client):
    email = "studytest@example.com"
    mongo.db.users.delete_many({"email": email})  # Clean up any previous test

    response = client.post("/api/register", json={
        "username": "studytestuser",
        "email": email,
        "password": "Study123!",
        "confirm_password": "Study123!"
    })

    assert response.status_code == 201
    user = mongo.db.users.find_one({"email": email})
    assert user is not None
    assert user["weekly_goal_hours"] == 8
    assert user["current_weekly_hours"] == 0

def test_update_weekly_goal(client):
    email = "studytest@example.com"
    new_goal = 12

    response = client.post("/api/update_weekly_goal", json={
        "email": email,
        "weekly_goal_hours": new_goal
    })

    assert response.status_code == 200
    user = mongo.db.users.find_one({"email": email})
    assert user["weekly_goal_hours"] == new_goal

def test_update_current_hours(client):
    email = "studytest@example.com"
    new_hours = 5

    response = client.post("/api/update_current_hours", json={
        "email": email,
        "current_weekly_hours": new_hours
    })

    assert response.status_code == 200
    user = mongo.db.users.find_one({"email": email})
    assert user["current_weekly_hours"] == new_hours

def test_reset_current_hours(client):
    email = "studytest@example.com"

    # Set some hours before resetting
    mongo.db.users.update_one({"email": email}, {"$set": {"current_weekly_hours": 3}})

    response = client.post("/api/reset_current_hours", json={"email": email})
    assert response.status_code == 200
    user = mongo.db.users.find_one({"email": email})
    assert user["current_weekly_hours"] == 0

def test_get_weekly_goal(client):
    email = "studytest@example.com"

    response = client.get(f"/api/get_weekly_goal?email={email}")
    assert response.status_code == 200
    assert "weekly_goal_hours" in response.json

def test_get_current_hours(client):
    email = "studytest@example.com"

    response = client.get(f"/api/get_current_hours?email={email}")
    assert response.status_code == 200
    assert "current_weekly_hours" in response.json
