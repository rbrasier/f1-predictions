import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/common/Layout';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { CountdownTimer } from '../components/dashboard/CountdownTimer';
import {
  getRace,
  getDrivers,
  getTeams,
  submitRacePrediction,
  getMyRacePrediction
} from '../services/api';
import { Driver, Team, Race } from '../types';

export const RaceDetailsPage = () => {
  const { raceId } = useParams<{ raceId: string }>();
  const navigate = useNavigate();
  const [race, setRace] = useState<Race | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [midfieldDrivers, setMidfieldDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [polePosition, setPolePosition] = useState<number>(0);
  const [podiumFirst, setPodiumFirst] = useState<number>(0);
  const [podiumSecond, setPodiumSecond] = useState<number>(0);
  const [podiumThird, setPodiumThird] = useState<number>(0);
  const [midfieldHero, setMidfieldHero] = useState<number>(0);
  const [crazyPrediction, setCrazyPrediction] = useState('');
  const [sprintPole, setSprintPole] = useState<number>(0);
  const [sprintWinner, setSprintWinner] = useState<number>(0);
  const [sprintMidfieldHero, setSprintMidfieldHero] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      if (!raceId) return;

      try {
        const [raceData, driversData, teamsData] = await Promise.all([
          getRace(parseInt(raceId)),
          getDrivers(),
          getTeams()
        ]);

        setRace(raceData);
        setDrivers(driversData);

        // Filter midfield drivers (not from top 4 teams)
        const topFourTeamIds = teamsData.filter(t => t.is_top_four).map(t => t.id);
        const midfield = driversData.filter(d => d.team_id && !topFourTeamIds.includes(d.team_id));
        setMidfieldDrivers(midfield);

        // Initialize default selections
        if (driversData.length > 0) {
          setPolePosition(driversData[0].id);
          setPodiumFirst(driversData[0].id);
          setPodiumSecond(driversData[1]?.id || driversData[0].id);
          setPodiumThird(driversData[2]?.id || driversData[0].id);
          setSprintPole(driversData[0].id);
          setSprintWinner(driversData[0].id);
        }
        if (midfield.length > 0) {
          setMidfieldHero(midfield[0].id);
          setSprintMidfieldHero(midfield[0].id);
        }

        // Try to load existing prediction
        try {
          const existing = await getMyRacePrediction(parseInt(raceId));
          setPolePosition(existing.pole_position_driver_id || 0);
          setPodiumFirst(existing.podium_first_driver_id || 0);
          setPodiumSecond(existing.podium_second_driver_id || 0);
          setPodiumThird(existing.podium_third_driver_id || 0);
          setMidfieldHero(existing.midfield_hero_driver_id || 0);
          setCrazyPrediction(existing.crazy_prediction || '');
          if (raceData.is_sprint_weekend) {
            setSprintPole(existing.sprint_pole_driver_id || 0);
            setSprintWinner(existing.sprint_winner_driver_id || 0);
            setSprintMidfieldHero(existing.sprint_midfield_hero_driver_id || 0);
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
        pole_position_driver_id: polePosition,
        podium_first_driver_id: podiumFirst,
        podium_second_driver_id: podiumSecond,
        podium_third_driver_id: podiumThird,
        midfield_hero_driver_id: midfieldHero,
        crazy_prediction: crazyPrediction
      };

      if (race?.is_sprint_weekend) {
        prediction.sprint_pole_driver_id = sprintPole;
        prediction.sprint_winner_driver_id = sprintWinner;
        prediction.sprint_midfield_hero_driver_id = sprintMidfieldHero;
      }

      await submitRacePrediction(parseInt(raceId), prediction);

      setSuccess('Race predictions saved successfully!');
      setTimeout(() => navigate('/dashboard'), 2000);
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

  const isPast = new Date() > new Date(race.fp1_start);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Round {race.round_number}: {race.name}
          </h1>
          <p className="text-gray-600">
            {race.location} • {new Date(race.race_date).toLocaleDateString()}
            {race.is_sprint_weekend && (
              <span className="ml-2 bg-f1-red text-white text-xs px-2 py-1 rounded font-bold">
                SPRINT WEEKEND
              </span>
            )}
          </p>
        </div>

        <div className="mb-6">
          <CountdownTimer targetDate={race.fp1_start} label="Predictions Close (FP1 Start)" />
        </div>

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
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-bold mb-4">Race Predictions</h3>

            {/* Pole Position */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pole Position (1 point)
              </label>
              <select
                value={polePosition}
                onChange={(e) => setPolePosition(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-f1-red"
                required
              >
                {drivers.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.team_name})</option>
                ))}
              </select>
            </div>

            {/* Podium */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Podium - Exact Order Required (3 points for perfect, 0 otherwise)
              </label>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-gray-600">1st Place</label>
                  <select
                    value={podiumFirst}
                    onChange={(e) => setPodiumFirst(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-f1-red"
                    required
                  >
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.team_name})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-600">2nd Place</label>
                  <select
                    value={podiumSecond}
                    onChange={(e) => setPodiumSecond(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-f1-red"
                    required
                  >
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.team_name})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-600">3rd Place</label>
                  <select
                    value={podiumThird}
                    onChange={(e) => setPodiumThird(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-f1-red"
                    required
                  >
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.team_name})</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Midfield Hero */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Midfield Hero - Best non-top-4 team driver (1 point)
              </label>
              <select
                value={midfieldHero}
                onChange={(e) => setMidfieldHero(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-f1-red"
                required
              >
                {midfieldDrivers.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.team_name})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Sprint Weekend Predictions */}
          {race.is_sprint_weekend && (
            <div className="bg-white p-6 rounded-lg shadow border-2 border-f1-red">
              <h3 className="text-xl font-bold mb-4 text-f1-red">Sprint Predictions</h3>

              {/* Sprint Pole */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sprint Pole Position (1 point)
                </label>
                <select
                  value={sprintPole}
                  onChange={(e) => setSprintPole(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-f1-red"
                >
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.team_name})</option>
                  ))}
                </select>
              </div>

              {/* Sprint Winner */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sprint Winner (1 point)
                </label>
                <select
                  value={sprintWinner}
                  onChange={(e) => setSprintWinner(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-f1-red"
                >
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.team_name})</option>
                  ))}
                </select>
              </div>

              {/* Sprint Midfield Hero */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sprint Midfield Hero (1 point)
                </label>
                <select
                  value={sprintMidfieldHero}
                  onChange={(e) => setSprintMidfieldHero(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-f1-red"
                >
                  {midfieldDrivers.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.team_name})</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Crazy Prediction */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-bold mb-4">Crazy Prediction (Optional)</h3>
            <p className="text-sm text-gray-600 mb-4">
              Make a wild prediction for this race. Other players will vote on whether it happened! (1 point if validated and happened)
            </p>
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
