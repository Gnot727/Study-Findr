#!/bin/bash

# Install Python dependencies
pip install -r requirements.txt

# Create a .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file with default settings"
    echo "MONGO_URI=mongodb://localhost:27017/studyfindr" > .env
    echo "SECRET_KEY=your_secret_key_here" >> .env
    echo "Please update the .env file with your actual MongoDB connection string and a secure secret key"
fi

echo "Setup complete! You can now run the API with: python studyfindr.py" 