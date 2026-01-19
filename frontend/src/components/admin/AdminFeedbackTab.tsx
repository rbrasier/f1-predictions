import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Feedback } from '../../types';

interface AdminFeedbackTabProps {
  onError: (error: string) => void;
  onSuccess: (message: string) => void;
}

const AdminFeedbackTab: React.FC<AdminFeedbackTabProps> = ({ onError, onSuccess }) => {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'bug' | 'feature'>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{
    status: string;
    implementation_note: string;
    implementation_date: string;
  }>({
    status: 'pending',
    implementation_note: '',
    implementation_date: ''
  });

  useEffect(() => {
    loadFeedback();
  }, [filterType, filterStatus]);

  const loadFeedback = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filterType !== 'all') params.type = filterType;
      if (filterStatus !== 'all') params.status = filterStatus;

      const data = await api.getAllFeedback(params);
      setFeedback(data);
    } catch (error: any) {
      onError(error.response?.data?.error || 'Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: Feedback) => {
    setEditingId(item.id);
    setEditForm({
      status: item.status,
      implementation_note: item.implementation_note || '',
      implementation_date: item.implementation_date || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({
      status: 'pending',
      implementation_note: '',
      implementation_date: ''
    });
  };

  const handleSave = async (id: number) => {
    try {
      await api.updateFeedback(id, editForm);
      onSuccess('Feedback updated successfully');
      setEditingId(null);
      loadFeedback();
    } catch (error: any) {
      onError(error.response?.data?.error || 'Failed to update feedback');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-600',
      in_progress: 'bg-blue-600',
      implemented: 'bg-green-600',
      fixed: 'bg-green-600',
      rejected: 'bg-red-600'
    };
    return colors[status] || 'bg-gray-600';
  };

  const getTypeColor = (type: string) => {
    return type === 'bug' ? 'text-red-400' : 'text-blue-400';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow text-gray-900">
        <h3 className="text-xl font-bold mb-4">Feedback Management</h3>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'all' | 'bug' | 'feature')}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="all">All Types</option>
              <option value="bug">Bugs</option>
              <option value="feature">Features</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="implemented">Implemented</option>
              <option value="fixed">Fixed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Feedback List */}
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <p className="text-gray-600 mt-2">Loading feedback...</p>
          </div>
        ) : feedback.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            No feedback found matching the filters.
          </div>
        ) : (
          <div className="space-y-4">
            {feedback.map((item) => (
              <div key={item.id} className="border rounded-lg p-4 bg-gray-50">
                {editingId === item.id ? (
                  // Edit Mode
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className={`font-semibold ${getTypeColor(item.type)} uppercase text-sm`}>
                          {item.type}
                        </span>
                        <h4 className="text-lg font-bold mt-1">{item.title}</h4>
                      </div>
                      <span className="text-sm text-gray-600">ID: {item.id}</span>
                    </div>

                    <p className="text-gray-700 whitespace-pre-wrap">{item.description}</p>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Status</label>
                        <select
                          value={editForm.status}
                          onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                          className="w-full px-3 py-2 border rounded"
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="implemented">Implemented</option>
                          <option value="fixed">Fixed</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Implementation Date</label>
                        <input
                          type="date"
                          value={editForm.implementation_date}
                          onChange={(e) => setEditForm({ ...editForm, implementation_date: e.target.value })}
                          className="w-full px-3 py-2 border rounded"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Implementation Note</label>
                      <textarea
                        value={editForm.implementation_note}
                        onChange={(e) => setEditForm({ ...editForm, implementation_note: e.target.value })}
                        className="w-full px-3 py-2 border rounded"
                        rows={3}
                        placeholder="Add a note about the implementation..."
                      />
                    </div>

                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={handleCancelEdit}
                        className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSave(item.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`font-semibold ${getTypeColor(item.type)} uppercase text-sm`}>
                            {item.type}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded ${getStatusColor(item.status)} text-white`}>
                            {item.status}
                          </span>
                        </div>
                        <h4 className="text-lg font-bold">{item.title}</h4>
                      </div>
                      <button
                        onClick={() => handleEdit(item)}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        Edit
                      </button>
                    </div>

                    <p className="text-gray-700 mb-3 whitespace-pre-wrap">{item.description}</p>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-2">
                      <span>Submitted by: {item.display_name}</span>
                      <span>•</span>
                      <span>{new Date(item.created_at).toLocaleString()}</span>
                      {item.type === 'feature' && (
                        <>
                          <span>•</span>
                          <span>Votes: {item.upvotes_count - item.downvotes_count} ({item.upvotes_count} up, {item.downvotes_count} down)</span>
                        </>
                      )}
                    </div>

                    {item.implementation_note && (
                      <div className="mt-3 p-3 bg-green-50 border-l-4 border-green-500 rounded">
                        <p className="text-sm">
                          <strong className="text-green-700">Note:</strong> {item.implementation_note}
                        </p>
                      </div>
                    )}

                    {item.implementation_date && (
                      <div className="mt-2 text-sm text-gray-600">
                        <strong>Implemented:</strong> {new Date(item.implementation_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminFeedbackTab;
