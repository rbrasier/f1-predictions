import { useState, useEffect } from 'react';
import { Layout } from '../components/common/Layout';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { getPendingValidations, validateCrazyPrediction } from '../services/api';
import { PendingValidation } from '../types';

export const ValidationsPage = () => {
  const [predictions, setPredictions] = useState<PendingValidation[]>([]);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchPendingValidations();
  }, []);

  const fetchPendingValidations = async () => {
    try {
      const data = await getPendingValidations();
      setPredictions(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load validations');
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async (
    predictionType: 'season' | 'race',
    predictionId: number,
    isValidated: boolean
  ) => {
    setValidating(predictionId);
    setError('');
    setSuccess('');

    try {
      await validateCrazyPrediction(predictionType, predictionId, isValidated);
      setSuccess(isValidated ? 'Prediction accepted!' : 'Prediction rejected!');

      // Remove from list or mark as validated
      setPredictions(prev =>
        prev.map(p =>
          p.id === predictionId
            ? { ...p, already_validated: 1 }
            : p
        )
      );

      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to validate prediction');
    } finally {
      setValidating(null);
    }
  };

  const pendingPredictions = predictions.filter(p => p.already_validated === 0);
  const validatedPredictions = predictions.filter(p => p.already_validated === 1);

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-2">Crazy Prediction Validations</h1>
        <p className="text-gray-600 mb-6">
          Review crazy predictions from other players and vote on whether they make sense.
          No vote = automatically accepted. Predictions must be validated AND marked as "happened" by admin to score points.
        </p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            {success}
          </div>
        )}

        {/* Pending Validations */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            Pending Validations
            {pendingPredictions.length > 0 && (
              <span className="ml-2 bg-f1-red text-white text-sm px-3 py-1 rounded-full">
                {pendingPredictions.length}
              </span>
            )}
          </h2>

          {pendingPredictions.length === 0 ? (
            <div className="bg-gray-50 p-8 rounded-lg text-center text-gray-500">
              No pending validations. Check back later!
            </div>
          ) : (
            <div className="space-y-4">
              {pendingPredictions.map((prediction) => (
                <div
                  key={`${prediction.prediction_type}-${prediction.id}`}
                  className="bg-white p-6 rounded-lg shadow border-2 border-gray-200 hover:border-f1-red transition"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-bold text-lg">{prediction.display_name}</span>
                        <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                          {prediction.prediction_type === 'season'
                            ? `Season ${prediction.season_year || prediction.year}`
                            : `Round ${prediction.round_number}`
                          }
                        </span>
                      </div>
                      <p className="text-gray-700 italic bg-gray-50 p-4 rounded border-l-4 border-f1-red">
                        "{prediction.crazy_prediction}"
                      </p>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleValidate(prediction.prediction_type, prediction.id, true)}
                      disabled={validating === prediction.id}
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ✓ Accept
                    </button>
                    <button
                      onClick={() => handleValidate(prediction.prediction_type, prediction.id, false)}
                      disabled={validating === prediction.id}
                      className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-bold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ✗ Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Already Validated */}
        {validatedPredictions.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4 text-gray-600">Already Validated by You</h2>
            <div className="space-y-3">
              {validatedPredictions.map((prediction) => (
                <div
                  key={`${prediction.prediction_type}-${prediction.id}`}
                  className="bg-gray-50 p-4 rounded-lg border border-gray-200 opacity-75"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium">{prediction.display_name}</span>
                        <span className="text-xs bg-gray-300 px-2 py-1 rounded">
                          {prediction.prediction_type === 'season'
                            ? `Season ${prediction.season_year || prediction.year}`
                            : `Round ${prediction.round_number}`
                          }
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 italic">
                        "{prediction.crazy_prediction}"
                      </p>
                    </div>
                    <span className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded font-medium">
                      ✓ Validated
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="font-bold mb-2 text-blue-900">How Validation Works</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>You cannot validate your own crazy predictions</li>
            <li>If no one votes, predictions are automatically accepted</li>
            <li>At least 1 accept vote is needed for points</li>
            <li>Admin must also mark the prediction as "actually happened"</li>
            <li>Both conditions (validated + happened) required to earn 1 point</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
};
