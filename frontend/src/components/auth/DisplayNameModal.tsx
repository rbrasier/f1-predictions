import React, { useState } from 'react';

interface DisplayNameModalProps {
  isOpen: boolean;
  onSubmit: (displayName: string) => void;
  currentDisplayName?: string;
}

const DisplayNameModal: React.FC<DisplayNameModalProps> = ({
  isOpen,
  onSubmit,
}) => {
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!displayName.trim()) {
      setError('Display name is required');
      return;
    }

    if (displayName.trim().length > 50) {
      setError('Display name must be 50 characters or less');
      return;
    }

    onSubmit(displayName.trim());
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome to Paddock Pulse! 🏁
          </h2>
          <p className="text-gray-600">
            Before you start making predictions, please choose how you'd like others to see you.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
              Display Name
            </label>
            <input
              type="text"
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-f1-red text-gray-900"
              placeholder="Enter your display name"
              maxLength={50}
              autoFocus
              required
            />
            <p className="text-xs text-gray-500 mt-1">This is how you'll appear on leaderboards (max 50 characters)</p>
            {error && (
              <p className="text-xs text-red-600 mt-1">{error}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-f1-red text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-f1-red focus:ring-offset-2 transition-colors"
          >
            Continue
          </button>
        </form>

        <p className="mt-4 text-xs text-gray-500 text-center">
          You can change this later in your settings
        </p>
      </div>
    </div>
  );
};

export default DisplayNameModal;
