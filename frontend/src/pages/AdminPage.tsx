import { useState, useEffect } from 'react';
import { Layout } from '../components/common/Layout';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ChampionshipOrderPicker } from '../components/predictions/ChampionshipOrderPicker';
import {
  getRaces,
  getDrivers,
  getTeams,
  enterRaceResults,
  enterSeasonResults,
  getAllSeasonPredictions,
  getActiveSeason,
  recalculateAllScores,
  refreshSeasonData,
  refreshRaceResults,
  getCacheStatus,
  clearSeasonCache,
  clearAllCache,
  importRaceResults,
  importSeasonStandings,
  bulkImportSeason
} from '../services/api';
import { Race, Driver, Team, Season } from '../types';

export const AdminPage = () => {
  const [activeTab, setActiveTab] = useState<'races' | 'season' | 'f1data'>('races');
  const [races, setRaces] = useState<Race[]>([]);
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [season, setSeason] = useState<Season | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [crazyPredictions, setCrazyPredictions] = useState<any[]>([]);
  const [crazyPredictionsHappened, setCrazyPredictionsHappened] = useState<number[]>([]);

  // F1 Data Management State
  const [cacheStatus, setCacheStatus] = useState<any>(null);
  const [refreshYear, setRefreshYear] = useState<number>(2024);
  const [refreshRound, setRefreshRound] = useState<number>(1);
  const [dataLoading, setDataLoading] = useState(false);

  // Race Results Form State
  const [polePosition, setPolePosition] = useState<string>('');
  const [podiumFirst, setPodiumFirst] = useState<string>('');
  const [podiumSecond, setPodiumSecond] = useState<string>('');
  const [podiumThird, setPodiumThird] = useState<string>('');
  const [midfieldHero, setMidfieldHero] = useState<string>('');
  const [sprintPole, setSprintPole] = useState<string>('');
  const [sprintWinner, setSprintWinner] = useState<string>('');
  const [sprintMidfieldHero, setSprintMidfieldHero] = useState<string>('');

  // Season Results Form State
  const [driversOrder, setDriversOrder] = useState<string[]>([]);
  const [constructorsOrder, setConstructorsOrder] = useState<string[]>([]);
  const [sackings] = useState<string[]>([]);
  const [audiVsCadillacWinner, setAudiVsCadillacWinner] = useState<'audi' | 'cadillac'>('audi');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [racesData, driversData, teamsData, seasonData] = await Promise.all([
        getRaces(),
        getDrivers(),
        getTeams(),
        getActiveSeason()
      ]);

      setRaces(racesData);
      setDrivers(driversData);
      setTeams(teamsData);
      setSeason(seasonData);

      if (driversData.length > 0) {
        setPolePosition(driversData[0].driverId);
        setPodiumFirst(driversData[0].driverId);
        setPodiumSecond(driversData[1]?.driverId || driversData[0].driverId);
        setPodiumThird(driversData[2]?.driverId || driversData[0].driverId);
        setMidfieldHero(driversData[0].driverId);
        setSprintPole(driversData[0].driverId);
        setSprintWinner(driversData[0].driverId);
        setSprintMidfieldHero(driversData[0].driverId);
        setDriversOrder(driversData.map((d: Driver) => d.driverId));
      }

      if (teamsData.length > 0) {
        setConstructorsOrder(teamsData.map((t: Team) => t.constructorId));
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadRacePredictions = async (season: string, round: string) => {
    try {
      // Note: API call needs to be updated to use season/round instead of raceId
      // For now, skip loading predictions
      console.log(`Loading predictions for ${season} round ${round}`);
      setCrazyPredictions([]);
      setCrazyPredictionsHappened([]);
    } catch (err) {
      console.error('Failed to load predictions');
    }
  };

  const loadSeasonPredictions = async (seasonYear: number) => {
    try {
      const predictions = await getAllSeasonPredictions(seasonYear);
      const withCrazy = predictions.filter(p => p.crazy_prediction);
      setCrazyPredictions(withCrazy);
      setCrazyPredictionsHappened([]);
    } catch (err) {
      console.error('Failed to load predictions');
    }
  };

  const handleRaceSelect = async (race: Race) => {
    setSelectedRace(race);
    await loadRacePredictions(race.season, race.round);
  };

  const handleSubmitRaceResults = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      if (!selectedRace) throw new Error('No race selected');

      const results: any = {
        pole_position_driver_api_id: polePosition,
        podium_first_driver_api_id: podiumFirst,
        podium_second_driver_api_id: podiumSecond,
        podium_third_driver_api_id: podiumThird,
        midfield_hero_driver_api_id: midfieldHero,
        crazy_predictions_happened: crazyPredictionsHappened
      };

      // Check if race has sprint by looking for Sprint property
      const hasSprintRace = !!selectedRace.Sprint;
      if (hasSprintRace) {
        results.sprint_pole_driver_api_id = sprintPole;
        results.sprint_winner_driver_api_id = sprintWinner;
        results.sprint_midfield_hero_driver_api_id = sprintMidfieldHero;
      }

      // Note: API needs to be updated to use season/round
      // For now, construct a race identifier
      const raceId = parseInt(selectedRace.season) * 100 + parseInt(selectedRace.round);
      await enterRaceResults(raceId, results);
      setSuccess('Race results saved and scores calculated!');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save results');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitSeasonResults = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      if (!season) throw new Error('No active season');

      const results = {
        drivers_championship_order: driversOrder,
        constructors_championship_order: constructorsOrder,
        mid_season_sackings: sackings,
        audi_vs_cadillac_winner: audiVsCadillacWinner,
        crazy_predictions_happened: crazyPredictionsHappened
      };

      await enterSeasonResults(season.year, results);
      setSuccess('Season results saved and scores calculated!');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save results');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecalculateScores = async () => {
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await recalculateAllScores();
      setSuccess('All scores recalculated successfully!');
    } catch (err: any) {
      setError('Failed to recalculate scores');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleCrazyPrediction = (id: number) => {
    setCrazyPredictionsHappened(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  // F1 Data Management Functions
  const loadCacheStatus = async () => {
    try {
      const status = await getCacheStatus();
      setCacheStatus(status);
    } catch (err) {
      console.error('Failed to load cache status');
    }
  };

  const handleRefreshSeasonData = async () => {
    setDataLoading(true);
    setError('');
    setSuccess('');

    try {
      await refreshSeasonData(refreshYear);
      setSuccess(`Successfully refreshed all data for ${refreshYear} season`);
      await loadCacheStatus();
    } catch (err: any) {
      setError(err.response?.data?.details || 'Failed to refresh season data');
    } finally {
      setDataLoading(false);
    }
  };

  const handleRefreshRaceResults = async () => {
    setDataLoading(true);
    setError('');
    setSuccess('');

    try {
      await refreshRaceResults(refreshYear, refreshRound);
      setSuccess(`Successfully refreshed results for ${refreshYear} Round ${refreshRound}`);
      await loadCacheStatus();
    } catch (err: any) {
      setError(err.response?.data?.details || 'Failed to refresh race results');
    } finally {
      setDataLoading(false);
    }
  };

  const handleClearSeasonCache = async (year: number) => {
    if (!confirm(`Are you sure you want to clear cache for ${year} season?`)) {
      return;
    }

    setDataLoading(true);
    setError('');
    setSuccess('');

    try {
      await clearSeasonCache(year);
      setSuccess(`Successfully cleared cache for ${year} season`);
      await loadCacheStatus();
    } catch (err: any) {
      setError('Failed to clear cache');
    } finally {
      setDataLoading(false);
    }
  };

  const handleClearAllCache = async () => {
    if (!confirm('Are you sure you want to clear ALL cached F1 data?')) {
      return;
    }

    setDataLoading(true);
    setError('');
    setSuccess('');

    try {
      await clearAllCache();
      setSuccess('Successfully cleared all cached F1 data');
      await loadCacheStatus();
    } catch (err: any) {
      setError('Failed to clear cache');
    } finally {
      setDataLoading(false);
    }
  };

  // Import handlers
  const handleImportRaceResults = async () => {
    setDataLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await importRaceResults(refreshYear, refreshRound);
      setSuccess(result.message);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to import race results');
    } finally {
      setDataLoading(false);
    }
  };

  const handleImportSeasonStandings = async () => {
    setDataLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await importSeasonStandings(refreshYear);
      setSuccess(result.message);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to import season standings');
    } finally {
      setDataLoading(false);
    }
  };

  const handleBulkImportSeason = async () => {
    if (!confirm(`Import ALL race results for ${refreshYear}? This may take a few minutes.`)) {
      return;
    }

    setDataLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await bulkImportSeason(refreshYear);
      setSuccess(`${result.message} - Imported: ${result.imported}, Failed: ${result.failed}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to bulk import season');
    } finally {
      setDataLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold text-gray-800">Admin Panel</h1>
          <button
            onClick={handleRecalculateScores}
            disabled={submitting}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50"
          >
            🔄 Recalculate All Scores
          </button>
        </div>

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

        {/* Tabs */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('races')}
            className={`px-6 py-3 rounded-lg font-bold ${
              activeTab === 'races'
                ? 'bg-f1-red text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Enter Race Results
          </button>
          <button
            onClick={() => {
              setActiveTab('season');
              if (season) loadSeasonPredictions(season.year);
            }}
            className={`px-6 py-3 rounded-lg font-bold ${
              activeTab === 'season'
                ? 'bg-f1-red text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Enter Season Results
          </button>
          <button
            onClick={() => {
              setActiveTab('f1data');
              loadCacheStatus();
            }}
            className={`px-6 py-3 rounded-lg font-bold ${
              activeTab === 'f1data'
                ? 'bg-f1-red text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            F1 Data Management
          </button>
        </div>

        {/* Race Results Tab */}
        {activeTab === 'races' && (
          <div className="space-y-6">
            {/* Race Selector */}
            <div className="bg-white p-6 rounded-lg shadow text-gray-900">
              <h3 className="text-xl font-bold mb-4 text-gray-900">Select Race</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {races.map(race => {
                  const raceKey = `${race.season}-${race.round}`;
                  const selectedKey = selectedRace ? `${selectedRace.season}-${selectedRace.round}` : null;
                  return (
                    <button
                      key={raceKey}
                      onClick={() => handleRaceSelect(race)}
                      className={`p-3 rounded-lg border-2 text-left transition ${
                        selectedKey === raceKey
                          ? 'border-f1-red bg-red-50'
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <div className="font-bold">Round {race.round}</div>
                      <div className="text-sm">{race.raceName}</div>
                      {race.Sprint && (
                        <span className="text-xs bg-f1-red text-white px-2 py-1 rounded mt-1 inline-block">
                          SPRINT
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Race Results Form */}
            {selectedRace && (
              <form onSubmit={handleSubmitRaceResults} className="space-y-6">
                <div className="bg-white p-6 rounded-lg shadow text-gray-900">
                  <h3 className="text-xl font-bold mb-4 text-gray-900">
                    {selectedRace.raceName} Results
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Pole Position</label>
                      <select
                        value={polePosition}
                        onChange={(e) => setPolePosition(e.target.value)}
                        className="w-full px-3 py-2 border rounded"
                        required
                      >
                        {drivers.map(d => (
                          <option key={d.driverId} value={d.driverId}>{`${d.givenName} ${d.familyName}`}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Midfield Hero</label>
                      <select
                        value={midfieldHero}
                        onChange={(e) => setMidfieldHero(e.target.value)}
                        className="w-full px-3 py-2 border rounded"
                        required
                      >
                        {drivers.map(d => (
                          <option key={d.driverId} value={d.driverId}>{`${d.givenName} ${d.familyName}`}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">1st Place</label>
                      <select
                        value={podiumFirst}
                        onChange={(e) => setPodiumFirst(e.target.value)}
                        className="w-full px-3 py-2 border rounded"
                        required
                      >
                        {drivers.map(d => (
                          <option key={d.driverId} value={d.driverId}>{`${d.givenName} ${d.familyName}`}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">2nd Place</label>
                      <select
                        value={podiumSecond}
                        onChange={(e) => setPodiumSecond(e.target.value)}
                        className="w-full px-3 py-2 border rounded"
                        required
                      >
                        {drivers.map(d => (
                          <option key={d.driverId} value={d.driverId}>{`${d.givenName} ${d.familyName}`}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">3rd Place</label>
                      <select
                        value={podiumThird}
                        onChange={(e) => setPodiumThird(e.target.value)}
                        className="w-full px-3 py-2 border rounded"
                        required
                      >
                        {drivers.map(d => (
                          <option key={d.driverId} value={d.driverId}>{`${d.givenName} ${d.familyName}`}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {selectedRace.Sprint && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-bold mb-3 text-f1-red">Sprint Results</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Sprint Pole</label>
                          <select
                            value={sprintPole}
                            onChange={(e) => setSprintPole(e.target.value)}
                            className="w-full px-3 py-2 border rounded"
                          >
                            {drivers.map(d => (
                              <option key={d.driverId} value={d.driverId}>{`${d.givenName} ${d.familyName}`}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Sprint Winner</label>
                          <select
                            value={sprintWinner}
                            onChange={(e) => setSprintWinner(e.target.value)}
                            className="w-full px-3 py-2 border rounded"
                          >
                            {drivers.map(d => (
                              <option key={d.driverId} value={d.driverId}>{`${d.givenName} ${d.familyName}`}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Sprint Midfield Hero</label>
                          <select
                            value={sprintMidfieldHero}
                            onChange={(e) => setSprintMidfieldHero(e.target.value)}
                            className="w-full px-3 py-2 border rounded"
                          >
                            {drivers.map(d => (
                              <option key={d.driverId} value={d.driverId}>{`${d.givenName} ${d.familyName}`}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Crazy Predictions */}
                {crazyPredictions.length > 0 && (
                  <div className="bg-white p-6 rounded-lg shadow text-gray-900">
                    <h3 className="text-xl font-bold mb-4 text-gray-900">Crazy Predictions - Mark Which Actually Happened</h3>
                    <div className="space-y-3">
                      {crazyPredictions.map(pred => (
                        <label key={pred.id} className="flex items-start space-x-3 p-3 border rounded hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={crazyPredictionsHappened.includes(pred.id)}
                            onChange={() => toggleCrazyPrediction(pred.id)}
                            className="mt-1"
                          />
                          <div>
                            <div className="font-medium">{pred.display_name}</div>
                            <div className="text-sm text-gray-600 italic">"{pred.crazy_prediction}"</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-f1-red text-white py-3 px-6 rounded-lg font-bold hover:bg-red-700 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Results & Calculate Scores'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Season Results Tab */}
        {activeTab === 'season' && season && (
          <form onSubmit={handleSubmitSeasonResults} className="space-y-6">
            <ChampionshipOrderPicker
              items={driversOrder.map(id => {
                const driver = drivers.find(d => d.driverId === id)!;
                return { id: driver.driverId, name: `${driver.givenName} ${driver.familyName}` };
              })}
              onChange={setDriversOrder}
              title="Final Drivers Championship Order"
            />

            <ChampionshipOrderPicker
              items={constructorsOrder.map(id => {
                const team = teams.find(t => t.constructorId === id)!;
                return { id: team.constructorId, name: team.name };
              })}
              onChange={setConstructorsOrder}
              title="Final Constructors Championship Order"
            />

            <div className="bg-white p-6 rounded-lg shadow text-gray-900">
              <h3 className="text-xl font-bold mb-4 text-gray-900">Audi vs Cadillac Winner</h3>
              <div className="flex space-x-6">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    value="audi"
                    checked={audiVsCadillacWinner === 'audi'}
                    onChange={() => setAudiVsCadillacWinner('audi')}
                  />
                  <span className="font-medium">Audi</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    value="cadillac"
                    checked={audiVsCadillacWinner === 'cadillac'}
                    onChange={() => setAudiVsCadillacWinner('cadillac')}
                  />
                  <span className="font-medium">Cadillac</span>
                </label>
              </div>
            </div>

            {crazyPredictions.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow text-gray-900">
                <h3 className="text-xl font-bold mb-4 text-gray-900">Season Crazy Predictions - Mark Which Actually Happened</h3>
                <div className="space-y-3">
                  {crazyPredictions.map(pred => (
                    <label key={pred.id} className="flex items-start space-x-3 p-3 border rounded hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={crazyPredictionsHappened.includes(pred.id)}
                        onChange={() => toggleCrazyPrediction(pred.id)}
                        className="mt-1"
                      />
                      <div>
                        <div className="font-medium">{pred.display_name}</div>
                        <div className="text-sm text-gray-600 italic">"{pred.crazy_prediction}"</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-f1-red text-white py-3 px-6 rounded-lg font-bold hover:bg-red-700 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Season Results & Calculate Scores'}
            </button>
          </form>
        )}

        {/* F1 Data Management Tab */}
        {activeTab === 'f1data' && (
          <div className="space-y-6">
            {/* Refresh Data Section */}
            <div className="bg-white p-6 rounded-lg shadow text-gray-900">
              <h3 className="text-xl font-bold mb-4 text-gray-900">Refresh F1 Data from Jolpica API</h3>
              <p className="text-gray-600 mb-4">
                Pull the latest F1 data from the Jolpica API (https://api.jolpi.ca/ergast).
                Data is cached for 24 hours to reduce API calls.
              </p>

              <div className="space-y-4">
                {/* Refresh Season Data */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-bold mb-3">Refresh Full Season Data</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Fetches schedule, drivers, constructors, and standings for a season
                  </p>
                  <div className="flex items-end space-x-3">
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-1">Season Year</label>
                      <input
                        type="number"
                        value={refreshYear}
                        onChange={(e) => setRefreshYear(parseInt(e.target.value))}
                        className="w-full px-3 py-2 border rounded"
                        min="2020"
                        max="2030"
                      />
                    </div>
                    <button
                      onClick={handleRefreshSeasonData}
                      disabled={dataLoading}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50"
                    >
                      {dataLoading ? 'Refreshing...' : 'Refresh Season'}
                    </button>
                  </div>
                </div>

                {/* Refresh Race Results */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-bold mb-3">Refresh Race Results</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Fetches race results, qualifying, and sprint data for a specific race
                  </p>
                  <div className="flex items-end space-x-3">
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-1">Season Year</label>
                      <input
                        type="number"
                        value={refreshYear}
                        onChange={(e) => setRefreshYear(parseInt(e.target.value))}
                        className="w-full px-3 py-2 border rounded"
                        min="2020"
                        max="2030"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-1">Round Number</label>
                      <input
                        type="number"
                        value={refreshRound}
                        onChange={(e) => setRefreshRound(parseInt(e.target.value))}
                        className="w-full px-3 py-2 border rounded"
                        min="1"
                        max="24"
                      />
                    </div>
                    <button
                      onClick={handleRefreshRaceResults}
                      disabled={dataLoading}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50"
                    >
                      {dataLoading ? 'Refreshing...' : 'Refresh Race'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Import Data Section */}
            <div className="bg-white p-6 rounded-lg shadow text-gray-900">
              <h3 className="text-xl font-bold mb-4 text-gray-900">Import & Auto-Populate from API</h3>
              <p className="text-gray-600 mb-4">
                Automatically transform API data and populate race results in the database with automatic score calculation.
              </p>

              <div className="space-y-4">
                {/* Import Single Race */}
                <div className="border rounded-lg p-4 bg-green-50 border-green-200">
                  <h4 className="font-bold mb-3 text-green-800">Import Single Race Results</h4>
                  <p className="text-sm text-gray-700 mb-3">
                    Fetches race data from API, auto-populates race_results table, and calculates prediction scores
                  </p>
                  <div className="flex items-end space-x-3">
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-1">Season Year</label>
                      <input
                        type="number"
                        value={refreshYear}
                        onChange={(e) => setRefreshYear(parseInt(e.target.value))}
                        className="w-full px-3 py-2 border rounded"
                        min="2020"
                        max="2030"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-1">Round Number</label>
                      <input
                        type="number"
                        value={refreshRound}
                        onChange={(e) => setRefreshRound(parseInt(e.target.value))}
                        className="w-full px-3 py-2 border rounded"
                        min="1"
                        max="24"
                      />
                    </div>
                    <button
                      onClick={handleImportRaceResults}
                      disabled={dataLoading}
                      className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 disabled:opacity-50"
                    >
                      {dataLoading ? 'Importing...' : 'Import Race'}
                    </button>
                  </div>
                </div>

                {/* Import Season Standings */}
                <div className="border rounded-lg p-4 bg-green-50 border-green-200">
                  <h4 className="font-bold mb-3 text-green-800">Import Season Championship Standings</h4>
                  <p className="text-sm text-gray-700 mb-3">
                    Imports final driver and constructor standings for a completed season and calculates scores
                  </p>
                  <div className="flex items-end space-x-3">
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-1">Season Year</label>
                      <input
                        type="number"
                        value={refreshYear}
                        onChange={(e) => setRefreshYear(parseInt(e.target.value))}
                        className="w-full px-3 py-2 border rounded"
                        min="2020"
                        max="2030"
                      />
                    </div>
                    <button
                      onClick={handleImportSeasonStandings}
                      disabled={dataLoading}
                      className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 disabled:opacity-50"
                    >
                      {dataLoading ? 'Importing...' : 'Import Standings'}
                    </button>
                  </div>
                </div>

                {/* Bulk Import All Races */}
                <div className="border rounded-lg p-4 bg-yellow-50 border-yellow-300">
                  <h4 className="font-bold mb-3 text-yellow-900">Bulk Import Entire Season</h4>
                  <p className="text-sm text-gray-700 mb-3">
                    <strong>⚠️ Warning:</strong> Imports ALL race results for a season. This may take several minutes and will use multiple API calls.
                  </p>
                  <div className="flex items-end space-x-3">
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-1">Season Year</label>
                      <input
                        type="number"
                        value={refreshYear}
                        onChange={(e) => setRefreshYear(parseInt(e.target.value))}
                        className="w-full px-3 py-2 border rounded"
                        min="2020"
                        max="2030"
                      />
                    </div>
                    <button
                      onClick={handleBulkImportSeason}
                      disabled={dataLoading}
                      className="bg-yellow-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-yellow-700 disabled:opacity-50"
                    >
                      {dataLoading ? 'Importing All...' : 'Bulk Import Season'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Cache Status Section */}
            <div className="bg-white p-6 rounded-lg shadow text-gray-900">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Cache Status</h3>
                <button
                  onClick={loadCacheStatus}
                  disabled={dataLoading}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-gray-700 disabled:opacity-50"
                >
                  Refresh Status
                </button>
              </div>

              {cacheStatus ? (
                <div className="space-y-4">
                  {/* Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="text-sm text-gray-600">Total Records</div>
                      <div className="text-2xl font-bold">{cacheStatus.summary.total_records}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Cache Size</div>
                      <div className="text-2xl font-bold">
                        {(cacheStatus.summary.total_size_bytes / 1024).toFixed(1)} KB
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Data Types</div>
                      <div className="text-2xl font-bold">
                        {Object.keys(cacheStatus.summary.by_type).length}
                      </div>
                    </div>
                  </div>

                  {/* By Season */}
                  {Object.keys(cacheStatus.summary.by_season).length > 0 && (
                    <div>
                      <h4 className="font-bold mb-2">Cached Seasons</h4>
                      <div className="space-y-2">
                        {Object.values(cacheStatus.summary.by_season).map((season: any) => (
                          <div key={season.year} className="flex justify-between items-center p-3 border rounded">
                            <div>
                              <span className="font-bold">{season.year}</span>
                              <span className="text-sm text-gray-600 ml-3">
                                {season.record_count} records
                              </span>
                              <span className="text-sm text-gray-600 ml-3">
                                Last updated: {new Date(season.last_updated).toLocaleString()}
                              </span>
                            </div>
                            <button
                              onClick={() => handleClearSeasonCache(season.year)}
                              disabled={dataLoading}
                              className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 disabled:opacity-50"
                            >
                              Clear
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Clear All Button */}
                  <button
                    onClick={handleClearAllCache}
                    disabled={dataLoading}
                    className="w-full bg-red-600 text-white py-2 px-4 rounded-lg font-bold hover:bg-red-700 disabled:opacity-50"
                  >
                    Clear All Cache
                  </button>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  Click "Refresh Status" to load cache information
                </div>
              )}
            </div>

            {/* Documentation */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-2">About the Jolpica F1 API</h3>
              <div className="text-sm text-gray-700 space-y-2">
                <p>
                  <strong>Base URL:</strong> https://api.jolpi.ca/ergast/f1/
                </p>
                <p>
                  <strong>Rate Limit:</strong> 200 requests per hour (unauthenticated)
                </p>
                <p>
                  <strong>Cache Duration:</strong> Data is cached for 24 hours to minimize API calls
                </p>
                <p className="pt-2">
                  The Jolpica API is the successor to the Ergast F1 API, providing comprehensive
                  Formula 1 data including race schedules, results, standings, driver and constructor
                  information.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};
