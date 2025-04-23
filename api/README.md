# Study-Findr API

The Flask backend API that powers the Study-Findr application, providing location data, user management, and review functionality.

## 🚀 Features

- Location data retrieval and filtering
- User authentication and profile management
- Review submission and rating system
- Bookmarking functionality
- Integration with Google Maps API

## 🔍 Getting Started

### Automated Setup

The easiest way to set up the API is using the project's setup script from the root directory:

```bash
# From project root
node setup.js
```

This script automatically sets up the Python virtual environment and installs all dependencies.

### Manual Setup

If you prefer to set up the API manually:

```bash
# Navigate to the API directory
cd api

# Create and activate a virtual environment
python -m venv venv

# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Running the API

#### Using the start script (recommended):

```bash
# From project root directory
node start.js
```

This will start both the frontend and backend servers.

#### Running the API directly:

```bash
# Navigate to the API directory
cd api

# Activate the virtual environment
source venv/bin/activate  # On macOS/Linux
# venv\Scripts\activate  # On Windows

# Start the Flask server
python studyfindr.py
```

The API will be available at [http://localhost:5000](http://localhost:5000)

## 📡 Core API Endpoints

### User Management

- **POST** `/api/register` - Register a new user
- **POST** `/api/login` - Log in a user
- **GET** `/api/get_user` - Get user profile information
- **POST** `/api/update_profile` - Update user profile

### Location Data

- **GET** `/api/cafes` - Get study locations from the database
- **GET** `/api/get_location_reviews` - Get reviews for a specific location

### Reviews & Ratings

- **POST** `/api/add_review` - Add or update a review for a location
- **GET** `/api/get_review` - Get a user's review for a specific location
- **POST** `/api/rate_review` - Like or dislike a review

### Bookmarks

- **POST** `/api/add_bookmark` - Bookmark a study location
- **GET** `/api/get_bookmarks` - Get all bookmarked locations
- **POST** `/api/remove_user_bookmark` - Remove a bookmark

## 🔒 Configuration

Create a `.env` file in the API directory with these variables:

```
MONGO_URI=mongodb://localhost:27017/studyfindr
SECRET_KEY=your_secret_key_here
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

## 📦 Dependencies

All required packages are listed in `requirements.txt`. Key dependencies include:

- Flask
- Flask-CORS
- PyMongo
- Requests (for Google Maps API)

## 🧪 Testing

Run the test suite with:

```bash
cd api
source venv/bin/activate  # On macOS/Linux
# venv\Scripts\activate  # On Windows
pytest test_studyfinder.py
```
