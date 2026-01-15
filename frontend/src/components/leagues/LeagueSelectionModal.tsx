import React, { useState } from 'react';
import { useLeague } from '../../contexts/LeagueContext';
import { useToast } from '../../contexts/ToastContext';

interface LeagueSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LeagueSelectionModal: React.FC<LeagueSelectionModalProps> = ({ isOpen, onClose }) => {
  const [inviteCode, setInviteCode] = useState('');
  const [leagueName, setLeagueName] = useState('');
  const [mode, setMode] = useState<'select' | 'join' | 'create'>('select');
  const [loading, setLoading] = useState(false);
  const { joinLeague, joinWorldLeague, createLeague } = useLeague();
  const { showToast } = useToast();

  const handleJoinWorld = async () => {
    setLoading(true);
    try {
      await joinWorldLeague();
      showToast('Successfully joined World League!', 'success');
      onClose();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to join World League', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      showToast('Please enter an invite code', 'error');
      return;
    }

    setLoading(true);
    try {
      await joinLeague(inviteCode.trim().toUpperCase());
      showToast('Successfully joined league!', 'success');
      onClose();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to join league', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leagueName.trim()) {
      showToast('Please enter a league name', 'error');
      return;
    }

    setLoading(true);
    try {
      const league = await createLeague(leagueName.trim());
      showToast(`League "${league.name}" created! Invite code: ${league.invite_code}`, 'success');
      onClose();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to create league', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        {mode === 'select' && (
          <>
            <h2 className="text-2xl font-bold text-white mb-2">Join a League</h2>
            <p className="text-gray-300 mb-6">
              Choose how you'd like to get started
            </p>
            <div className="space-y-3">
              <button
                onClick={handleJoinWorld}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-left"
                disabled={loading}
              >
                <div className="font-semibold">Join World League</div>
                <div className="text-sm text-blue-100">Compete with everyone</div>
              </button>
              <button
                onClick={() => setMode('join')}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-left"
                disabled={loading}
              >
                <div className="font-semibold">Join via Invite Code</div>
                <div className="text-sm text-green-100">Join a friend's league</div>
              </button>
              <button
                onClick={() => setMode('create')}
                className="w-full px-4 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-left"
                disabled={loading}
              >
                <div className="font-semibold">Create New League</div>
                <div className="text-sm text-red-100">Start your own league</div>
              </button>
            </div>
          </>
        )}

        {mode === 'join' && (
          <>
            <h2 className="text-2xl font-bold text-white mb-4">Join League</h2>
            <form onSubmit={handleJoinLeague}>
              <div className="mb-4">
                <label htmlFor="inviteCode" className="block text-gray-300 mb-2">
                  Invite Code
                </label>
                <input
                  id="inviteCode"
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500 uppercase"
                  placeholder="e.g., ABC123"
                  maxLength={20}
                  disabled={loading}
                  autoFocus
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setMode('select')}
                  className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
                  disabled={loading}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? 'Joining...' : 'Join League'}
                </button>
              </div>
            </form>
          </>
        )}

        {mode === 'create' && (
          <>
            <h2 className="text-2xl font-bold text-white mb-4">Create New League</h2>
            <form onSubmit={handleCreateLeague}>
              <div className="mb-4">
                <label htmlFor="leagueName" className="block text-gray-300 mb-2">
                  League Name
                </label>
                <input
                  id="leagueName"
                  type="text"
                  value={leagueName}
                  onChange={(e) => setLeagueName(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="e.g., My Friends League"
                  maxLength={100}
                  disabled={loading}
                  autoFocus
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setMode('select')}
                  className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
                  disabled={loading}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create League'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default LeagueSelectionModal;
