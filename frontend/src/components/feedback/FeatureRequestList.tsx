import React, { useState, useEffect } from 'react';
import { useToast } from '../../contexts/ToastContext';
import api from '../../services/api';
import { Feedback } from '../../types';
import FeatureRequestForm from './FeatureRequestForm';

interface FeatureRequestListProps {
  onClose: () => void;
  onBack: () => void;
}

const FeatureRequestList: React.FC<FeatureRequestListProps> = ({ onClose, onBack }) => {
  const [features, setFeatures] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const { showToast } = useToast();

  const loadFeatures = async () => {
    try {
      const data = await api.getFeatures();
      setFeatures(data);
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to load features', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeatures();
  }, []);

  const handleVote = async (featureId: number, voteType: 'upvote' | 'downvote') => {
    try {
      await api.voteOnFeature(featureId, voteType);
      // Reload features to get updated counts
      await loadFeatures();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to vote', 'error');
    }
  };

  const handleFeatureSubmitted = () => {
    setShowForm(false);
    loadFeatures();
  };

  if (showForm) {
    return (
      <FeatureRequestForm
        onClose={onClose}
        onBack={() => setShowForm(false)}
        onSubmitted={handleFeatureSubmitted}
      />
    );
  }

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      pending: 'bg-yellow-600',
      in_progress: 'bg-blue-600',
      implemented: 'bg-green-600',
      fixed: 'bg-green-600',
      rejected: 'bg-red-600'
    };

    const statusLabels: Record<string, string> = {
      pending: 'Pending',
      in_progress: 'In Progress',
      implemented: 'Implemented',
      fixed: 'Fixed',
      rejected: 'Rejected'
    };

    return (
      <span className={`text-xs px-2 py-1 rounded ${statusColors[status]} text-white`}>
        {statusLabels[status]}
      </span>
    );
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="mr-4 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-2xl font-bold text-white">Feature Requests</h2>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          + New Request
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="text-gray-400 mt-2">Loading features...</p>
        </div>
      ) : features.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400">No feature requests yet. Be the first to submit one!</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Submit Feature Request
          </button>
        </div>
      ) : (
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {features.map((feature) => (
            <div
              key={feature.id}
              className="bg-gray-700 rounded-lg p-4 hover:bg-gray-650 transition-colors"
            >
              <div className="flex items-start gap-4">
                {/* Vote buttons */}
                <div className="flex flex-col items-center gap-1 min-w-[60px]">
                  <button
                    onClick={() => handleVote(feature.id, 'upvote')}
                    className={`p-1 rounded transition-colors ${
                      feature.user_vote === 'upvote'
                        ? 'text-blue-500 bg-blue-900'
                        : 'text-gray-400 hover:text-blue-500'
                    }`}
                    title="Upvote"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 4l-8 8h5v8h6v-8h5l-8-8z" />
                    </svg>
                  </button>
                  <span className="text-white font-bold text-lg">
                    {feature.upvotes_count - feature.downvotes_count}
                  </span>
                  <button
                    onClick={() => handleVote(feature.id, 'downvote')}
                    className={`p-1 rounded transition-colors ${
                      feature.user_vote === 'downvote'
                        ? 'text-red-500 bg-red-900'
                        : 'text-gray-400 hover:text-red-500'
                    }`}
                    title="Downvote"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 20l8-8h-5V4H9v8H4l8 8z" />
                    </svg>
                  </button>
                </div>

                {/* Feature content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                    {getStatusBadge(feature.status)}
                  </div>
                  <p className="text-gray-300 mb-2 whitespace-pre-wrap">{feature.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>by {feature.display_name}</span>
                    <span>•</span>
                    <span>{new Date(feature.created_at).toLocaleDateString()}</span>
                  </div>
                  {feature.implementation_note && (
                    <div className="mt-3 p-3 bg-gray-800 rounded border-l-4 border-green-500">
                      <p className="text-sm text-gray-300">
                        <strong className="text-green-400">Admin note:</strong> {feature.implementation_note}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end mt-6 pt-4 border-t border-gray-600">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default FeatureRequestList;
