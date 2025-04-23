# Study-Findr

An interactive web application that helps users find and rate study locations in their area.

## 📋 Overview

Study-Findr is a comprehensive platform that helps students and professionals find the perfect study spots based on various criteria like quietness, internet quality, and seating comfort. Users can discover, review, and bookmark their favorite study locations, including libraries and cafes.

Built with:

- React frontend
- Flask backend API
- MongoDB for data storage
- Google Maps integration

## 🚀 Quick Start

### First-time Setup

To set up the project for the first time, run:

```bash
# Run the setup script to install all dependencies for both frontend and backend
node setup.js
```

The setup script will:

1. Install all frontend dependencies (React, Tailwind CSS, etc.)
2. Set up the Python virtual environment for the backend
3. Install all backend dependencies from requirements.txt
4. Configure necessary environment variables

### Running the Application

To start both the frontend and backend servers in one command:

```bash
# Start both servers simultaneously
node start.js
```

This script will:

1. Start the React frontend on http://localhost:3000
2. Start the Flask backend API on http://localhost:5000
3. Display logs from both servers in the terminal

### Accessing the Application

After starting the servers:

- Frontend UI: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:5000](http://localhost:5000)

## 🛠️ Manual Development Commands

If you prefer to run the frontend and backend separately:

```bash
# Start only the frontend
cd studyfront
npm start

# Start only the backend
cd api
source venv/bin/activate  # On macOS/Linux
# OR
venv\Scripts\activate     # On Windows
python studyfindr.py
```

## 📦 System Requirements

- Node.js (v14.0.0 or higher)
- Python 3.10 or higher
- MongoDB (local installation or cloud service)
- Google Maps API key (for map functionality)

## 🔒 Environment Variables

The setup script will prompt for necessary environment variables, or you can manually set them up:

### Backend (.env file in api/ directory)

- `MONGO_URI`: MongoDB connection string
- `SECRET_KEY`: Secret key for session management
- `GOOGLE_MAPS_API_KEY`: API key for Google Maps services

### Frontend (.env file in studyfront/ directory)

- `REACT_APP_GOOGLE_MAPS_API_KEY`: Google Maps API key for frontend
- `REACT_APP_API_URL`: Backend API URL (default: http://localhost:5000)

## 📱 Features

- Interactive map interface with location markers
- User authentication and profiles
- Location bookmarking
- Detailed location reviews with multiple rating categories
- Smart filtering by location type and ratings
- Responsive design for mobile and desktop

## 📖 License

[MIT License](LICENSE)
