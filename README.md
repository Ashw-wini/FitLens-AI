<div align="center">

# 💪 FitLens AI

### Your AI-Powered Personal Fitness Trainer

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-Pose-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://mediapipe.dev/)

**FitLens AI** is a full-stack AI-powered gym trainer web application that uses real-time pose detection to analyze exercise form, count reps, and provide instant feedback — all from your browser's camera. It also features personalized meal planning and workout scheduling.

[Features](#-features) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [Project Structure](#-project-structure) • [API Endpoints](#-api-endpoints)

</div>

---

## ✨ Features

### 🤖 AI Form Correction
- **Real-time pose detection** using Google MediaPipe Pose Landmarker
- **Skeleton overlay** drawn on live camera feed
- **Joint angle calculation** for accurate form analysis
- **Exercise-specific form checks** (elbow position, back alignment, depth, etc.)
- **Instant feedback** — Good ✅, Warning ⚠️, or Bad ❌ per rep

### 🏋️ Smart Workout Engine
- **Automatic rep counting** with configurable thresholds
- **Multi-exercise support**: Squat, Bicep Curl, Shoulder Press, Deadlift, Lunge, Push-Up
- **Form quality scoring** per rep and per session
- **Calorie burn estimation** based on exercise type, reps, and user body weight
- **Workout history logging** with detailed stats

### 🥗 AI Meal Planner
- **Personalized meal plans** generated based on your calorie target and macros
- **Goal-based nutrition**: Lose Fat, Build Muscle, or Maintain
- **Dietary preference support**: Vegetarian, Vegan, Keto, Paleo, etc.
- **Meal logging** with daily calorie and macro tracking

### 📅 Workout Scheduler
- **Pre-built programs**: PPL (Push/Pull/Legs), Full Body, Upper/Lower, HIIT
- **Weekly schedule generation** based on your available training days
- **Exercise database** with sets, reps, and target muscles
- **Program customization** tailored to user preferences

### 👤 User Profile & Dashboard
- **BMR & TDEE calculation** using Mifflin-St Jeor equation
- **Macro target computation** (protein, carbs, fat) based on fitness goals
- **Fitness dashboard** with calorie progress, workout stats, and quick actions
- **Profile management** with weight, height, age, activity level, and goal

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | UI framework with hooks and context |
| **Vite 8** | Lightning-fast build tool and dev server |
| **React Router v7** | Client-side routing |
| **MediaPipe Pose Landmarker** | Real-time pose detection via webcam |
| **Vanilla CSS** | Custom design system with glassmorphism, dark mode |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js + Express 5** | REST API server |
| **MongoDB + Mongoose 9** | NoSQL database and ODM |
| **dotenvx** | Environment variable management |
| **CORS** | Cross-origin request handling |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18 or higher)
- **MongoDB** (local or cloud — e.g., MongoDB Atlas)
- **Webcam** (for AI workout features)

### 1. Clone the Repository

```bash
git clone https://github.com/Ashw-wini/FitLens-AI.git
cd FitLens-AI
```

### 2. Setup the Server

```bash
cd server
npm install
```

Create a `.env` file in the `server/` directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/fitlens
```

Start the server:

```bash
npm start
```

The API will be available at `http://localhost:5000/api`

### 3. Setup the Client

```bash
cd client
npm install
npm run dev
```

The app will be available at `http://localhost:5173`

### 4. Seed Exercise Data (Optional)

```bash
cd server
npm run seed
```

---

## 📁 Project Structure

