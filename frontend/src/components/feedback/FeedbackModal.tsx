import React, { useState } from 'react';
import BugReportForm from './BugReportForm';
import FeatureRequestList from './FeatureRequestList';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const [selectedType, setSelectedType] = useState<'bug' | 'feature' | null>(null);

  const handleClose = () => {
    setSelectedType(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {!selectedType ? (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-white mb-6">How can we help?</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <button
                onClick={() => setSelectedType('bug')}
                className="p-6 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors text-left group"
              >
                <div className="flex items-center mb-3">
                  <svg className="w-8 h-8 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-xl font-semibold text-white group-hover:text-red-400">Report a Bug</h3>
                </div>
                <p className="text-gray-300">
                  Found something broken? Let us know so we can fix it.
                </p>
              </button>

              <button
                onClick={() => setSelectedType('feature')}
                className="p-6 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors text-left group"
              >
                <div className="flex items-center mb-3">
                  <svg className="w-8 h-8 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <h3 className="text-xl font-semibold text-white group-hover:text-blue-400">Feature Request</h3>
                </div>
                <p className="text-gray-300">
                  Have an idea? Share it and vote on others' suggestions.
                </p>
              </button>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : selectedType === 'bug' ? (
          <BugReportForm onClose={handleClose} onBack={() => setSelectedType(null)} />
        ) : (
          <FeatureRequestList onClose={handleClose} onBack={() => setSelectedType(null)} />
        )}
      </div>
    </div>
  );
};

export default FeedbackModal;
