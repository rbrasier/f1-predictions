import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/common/Layout';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ChampionshipOrderPicker } from '../components/predictions/ChampionshipOrderPicker';
import { DriverAutocomplete } from '../components/predictions/DriverAutocomplete';
import { CountdownTimer } from '../components/dashboard/CountdownTimer';
import { useToast } from '../contexts/ToastContext';
import {
  getActiveSeason,
  getDrivers,
  getTeams,
  getTeamPrincipals,
  getDriverStandings,
  submitSeasonPrediction,
  getMySeasonPrediction
} from '../services/api';
import { Driver, Team, TeamPrincipal, Season, DriverTeamPairing, DriverStanding } from '../types';

export const SeasonPredictionsPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [season, setSeason] = useState<Season | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [standings, setStandings] = useState<DriverStanding[]>([]);
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
  const [firstCareerRaceWinner, setFirstCareerRaceWinner] = useState<string[]>([]);
  const [grid2027, setGrid2027] = useState<DriverTeamPairing[]>([]);
  const [grid2028, setGrid2028] = useState<DriverTeamPairing[]>([]);
  const [customDriverNames, setCustomDriverNames] = useState<{ [key: number]: string }>({});


  useEffect(() => {
    const fetchData = async () => {
      try {
        const [seasonData, driversData, teamsData, principalsData] = await Promise.all([
          getActiveSeason(),
          getDrivers(),
          getTeams(),
          getTeamPrincipals()
        ]);

        // Fetch standings separately or if needed. We need current driver-team pairings.
        // Usually standings has this info.
        let standingsData: DriverStanding[] = [];
        try {
          standingsData = await getDriverStandings(seasonData.year);
        } catch (e) {
          console.error("Failed to fetch standings", e);
        }

        setSeason(seasonData);
        setDrivers(driversData);
        setTeams(teamsData);
        setPrincipals(principalsData);
        setStandings(standingsData);

        // Initialize default orders
        setDriversOrder(driversData.map((d: Driver) => d.driverId));
        setConstructorsOrder(teamsData.map((t: Team) => t.constructorId));

        // Initialize first career race winner
        // (default empty array, unlike before where we picked the first driver)

        // Initialize grid with 22 seats (11 teams * 2 drivers)
        // We need to ensure we have 11 teams. If only 10 (current grid), add Cadillac.
        let gridTeams = [...teamsData];
        if (gridTeams.length === 10) {
          gridTeams.push({
            constructorId: 'cadillac',
            name: 'Cadillac F1 Team',
            url: '',
            nationality: 'USA'
          } as Team);
        }

        const initialGrid: DriverTeamPairing[] = [];
        // Ensure we fill exactly 22 slots (11 teams * 2 drivers)
        for (let i = 0; i < 11; i++) {
          const team = gridTeams[i] || { constructorId: `team_${i}`, name: 'Pending Team' };
          initialGrid.push({ driver_api_id: '', constructor_api_id: team.constructorId });
          initialGrid.push({ driver_api_id: '', constructor_api_id: team.constructorId });
        }

        // If we have default drivers for first 20 spots, could fill them, but maybe better to leave blank or mapped?
        // Existing logic mapped first 20 drivers. Let's try to map them but respect the new structure?
        // Actually user wants "2 seats for each team", so pre-filling might be messy if we don't know who goes where.
        // Let's just initialize structure correctly.

        // However, we must ensure we don't lose data if we reload standard defaults.
        // The previous code:
        // const initialGrid = driversData.slice(0, 20).map((d: Driver) => ({
        //   driver_api_id: d.driverId,
        //   constructor_api_id: teamsData[0]?.constructorId || ''
        // }));
        // This was assigning everyone to the first team? That seems like a bug or placeholder in previous code.
        // I will initialize empty for now, or maybe pre-fill if possible.
        // Let's just set the structure.

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
          setFirstCareerRaceWinner(
            existing.first_career_race_winner ? JSON.parse(existing.first_career_race_winner) : []
          );

          let loadedGrid2027 = JSON.parse(existing.grid_2027);
          // Pad to 22 if legacy data (20 items)
          if (loadedGrid2027.length < 22) {
            const missingCount = 22 - loadedGrid2027.length;
            // Assume missing slots are for the new team (Cadillac)
            // We can try to find Cadillac ID or just use 'cadillac' if we added it to defaults
            for (let i = 0; i < missingCount; i++) {
              loadedGrid2027.push({ driver_api_id: '', constructor_api_id: 'cadillac' });
            }
          }
          // Map custom drivers
          const mappedGrid2027 = loadedGrid2027.map((pairing: DriverTeamPairing, idx: number) => {
            // Skip empty
            if (!pairing.driver_api_id) return pairing;

            const isStandardDriver = driversData.some((d: Driver) => d.driverId === pairing.driver_api_id);

            // If not a standard driver ID, it must be a custom name
            if (!isStandardDriver) {
              setCustomDriverNames(prev => ({ ...prev, [idx]: pairing.driver_api_id }));
              return { ...pairing, driver_api_id: 'custom' };
            }
            return pairing;
          });

          setGrid2027(mappedGrid2027);
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

      // Map grid2027 to replace 'custom' ID with the actual custom name
      const finalGrid2027 = grid2027.map((pairing, index) => {
        if (pairing.driver_api_id === 'custom' && customDriverNames[index]) {
          return { ...pairing, driver_api_id: customDriverNames[index] };
        }
        return pairing;
      });

      // For grid2028, if it also uses custom drivers, similar mapping would be needed.
      // Assuming for now it's handled differently or not using custom drivers.
      // If it uses the same customDriverNames state, it would need careful handling.
      // For now, sending grid2028 as is.

      await submitSeasonPrediction(season.year, {
        drivers_championship_order: driversOrder,
        constructors_championship_order: constructorsOrder,
        mid_season_sackings: sackings,
        audi_vs_cadillac: audiVsCadillac,
        crazy_prediction: crazyPrediction,
        first_career_race_winner: firstCareerRaceWinner,
        grid_2027: finalGrid2027, // Use the mapped grid
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

  const toggleFirstWinner = (id: string) => {
    setFirstCareerRaceWinner(prev =>
      prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id]
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

  const applyCurrentDrivers = (teamIndex: number, constructorId: string) => {
    // Find current drivers for this team from standings or drivers list
    // Helper to find drivers by constructorId
    // standings has Driver and Constructors list.

    // Filter standings where Constructors includes this constructorId
    const teamDrivers = standings
      .filter(s => s.Constructors.some(c => c.constructorId === constructorId))
      .map(s => s.Driver.driverId);

    // If we found drivers, apply them to the grid
    if (teamDrivers.length > 0) {
      const seat1Index = teamIndex * 2;
      const seat2Index = teamIndex * 2 + 1;

      // We expect 2 drivers usually.
      const driver1 = teamDrivers[0];
      const driver2 = teamDrivers[1];

      setGrid2027(prev => {
        const newGrid = [...prev];
        if (driver1) newGrid[seat1Index] = { ...newGrid[seat1Index], driver_api_id: driver1 };
        if (driver2) newGrid[seat2Index] = { ...newGrid[seat2Index], driver_api_id: driver2 };
        return newGrid;
      });

      // Also clear any custom names for these seats
      setCustomDriverNames(prev => {
        const newNames = { ...prev };
        delete newNames[seat1Index];
        delete newNames[seat2Index];
        return newNames;
      });
    } else {
      showToast(`No current drivers found for ${constructorId}`, 'error');
    }
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
              Select drivers or team principals you think will be sacked/replaced before the end of the season, or select "None"
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
            <h3 className="text-xl font-bold mb-4 text-gray-900">Crazy Prediction</h3>
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
              Which driver will win their first race of their career this season? Select all that apply.
            </p>

            <div className="mb-4">
              <label className="flex items-center space-x-2 cursor-pointer bg-gray-100 p-3 rounded-lg border-2 border-gray-300">
                <input
                  type="checkbox"
                  checked={firstCareerRaceWinner.includes('no_new_winners')}
                  onChange={() => toggleFirstWinner('no_new_winners')}
                  className="w-4 h-4"
                />
                <span className="font-bold text-gray-900">No new race winners in {season.year}</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {drivers.map(driver => (
                <label key={driver.driverId} className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-gray-50 rounded">
                  <input
                    type="checkbox"
                    checked={firstCareerRaceWinner.includes(driver.driverId)}
                    onChange={() => toggleFirstWinner(driver.driverId)}
                    disabled={firstCareerRaceWinner.includes('no_new_winners')}
                    className="w-4 h-4 disabled:opacity-50"
                  />
                  <span className="text-gray-900">{driver.givenName} {driver.familyName}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 2027 Grid */}
          <div className="bg-white p-6 rounded-lg shadow text-gray-900">
            <h3 className="text-xl font-bold mb-4 text-gray-900">2027 Grid Predictions</h3>
            <p className="text-sm text-gray-600 mb-4">
              Predict the driver-team pairings for the 2027 season (22 seats, 2 per team).
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: Math.ceil(grid2027.length / 2) }).map((_, teamIndex) => {
                // Group by team (every 2 items)
                const seat1Index = teamIndex * 2;
                const seat2Index = teamIndex * 2 + 1;
                const seat1 = grid2027[seat1Index];
                const seat2 = grid2027[seat2Index];

                if (!seat1) return null;

                // Find team name from constructorId
                const team = teams.find(t => t.constructorId === seat1.constructor_api_id) ||
                  (seat1.constructor_api_id === 'cadillac' ? { name: 'Cadillac F1 Team' } as any : null);

                return (
                  <div key={teamIndex} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-center mb-3 border-b border-gray-200 pb-2">
                      <h4 className="font-bold text-gray-900">
                        {team ? team.name : seat1.constructor_api_id}
                      </h4>

                      {team && (
                        <button
                          type="button"
                          onClick={() => applyCurrentDrivers(teamIndex, team.constructorId)}
                          className="text-xs text-f1-red font-bold hover:underline"
                        >
                          Populate current drivers
                        </button>
                      )}
                    </div>

                    <div className="space-y-4">
                      {/* Seat 1 */}
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Driver 1</label>
                        <DriverAutocomplete
                          drivers={drivers}
                          selectedDriverId={seat1.driver_api_id}
                          onSelect={(val) => updateGridPairing(seat1Index, 'driver_api_id', val)}
                          placeholder="Select driver..."
                          customOption={true}
                        />
                        {seat1.driver_api_id === 'custom' && (
                          <input
                            type="text"
                            placeholder="Enter driver name"
                            value={customDriverNames[seat1Index] || ''}
                            onChange={(e) => updateCustomDriverName(seat1Index, e.target.value)}
                            className="w-full mt-2 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-f1-red"
                          />
                        )}
                      </div>

                      {/* Seat 2 */}
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Driver 2</label>
                        {seat2 && (
                          <>
                            <DriverAutocomplete
                              drivers={drivers}
                              selectedDriverId={seat2.driver_api_id}
                              onSelect={(val) => updateGridPairing(seat2Index, 'driver_api_id', val)}
                              placeholder="Select driver..."
                              customOption={true}
                            />
                            {seat2.driver_api_id === 'custom' && (
                              <input
                                type="text"
                                placeholder="Enter driver name"
                                value={customDriverNames[seat2Index] || ''}
                                onChange={(e) => updateCustomDriverName(seat2Index, e.target.value)}
                                className="w-full mt-2 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-f1-red"
                              />
                            )}
                          </>
                        )}
                      </div>
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
