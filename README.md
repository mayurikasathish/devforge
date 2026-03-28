# 🔥 DevForge — Developer Networking Platform

> A production-grade developer collaboration platform with real-time rooms, project matchmaking, anonymous Q&A, GitHub integration, and beautiful glassmorphism UI.

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- Git

---

### 1. Clone / Extract the project

```
devforge/
├── server.js
├── config/
├── middleware/
├── models/
├── routes/
├── package.json
└── client/         ← React frontend (Vite)
```

---

### 2. Backend Setup

```bash
cd devforge

# Install backend dependencies
npm install

# Create your config
cp config/default.json config/default.json
# Edit config/default.json with your MongoDB URI and JWT secret
```

**`config/default.json`** (edit this):
```json
{
  "mongoURI": "mongodb://localhost:27017/devforge",
  "jwtSecret": "your_strong_secret_here"
}
```

> 💡 For MongoDB Atlas, replace with your Atlas connection string.

---

### 3. Frontend Setup

```bash
cd client

# Install frontend dependencies
npm install
```

---

### 4. Run the App

**Option A — Run separately (recommended for dev):**

```bash
# Terminal 1 — Backend
cd devforge
npm run server      # runs on http://localhost:5000

# Terminal 2 — Frontend
cd devforge/client
npm run dev         # runs on http://localhost:5173
```

**Option B — Run together:**
```bash
cd devforge
npm run dev         # runs both concurrently
```

---

## 🌐 Pages & Features

| Route | Feature |
|---|---|
| `/` | Landing page with hero + features |
| `/register` | Create account |
| `/login` | Sign in |
| `/dashboard` | Skill radar chart, suggested collabs, open projects |
| `/edit-profile` | Add skills (with star ratings), experience, education, GitHub |
| `/profile/me` | Your profile with GitHub repos + LeetCode stats |
| `/profile/:id` | Any developer's profile |
| `/explore` | Search/filter developers by skill |
| `/projects` | Post & browse projects, skill-based matchmaking |
| `/doubts` | Anonymous Q&A board with tags |
| `/rooms` | Browse & create Build Together rooms |
| `/rooms/:id` | Real-time chat + task board (Socket.IO) |

---

## 🔑 API Endpoints

### Auth
- `POST /api/users` — Register
- `POST /api/auth` — Login
- `GET  /api/auth` — Get logged-in user

### Profile
- `GET  /api/profile/me` — My profile
- `POST /api/profile` — Create/update profile
- `GET  /api/profile` — All profiles
- `GET  /api/profile/user/:id` — Profile by user ID
- `GET  /api/profile/match/:skills` — Match by skills
- `PUT  /api/profile/experience` — Add experience
- `PUT  /api/profile/education` — Add education

### Projects
- `POST /api/projects` — Create project
- `GET  /api/projects` — All open projects
- `GET  /api/projects/suggest/me` — Matched projects for my skills
- `PUT  /api/projects/apply/:id` — Apply to project

### Doubts
- `POST /api/doubts` — Post doubt
- `GET  /api/doubts?tag=DSA` — Get doubts (with optional tag filter)
- `POST /api/doubts/answer/:id` — Answer a doubt
- `PUT  /api/doubts/upvote/:id` — Upvote

### Rooms
- `POST /api/rooms` — Create room
- `GET  /api/rooms` — All active rooms
- `GET  /api/rooms/:id` — Room detail
- `PUT  /api/rooms/join/:id` — Join room
- `PUT  /api/rooms/tasks/:id` — Save tasks

### GitHub
- `GET /api/github/:username` — Repos
- `GET /api/github/profile/:username` — Profile info

---

## 🎨 Tech Stack

**Backend:** Node.js, Express, MongoDB (Mongoose), JWT, Socket.IO, Axios  
**Frontend:** React 18, Vite, Tailwind CSS, Framer Motion, Recharts, Socket.IO Client  
**Design:** Glassmorphism, Syne + DM Sans fonts, Pink/Purple/Aquamarine palette

---

## 🐛 Troubleshooting

**"Cannot connect to MongoDB"**  
→ Make sure MongoDB is running: `mongod` or check your Atlas URI

**"Token is not valid"**  
→ Clear `localStorage` in browser DevTools → Application → Local Storage

**GitHub repos not loading**  
→ GitHub API is rate-limited (60 req/hr unauthenticated). Add a `GITHUB_TOKEN` env var for higher limits.

**Socket.IO not connecting in rooms**  
→ Make sure backend is running on port 5000. The client connects to `http://localhost:5000`.

---

## 📁 Folder Structure

```
devforge/
├── config/
│   └── default.json          # MongoDB URI + JWT secret
├── middleware/
│   └── auth.js               # JWT middleware
├── models/
│   ├── User.js
│   ├── Profile.js            # Skills with levels, availability, leetcode
│   ├── Project.js            # Matchmaking projects
│   ├── Doubt.js              # Anonymous Q&A
│   └── Room.js               # Build Together rooms
├── routes/api/
│   ├── auth.js
│   ├── users.js
│   ├── profile.js            # + matchmaking endpoint
│   ├── posts.js
│   ├── projects.js
│   ├── doubts.js
│   ├── rooms.js
│   └── github.js
├── server.js                 # Express + Socket.IO
└── client/
    ├── src/
    │   ├── components/
    │   │   └── layout/Navbar.jsx
    │   ├── context/AuthContext.jsx
    │   ├── pages/
    │   │   ├── LandingPage.jsx
    │   │   ├── LoginPage.jsx
    │   │   ├── RegisterPage.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── EditProfile.jsx
    │   │   ├── ProfilePage.jsx
    │   │   ├── ExplorePage.jsx
    │   │   ├── ProjectsPage.jsx
    │   │   ├── DoubtsPage.jsx
    │   │   ├── RoomsPage.jsx
    │   │   └── RoomDetail.jsx
    │   ├── utils/api.js
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── tailwind.config.js
    ├── vite.config.js
    └── package.json
```
