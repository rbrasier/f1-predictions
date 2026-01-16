import React, { useState } from 'react';
import { useLeague } from '../../contexts/LeagueContext';
import { useToast } from '../../contexts/ToastContext';

interface JoinLeagueModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const JoinLeagueModal: React.FC<JoinLeagueModalProps> = ({ isOpen, onClose }) => {
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { joinLeague } = useLeague();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      showToast('Please enter an invite code', 'error');
      return;
    }

    setLoading(true);
    try {
      await joinLeague(inviteCode.trim().toUpperCase());
      showToast('Successfully joined league!', 'success');
      setInviteCode('');
      onClose();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to join league', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Join League</h2>
        <form onSubmit={handleSubmit}>
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
            />
            <p className="text-gray-400 text-sm mt-2">
              Enter the invite code shared by a friend
            </p>
          </div>
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Joining...' : 'Join League'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JoinLeagueModal;
