import { useState, useEffect } from 'react';
import { Layout } from '../components/common/Layout';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { getLeaderboard, getUserBreakdown, exportLeaderboard } from '../services/api';
import { LeaderboardEntry } from '../types';

export const LeaderboardPage = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [expandedUserId, setExpandedUserId] = useState<number | null>(null);
  const [userBreakdown, setUserBreakdown] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingBreakdown, setLoadingBreakdown] = useState(false);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const data = await getLeaderboard();
      setLeaderboard(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserExpand = async (userId: number) => {
    if (expandedUserId === userId) {
      setExpandedUserId(null);
      setUserBreakdown(null);
      return;
    }

    setExpandedUserId(userId);
    setLoadingBreakdown(true);

    try {
      const data = await getUserBreakdown(userId);
      setUserBreakdown(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load user breakdown');
    } finally {
      setLoadingBreakdown(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await exportLeaderboard();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `f1-tipping-leaderboard-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError('Failed to export leaderboard');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold text-white italic">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-paddock-red to-paddock-coral">
              THE STANDINGS
            </span>
          </h1>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="bg-green-600 text-white px-6 py-2 rounded font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed uppercase text-sm tracking-wide"
          >
            {exporting ? 'Exporting...' : '📊 Export to Excel'}
          </button>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="bg-paddock-gray rounded-lg border border-paddock-lightgray overflow-hidden">
          <table className="w-full">
            <thead className="bg-paddock-darkgray text-gray-400">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Player</th>
                <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider">Season Points</th>
                <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider">Race Points</th>
                <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider">Total Points</th>
                <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-paddock-lightgray">
              {leaderboard.map((entry) => (
                <>
                  <tr
                    key={entry.user_id}
                    className={`hover:bg-paddock-lightgray transition ${
                      entry.rank <= 3 ? 'bg-paddock-lightgray/50' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <span className="text-2xl font-bold">
                        {entry.rank === 1 ? '🥇' :
                         entry.rank === 2 ? '🥈' :
                         entry.rank === 3 ? '🥉' :
                         <span className="text-gray-400">{String(entry.rank).padStart(2, '0')}</span>}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-white">{entry.display_name}</td>
                    <td className="px-6 py-4 text-center text-gray-300">{entry.season_points}</td>
                    <td className="px-6 py-4 text-center text-gray-300">{entry.race_points}</td>
                    <td className="px-6 py-4 text-center font-bold text-paddock-coral">
                      {entry.total_points}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => toggleUserExpand(entry.user_id)}
                        className="text-paddock-red hover:text-paddock-coral font-medium"
                      >
                        {expandedUserId === entry.user_id ? '▼ Hide' : '▶ Show'}
                      </button>
                    </td>
                  </tr>
                  {expandedUserId === entry.user_id && (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 bg-paddock-darkgray">
                        {loadingBreakdown ? (
                          <div className="flex justify-center py-4">
                            <LoadingSpinner />
                          </div>
                        ) : userBreakdown ? (
                          <div className="space-y-4">
                            {/* Season Prediction */}
                            {userBreakdown.season_prediction && (
                              <div className="bg-paddock-gray p-4 rounded-lg border border-paddock-lightgray">
                                <h4 className="font-bold text-lg mb-2 text-paddock-coral">
                                  Season Prediction - {userBreakdown.season_prediction.points_earned} points
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                  <div className="text-gray-300">
                                    <span className="font-medium">Submitted:</span>{' '}
                                    {new Date(userBreakdown.season_prediction.submitted_at).toLocaleDateString()}
                                  </div>
                                  {userBreakdown.season_prediction.crazy_prediction && (
                                    <div className="col-span-2 text-gray-300">
                                      <span className="font-medium">Crazy Prediction:</span>{' '}
                                      {userBreakdown.season_prediction.crazy_prediction}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Race Predictions */}
                            {userBreakdown.race_predictions && userBreakdown.race_predictions.length > 0 && (
                              <div>
                                <h4 className="font-bold text-lg mb-2 text-white">Race Predictions</h4>
                                <div className="space-y-2">
                                  {userBreakdown.race_predictions.map((pred: any) => (
                                    <div
                                      key={pred.id}
                                      className="bg-paddock-gray p-3 rounded-lg border border-paddock-lightgray flex justify-between items-center"
                                    >
                                      <div className="text-gray-300">
                                        <span className="font-medium text-white">Round {pred.round_number}:</span>{' '}
                                        {pred.name}
                                        <span className="text-xs text-gray-500 ml-2">
                                          {new Date(pred.race_date).toLocaleDateString()}
                                        </span>
                                      </div>
                                      <div className="flex items-center space-x-4">
                                        <span className={`font-bold ${
                                          pred.points_earned > 0 ? 'text-green-500' : 'text-gray-500'
                                        }`}>
                                          {pred.points_earned} pts
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-center text-gray-500">No predictions yet</p>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>

          {leaderboard.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No players yet. Be the first to make predictions!
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-6 bg-paddock-gray p-6 rounded-lg border border-paddock-lightgray">
          <h3 className="font-bold mb-4 text-white text-lg uppercase tracking-wide">Scoring Legend</h3>
          <div className="text-sm text-gray-300 space-y-2">
            <p>• <strong className="text-paddock-coral">Season Points:</strong> Championship orders, sackings, grid predictions (1 pt each)</p>
            <p>• <strong className="text-paddock-coral">Race Points:</strong> Pole (1 pt), Podium (3 pts for perfect), Midfield Hero (1 pt), Sprint (1 pt each)</p>
            <p>• <strong className="text-paddock-coral">Crazy Predictions:</strong> Must be validated by peers AND marked as happened by admin (1 pt)</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};
