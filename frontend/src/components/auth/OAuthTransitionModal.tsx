import React from 'react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';

interface OAuthTransitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoogleSuccess: (credentialResponse: CredentialResponse) => void;
  onSnooze: () => void;
}

const OAuthTransitionModal: React.FC<OAuthTransitionModalProps> = ({
  isOpen,
  onClose,
  onGoogleSuccess,
  onSnooze
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Upgrade Your Account
          </h2>
          <p className="text-gray-600">
            We're transitioning to Google OAuth for a more secure and convenient login experience.
            Link your Google account now to continue enjoying all features seamlessly.
          </p>
        </div>

        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Benefits of Google OAuth:</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="mr-2">🔒</span>
                <span>Enhanced security with Google's authentication</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">⚡</span>
                <span>Faster login without remembering passwords</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">🔄</span>
                <span>Seamless access across devices</span>
              </li>
            </ul>
          </div>

          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={onGoogleSuccess}
              onError={() => {
                console.error('Google OAuth failed');
                alert('Failed to authenticate with Google. Please try again.');
              }}
              useOneTap={false}
              text="continue_with"
              shape="rectangular"
              theme="outline"
              size="large"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={onSnooze}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Remind Me Later
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              Dismiss
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            You can continue using your password for now, but we recommend linking your Google account.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OAuthTransitionModal;