```
fitlens-ai/
├── client/                     # Frontend (React + Vite)
│   ├── index.html              # Entry HTML with meta tags
│   └── src/
│       ├── components/         # Reusable UI components
│       │   ├── ExerciseCard.jsx    # Exercise display card
│       │   ├── MealCard.jsx        # Meal display card
│       │   ├── Navbar.jsx          # Top navigation bar
│       │   ├── Sidebar.jsx         # Side navigation panel
│       │   └── StatCard.jsx        # Dashboard stat card
│       ├── context/
│       │   └── UserContext.jsx     # Global user state management
│       ├── engine/             # AI / Pose Detection core
│       │   ├── poseEngine.js       # MediaPipe initialization & pose detection
│       │   ├── formAnalyzer.js     # Joint angle calculation & form checks
│       │   └── repCounter.js       # Rep counting state machine
│       ├── pages/              # Route-level page components
│       │   ├── Dashboard.jsx       # Home dashboard with stats
│       │   ├── Workout.jsx         # Live AI workout with camera
│       │   ├── MealPlanner.jsx     # Meal plan generation & logging
│       │   ├── Schedule.jsx        # Weekly workout schedule
│       │   └── Profile.jsx         # User profile setup
│       ├── services/
│       │   └── api.js              # Axios HTTP client for backend
│       ├── index.css               # Global design system & styles
│       ├── App.jsx                 # Root component with routing
│       └── main.jsx                # Vite entry point
│
├── server/                     # Backend (Node.js + Express)
│   ├── config/
│   │   └── db.js                   # MongoDB connection setup
│   ├── data/
│   │   ├── programs.json           # Workout program definitions
│   │   └── seed.js                 # Database seeder script
│   ├── models/                 # Mongoose schemas
│   │   ├── User.js                 # User profile model
│   │   ├── WorkoutLog.js           # Workout session logs
│   │   └── MealLog.js              # Meal & nutrition logs
│   ├── routes/                 # Express route handlers
│   │   ├── users.js                # User CRUD endpoints
│   │   ├── exercises.js            # Exercise data endpoints
│   │   ├── workouts.js             # Workout logging endpoints
│   │   └── meals.js                # Meal plan & logging endpoints
│   ├── utils/
│   │   ├── nutrition.js            # Calorie & macro calculations
│   │   └── scheduler.js            # Workout schedule generator
│   ├── server.js                   # Express app entry point
│   └── .env                        # Environment variables
│
└── README.md
```

---

## 📡 API Endpoints

### Users
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/users` | Get all users |
| `POST` | `/api/users` | Create a new user |
| `PUT` | `/api/users/:id` | Update user profile |

### Exercises
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/exercises` | Get all exercises |
| `GET` | `/api/exercises/program/:name` | Get exercises by program |

### Workouts
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/workouts` | Log a workout session |
| `GET` | `/api/workouts/user/:userId` | Get workout history |

### Meals
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/meals/generate` | Generate a meal plan |
| `POST` | `/api/meals/log` | Log daily meals |
| `GET` | `/api/meals/user/:userId` | Get meal history |

### Health
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Server health check |

---

## 🎯 Supported Exercises

| Exercise | Joint Tracking | Form Checks |
|---|---|---|
| 🏋️ **Squat** | Knee, Hip | Knee alignment, Depth, Back angle |
| 💪 **Bicep Curl** | Elbow | Elbow position, Full ROM |
| 🙆 **Shoulder Press** | Shoulder, Elbow | Lockout, Elbow flare |
| 🏗️ **Deadlift** | Hip, Knee | Back rounding, Hip hinge |
| 🦵 **Lunge** | Knee, Hip | Front knee tracking, Depth |
| 🫸 **Push-Up** | Elbow, Shoulder | Elbow flare, Depth, Body alignment |

---

## 🎨 Design System

FitLens AI uses a custom **glassmorphism dark theme** design system featuring:

- 🌌 Deep dark backgrounds with gradient overlays
- 💜 Purple-to-cyan gradient accents
- 🔮 Glass-effect cards with backdrop blur
- ✨ Smooth micro-animations and transitions
- 📱 Fully responsive with mobile bottom navigation
- 🔤 Inter font family for clean typography

---

## 📄 License

This project is licensed under the ISC License.

---

<div align="center">

**Built with ❤️ by [Ashwini](https://github.com/Ashw-wini)**

*FitLens AI — See Your Form, Perfect Your Fitness*

</div>
