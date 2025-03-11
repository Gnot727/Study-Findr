# Study-Findr

A web application that helps students find and organize study groups based on courses, subjects, and availability.

## 📋 Overview

Study-Findr connects students who want to study together. Built with React for the frontend and Flask for the backend API, with MongoDB for data storage.

## 🚀 Project Structure

- `api/` - Flask backend server (Python)
- `studyfront/` - React frontend application

## ⚡ Quick Start

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

Access the application:

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:5000](http://localhost:5000)

## 🛠️ Development Commands

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

## 📦 Requirements

- Node.js and npm
- Python 3.x
- MongoDB (for data storage)

## 🔒 Environment Variables

Check the `.env` files in each directory for required configuration variables.
