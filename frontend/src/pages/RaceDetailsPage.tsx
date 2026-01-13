import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/common/Layout';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { CountdownTimer } from '../components/dashboard/CountdownTimer';
import { DriverAutocomplete } from '../components/predictions/DriverAutocomplete';
import { useToast } from '../contexts/ToastContext';
import {
  getRace,
  getDrivers,
  submitRacePrediction,
  getMyRacePrediction
} from '../services/api';
import { Driver, Race } from '../types';

export const RaceDetailsPage = () => {
  const { raceId } = useParams<{ raceId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [race, setRace] = useState<Race | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [midfieldDrivers, setMidfieldDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [polePosition, setPolePosition] = useState<string>('');
  const [podiumFirst, setPodiumFirst] = useState<string>('');
  const [podiumSecond, setPodiumSecond] = useState<string>('');
  const [podiumThird, setPodiumThird] = useState<string>('');
  const [midfieldHero, setMidfieldHero] = useState<string>('');
  const [crazyPrediction, setCrazyPrediction] = useState('');
  const [sprintPole, setSprintPole] = useState<string>('');
  const [sprintWinner, setSprintWinner] = useState<string>('');
  const [sprintMidfieldHero, setSprintMidfieldHero] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      if (!raceId) return;

      try {
        const [raceData, driversData] = await Promise.all([
          getRace(raceId),
          getDrivers()
        ]);

        setRace(raceData);
        setDrivers(driversData);

        // Filter midfield drivers (not from top 4 teams)
        // Note: F1 API doesn't provide team assignments directly
        // For now, use all drivers as midfield options
        setMidfieldDrivers(driversData);

        // Initialize default selections
        if (driversData.length > 0) {
          setPolePosition(driversData[0].driverId);
          setPodiumFirst(driversData[0].driverId);
          setPodiumSecond(driversData[1]?.driverId || driversData[0].driverId);
          setPodiumThird(driversData[2]?.driverId || driversData[0].driverId);
          setSprintPole(driversData[0].driverId);
          setSprintWinner(driversData[0].driverId);
          setMidfieldHero(driversData[0].driverId);
          setSprintMidfieldHero(driversData[0].driverId);
        }

        // Try to load existing prediction
        try {
          const existing = await getMyRacePrediction(raceId);
          setPolePosition(existing.pole_position_driver_api_id || '');
          setPodiumFirst(existing.podium_first_driver_api_id || '');
          setPodiumSecond(existing.podium_second_driver_api_id || '');
          setPodiumThird(existing.podium_third_driver_api_id || '');
          setMidfieldHero(existing.midfield_hero_driver_api_id || '');
          setCrazyPrediction(existing.crazy_prediction || '');
          // Check if race has sprint
          const hasSprintRace = !!raceData.Sprint;
          if (hasSprintRace) {
            setSprintPole(existing.sprint_pole_driver_api_id || '');
            setSprintWinner(existing.sprint_winner_driver_api_id || '');
            setSprintMidfieldHero(existing.sprint_midfield_hero_driver_api_id || '');
          }
        } catch (err) {
          // No existing prediction, use defaults
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [raceId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      if (!raceId) throw new Error('No race ID');

      // Validate podium - all must be different
      if (podiumFirst === podiumSecond || podiumFirst === podiumThird || podiumSecond === podiumThird) {
        throw new Error('Podium drivers must all be different');
      }

      const prediction: any = {
        pole_position_driver_api_id: polePosition,
        podium_first_driver_api_id: podiumFirst,
        podium_second_driver_api_id: podiumSecond,
        podium_third_driver_api_id: podiumThird,
        midfield_hero_driver_api_id: midfieldHero,
        crazy_prediction: crazyPrediction
      };

      // Check if race has sprint
      const hasSprintRace = !!race?.Sprint;
      if (hasSprintRace) {
        prediction.sprint_pole_driver_api_id = sprintPole;
        prediction.sprint_winner_driver_api_id = sprintWinner;
        prediction.sprint_midfield_hero_driver_api_id = sprintMidfieldHero;
      }

      await submitRacePrediction(raceId, prediction);

      showToast('Race predictions saved successfully!', 'success');
      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to submit prediction');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  if (!race) {
    return (
      <Layout>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Race not found
        </div>
      </Layout>
    );
  }

  const fp1Start = race.FirstPractice ? `${race.FirstPractice.date}T${race.FirstPractice.time}` : null;
  const isPast = fp1Start ? new Date() > new Date(fp1Start) : false;
  const raceLocation = `${race.Circuit.Location.locality}, ${race.Circuit.Location.country}`;
  const hasSprint = !!race.Sprint;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-white mb-2">
            Round {race.round}: {race.raceName}
          </h1>
          <p className="text-gray-600">
            {raceLocation} • {new Date(race.date).toLocaleDateString()}
            {hasSprint && (
              <span className="ml-2 bg-f1-red text-white text-xs px-2 py-1 rounded font-bold">
                SPRINT WEEKEND
              </span>
            )}
          </p>
        </div>

        {fp1Start && (
          <div className="mb-6">
            <CountdownTimer targetDate={fp1Start} label="Predictions Close (FP1 Start)" />
          </div>
        )}

        {isPast && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded mb-6">
            ⚠️ Deadline has passed. Changes may not be saved.
          </div>
        )}

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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Race Predictions */}
          <div className="bg-white p-6 rounded-lg shadow text-gray-900">
            <h3 className="text-xl font-bold mb-4 text-gray-900">Race Predictions</h3>

            {/* Pole Position */}
            <div className="mb-6">
              <DriverAutocomplete
                drivers={drivers}
                selectedDriverId={polePosition}
                onSelect={setPolePosition}
                label="Pole Position (1 point)"
                required
              />
            </div>

            {/* Podium */}
            <div className="mb-6">
              <div className="mb-4">
                <h4 className="text-sm font-bold text-gray-900 mb-3">
                  Podium - 1 point per correct position (up to 3 points)
                </h4>
              </div>

              <div className="space-y-6">
                <DriverAutocomplete
                  drivers={drivers}
                  selectedDriverId={podiumFirst}
                  onSelect={setPodiumFirst}
                  label="1st Place"
                  required
                />

                <DriverAutocomplete
                  drivers={drivers}
                  selectedDriverId={podiumSecond}
                  onSelect={setPodiumSecond}
                  label="2nd Place"
                  required
                />

                <DriverAutocomplete
                  drivers={drivers}
                  selectedDriverId={podiumThird}
                  onSelect={setPodiumThird}
                  label="3rd Place"
                  required
                />
              </div>
            </div>

            {/* Midfield Hero */}
            <div className="mb-6">
              <DriverAutocomplete
                drivers={midfieldDrivers}
                selectedDriverId={midfieldHero}
                onSelect={setMidfieldHero}
                label="Midfield Hero - Best non-top-4 team driver (1 point)"
                required
              />
            </div>
          </div>

          {/* Sprint Weekend Predictions */}
          {hasSprint && (
            <div className="bg-white p-6 rounded-lg shadow border-2 border-f1-red text-gray-900">
              <h3 className="text-xl font-bold mb-4 text-f1-red">Sprint Predictions</h3>

              <div className="space-y-6">
                <DriverAutocomplete
                  drivers={drivers}
                  selectedDriverId={sprintPole}
                  onSelect={setSprintPole}
                  label="Sprint Pole Position (1 point)"
                />

                <DriverAutocomplete
                  drivers={drivers}
                  selectedDriverId={sprintWinner}
                  onSelect={setSprintWinner}
                  label="Sprint Winner (1 point)"
                />

                <DriverAutocomplete
                  drivers={midfieldDrivers}
                  selectedDriverId={sprintMidfieldHero}
                  onSelect={setSprintMidfieldHero}
                  label="Sprint Midfield Hero (1 point)"
                />
              </div>
            </div>
          )}

          {/* Crazy Prediction */}
          <div className="bg-white p-6 rounded-lg shadow text-gray-900">
            <h3 className="text-xl font-bold mb-4 text-gray-900">Crazy Prediction</h3>
            <p className="text-sm text-gray-600 mb-3">
              Make a wild prediction for this race. Other players will vote on whether it happened! (1 point if validated and happened)
            </p>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4">
              <p className="text-xs text-yellow-800">
                <strong>Guidance:</strong> Crazy predictions should at least not have happened for the at least the last 6 races (but should really be the last 10) - e.g. Alpine double points
              </p>
            </div>
            <textarea
              value={crazyPrediction}
              onChange={(e) => setCrazyPrediction(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-f1-red"
              rows={3}
              maxLength={500}
              placeholder="e.g., 'Safety car will be deployed in the last 3 laps'"
            />
            <p className="text-xs text-gray-500 mt-1">{crazyPrediction.length}/500 characters</p>
          </div>

          {/* Submit Button */}
          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={submitting || isPast}
              className="flex-1 bg-f1-red text-white py-3 px-6 rounded-lg font-bold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Saving...' : 'Save Predictions'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 border-2 border-gray-300 rounded-lg font-bold hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};
