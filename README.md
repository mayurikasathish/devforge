DevForge - Developer Networking Platform

A developer collaboration platform featuring real-time collaboration rooms, project matchmaking, anonymous Q&A, GitHub integration, and a modern glassmorphism-based UI.

Quick Start
Prerequisites
Node.js (v18 or higher)
MongoDB (local instance or MongoDB Atlas)
Git
Project Structure
devforge/
├── server.js
├── config/
├── middleware/
├── models/
├── routes/
├── package.json
└── client/         (React frontend using Vite)
Backend Setup
cd devforge
npm install

Configure the application by editing:

config/default.json

{
  "mongoURI": "mongodb://localhost:27017/devforge",
  "jwtSecret": "your_strong_secret_here"
}

For MongoDB Atlas, replace the URI with your cloud connection string.

Frontend Setup
cd client
npm install
Running the Application

Option 1: Run services separately (recommended for development)

# Backend
cd devforge
npm run server

# Frontend
cd devforge/client
npm run dev

Option 2: Run both concurrently

cd devforge
npm run dev
Features
User authentication and profile management
Skill-based developer discovery and matchmaking
Project collaboration system with application flow
Anonymous Q&A discussion board with tagging and voting
Real-time collaboration rooms with chat and task tracking
GitHub integration for repository and profile insights
API Overview
Authentication
POST /api/users — Register user
POST /api/auth — Login
GET /api/auth — Get current user
Profile
GET /api/profile/me — Current user profile
POST /api/profile — Create or update profile
GET /api/profile — Retrieve all profiles
GET /api/profile/user/:id — Get profile by ID
GET /api/profile/match/:skills — Skill-based matching
Projects
POST /api/projects — Create project
GET /api/projects — Retrieve all open projects
GET /api/projects/suggest/me — Suggested projects
PUT /api/projects/apply/:id — Apply to a project
Doubts
POST /api/doubts — Post a doubt
GET /api/doubts — Retrieve doubts (with optional filters)
POST /api/doubts/answer/:id — Answer a doubt
PUT /api/doubts/upvote/:id — Upvote a doubt
Rooms
POST /api/rooms — Create a room
GET /api/rooms — List all active rooms
GET /api/rooms/:id — Get room details
PUT /api/rooms/join/:id — Join a room
PUT /api/rooms/tasks/:id — Update tasks
Tech Stack

Backend: Node.js, Express, MongoDB (Mongoose), JWT, Socket.IO
Frontend: React 18, Vite, Tailwind CSS, Framer Motion
Other Tools: Axios, Recharts, GitHub API

Troubleshooting
MongoDB connection issues: Ensure MongoDB is running or verify your Atlas URI
Invalid token errors: Clear browser local storage
GitHub API limits: Use a personal access token to increase request limits
Socket connection issues: Ensure backend is running on the correct port
Folder Structure

Refer to the detailed structure provided in the project documentation for organization of backend routes, models, middleware, and frontend components.
