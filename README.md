# 🗳️ Distributed EVM System

A web-based distributed Electronic Voting Machine with 4 specialized devices communicating in real-time via Socket.IO.

---

## Architecture

```
Supreme Device  →  assigns roles to devices
Machine 1       →  verifies voter identity, sends approval
Machine 2       →  unlocks only after M1 approval, voter casts vote
Machine 3       →  listens for vote, generates printable receipt
```

---

## Quick Start (Local)

### Prerequisites
- Node.js v18+
- PostgreSQL (optional for full features)
- Redis (optional, falls back to in-memory)

---

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your PostgreSQL and Redis URLs
npm run dev
```

Backend runs on: `http://localhost:5000`

---

### 2. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
npm start
```

Frontend runs on: `http://localhost:3000`

---

### 3. Running All 4 Machines

Open 4 browser tabs (or 4 different devices on same network):

| Tab | URL | Role |
|-----|-----|------|
| Tab 1 | `http://localhost:3000` → `/supreme` | Supreme Device |
| Tab 2 | `http://localhost:3000` → `/machine1` | Auth Device |
| Tab 3 | `http://localhost:3000` → `/machine2` | Voting Device |
| Tab 4 | `http://localhost:3000` → `/machine3` | Receipt Device |

On each tab, enter a unique Device ID then select role.

---

### 4. Voting Flow

1. **Supreme Device** → Start Election
2. **Supreme Device** → Assign Machine 1 / Machine 2 / Machine 3 roles to devices
3. **Machine 1** → Enter Voter ID (VOTER001 to VOTER005) → Verify → Approve
4. **Machine 2** → Automatically unlocks → Voter selects candidate → Cast Vote
5. **Machine 3** → Receipt appears automatically → Print

---

## Test Voter IDs (pre-seeded)

```
VOTER001 - Hemant Kumar
VOTER002 - Amit Sharma
VOTER003 - Priya Singh
VOTER004 - Rahul Verma
VOTER005 - Neha Gupta
```

---

## Project Structure

```
evm-project/
├── backend/
│   ├── src/
│   │   ├── index.js              # Express + Socket.IO server
│   │   ├── config/
│   │   │   ├── db.js             # PostgreSQL setup
│   │   │   └── redis.js          # Redis / in-memory fallback
│   │   ├── socket/
│   │   │   └── socketHandler.js  # All real-time events
│   │   └── routes/
│   │       ├── voters.js         # Voter verify API
│   │       └── candidates.js     # Candidates + vote API
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── App.js                # Router
    │   ├── socket/socket.js      # Socket.IO client
    │   ├── styles/global.css     # Design system
    │   └── pages/
    │       ├── Home.jsx          # Device setup / role select
    │       ├── Supreme.jsx       # Admin control panel
    │       ├── Machine1.jsx      # Auth device
    │       ├── Machine2.jsx      # Voting device
    │       └── Machine3.jsx      # Receipt device
    └── package.json
```

---

## Tech Stack

| Purpose | Tech |
|---------|------|
| Frontend UI | React.js |
| Routing | React Router v6 |
| Real-time sync | Socket.IO |
| Backend | Node.js + Express |
| Role/token state | Redis (in-memory fallback) |
| Persistent storage | PostgreSQL |
| One-time tokens | UUID |
| Receipt printing | Browser Print API |

---

## Without PostgreSQL / Redis

The app works without PostgreSQL and Redis for demo purposes:
- Redis → automatically falls back to in-memory store
- PostgreSQL → candidates are hardcoded in socket memory for demo

For full functionality (vote persistence, double-vote prevention), set up PostgreSQL.

---

## Deployment

- **Frontend** → Vercel (`vercel deploy`)
- **Backend** → Railway or Render
- Set `REACT_APP_BACKEND_URL` to your deployed backend URL
# EVM-Machine-
