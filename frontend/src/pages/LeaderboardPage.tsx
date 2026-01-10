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
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold text-gray-800">Leaderboard</h1>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? 'Exporting...' : '📊 Export to Excel'}
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-f1-dark text-white">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-bold">Rank</th>
                <th className="px-6 py-3 text-left text-sm font-bold">Player</th>
                <th className="px-6 py-3 text-center text-sm font-bold">Season Points</th>
                <th className="px-6 py-3 text-center text-sm font-bold">Race Points</th>
                <th className="px-6 py-3 text-center text-sm font-bold">Total Points</th>
                <th className="px-6 py-3 text-center text-sm font-bold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {leaderboard.map((entry) => (
                <>
                  <tr
                    key={entry.user_id}
                    className={`hover:bg-gray-50 transition ${
                      entry.rank <= 3 ? 'bg-yellow-50' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <span className={`text-2xl font-bold ${
                        entry.rank === 1 ? 'text-yellow-500' :
                        entry.rank === 2 ? 'text-gray-400' :
                        entry.rank === 3 ? 'text-amber-600' :
                        'text-gray-600'
                      }`}>
                        {entry.rank === 1 ? '🥇' :
                         entry.rank === 2 ? '🥈' :
                         entry.rank === 3 ? '🥉' :
                         entry.rank}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium">{entry.display_name}</td>
                    <td className="px-6 py-4 text-center">{entry.season_points}</td>
                    <td className="px-6 py-4 text-center">{entry.race_points}</td>
                    <td className="px-6 py-4 text-center font-bold text-f1-red">
                      {entry.total_points}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => toggleUserExpand(entry.user_id)}
                        className="text-f1-red hover:underline font-medium"
                      >
                        {expandedUserId === entry.user_id ? '▼ Hide' : '▶ Show'}
                      </button>
                    </td>
                  </tr>
                  {expandedUserId === entry.user_id && (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 bg-gray-50">
                        {loadingBreakdown ? (
                          <div className="flex justify-center py-4">
                            <LoadingSpinner />
                          </div>
                        ) : userBreakdown ? (
                          <div className="space-y-4">
                            {/* Season Prediction */}
                            {userBreakdown.season_prediction && (
                              <div className="bg-white p-4 rounded-lg border border-gray-200">
                                <h4 className="font-bold text-lg mb-2 text-f1-red">
                                  Season Prediction - {userBreakdown.season_prediction.points_earned} points
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="font-medium">Submitted:</span>{' '}
                                    {new Date(userBreakdown.season_prediction.submitted_at).toLocaleDateString()}
                                  </div>
                                  {userBreakdown.season_prediction.crazy_prediction && (
                                    <div className="col-span-2">
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
                                <h4 className="font-bold text-lg mb-2">Race Predictions</h4>
                                <div className="space-y-2">
                                  {userBreakdown.race_predictions.map((pred: any) => (
                                    <div
                                      key={pred.id}
                                      className="bg-white p-3 rounded-lg border border-gray-200 flex justify-between items-center"
                                    >
                                      <div>
                                        <span className="font-medium">Round {pred.round_number}:</span>{' '}
                                        {pred.name}
                                        <span className="text-xs text-gray-500 ml-2">
                                          {new Date(pred.race_date).toLocaleDateString()}
                                        </span>
                                      </div>
                                      <div className="flex items-center space-x-4">
                                        <span className={`font-bold ${
                                          pred.points_earned > 0 ? 'text-green-600' : 'text-gray-400'
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
        <div className="mt-6 bg-white p-4 rounded-lg shadow">
          <h3 className="font-bold mb-2">Scoring Legend</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p>• <strong>Season Points:</strong> Championship orders, sackings, grid predictions (1 pt each)</p>
            <p>• <strong>Race Points:</strong> Pole (1 pt), Podium (3 pts for perfect), Midfield Hero (1 pt), Sprint (1 pt each)</p>
            <p>• <strong>Crazy Predictions:</strong> Must be validated by peers AND marked as happened by admin (1 pt)</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};
