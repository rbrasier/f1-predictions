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
  getAllRacePredictions,
  getAllSeasonPredictions,
  getActiveSeason,
  recalculateAllScores
} from '../services/api';
import { Race, Driver, Team, Season } from '../types';

export const AdminPage = () => {
  const [activeTab, setActiveTab] = useState<'races' | 'season'>('races');
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

  // Race Results Form State
  const [polePosition, setPolePosition] = useState<number>(0);
  const [podiumFirst, setPodiumFirst] = useState<number>(0);
  const [podiumSecond, setPodiumSecond] = useState<number>(0);
  const [podiumThird, setPodiumThird] = useState<number>(0);
  const [midfieldHero, setMidfieldHero] = useState<number>(0);
  const [sprintPole, setSprintPole] = useState<number>(0);
  const [sprintWinner, setSprintWinner] = useState<number>(0);
  const [sprintMidfieldHero, setSprintMidfieldHero] = useState<number>(0);

  // Season Results Form State
  const [driversOrder, setDriversOrder] = useState<number[]>([]);
  const [constructorsOrder, setConstructorsOrder] = useState<number[]>([]);
  const [sackings, setSackings] = useState<number[]>([]);
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
        setPolePosition(driversData[0].id);
        setPodiumFirst(driversData[0].id);
        setPodiumSecond(driversData[1]?.id || driversData[0].id);
        setPodiumThird(driversData[2]?.id || driversData[0].id);
        setMidfieldHero(driversData[0].id);
        setSprintPole(driversData[0].id);
        setSprintWinner(driversData[0].id);
        setSprintMidfieldHero(driversData[0].id);
        setDriversOrder(driversData.map(d => d.id));
      }

      if (teamsData.length > 0) {
        setConstructorsOrder(teamsData.map(t => t.id));
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadRacePredictions = async (raceId: number) => {
    try {
      const predictions = await getAllRacePredictions(raceId);
      const withCrazy = predictions.filter(p => p.crazy_prediction);
      setCrazyPredictions(withCrazy);
      setCrazyPredictionsHappened([]);
    } catch (err) {
      console.error('Failed to load predictions');
    }
  };

  const loadSeasonPredictions = async (seasonId: number) => {
    try {
      const predictions = await getAllSeasonPredictions(seasonId);
      const withCrazy = predictions.filter(p => p.crazy_prediction);
      setCrazyPredictions(withCrazy);
      setCrazyPredictionsHappened([]);
    } catch (err) {
      console.error('Failed to load predictions');
    }
  };

  const handleRaceSelect = async (race: Race) => {
    setSelectedRace(race);
    await loadRacePredictions(race.id);
  };

  const handleSubmitRaceResults = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      if (!selectedRace) throw new Error('No race selected');

      const results: any = {
        pole_position_driver_id: polePosition,
        podium_first_driver_id: podiumFirst,
        podium_second_driver_id: podiumSecond,
        podium_third_driver_id: podiumThird,
        midfield_hero_driver_id: midfieldHero,
        crazy_predictions_happened: crazyPredictionsHappened
      };

      if (selectedRace.is_sprint_weekend) {
        results.sprint_pole_driver_id = sprintPole;
        results.sprint_winner_driver_id = sprintWinner;
        results.sprint_midfield_hero_driver_id = sprintMidfieldHero;
      }

      await enterRaceResults(selectedRace.id, results);
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

      await enterSeasonResults(season.id, results);
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
              if (season) loadSeasonPredictions(season.id);
            }}
            className={`px-6 py-3 rounded-lg font-bold ${
              activeTab === 'season'
                ? 'bg-f1-red text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Enter Season Results
          </button>
        </div>

        {/* Race Results Tab */}
        {activeTab === 'races' && (
          <div className="space-y-6">
            {/* Race Selector */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-bold mb-4">Select Race</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {races.map(race => (
                  <button
                    key={race.id}
                    onClick={() => handleRaceSelect(race)}
                    className={`p-3 rounded-lg border-2 text-left transition ${
                      selectedRace?.id === race.id
                        ? 'border-f1-red bg-red-50'
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <div className="font-bold">Round {race.round_number}</div>
                    <div className="text-sm">{race.name}</div>
                    {race.is_sprint_weekend && (
                      <span className="text-xs bg-f1-red text-white px-2 py-1 rounded mt-1 inline-block">
                        SPRINT
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Race Results Form */}
            {selectedRace && (
              <form onSubmit={handleSubmitRaceResults} className="space-y-6">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-xl font-bold mb-4">
                    {selectedRace.name} Results
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Pole Position</label>
                      <select
                        value={polePosition}
                        onChange={(e) => setPolePosition(parseInt(e.target.value))}
                        className="w-full px-3 py-2 border rounded"
                        required
                      >
                        {drivers.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Midfield Hero</label>
                      <select
                        value={midfieldHero}
                        onChange={(e) => setMidfieldHero(parseInt(e.target.value))}
                        className="w-full px-3 py-2 border rounded"
                        required
                      >
                        {drivers.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">1st Place</label>
                      <select
                        value={podiumFirst}
                        onChange={(e) => setPodiumFirst(parseInt(e.target.value))}
                        className="w-full px-3 py-2 border rounded"
                        required
                      >
                        {drivers.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">2nd Place</label>
                      <select
                        value={podiumSecond}
                        onChange={(e) => setPodiumSecond(parseInt(e.target.value))}
                        className="w-full px-3 py-2 border rounded"
                        required
                      >
                        {drivers.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">3rd Place</label>
                      <select
                        value={podiumThird}
                        onChange={(e) => setPodiumThird(parseInt(e.target.value))}
                        className="w-full px-3 py-2 border rounded"
                        required
                      >
                        {drivers.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {selectedRace.is_sprint_weekend && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-bold mb-3 text-f1-red">Sprint Results</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Sprint Pole</label>
                          <select
                            value={sprintPole}
                            onChange={(e) => setSprintPole(parseInt(e.target.value))}
                            className="w-full px-3 py-2 border rounded"
                          >
                            {drivers.map(d => (
                              <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Sprint Winner</label>
                          <select
                            value={sprintWinner}
                            onChange={(e) => setSprintWinner(parseInt(e.target.value))}
                            className="w-full px-3 py-2 border rounded"
                          >
                            {drivers.map(d => (
                              <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Sprint Midfield Hero</label>
                          <select
                            value={sprintMidfieldHero}
                            onChange={(e) => setSprintMidfieldHero(parseInt(e.target.value))}
                            className="w-full px-3 py-2 border rounded"
                          >
                            {drivers.map(d => (
                              <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Crazy Predictions */}
                {crazyPredictions.length > 0 && (
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-xl font-bold mb-4">Crazy Predictions - Mark Which Actually Happened</h3>
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
                const driver = drivers.find(d => d.id === id)!;
                return { id: driver.id, name: driver.name };
              })}
              onChange={setDriversOrder}
              title="Final Drivers Championship Order"
            />

            <ChampionshipOrderPicker
              items={constructorsOrder.map(id => {
                const team = teams.find(t => t.id === id)!;
                return { id: team.id, name: team.name };
              })}
              onChange={setConstructorsOrder}
              title="Final Constructors Championship Order"
            />

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-bold mb-4">Audi vs Cadillac Winner</h3>
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
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-xl font-bold mb-4">Season Crazy Predictions - Mark Which Actually Happened</h3>
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
      </div>
    </Layout>
  );
};
