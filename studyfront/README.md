# StudyFindr Frontend

The React frontend for StudyFindr - a platform for finding and organizing study groups.

## 🚀 Features

- User authentication (login/signup)
- Dashboard for managing study groups
- Group discovery and joining
- Scheduling and availability management

## 🛠️ Setup & Development

For a complete development environment:

```bash
# From project root
npm run setup         # Install all dependencies
npm start             # Start both frontend and backend
```

For frontend-only development:

```bash
# From project root
npm run start:frontend

# Or from this directory
npm start
```

## 📦 Available Scripts

- `npm start` – Runs the development server
- `npm test` – Runs the test suite
- `npm run build` – Builds the app for production

## 🔄 API Integration

The frontend proxies API requests to the backend server running on port 5000.
See the API documentation in the `/api` directory for available endpoints.

## 🧩 Project Structure

- `src/Components/Login` - Authentication components
- `src/Components/Mainpage` - Dashboard and main application views
