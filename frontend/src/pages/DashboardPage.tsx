import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/common/Layout';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { CountdownTimer } from '../components/dashboard/CountdownTimer';
import { getActiveSeason, getNextRace, getUpcomingRaces, getAllUsers, getAllRacePredictions, getLeaderboard, getPendingValidations, getDrivers } from '../services/api';
import { Season, Race, User, RacePrediction, LeaderboardEntry, PendingValidation, Driver } from '../types';
import { useAuth } from '../hooks/useAuth';

export const DashboardPage = () => {
  const { user: currentUser } = useAuth();
  const [season, setSeason] = useState<Season | null>(null);
  const [nextRace, setNextRace] = useState<Race | null>(null);
  const [upcomingRaces, setUpcomingRaces] = useState<Race[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [racePredictions, setRacePredictions] = useState<RacePrediction[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [pendingValidations, setPendingValidations] = useState<PendingValidation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Helper to get driver name from API ID
  const getDriverName = (apiId: string | null): string => {
    if (!apiId) return 'Not Set';
    const driver = drivers.find(d => d.driverId === apiId);
    return driver ? `${driver.givenName} ${driver.familyName}` : 'Unknown Driver';
  };

  // Get current user's prediction for the next race
  const userPrediction = racePredictions.find(p => p.user_id === currentUser?.id);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [seasonData, raceData, upcomingRacesData, allUsers, leaderboardData, driversData] = await Promise.all([
          getActiveSeason().catch(() => null),
          getNextRace().catch(() => null),
          getUpcomingRaces(5),
          getAllUsers(),
          getLeaderboard().catch(() => []),
          getDrivers().catch(() => [])
        ]);

        setSeason(seasonData);
        setNextRace(raceData);
        setUpcomingRaces(upcomingRacesData);
        setUsers(allUsers);
        setLeaderboard(leaderboardData);
        setDrivers(driversData);

        // Fetch race predictions if there's a next race (limit to 5 for dashboard)
        if (raceData) {
          // Note: getAllRacePredictions API needs to support season/round
          // For now, skip loading predictions or use a temporary solution
          console.log('Would load predictions for:', raceData.season, raceData.round);
          // const predictions = await getAllRacePredictions(raceData.season, raceData.round, 5);
          // setRacePredictions(predictions);
        }

        // Fetch pending crazy prediction validations
        try {
          const validations = await getPendingValidations();
          setPendingValidations(validations);
        } catch (err) {
          // Ignore errors for pending validations
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
          <h1 className="text-4xl font-bold mb-4 italic tracking-tight leading-tight">
            <span className="text-white">LIGHTS OUT</span>
            <br />
            <span className="text-white">&</span>{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-paddock-red to-paddock-coral">
              AWAY WE GO
            </span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl">
            The ultimate tipping battleground for you and your mates. Predict the podium,
            best of the rest, and crazy outcomes to claim the Championship Trophy.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Left Side */}
          <div className="lg:col-span-2 space-y-6">
            {/* Season Predictions Countdown */}
            {season && (
              <div className="bg-gradient-to-r from-purple-900/40 to-black rounded-lg p-6 border border-paddock-lightgray">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-purple-400 text-sm font-bold uppercase tracking-wide mb-2">
                      Season {season.year}
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">
                      SEASON PREDICTIONS
                    </h2>
                    <p className="text-gray-400">Championship Predictions Close</p>
                  </div>
                  <Link
                    to="/season-predictions"
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded font-bold uppercase text-sm tracking-wide transition"
                  >
                    Submit Predictions
                  </Link>
                </div>

                <CountdownTimer
                  targetDate={season.prediction_deadline}
                  label=""
                />
              </div>
            )}

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

            {/* Upcoming Races Section */}
            {upcomingRaces.length > 1 && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-paddock-red inline-block"></span>
                  UPCOMING RACES
                </h2>
                <div className="bg-paddock-gray rounded-lg border border-paddock-lightgray">
                  <div className="divide-y divide-paddock-lightgray">
                    {upcomingRaces.slice(1).map((race) => (
                      <Link
                        key={race.id}
                        to={`/race/${race.id}`}
                        className="flex items-center justify-between p-4 hover:bg-paddock-lightgray transition"
                      >
                        <div className="flex-1">
                          <div className="text-paddock-coral text-xs font-bold uppercase tracking-wide mb-1">
                            Round {race.round_number}
                          </div>
                          <div className="text-white font-bold text-lg">
                            {race.name}
                          </div>
                          <div className="text-gray-400 text-sm">
                            {race.location}
                          </div>
                          <div className="text-gray-500 text-xs mt-1">
                            {new Date(race.fp1_start).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </div>
                        </div>
                        <div className="text-paddock-red hover:text-paddock-coral font-bold uppercase text-sm">
                          Predict →
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
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
                      {getDriverName(userPrediction.podium_first_driver_api_id)}
                    </div>
                  </div>

                  {/* Podium P2 Card */}
                  <div className="bg-paddock-gray rounded-lg p-4 border border-paddock-lightgray">
                    <div className="text-paddock-coral text-xs font-bold uppercase tracking-wide mb-2">
                      Podium (P2)
                    </div>
                    <div className="text-white font-bold text-lg">
                      {getDriverName(userPrediction.podium_second_driver_api_id)}
                    </div>
                  </div>

                  {/* Podium P3 Card */}
                  <div className="bg-paddock-gray rounded-lg p-4 border border-paddock-lightgray">
                    <div className="text-paddock-coral text-xs font-bold uppercase tracking-wide mb-2">
                      Podium (P3)
                    </div>
                    <div className="text-white font-bold text-lg">
                      {getDriverName(userPrediction.podium_third_driver_api_id)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Paddock Predictions Section */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-paddock-red inline-block"></span>
                PADDOCK PREDICTIONS
              </h2>
              <div className="bg-paddock-gray rounded-lg border border-paddock-lightgray">
                {(pendingValidations.length > 0 || (nextRace && racePredictions.length > 0)) ? (
                  <div className="divide-y divide-paddock-lightgray">
                    {/* Crazy Predictions Needing Validation */}
                    {pendingValidations.slice(0, 3).map((validation) => (
                      <Link
                        key={`${validation.prediction_type}-${validation.id}`}
                        to="/validations"
                        className="block p-4 hover:bg-paddock-lightgray transition"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                            {validation.display_name.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-white font-bold">{validation.display_name}</span>
                              <span className="bg-purple-600 text-white text-xs px-2 py-0.5 rounded uppercase font-bold">
                                Needs Validation
                              </span>
                            </div>
                            <p className="text-gray-300 text-sm mb-1">
                              "{validation.crazy_prediction}"
                            </p>
                            <p className="text-gray-500 text-xs">
                              {validation.prediction_type === 'season'
                                ? `Season ${validation.season_year || validation.year}`
                                : `Round ${validation.round_number}`}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}

                    {/* Race Predictions */}
                    {nextRace && racePredictions.slice(0, 5 - Math.min(pendingValidations.length, 3)).map((prediction) => {
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
                                just locked in his tips. Feeling risky with a {getDriverName(prediction.podium_first_driver_api_id)} win!
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
