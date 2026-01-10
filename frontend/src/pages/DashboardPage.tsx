import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/common/Layout';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { CountdownTimer } from '../components/dashboard/CountdownTimer';
import { getActiveSeason, getNextRace, getRaces } from '../services/api';
import { Season, Race } from '../types';

export const DashboardPage = () => {
  const [season, setSeason] = useState<Season | null>(null);
  const [nextRace, setNextRace] = useState<Race | null>(null);
  const [upcomingRaces, setUpcomingRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [seasonData, raceData, allRaces] = await Promise.all([
          getActiveSeason(),
          getNextRace().catch(() => null),
          getRaces()
        ]);

        setSeason(seasonData);
        setNextRace(raceData);

        // Get upcoming races (next 5)
        const now = new Date();
        const upcoming = allRaces
          .filter(r => new Date(r.fp1_start) > now)
          .slice(0, 5);
        setUpcomingRaces(upcoming);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {season && (
            <div>
              <CountdownTimer
                targetDate={season.prediction_deadline}
                label="Season Predictions Close"
              />
              <Link
                to="/season-predictions"
                className="block mt-4 bg-white hover:bg-gray-50 border-2 border-f1-red text-f1-red font-bold py-3 px-6 rounded-lg text-center transition"
              >
                Make Season Predictions
              </Link>
            </div>
          )}

          {nextRace && (
            <div>
              <CountdownTimer
                targetDate={nextRace.fp1_start}
                label={`${nextRace.name} - Predictions Close`}
              />
              <Link
                to={`/race/${nextRace.id}`}
                className="block mt-4 bg-white hover:bg-gray-50 border-2 border-f1-red text-f1-red font-bold py-3 px-6 rounded-lg text-center transition"
              >
                Make Race Predictions
              </Link>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Upcoming Races</h2>
          {upcomingRaces.length === 0 ? (
            <p className="text-gray-600">No upcoming races</p>
          ) : (
            <div className="space-y-3">
              {upcomingRaces.map((race) => (
                <Link
                  key={race.id}
                  to={`/race/${race.id}`}
                  className="block p-4 border-2 border-gray-200 rounded-lg hover:border-f1-red transition"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-lg">
                        Round {race.round_number}: {race.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {race.location} • {new Date(race.race_date).toLocaleDateString()}
                        {race.is_sprint_weekend && (
                          <span className="ml-2 bg-f1-red text-white text-xs px-2 py-1 rounded">
                            SPRINT
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="text-f1-red font-bold">
                      →
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/leaderboard"
            className="bg-f1-dark text-white p-6 rounded-lg hover:bg-f1-gray transition text-center"
          >
            <div className="text-3xl mb-2">🏆</div>
            <div className="font-bold">Leaderboard</div>
          </Link>

          <Link
            to="/validations"
            className="bg-f1-dark text-white p-6 rounded-lg hover:bg-f1-gray transition text-center"
          >
            <div className="text-3xl mb-2">✅</div>
            <div className="font-bold">Validate Predictions</div>
          </Link>

          <a
            href="/api/leaderboard/export"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-green-600 text-white p-6 rounded-lg hover:bg-green-700 transition text-center"
          >
            <div className="text-3xl mb-2">📊</div>
            <div className="font-bold">Export to Excel</div>
          </a>
        </div>
      </div>
    </Layout>
  );
};
