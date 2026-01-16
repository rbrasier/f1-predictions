import React, { useState } from 'react';
import { useLeague } from '../../contexts/LeagueContext';
import { useToast } from '../../contexts/ToastContext';

interface CreateLeagueModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateLeagueModal: React.FC<CreateLeagueModalProps> = ({ isOpen, onClose }) => {
  const [leagueName, setLeagueName] = useState('');
  const [loading, setLoading] = useState(false);
  const { createLeague } = useLeague();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leagueName.trim()) {
      showToast('Please enter a league name', 'error');
      return;
    }

    setLoading(true);
    try {
      const league = await createLeague(leagueName.trim());
      showToast(`League "${league.name}" created successfully! Invite code: ${league.invite_code}`, 'success');
      setLeagueName('');
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
        <h2 className="text-2xl font-bold text-white mb-4">Create New League</h2>
        <form onSubmit={handleSubmit}>
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
            />
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
              {loading ? 'Creating...' : 'Create League'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateLeagueModal;
