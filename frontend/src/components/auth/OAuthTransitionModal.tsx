import React from 'react';

interface OAuthTransitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoogleSuccess: () => void;
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
            <button
              onClick={onGoogleSuccess}
              className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 text-gray-700 py-2.5 px-4 rounded-md hover:bg-gray-50 hover:border-gray-400 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Link Google Account
            </button>
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
