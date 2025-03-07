# StudyFindr API

This is the backend API for the StudyFindr application.

## Development

For full setup and development instructions, please refer to the main README.md file in the root directory of this project.

## API-Specific Information

### API Endpoints

- POST `/api/register` - Register a new user
- POST `/api/login` - Login a user

### Environment Variables

The API requires the following environment variables in a `.env` file:

```
MONGO_URI=mongodb://localhost:27017/studyfindr
SECRET_KEY=your_secret_key_here
```

### Running the API Independently

If you want to run just the API (without the frontend):

```bash
# From the API directory:
python studyfindr.py

# From the project root:
npm run start:api
```

### Development Notes

Make sure you have MongoDB installed and running locally, or update the MONGO_URI in your .env file to point to your MongoDB instance.
