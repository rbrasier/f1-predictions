import { useState, useEffect } from 'react';
import { Layout } from '../components/common/Layout';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import api from '../services/api';
import { Feedback } from '../types';

export const ChangelogPage = () => {
  const [changelog, setChangelog] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchChangelog();
  }, []);

  const fetchChangelog = async () => {
    try {
      const data = await api.getChangelog();
      setChangelog(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load changelog');
    } finally {
      setLoading(false);
    }
  };

  const groupByDate = (items: Feedback[]) => {
    const grouped: { [key: string]: Feedback[] } = {};

    items.forEach((item) => {
      const date = item.implementation_date || 'Unknown';
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(item);
    });

    return grouped;
  };

  const formatDate = (dateString: string) => {
    if (dateString === 'Unknown') return 'Unknown Date';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTypeIcon = (type: string) => {
    if (type === 'bug') {
      return (
        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    );
  };

  const getStatusBadge = (status: string) => {
    if (status === 'implemented') {
      return <span className="text-xs px-2 py-1 rounded bg-green-600 text-white">Implemented</span>;
    }
    return <span className="text-xs px-2 py-1 rounded bg-green-600 text-white">Fixed</span>;
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  const groupedChangelog = groupByDate(changelog);
  const sortedDates = Object.keys(groupedChangelog).sort((a, b) => {
    if (a === 'Unknown') return 1;
    if (b === 'Unknown') return -1;
    return new Date(b).getTime() - new Date(a).getTime();
  });

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Changelog</h1>
          <p className="text-gray-400">
            Track all the new features and bug fixes we've implemented based on your feedback.
          </p>
        </div>

        {error && (
          <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {changelog.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-400 text-lg">No changes have been implemented yet.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {sortedDates.map((date) => (
              <div key={date} className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-bold text-white mb-4 pb-2 border-b border-gray-700">
                  {formatDate(date)}
                </h2>
                <div className="space-y-4">
                  {groupedChangelog[date].map((item) => (
                    <div key={item.id} className="border-l-4 border-blue-500 pl-4">
                      <div className="flex items-start gap-3">
                        {getTypeIcon(item.type)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                            {getStatusBadge(item.status)}
                          </div>
                          <p className="text-gray-300 mb-2 whitespace-pre-wrap">{item.description}</p>
                          {item.implementation_note && (
                            <div className="mt-2 p-3 bg-gray-700 rounded border-l-4 border-green-500">
                              <p className="text-sm text-gray-300">
                                <strong className="text-green-400">Note:</strong> {item.implementation_note}
                              </p>
                            </div>
                          )}
                          <div className="flex items-center gap-4 text-sm text-gray-400 mt-2">
                            <span>Requested by {item.display_name}</span>
                            {item.type === 'feature' && (
                              <>
                                <span>•</span>
                                <span>{item.upvotes_count - item.downvotes_count} votes</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ChangelogPage;
