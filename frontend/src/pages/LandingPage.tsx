import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useEffect, useState } from 'react';
import { CountdownTimer } from '../components/dashboard/CountdownTimer';
import { getActiveSeason, getUpcomingRaces } from '../services/api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

interface Season {
  id: number;
  year: number;
  championship_predictions_close: string;
}

interface Race {
  id: number;
  name: string;
  location: string;
  race_date: string;
  predictions_close: string;
}

export const LandingPage = () => {
  const { user } = useAuth();
  const [season, setSeason] = useState<Season | null>(null);
  const [nextRace, setNextRace] = useState<Race | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [seasonData, racesData] = await Promise.all([
          getActiveSeason(),
          getUpcomingRaces(1)
        ]);
        setSeason(seasonData);
        if (racesData.length > 0) {
          setNextRace(racesData[0]);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paddock-dark">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paddock-dark">
      {/* Navigation */}
      <nav className="bg-paddock-dark border-b border-paddock-lightgray">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center py-4">
            <Link to="/" className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-paddock-red flex items-center justify-center">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="3" y="3" width="8" height="8" />
                  <rect x="13" y="3" width="8" height="8" />
                  <rect x="3" y="13" width="8" height="8" />
                  <rect x="13" y="13" width="8" height="8" />
                </svg>
              </div>
              <span className="text-lg sm:text-xl font-bold tracking-wider">
                <span className="text-white">PADDOCK</span>
                <span className="text-paddock-red">PULSE</span>
              </span>
            </Link>
            <div className="flex items-center gap-4">
              {user ? (
                <Link
                  to="/dashboard"
                  className="bg-paddock-red hover:bg-red-600 text-white px-6 py-2 rounded font-bold uppercase text-sm tracking-wide transition"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-white hover:text-paddock-red transition font-medium"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="bg-paddock-red hover:bg-red-600 text-white px-6 py-2 rounded font-bold uppercase text-sm tracking-wide transition"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="text-center max-w-4xl mx-auto mb-12">
          <h1 className="text-4xl sm:text-6xl font-bold mb-6">
            <span className="text-white">Predict. </span>
            <span className="text-paddock-red">Compete. </span>
            <span className="text-white">Win.</span>
          </h1>
          <p className="text-xl sm:text-2xl text-gray-300 mb-4">
            The ultimate F1 predictions league for fans who think they know racing
          </p>
          <p className="text-lg text-gray-400">
            Make your predictions for race results, championship standings, and crazy season events.
            Compete with friends and climb the leaderboard.
          </p>
        </div>

        {/* Countdown Sections */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Season Predictions Card */}
          {season && (
            <div className="bg-gradient-to-br from-purple-900/40 to-purple-700/20 rounded-lg p-8 border border-purple-500/30">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-300 text-sm uppercase tracking-wider">Season {season.year}</span>
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">SEASON PREDICTIONS</h2>
              <p className="text-gray-300 mb-6">Championship Predictions Close</p>

              <CountdownTimer
                targetDate={season.championship_predictions_close}
                label=""
              />

              <div className="mt-6">
                <Link
                  to={user ? "/season-predictions" : "/register"}
                  className="block w-full bg-paddock-red hover:bg-red-600 text-white px-6 py-3 rounded font-bold uppercase text-sm tracking-wide transition text-center"
                >
                  Get Started
                </Link>
              </div>
            </div>
          )}

          {/* Next Race Card */}
          {nextRace && (
            <div className="bg-gradient-to-br from-red-900/40 to-red-700/20 rounded-lg p-8 border border-red-500/30">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-300 text-sm uppercase tracking-wider">Round 1</span>
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">{nextRace.name.toUpperCase()}</h2>
              <p className="text-gray-300 mb-6">{nextRace.location}</p>

              <CountdownTimer
                targetDate={nextRace.predictions_close}
                label=""
              />

              <div className="mt-6">
                <Link
                  to={user ? `/race/${nextRace.id}` : "/register"}
                  className="block w-full bg-paddock-red hover:bg-red-600 text-white px-6 py-3 rounded font-bold uppercase text-sm tracking-wide transition text-center"
                >
                  Get Started
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-paddock-darkgray py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-white mb-4">
            What You'll Be <span className="text-paddock-red">Predicting</span>
          </h2>
          <p className="text-center text-gray-400 mb-12 max-w-2xl mx-auto">
            Put your F1 knowledge to the test across two main prediction categories
          </p>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Season Predictions */}
            <div className="bg-paddock-gray rounded-lg p-8 border border-paddock-lightgray">
              <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Season Predictions</h3>
              <p className="text-gray-300 mb-4">Make your predictions for the entire season before it starts:</p>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-paddock-red mt-1">•</span>
                  <span>Drivers' Championship final order (1st through 20th)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-paddock-red mt-1">•</span>
                  <span>Constructors' Championship standings</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-paddock-red mt-1">•</span>
                  <span>Team principal sackings during the season</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-paddock-red mt-1">•</span>
                  <span>2027 grid predictions (which drivers will be on the grid next season)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-paddock-red mt-1">•</span>
                  <span>Crazy predictions (unexpected events you think will happen)</span>
                </li>
              </ul>
            </div>

            {/* Race Predictions */}
            <div className="bg-paddock-gray rounded-lg p-8 border border-paddock-lightgray">
              <div className="w-12 h-12 bg-red-600/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Race Predictions</h3>
              <p className="text-gray-300 mb-4">Predict the outcome of each Grand Prix:</p>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-paddock-red mt-1">•</span>
                  <span>Pole position winner</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-paddock-red mt-1">•</span>
                  <span>Podium finishers (1st, 2nd, 3rd place)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-paddock-red mt-1">•</span>
                  <span>Fastest lap driver</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-paddock-red mt-1">•</span>
                  <span>First driver to retire (DNF)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-paddock-red mt-1">•</span>
                  <span>Safety car appearance predictions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-paddock-red mt-1">•</span>
                  <span>And more race-specific events</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Additional Features */}
          <div className="grid sm:grid-cols-3 gap-6 mt-12 max-w-5xl mx-auto">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-paddock-red/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-paddock-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Create Leagues</h4>
              <p className="text-gray-400 text-sm">Compete with friends in private leagues and see who knows F1 best</p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-paddock-red/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-paddock-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Live Leaderboards</h4>
              <p className="text-gray-400 text-sm">Track your ranking and compare your predictions with other players</p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-paddock-red/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-paddock-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Crazy Predictions</h4>
              <p className="text-gray-400 text-sm">Make bold predictions and vote on others' wild calls for bonus points</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 sm:px-6 py-16 text-center">
        <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6">
          Ready to Test Your F1 Knowledge?
        </h2>
        <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
          Join Paddock Pulse today and start making predictions for the {season?.year || 'upcoming'} season
        </p>
        {!user && (
          <Link
            to="/register"
            className="inline-block bg-paddock-red hover:bg-red-600 text-white px-12 py-4 rounded font-bold uppercase text-lg tracking-wide transition"
          >
            Get Started Free
          </Link>
        )}
        {user && (
          <Link
            to="/dashboard"
            className="inline-block bg-paddock-red hover:bg-red-600 text-white px-12 py-4 rounded font-bold uppercase text-lg tracking-wide transition"
          >
            Go to Dashboard
          </Link>
        )}
      </section>

      {/* P1 Attribution */}
      <section className="bg-paddock-darkgray py-12">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <p className="text-gray-400 text-sm mb-2">
            Inspired by the predictions discussed on
          </p>
          <p className="text-xl font-bold text-white">
            The <span className="text-paddock-red">P1</span> Podcast
          </p>
          <p className="text-gray-500 text-xs mt-2">
            Bringing the spirit of F1 debate and predictions to life
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-paddock-dark border-t border-paddock-lightgray py-8">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex flex-col items-center md:items-start">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-paddock-red flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="3" y="3" width="8" height="8" />
                    <rect x="13" y="3" width="8" height="8" />
                    <rect x="3" y="13" width="8" height="8" />
                    <rect x="13" y="13" width="8" height="8" />
                  </svg>
                </div>
                <span className="text-lg font-bold tracking-wider">
                  <span className="text-white">PADDOCK</span>
                  <span className="text-paddock-red">PULSE</span>
                </span>
              </div>
              <p className="text-gray-500 text-sm">© {new Date().getFullYear()} Paddock Pulse</p>
            </div>

            <div className="flex flex-wrap justify-center gap-6">
              {user ? (
                <>
                  <Link to="/dashboard" className="text-gray-400 hover:text-white transition text-sm">Dashboard</Link>
                  <Link to="/season-predictions" className="text-gray-400 hover:text-white transition text-sm">Season Predictions</Link>
                  <Link to="/leaderboard" className="text-gray-400 hover:text-white transition text-sm">Leaderboard</Link>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-gray-400 hover:text-white transition text-sm">Login</Link>
                  <Link to="/register" className="text-gray-400 hover:text-white transition text-sm">Sign Up</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
