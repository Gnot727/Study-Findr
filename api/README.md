# StudyFindr API

The Flask backend API that powers the StudyFindr application.

## 🚀 Features

- User authentication and authorization
- Study group management
- User profile handling
- Real-time notifications

## 🛠️ Development

### Setup

```bash
# From project root
npm run setup           # Sets up both frontend and backend

# Or manually
cd api
bash setup.sh           # On macOS/Linux
# OR
python -m venv venv     # On Windows
venv\Scripts\pip install -r requirements.txt
```

### Running the API

```bash
# From project root
npm run start:api

# Or directly
cd api
source venv/bin/activate  # On macOS/Linux
# OR
venv\Scripts\activate     # On Windows
python studyfindr.py
```

The API will be available at [http://localhost:5000](http://localhost:5000)

## 📡 API Endpoints

### Authentication

- **POST** `/api/register` - Register a new user
  - Requires username, email, and password
- **POST** `/api/login` - Log in a user
  - Requires email and password

## 🔒 Environment Variables

Create a `.env` file with the following variables:

```
MONGO_URI=mongodb://localhost:27017/studyfindr
SECRET_KEY=your_secret_key_here
```

## 📦 Dependencies

All required packages are listed in `requirements.txt`. The main dependencies are:

- Flask 3.1.0
- Flask-CORS 5.0.1
- Flask-PyMongo 3.0.1
- Flask-WTF 1.2.2

Make sure MongoDB is running or update your MONGO_URI connection string.
