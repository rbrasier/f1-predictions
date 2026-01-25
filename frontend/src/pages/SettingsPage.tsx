import React, { useState, useEffect } from 'react';
import { Layout } from '../components/common/Layout';
import { useLeague } from '../contexts/LeagueContext';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../hooks/useAuth';
import * as api from '../services/api';
import CreateLeagueModal from '../components/leagues/CreateLeagueModal';
import JoinLeagueModal from '../components/leagues/JoinLeagueModal';

const SettingsPage: React.FC = () => {
  const { leagues, defaultLeague, loading, setDefaultLeague, joinWorldLeague, leaveLeague } = useLeague();
  const { showToast } = useToast();
  const { user } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [processingLeagueId, setProcessingLeagueId] = useState<number | null>(null);

  // User profile state
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Email preferences state
  const [raceReminderEmails, setRaceReminderEmails] = useState(true);
  const [raceResultsEmails, setRaceResultsEmails] = useState(true);
  const [isSavingEmailPrefs, setIsSavingEmailPrefs] = useState(false);
  const [loadingEmailPrefs, setLoadingEmailPrefs] = useState(true);

  // Load email preferences on mount
  useEffect(() => {
    loadEmailPreferences();
  }, []);

  const loadEmailPreferences = async () => {
    try {
      const response = await api.getEmailPreferences();
      setRaceReminderEmails(response.data.race_reminder_emails);
      setRaceResultsEmails(response.data.race_results_emails);
    } catch (error: any) {
      console.error('Failed to load email preferences:', error);
    } finally {
      setLoadingEmailPrefs(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!displayName.trim()) {
      showToast('Display name cannot be empty', 'error');
      return;
    }

    setIsSavingProfile(true);
    try {
      await api.updateDisplayName(displayName);
      showToast('Profile updated successfully', 'success');
      // Reload page to reflect changes
      window.location.reload();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to update profile', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveEmailPreferences = async () => {
    setIsSavingEmailPrefs(true);
    try {
      await api.updateEmailPreferences({
        race_reminder_emails: raceReminderEmails,
        race_results_emails: raceResultsEmails
      });
      showToast('Email preferences updated successfully', 'success');
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to update email preferences', 'error');
    } finally {
      setIsSavingEmailPrefs(false);
    }
  };

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

        {/* User Profile Section */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-4 md:p-6 mb-6">
          <h2 className="text-2xl font-bold text-white mb-4">Profile</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-300 mb-2">
                Display Name
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Enter your display name"
                />
                <button
                  onClick={handleSaveProfile}
                  disabled={isSavingProfile || displayName === user?.display_name}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSavingProfile ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <div className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-400">
                {user?.email || 'No email set'}
              </div>
            </div>
          </div>
        </div>

        {/* Email Preferences Section */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-4 md:p-6 mb-6">
          <h2 className="text-2xl font-bold text-white mb-4">Email Preferences</h2>

          {loadingEmailPrefs ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="raceReminders"
                    type="checkbox"
                    checked={raceReminderEmails}
                    onChange={(e) => setRaceReminderEmails(e.target.checked)}
                    className="w-4 h-4 text-red-600 bg-gray-700 border-gray-600 rounded focus:ring-red-500 focus:ring-2"
                  />
                </div>
                <div className="ml-3">
                  <label htmlFor="raceReminders" className="font-medium text-white">
                    Race Reminder Emails
                  </label>
                  <p className="text-sm text-gray-400">
                    Receive emails on Wednesday before each race weekend with weather forecasts, crazy predictions, and league standings
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="raceResults"
                    type="checkbox"
                    checked={raceResultsEmails}
                    onChange={(e) => setRaceResultsEmails(e.target.checked)}
                    className="w-4 h-4 text-red-600 bg-gray-700 border-gray-600 rounded focus:ring-red-500 focus:ring-2"
                  />
                </div>
                <div className="ml-3">
                  <label htmlFor="raceResults" className="font-medium text-white">
                    Race Results Emails
                  </label>
                  <p className="text-sm text-gray-400">
                    Receive emails 12 hours after each race with your points, league results, and crazy prediction confirmations
                  </p>
                </div>
              </div>

              <button
                onClick={handleSaveEmailPreferences}
                disabled={isSavingEmailPrefs}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isSavingEmailPrefs ? 'Saving...' : 'Save Email Preferences'}
              </button>
            </div>
          )}
        </div>

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
