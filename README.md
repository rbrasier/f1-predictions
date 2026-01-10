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

## Seeded Data (2027 Season)

The database includes:
- **10 F1 Teams**: Red Bull, Mercedes, Ferrari, McLaren, Aston Martin, Alpine, Williams, RB, Kick Sauber (Audi), Cadillac F1
- **20 Drivers**: Including Max Verstappen, Lewis Hamilton, Charles Leclerc, Lando Norris, etc.
- **10 Team Principals**: Christian Horner, Toto Wolff, Fred Vasseur, etc.
- **24 Races**: Full 2027 F1 calendar with correct dates and sprint weekends
- **Top 4 Teams Marked**: For midfield hero filtering

## Next Steps

The application is partially complete. The following components still need to be implemented:

### Frontend Components Needed
1. **Season Predictions Form** (`/frontend/src/pages/SeasonPredictionsPage.tsx`)
   - Uses ChampionshipOrderPicker for championship orders (already created)
   - Multi-select for sackings
   - Radio buttons for Audi vs Cadillac
   - Grid predictions with dropdowns

2. **Race Predictions Form** (`/frontend/src/pages/RaceDetailsPage.tsx`)
   - Dropdowns for pole, podium, midfield hero
   - Sprint fields if is_sprint_weekend
   - Crazy prediction text area

3. **Leaderboard Page** (`/frontend/src/pages/LeaderboardPage.tsx`)
   - Table with expandable rows
   - User breakdown display
   - Export button

4. **Validations Page** (`/frontend/src/pages/ValidationsPage.tsx`)
   - List of pending crazy predictions
   - Accept/Reject buttons

5. **Admin Panel** (`/frontend/src/pages/AdminPage.tsx`)
   - Forms to enter race results
   - Forms to enter season results
   - Mark crazy predictions that happened
   - Uses ChampionshipOrderPicker for season results

### Deployment Configuration
- **Vercel** config for frontend (`vercel.json`)
- **Railway** config for backend

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