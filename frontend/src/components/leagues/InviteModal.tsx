import React, { useState } from 'react';
import { useLeague } from '../../contexts/LeagueContext';
import { useToast } from '../../contexts/ToastContext';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InviteModal: React.FC<InviteModalProps> = ({ isOpen, onClose }) => {
  const { defaultLeague } = useLeague();
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  if (!isOpen || !defaultLeague) return null;

  const inviteUrl = `${window.location.origin}/register?invite=${defaultLeague.invite_code}`;
  const inviteMessage = `Join my F1 predictions league "${defaultLeague.name}"! Sign up here: ${inviteUrl}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      showToast('Invite link copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      showToast('Failed to copy link', 'error');
    }
  };

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(inviteMessage);
      setCopied(true);
      showToast('Invite message copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      showToast('Failed to copy message', 'error');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-lg w-full p-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold text-white">Invite Friends</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-gray-300">
            Share this invite link with your friends to join <span className="font-semibold text-white">"{defaultLeague.name}"</span>
          </p>

          {/* Invite Code */}
          <div>
            <label className="block text-gray-400 text-sm mb-2">Invite Code</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={defaultLeague.invite_code}
                readOnly
                className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-center font-mono text-lg font-bold"
              />
            </div>
          </div>

          {/* Invite Link */}
          <div>
            <label className="block text-gray-400 text-sm mb-2">Invite Link</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={inviteUrl}
                readOnly
                className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm"
              />
              <button
                onClick={handleCopyLink}
                className="px-4 py-2 bg-paddock-red text-white rounded-md hover:bg-red-700 transition-colors font-medium whitespace-nowrap"
              >
                {copied ? '✓ Copied' : 'Copy Link'}
              </button>
            </div>
          </div>

          {/* Full Message */}
          <div>
            <label className="block text-gray-400 text-sm mb-2">Share Message</label>
            <div className="bg-gray-700 border border-gray-600 rounded-md p-3 mb-2">
              <p className="text-white text-sm">{inviteMessage}</p>
            </div>
            <button
              onClick={handleCopyMessage}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium"
            >
              Copy Full Message
            </button>
          </div>

          <div className="pt-4 border-t border-gray-700">
            <p className="text-gray-400 text-sm">
              Friends can use the invite code during registration or login, or click the link directly to join your league.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviteModal;
