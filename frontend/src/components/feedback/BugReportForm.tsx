import React, { useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
import api from '../../services/api';

interface BugReportFormProps {
  onClose: () => void;
  onBack: () => void;
}

const BugReportForm: React.FC<BugReportFormProps> = ({ onClose, onBack }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim()) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    if (description.length < 10) {
      showToast('Please provide a more detailed description (at least 10 characters)', 'error');
      return;
    }

    setLoading(true);
    try {
      await api.submitFeedback({
        type: 'bug',
        title: title.trim(),
        description: description.trim()
      });

      showToast('Bug report submitted successfully! Thank you for your feedback.', 'success');
      setTitle('');
      setDescription('');
      onClose();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to submit bug report', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <button
          onClick={onBack}
          className="mr-4 text-gray-400 hover:text-white transition-colors"
          disabled={loading}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-2xl font-bold text-white">Report a Bug</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="title" className="block text-gray-300 mb-2">
            Bug Title <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="e.g., Unable to submit race predictions"
            maxLength={200}
            disabled={loading}
          />
          <p className="text-sm text-gray-400 mt-1">{title.length}/200 characters</p>
        </div>

        <div className="mb-6">
          <label htmlFor="description" className="block text-gray-300 mb-2">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[150px]"
            placeholder="Please describe the bug in detail. Include steps to reproduce, what you expected to happen, and what actually happened."
            maxLength={5000}
            disabled={loading}
          />
          <p className="text-sm text-gray-400 mt-1">{description.length}/5000 characters</p>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
            disabled={loading}
          >
            Back
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit Bug Report'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BugReportForm;
