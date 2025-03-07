# Study-Findr

A web application for finding and organizing study groups.

## Project Structure

- `api/` - Flask backend server (Python)
- `studyfront/` - React frontend application

## Quick Start

### Initial Setup (First Time Only)

```bash
# Install all dependencies for both frontend and backend
npm run setup
```

### Starting the Application

```bash
# Start both the frontend and backend servers
npm start
```

The frontend will be available at http://localhost:3000
The backend API will be available at http://localhost:5000

## Development Commands

```bash
# Install only frontend dependencies
npm run install:frontend

# Install only backend dependencies
npm run install:api

# Start only the frontend
npm run start:frontend

# Start only the backend
npm run start:api
```

## Requirements

- Node.js and npm
- Python 3.x
- MongoDB (for data storage)
