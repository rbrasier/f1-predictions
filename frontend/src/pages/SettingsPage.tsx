import React, { useState } from 'react';
import { Layout } from '../components/common/Layout';
import { useLeague } from '../contexts/LeagueContext';
import { useToast } from '../contexts/ToastContext';
import CreateLeagueModal from '../components/leagues/CreateLeagueModal';
import JoinLeagueModal from '../components/leagues/JoinLeagueModal';

const SettingsPage: React.FC = () => {
  const { leagues, defaultLeague, loading, setDefaultLeague, joinWorldLeague, leaveLeague } = useLeague();
  const { showToast } = useToast();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [processingLeagueId, setProcessingLeagueId] = useState<number | null>(null);

  const handleSetDefault = async (leagueId: number) => {
    setProcessingLeagueId(leagueId);
    try {
      await setDefaultLeague(leagueId);
      showToast('Default league updated successfully', 'success');
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to update default league', 'error');
    } finally {
      setProcessingLeagueId(null);
    }
  };

  const handleJoinWorld = async () => {
    setProcessingLeagueId(-1);
    try {
      await joinWorldLeague();
      showToast('Successfully joined World League!', 'success');
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to join World League', 'error');
    } finally {
      setProcessingLeagueId(null);
    }
  };

  const handleLeaveLeague = async (leagueId: number, leagueName: string) => {
    if (!confirm(`Are you sure you want to leave "${leagueName}"?`)) {
      return;
    }

    setProcessingLeagueId(leagueId);
    try {
      await leaveLeague(leagueId);
      showToast('Successfully left league', 'success');
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to leave league', 'error');
    } finally {
      setProcessingLeagueId(null);
    }
  };

  const copyInviteCode = (code: string, leagueName: string) => {
    navigator.clipboard.writeText(code);
    showToast(`Invite code for "${leagueName}" copied to clipboard!`, 'success');
  };

  const isInWorldLeague = leagues.some(l => l.is_world_league);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-8">Settings</h1>

        {/* Leagues Section */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-4 md:p-6 mb-6">
          <h2 className="text-2xl font-bold text-white mb-4">My Leagues</h2>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
              <p className="text-gray-400 mt-4">Loading leagues...</p>
            </div>
          ) : leagues.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">You're not in any leagues yet</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={handleJoinWorld}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  disabled={processingLeagueId === -1}
                >
                  Join World League
                </button>
                <button
                  onClick={() => setShowJoinModal(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Join via Invite Code
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Create New League
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-3 mb-6">
                {leagues.map((league) => (
                  <div
                    key={league.id}
                    className={`border rounded-lg p-4 ${
                      league.id === defaultLeague?.id
                        ? 'border-red-500 bg-gray-750'
                        : 'border-gray-700 bg-gray-900'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-semibold text-white">{league.name}</h3>
                          {league.is_world_league && (
                            <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded">
                              World
                            </span>
                          )}
                          {league.id === defaultLeague?.id && (
                            <span className="px-2 py-1 bg-red-600 text-white text-xs rounded">
                              Default
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2 text-sm">
                          <span className="text-gray-400">
                            Invite Code: <span className="text-white font-mono">{league.invite_code}</span>
                          </span>
                          <button
                            onClick={() => copyInviteCode(league.invite_code, league.name)}
                            className="text-blue-400 hover:text-blue-300 text-left sm:text-center"
                          >
                            Copy
                          </button>
                        </div>
                        {league.member_count && (
                          <p className="text-gray-400 text-sm mt-1">
                            {league.member_count} member{league.member_count !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {league.id !== defaultLeague?.id && (
                          <button
                            onClick={() => handleSetDefault(league.id)}
                            className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors disabled:opacity-50"
                            disabled={processingLeagueId === league.id}
                          >
                            {processingLeagueId === league.id ? 'Setting...' : 'Set as Default'}
                          </button>
                        )}
                        {!league.is_world_league && (
                          <button
                            onClick={() => handleLeaveLeague(league.id, league.name)}
                            className="px-3 py-1.5 bg-gray-700 text-white text-sm rounded hover:bg-gray-600 transition-colors disabled:opacity-50"
                            disabled={processingLeagueId === league.id}
                          >
                            {processingLeagueId === league.id ? 'Leaving...' : 'Leave'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-700 pt-6">
                <h3 className="text-lg font-semibold text-white mb-3">Join or Create</h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  {!isInWorldLeague && (
                    <button
                      onClick={handleJoinWorld}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                      disabled={processingLeagueId === -1}
                    >
                      {processingLeagueId === -1 ? 'Joining...' : 'Join World League'}
                    </button>
                  )}
                  <button
                    onClick={() => setShowJoinModal(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    Join via Invite Code
                  </button>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    Create New League
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <CreateLeagueModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
      <JoinLeagueModal isOpen={showJoinModal} onClose={() => setShowJoinModal(false)} />
    </Layout>
  );
};

export default SettingsPage;
