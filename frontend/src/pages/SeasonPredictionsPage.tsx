import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/common/Layout';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ChampionshipOrderPicker } from '../components/predictions/ChampionshipOrderPicker';
import { CountdownTimer } from '../components/dashboard/CountdownTimer';
import {
  getActiveSeason,
  getDrivers,
  getTeams,
  getTeamPrincipals,
  submitSeasonPrediction,
  getMySeasonPrediction
} from '../services/api';
import { Driver, Team, TeamPrincipal, Season, DriverTeamPairing } from '../types';

export const SeasonPredictionsPage = () => {
  const navigate = useNavigate();
  const [season, setSeason] = useState<Season | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [principals, setPrincipals] = useState<TeamPrincipal[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [driversOrder, setDriversOrder] = useState<number[]>([]);
  const [constructorsOrder, setConstructorsOrder] = useState<number[]>([]);
  const [sackings, setSackings] = useState<number[]>([]);
  const [audiVsCadillac, setAudiVsCadillac] = useState<'audi' | 'cadillac'>('audi');
  const [crazyPrediction, setCrazyPrediction] = useState('');
  const [grid2027, setGrid2027] = useState<DriverTeamPairing[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [seasonData, driversData, teamsData, principalsData] = await Promise.all([
          getActiveSeason(),
          getDrivers(),
          getTeams(),
          getTeamPrincipals()
        ]);

        setSeason(seasonData);
        setDrivers(driversData);
        setTeams(teamsData);
        setPrincipals(principalsData);

        // Initialize default orders
        setDriversOrder(driversData.map(d => d.id));
        setConstructorsOrder(teamsData.map(t => t.id));

        // Initialize grid with first 20 drivers and their current teams
        const initialGrid = driversData.slice(0, 20).map(d => ({
          driver_id: d.id,
          team_id: d.team_id || teamsData[0].id
        }));
        setGrid2027(initialGrid);

        // Try to load existing prediction
        try {
          const existing = await getMySeasonPrediction(seasonData.id);
          setDriversOrder(JSON.parse(existing.drivers_championship_order));
          setConstructorsOrder(JSON.parse(existing.constructors_championship_order));
          setSackings(existing.mid_season_sackings ? JSON.parse(existing.mid_season_sackings) : []);
          setAudiVsCadillac(existing.audi_vs_cadillac as 'audi' | 'cadillac');
          setCrazyPrediction(existing.crazy_prediction || '');
          setGrid2027(JSON.parse(existing.grid_2027));
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
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      if (!season) throw new Error('No active season');

      await submitSeasonPrediction(season.id, {
        drivers_championship_order: driversOrder,
        constructors_championship_order: constructorsOrder,
        mid_season_sackings: sackings,
        audi_vs_cadillac: audiVsCadillac,
        crazy_prediction: crazyPrediction,
        grid_2027: grid2027
      });

      setSuccess('Season predictions saved successfully!');
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit prediction');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSacking = (id: number) => {
    setSackings(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const updateGridPairing = (index: number, field: 'driver_id' | 'team_id', value: number) => {
    setGrid2027(prev => {
      const newGrid = [...prev];
      newGrid[index] = { ...newGrid[index], [field]: value };
      return newGrid;
    });
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  if (!season) {
    return (
      <Layout>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          No active season found
        </div>
      </Layout>
    );
  }

  const isPast = new Date() > new Date(season.prediction_deadline);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-4xl font-bold text-white mb-4">Season {season.year} Predictions</h1>

        <div className="mb-6">
          <CountdownTimer targetDate={season.prediction_deadline} label="Deadline" />
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

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Drivers Championship */}
          <ChampionshipOrderPicker
            items={driversOrder.map(id => {
              const driver = drivers.find(d => d.id === id)!;
              return { id: driver.id, name: driver.name };
            })}
            onChange={setDriversOrder}
            title="Drivers Championship Order"
          />

          {/* Constructors Championship */}
          <ChampionshipOrderPicker
            items={constructorsOrder.map(id => {
              const team = teams.find(t => t.id === id)!;
              return { id: team.id, name: team.name };
            })}
            onChange={setConstructorsOrder}
            title="Constructors Championship Order"
          />

          {/* Mid-Season Sackings */}
          <div className="bg-white p-6 rounded-lg shadow text-gray-900">
            <h3 className="text-xl font-bold mb-4 text-gray-900">Mid-Season Sackings</h3>
            <p className="text-sm text-gray-600 mb-4">
              Select drivers or team principals you think will be sacked/replaced mid-season
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-bold mb-2 text-gray-900">Drivers</h4>
                {drivers.map(driver => (
                  <label key={driver.id} className="flex items-center space-x-2 mb-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sackings.includes(driver.id)}
                      onChange={() => toggleSacking(driver.id)}
                      className="w-4 h-4"
                    />
                    <span className="text-gray-900">{driver.name}</span>
                  </label>
                ))}
              </div>
              <div>
                <h4 className="font-bold mb-2 text-gray-900">Team Principals</h4>
                {principals.map(principal => (
                  <label key={principal.id} className="flex items-center space-x-2 mb-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sackings.includes(principal.id)}
                      onChange={() => toggleSacking(principal.id)}
                      className="w-4 h-4"
                    />
                    <span className="text-gray-900">{principal.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Audi vs Cadillac */}
          <div className="bg-white p-6 rounded-lg shadow text-gray-900">
            <h3 className="text-xl font-bold mb-4 text-gray-900">Audi vs Cadillac</h3>
            <p className="text-sm text-gray-600 mb-4">
              Which new team will finish higher in the Constructors Championship?
            </p>
            <div className="flex space-x-6">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="audi_cadillac"
                  value="audi"
                  checked={audiVsCadillac === 'audi'}
                  onChange={() => setAudiVsCadillac('audi')}
                  className="w-4 h-4"
                />
                <span className="font-medium text-gray-900">Audi (Kick Sauber)</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="audi_cadillac"
                  value="cadillac"
                  checked={audiVsCadillac === 'cadillac'}
                  onChange={() => setAudiVsCadillac('cadillac')}
                  className="w-4 h-4"
                />
                <span className="font-medium text-gray-900">Cadillac F1</span>
              </label>
            </div>
          </div>

          {/* Crazy Prediction */}
          <div className="bg-white p-6 rounded-lg shadow text-gray-900">
            <h3 className="text-xl font-bold mb-4 text-gray-900">Crazy Prediction (Optional)</h3>
            <p className="text-sm text-gray-600 mb-4">
              Make a wild prediction for the season. Other players will vote on whether it happened!
            </p>
            <textarea
              value={crazyPrediction}
              onChange={(e) => setCrazyPrediction(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-f1-red"
              rows={3}
              maxLength={500}
              placeholder="e.g., 'Max Verstappen will win every single race'"
            />
            <p className="text-xs text-gray-500 mt-1">{crazyPrediction.length}/500 characters</p>
          </div>

          {/* 2027 Grid */}
          <div className="bg-white p-6 rounded-lg shadow text-gray-900">
            <h3 className="text-xl font-bold mb-4 text-gray-900">2027 Grid Predictions</h3>
            <p className="text-sm text-gray-600 mb-4">
              Predict the driver-team pairings for the 2027 season
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {grid2027.map((pairing, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <span className="text-sm font-medium w-8">{index + 1}.</span>
                  <select
                    value={pairing.driver_id}
                    onChange={(e) => updateGridPairing(index, 'driver_id', parseInt(e.target.value))}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                  <span className="text-gray-400">@</span>
                  <select
                    value={pairing.team_id}
                    onChange={(e) => updateGridPairing(index, 'team_id', parseInt(e.target.value))}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
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
