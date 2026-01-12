import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/common/Layout';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ChampionshipOrderPicker } from '../components/predictions/ChampionshipOrderPicker';
import { CountdownTimer } from '../components/dashboard/CountdownTimer';
import { useToast } from '../contexts/ToastContext';
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
  const { showToast } = useToast();
  const [season, setSeason] = useState<Season | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [principals, setPrincipals] = useState<TeamPrincipal[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [driversOrder, setDriversOrder] = useState<string[]>([]);
  const [constructorsOrder, setConstructorsOrder] = useState<string[]>([]);
  const [sackings, setSackings] = useState<string[]>([]);
  const [audiVsCadillac, setAudiVsCadillac] = useState<'audi' | 'cadillac'>('audi');
  const [crazyPrediction, setCrazyPrediction] = useState('');
  const [firstCareerRaceWinner, setFirstCareerRaceWinner] = useState('');
  const [grid2027, setGrid2027] = useState<DriverTeamPairing[]>([]);
  const [grid2028, setGrid2028] = useState<DriverTeamPairing[]>([]);
  const [customDriverNames, setCustomDriverNames] = useState<{[key: number]: string}>({});

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
        setDriversOrder(driversData.map((d: Driver) => d.driverId));
        setConstructorsOrder(teamsData.map((t: Team) => t.constructorId));

        // Initialize first career race winner with first driver
        if (driversData.length > 0) {
          setFirstCareerRaceWinner(driversData[0].driverId);
        }

        // Initialize grid with first 20 drivers and their current teams
        const initialGrid = driversData.slice(0, 20).map((d: Driver) => ({
          driver_api_id: d.driverId,
          constructor_api_id: teamsData[0]?.constructorId || ''
        }));
        setGrid2027(initialGrid);
        // Initialize grid2028 with same default structure to satisfy backend validation
        setGrid2028(initialGrid);

        // Try to load existing prediction
        try {
          const existing = await getMySeasonPrediction(seasonData.year);
          setDriversOrder(JSON.parse(existing.drivers_championship_order));
          setConstructorsOrder(JSON.parse(existing.constructors_championship_order));
          setSackings(existing.mid_season_sackings ? JSON.parse(existing.mid_season_sackings) : []);
          setAudiVsCadillac(existing.audi_vs_cadillac as 'audi' | 'cadillac');
          setCrazyPrediction(existing.crazy_prediction || '');
          setFirstCareerRaceWinner(existing.first_career_race_winner || driversData[0].driverId);
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

      await submitSeasonPrediction(season.year, {
        drivers_championship_order: driversOrder,
        constructors_championship_order: constructorsOrder,
        mid_season_sackings: sackings,
        audi_vs_cadillac: audiVsCadillac,
        crazy_prediction: crazyPrediction,
        first_career_race_winner: firstCareerRaceWinner,
        grid_2027: grid2027,
        grid_2028: grid2028
      });

      showToast('Season predictions saved successfully!', 'success');
      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit prediction');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSacking = (id: string) => {
    setSackings(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const updateGridPairing = (index: number, field: 'driver_api_id' | 'constructor_api_id', value: string) => {
    setGrid2027(prev => {
      const newGrid = [...prev];
      newGrid[index] = { ...newGrid[index], [field]: value };
      return newGrid;
    });
    // Clear custom name if switching away from "custom"
    if (field === 'driver_api_id' && value !== 'custom') {
      setCustomDriverNames(prev => {
        const newNames = { ...prev };
        delete newNames[index];
        return newNames;
      });
    }
  };

  const updateCustomDriverName = (index: number, name: string) => {
    setCustomDriverNames(prev => ({
      ...prev,
      [index]: name
    }));
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
              const driver = drivers.find(d => d.driverId === id)!;
              return { id: driver.driverId, name: `${driver.givenName} ${driver.familyName}`, image_url: null };
            })}
            onChange={setDriversOrder}
            title="Drivers Championship Order"
          />

          {/* Constructors Championship */}
          <ChampionshipOrderPicker
            items={constructorsOrder.map(id => {
              const team = teams.find(t => t.constructorId === id)!;
              return { id: team.constructorId, name: team.name };
            })}
            onChange={setConstructorsOrder}
            title="Constructors Championship Order"
          />

          {/* Mid-Season Sackings */}
          <div className="bg-white p-6 rounded-lg shadow text-gray-900">
            <h3 className="text-xl font-bold mb-4 text-gray-900">Mid-Season Sackings</h3>
            <p className="text-sm text-gray-600 mb-4">
              Select drivers or team principals you think will be sacked/replaced mid-season, or select "None"
            </p>
            <div className="mb-4">
              <label className="flex items-center space-x-2 cursor-pointer bg-gray-100 p-3 rounded-lg border-2 border-gray-300">
                <input
                  type="checkbox"
                  checked={sackings.length === 0}
                  onChange={() => setSackings([])}
                  className="w-4 h-4"
                />
                <span className="font-bold text-gray-900">None - No sackings will occur</span>
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-bold mb-2 text-gray-900">Drivers</h4>
                {drivers.map(driver => (
                  <label key={driver.driverId} className="flex items-center space-x-2 mb-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sackings.includes(driver.driverId)}
                      onChange={() => toggleSacking(driver.driverId)}
                      className="w-4 h-4"
                    />
                    <span className="text-gray-900">{`${driver.givenName} ${driver.familyName}`}</span>
                  </label>
                ))}
              </div>
              <div>
                <h4 className="font-bold mb-2 text-gray-900">Team Principals</h4>
                {principals.map(principal => (
                  <label key={principal.constructor_id} className="flex items-center space-x-2 mb-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sackings.includes(principal.constructor_id)}
                      onChange={() => toggleSacking(principal.constructor_id)}
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

          {/* First Career Race Winner */}
          <div className="bg-white p-6 rounded-lg shadow text-gray-900">
            <h3 className="text-xl font-bold mb-4 text-gray-900">First Career Race Winner</h3>
            <p className="text-sm text-gray-600 mb-4">
              Which driver will win their first race of their career this season?
            </p>
            <select
              value={firstCareerRaceWinner}
              onChange={(e) => setFirstCareerRaceWinner(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-f1-red"
            >
              {drivers.map(driver => (
                <option key={driver.driverId} value={driver.driverId}>
                  {driver.givenName} {driver.familyName}
                </option>
              ))}
            </select>
          </div>

          {/* 2027 Grid */}
          <div className="bg-white p-6 rounded-lg shadow text-gray-900">
            <h3 className="text-xl font-bold mb-4 text-gray-900">2027 Grid Predictions</h3>
            <p className="text-sm text-gray-600 mb-4">
              Predict the driver-team pairings for the 2027 season (20 seats)
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {grid2027.map((pairing, index) => {
                const isCustomDriver = pairing.driver_api_id === 'custom';

                return (
                  <div key={index} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-gray-500 w-8">#{index + 1}</span>
                      <select
                        value={isCustomDriver ? 'custom' : pairing.driver_api_id}
                        onChange={(e) => updateGridPairing(index, 'driver_api_id', e.target.value)}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-f1-red"
                      >
                        {drivers.map(d => (
                          <option key={d.driverId} value={d.driverId}>
                            {d.givenName} {d.familyName}
                          </option>
                        ))}
                        <option value="custom">Someone else...</option>
                      </select>
                    </div>

                    {isCustomDriver && (
                      <div className="mb-2">
                        <input
                          type="text"
                          placeholder="Enter driver name"
                          value={customDriverNames[index] || ''}
                          onChange={(e) => updateCustomDriverName(index, e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-f1-red"
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-8">@</span>
                      <select
                        value={pairing.constructor_api_id}
                        onChange={(e) => updateGridPairing(index, 'constructor_api_id', e.target.value)}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-f1-red"
                      >
                        {teams.map(t => (
                          <option key={t.constructorId} value={t.constructorId}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
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
