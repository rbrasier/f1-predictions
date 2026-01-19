import React, { useState } from 'react';

interface EmailRequirementModalProps {
  isOpen: boolean;
  onSave: (email: string) => Promise<void>;
  onSnooze: () => void;
}

const EmailRequirementModal: React.FC<EmailRequirementModalProps> = ({
  isOpen,
  onSave,
  onSnooze
}) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    setError('');

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await onSave(email);
    } catch (err: any) {
      setError(err.message || 'Failed to save email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleSave();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Add Your Email Address
          </h2>
          <p className="text-gray-600">
            To keep your account secure and enable password recovery, please add your email address.
          </p>
        </div>

        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Why we need your email:</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="mr-2">🔒</span>
                <span>Reset your password if you forget it</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">📧</span>
                <span>Receive important account notifications</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✅</span>
                <span>Secure your account with email verification</span>
              </li>
            </ul>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="your.email@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
              disabled={loading}
            />
            {error && (
              <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save Email'}
          </button>

          <div className="flex gap-2">
            <button
              onClick={onSnooze}
              disabled={loading}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Remind Me Later
            </button>
            <button
              onClick={onSnooze}
              disabled={loading}
              className="px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Your email will only be used for account security and notifications.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailRequirementModal;
