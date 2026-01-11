import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/common/Layout';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { CountdownTimer } from '../components/dashboard/CountdownTimer';
import { getNextRace, getRaces, getAllUsers, getAllRacePredictions, getLeaderboard } from '../services/api';
import { Race, User, RacePrediction, LeaderboardEntry } from '../types';
import { useAuth } from '../hooks/useAuth';

export const DashboardPage = () => {
  const { user: currentUser } = useAuth();
  const [nextRace, setNextRace] = useState<Race | null>(null);
  const [upcomingRaces, setUpcomingRaces] = useState<Race[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [racePredictions, setRacePredictions] = useState<RacePrediction[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Get current user's prediction for the next race
  const userPrediction = racePredictions.find(p => p.user_id === currentUser?.id);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [raceData, allRaces, allUsers, leaderboardData] = await Promise.all([
          getNextRace().catch(() => null),
          getRaces(),
          getAllUsers(),
          getLeaderboard().catch(() => [])
        ]);

        setNextRace(raceData);
        setUsers(allUsers);
        setLeaderboard(leaderboardData);

        // Get upcoming races (next 5)
        const now = new Date();
        const upcoming = allRaces
          .filter(r => new Date(r.fp1_start) > now)
          .slice(0, 5);
        setUpcomingRaces(upcoming);

        // Fetch race predictions if there's a next race
        if (raceData) {
          const predictions = await getAllRacePredictions(raceData.id);
          setRacePredictions(predictions);
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

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
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="mb-12">
          <h1 className="text-6xl font-bold mb-4 italic tracking-tight leading-tight">
            <span className="text-white">LIGHTS OUT</span>
            <br />
            <span className="text-white">&</span>{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-paddock-red to-paddock-coral">
              AWAY WE GO
            </span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl">
            The ultimate tipping battleground for you and your mates. Predict the podium,
            fastest lap, and DNFs to claim the Championship Trophy.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Left Side */}
          <div className="lg:col-span-2 space-y-6">
            {/* Next Race Card */}
            {nextRace && (
              <div className="bg-gradient-to-r from-red-900/40 to-black rounded-lg p-6 border border-paddock-lightgray">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-paddock-coral text-sm font-bold uppercase tracking-wide mb-2">
                      Round {nextRace.round_number}
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">
                      {nextRace.name.toUpperCase()}
                    </h2>
                    <p className="text-gray-400">{nextRace.location}</p>
                  </div>
                  <Link
                    to={`/race/${nextRace.id}`}
                    className="bg-paddock-red hover:bg-red-600 text-white px-6 py-3 rounded font-bold uppercase text-sm tracking-wide transition"
                  >
                    Submit Tips
                  </Link>
                </div>

                <CountdownTimer
                  targetDate={nextRace.fp1_start}
                  label=""
                />
              </div>
            )}

            {/* Your Predictions Section */}
            {nextRace && userPrediction && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-paddock-red inline-block"></span>
                  YOUR PREDICTIONS
                </h2>
                <div className="grid grid-cols-3 gap-4">
                  {/* Winner Card */}
                  <div className="bg-paddock-gray rounded-lg p-4 border border-paddock-lightgray">
                    <div className="text-paddock-coral text-xs font-bold uppercase tracking-wide mb-2">
                      Winner (P1)
                    </div>
                    <div className="text-white font-bold text-lg">
                      {userPrediction.p1_driver_name || 'Not Set'}
                    </div>
                    <div className="text-gray-500 text-sm">
                      {userPrediction.p1_team_name || ''}
                    </div>
                  </div>

                  {/* Podium P2 Card */}
                  <div className="bg-paddock-gray rounded-lg p-4 border border-paddock-lightgray">
                    <div className="text-paddock-coral text-xs font-bold uppercase tracking-wide mb-2">
                      Podium (P2)
                    </div>
                    <div className="text-white font-bold text-lg">
                      {userPrediction.p2_driver_name || 'Not Set'}
                    </div>
                    <div className="text-gray-500 text-sm">
                      {userPrediction.p2_team_name || ''}
                    </div>
                  </div>

                  {/* Podium P3 Card */}
                  <div className="bg-paddock-gray rounded-lg p-4 border border-paddock-lightgray">
                    <div className="text-paddock-coral text-xs font-bold uppercase tracking-wide mb-2">
                      Podium (P3)
                    </div>
                    <div className="text-white font-bold text-lg">
                      {userPrediction.p3_driver_name || 'Not Set'}
                    </div>
                    <div className="text-gray-500 text-sm">
                      {userPrediction.p3_team_name || ''}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Paddock Chatter Section */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-paddock-red inline-block"></span>
                PADDOCK CHATTER
              </h2>
              <div className="bg-paddock-gray rounded-lg border border-paddock-lightgray">
                {nextRace && racePredictions.length > 0 ? (
                  <div className="divide-y divide-paddock-lightgray">
                    {racePredictions.slice(0, 5).map((prediction) => {
                      const user = users.find(u => u.id === prediction.user_id);
                      if (!user) return null;

                      return (
                        <div key={prediction.id} className="p-4 hover:bg-paddock-lightgray transition">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-paddock-red flex items-center justify-center text-white font-bold flex-shrink-0">
                              {user.display_name.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-white font-bold">{user.display_name}</span>
                                <span className="text-gray-500 text-xs">
                                  {new Date(prediction.submitted_at).toLocaleDateString()} at{' '}
                                  {new Date(prediction.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-gray-300 text-sm">
                                just locked in his tips. Feeling risky with a {prediction.p1_driver_name} win!
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    No tips submitted yet. Be the first!
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* The Standings */}
            <div className="bg-paddock-gray rounded-lg border border-paddock-lightgray overflow-hidden">
              <div className="bg-paddock-red px-4 py-3">
                <h2 className="text-white font-bold uppercase tracking-wide italic text-lg">
                  THE STANDINGS
                </h2>
              </div>
              <div className="p-4">
                <div className="space-y-1 mb-4">
                  <div className="flex text-xs text-gray-500 uppercase tracking-wide px-2">
                    <div className="w-12">POS</div>
                    <div className="flex-1">PLAYER</div>
                    <div className="w-16 text-right">PTS</div>
                  </div>
                  {leaderboard.slice(0, 5).map((entry) => (
                    <div
                      key={entry.user_id}
                      className={`flex items-center py-2 px-2 rounded ${
                        entry.user_id === currentUser?.id ? 'bg-paddock-red/20' : ''
                      }`}
                    >
                      <div className="w-12 text-white font-bold">
                        {entry.rank <= 3 ? (
                          <span className="text-xl">
                            {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
                          </span>
                        ) : (
                          <span className="text-gray-400">0{entry.rank}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <span className={entry.user_id === currentUser?.id ? 'text-paddock-coral' : 'text-white'}>
                          {entry.display_name}
                          {entry.user_id === currentUser?.id && ' (PaddockKing)'}
                        </span>
                      </div>
                      <div className="w-16 text-right text-paddock-coral font-bold">
                        {entry.total_points}
                      </div>
                    </div>
                  ))}
                </div>
                <Link
                  to="/leaderboard"
                  className="block text-center text-paddock-red hover:text-paddock-coral uppercase text-sm font-bold tracking-wide"
                >
                  View Full Leaderboard
                </Link>
              </div>
            </div>

            {/* Season Stats */}
            <div className="bg-paddock-gray rounded-lg border border-paddock-lightgray p-4">
              <h3 className="text-white font-bold uppercase tracking-wide mb-4">
                Season Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Races Completed</span>
                  <span className="text-white font-bold">
                    {upcomingRaces.length > 0 ? (nextRace?.round_number || 1) - 1 : 0}/24
                  </span>
                </div>
                {currentUser && leaderboard.length > 0 && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Best Prediction</span>
                      <span className="text-white font-bold">Australia</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Points per Race (Avg)</span>
                      <span className="text-white font-bold">
                        {leaderboard.find(e => e.user_id === currentUser.id)
                          ? Math.round((leaderboard.find(e => e.user_id === currentUser.id)!.race_points / Math.max((nextRace?.round_number || 1) - 1, 1)) * 10) / 10
                          : '0.0'}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
