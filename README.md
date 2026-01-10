# F1 Tipping Competition Web App

A comprehensive web-based F1 tipping competition application where players make predictions for the season and individual races, with an admin managing results and scoring.

## Features

### Core Functionality
- **User Authentication**: Secure registration and login system with JWT tokens
- **Season Predictions**: Annual predictions including:
  - Drivers & Constructors Championship order (drag-and-drop interface)
  - Mid-season sackings
  - Audi vs Cadillac prediction
  - 2027 & 2028 grid predictions
  - Crazy predictions with peer validation
- **Race Predictions**: For each race:
  - Pole position
  - Podium (exact order required for points)
  - Midfield hero (auto-filtered to exclude top 4 teams)
  - Sprint weekend fields (pole, winner, midfield hero)
  - Crazy predictions
- **Crazy Prediction Validation**: Peer review system where players validate each other's crazy predictions
- **Admin Panel**: Enter race and season results, calculate scores automatically
- **Leaderboard**:
  - Overall standings
  - Expandable rows showing detailed breakdowns
  - Export to Excel functionality
- **Countdown Timers**: Visual countdown to prediction deadlines

### UI/UX Highlights
- **Drag-and-Drop Championship Order**: Uses @dnd-kit for smooth, intuitive championship order predictions
- **Mobile Responsive**: Works seamlessly on desktop, tablet, and mobile devices
- **F1-Inspired Design**: Red, black, and white color scheme matching Formula 1 branding
- **Real-time Validation Badges**: Notification badges for pending crazy prediction validations

## Tech Stack

### Backend
- **Runtime**: Node.js v18+
- **Framework**: Express.js with TypeScript
- **Database**: SQLite3 (better-sqlite3)
- **Authentication**: JWT tokens with bcrypt password hashing
- **Excel Export**: ExcelJS for multi-sheet leaderboard exports
- **Validation**: express-validator for input validation

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **Drag-and-Drop**: @dnd-kit/core + @dnd-kit/sortable
- **HTTP Client**: Axios
- **Date Handling**: date-fns

## Project Structure

```
f1-predictions/
├── backend/
│   ├── src/
│   │   ├── controllers/      # Request handlers
│   │   ├── middleware/       # Auth middleware
│   │   ├── routes/           # API routes
│   │   ├── db/               # Database setup and seed
│   │   ├── types/            # TypeScript types
│   │   └── index.ts          # Express server
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/            # Page components
│   │   ├── hooks/            # Custom hooks
│   │   ├── services/         # API service layer
│   │   ├── types/            # TypeScript types
│   │   └── main.tsx          # App entry point
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
└── README.md
```

## Getting Started

### Prerequisites
- Node.js v18 or higher
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env and update JWT_SECRET for production
```

4. Seed the database with 2027 F1 data:
```bash
npm run seed
```

5. Start the development server:
```bash
npm run dev
```

The backend will run on `http://localhost:4001`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:4000`

### Default Admin User

A default admin user is automatically created when the backend starts. The credentials are configured in the `.env` file:

- **Username**: `admin` (configurable via `ADMIN_USERNAME`)
- **Password**: `admin123` (configurable via `ADMIN_PASSWORD`)
- **Display Name**: `Administrator` (configurable via `ADMIN_DISPLAY_NAME`)

**Important**: Change the default password in production by updating the `ADMIN_PASSWORD` in your `.env` file before starting the backend.

### Restart Scripts

Convenient restart scripts are available for both frontend and backend:

```bash
# Restart frontend (kills port 4000, rebuilds, starts dev server)
cd frontend
./restart.sh

# Restart backend (kills port 4001, rebuilds, starts dev server)
cd backend
./restart.sh
```

## Seeded Data (2026 & 2027 Seasons)

The database includes:
- **11 F1 Teams**: Red Bull, Mercedes, Ferrari, McLaren, Aston Martin, Alpine, Williams, RB, Kick Sauber, Haas, and Cadillac F1 (2027+)
- **20 Drivers**: 2026 confirmed grid including Max Verstappen, Lewis Hamilton at Ferrari, Liam Lawson at Red Bull, Andrea Kimi Antonelli at Mercedes, etc.
- **10 Team Principals**: Christian Horner, Toto Wolff, Fred Vasseur, Andrea Stella, Mattia Binotto, etc.
- **2026 Season** (ACTIVE): Full 24-race calendar with correct dates and 6 sprint weekends
- **2027 Season** (INACTIVE): Pre-configured for future season predictions
- **Top 4 Teams Marked**: Red Bull, Mercedes, Ferrari, McLaren for midfield hero filtering

## Application Status

✅ **COMPLETE** - The application is fully functional and ready for deployment!

### Completed Features
- ✅ Full backend API with all endpoints
- ✅ Database schema with 2026 & 2027 F1 season data (2026 active)
- ✅ Authentication system (login/register)
- ✅ Season predictions form with drag-and-drop championship orders
- ✅ Race predictions form with sprint weekend support
- ✅ Leaderboard with expandable rows
- ✅ Crazy prediction validation system
- ✅ Admin panel for entering results
- ✅ Automatic scoring calculation
- ✅ Excel export functionality
- ✅ Countdown timers
- ✅ Mobile responsive design
- ✅ Deployment configuration (Vercel + Railway)

### Pages Implemented
1. **Dashboard** - Overview with countdown timers
2. **Season Predictions** - Drag-and-drop championship orders, sackings, grid predictions
3. **Race Details** - Pole, podium, midfield hero, sprint predictions
4. **Leaderboard** - Expandable rows with user breakdowns, Excel export
5. **Validations** - Accept/reject crazy predictions
6. **Admin Panel** - Enter race and season results, mark crazy predictions

## Quick Start

### Running Locally

**Backend:**
```bash
cd backend
npm install
npm run seed
npm run dev  # Runs on http://localhost:3001
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev  # Runs on http://localhost:5173
```

### Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete deployment instructions to Vercel (frontend) and Railway (backend).

## Scoring Rules

### Season Predictions
- **Drivers Championship**: 1 point per driver in correct position (max 20 points)
- **Constructors Championship**: 1 point per team in correct position (max 10 points)
- **Mid-Season Sackings**: 1 point per correct sacking
- **Audi vs Cadillac**: 1 point if correct
- **Crazy Prediction**: 1 point if validated AND actually happened
- **2027/2028 Grid**: 1 point per correct driver-team pairing (max 20 points each)

### Race Predictions
- **Pole Position**: 1 point if exact match
- **Podium**: 3 points if all three positions exactly correct (all-or-nothing)
- **Midfield Hero**: 1 point if exact match
- **Crazy Prediction**: 1 point if validated AND actually happened
- **Sprint fields**: 1 point each for pole, winner, midfield hero

## License

MIT