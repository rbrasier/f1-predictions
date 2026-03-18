
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '../components/common/Layout';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import {
    getActiveSeason,
    getNextRace,
    getLeagueUsers,
    getDrivers,
    getTeams,
    getAllSeasonPredictions,
    getAllRacePredictions,
    getLastRoundResults,
    getCompletedRounds,
    getRoundResults
} from '../services/api';
import { User, Driver, Team, SeasonPrediction, RacePrediction, Race } from '../types';
import { useLeague } from '../contexts/LeagueContext';

type ViewMode = 'season' | 'race';

export const CompareTipsPage = () => {
    const { defaultLeague } = useLeague();
    const [searchParams] = useSearchParams();
    const [viewMode, setViewMode] = useState<ViewMode>((searchParams.get('mode') as ViewMode) || 'season');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Data
    const [users, setUsers] = useState<User[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [seasonPreds, setSeasonPreds] = useState<SeasonPrediction[]>([]);
    const [racePreds, setRacePreds] = useState<RacePrediction[]>([]);
    const [nextRace, setNextRace] = useState<Race | null>(null);
    const [lastRace, setLastRace] = useState<any>(null);

    // Round navigation
    const [completedRounds, setCompletedRounds] = useState<{ round: number; race_name: string; race_location: string | null }[]>([]);
    const [selectedRound, setSelectedRound] = useState<number | null>(null);
    const [roundResults, setRoundResults] = useState<any>(null);
    const [roundLoading, setRoundLoading] = useState(false);

    const getDriverCode = (id: string | null) => {
        if (!id) return '-';
        const driver = drivers.find(d => d.driverId === id);
        return driver ? (driver.code || driver.familyName.substring(0, 3).toUpperCase()) : id;
    };

    const getTeamName = (id: string | null) => {
        if (!id) return '-';
        const team = teams.find(t => t.constructorId === id);
        return team ? team.name : id;
    };

    useEffect(() => {
        if (!defaultLeague) return;

        const fetchData = async () => {
            try {
                setLoading(true);
                const [usersData, driversData, teamsData, seasonData, raceData] = await Promise.all([
                    getLeagueUsers(defaultLeague.id) as unknown as Promise<User[]>,
                    getDrivers(),
                    getTeams(),
                    getActiveSeason().catch(() => null),
                    getNextRace().catch(() => null)
                ]);

                setUsers(usersData);
                setDrivers(driversData);
                setTeams(teamsData);
                setNextRace(raceData);

                if (seasonData) {
                    const [sPreds, rounds] = await Promise.all([
                        getAllSeasonPredictions(seasonData.year, defaultLeague?.id),
                        getCompletedRounds(seasonData.year).catch(() => [] as { round: number; race_name: string; race_location: string | null }[])
                    ]);
                    setSeasonPreds(sPreds);
                    setCompletedRounds(rounds);

                    // Check if a specific round was requested via URL param
                    const roundParam = searchParams.get('round');
                    const requestedRound = roundParam ? parseInt(roundParam) : null;

                    if (raceData) {
                        const rPreds = await getAllRacePredictions(`${raceData.season}-${raceData.round}`, 100, defaultLeague?.id);
                        setRacePreds(rPreds);

                        // If a specific completed round was requested, load it
                        if (requestedRound && rounds.some(r => r.round === requestedRound)) {
                            setSelectedRound(requestedRound);
                        }
                    } else {
                        // No next race - fall back to last completed round
                        if (rounds.length > 0) {
                            const lastRound = rounds[rounds.length - 1];
                            try {
                                const lastRoundData = await getLastRoundResults(seasonData.year, defaultLeague?.id);
                                if (lastRoundData && lastRoundData.round) {
                                    setLastRace(lastRoundData);
                                    const rPreds = await getAllRacePredictions(`${seasonData.year}-${lastRoundData.round}`, 100, defaultLeague?.id);
                                    setRacePreds(rPreds);
                                    setSelectedRound(lastRound.round);
                                }
                            } catch (e) { }
                        }
                    }

                    // Auto-select the requested round or last completed round for results view
                    if (requestedRound && rounds.some(r => r.round === requestedRound)) {
                        setSelectedRound(requestedRound);
                    } else if (rounds.length > 0 && !raceData) {
                        setSelectedRound(rounds[rounds.length - 1].round);
                    }
                }

            } catch (err: any) {
                setError(err.message || 'Failed to load data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [defaultLeague]);

    // Load round results when selectedRound changes
    useEffect(() => {
        if (!selectedRound || !defaultLeague) return;

        const fetchRoundResults = async () => {
            try {
                setRoundLoading(true);
                const seasonData = await getActiveSeason().catch(() => null);
                if (!seasonData) return;

                const [results, preds] = await Promise.all([
                    getRoundResults(seasonData.year, selectedRound, defaultLeague.id).catch(() => null),
                    getAllRacePredictions(`${seasonData.year}-${selectedRound}`, 100, defaultLeague.id).catch(() => [])
                ]);
                setRoundResults(results);
                setRacePreds(preds);
            } catch (e) {
                console.error('Failed to load round results', e);
            } finally {
                setRoundLoading(false);
            }
        };

        fetchRoundResults();
    }, [selectedRound, defaultLeague]);

    if (loading) return <Layout><LoadingSpinner /></Layout>;
    if (error) return <Layout><div className="text-white p-4">Error: {error}</div></Layout>;

    const displayRace = selectedRound
        ? completedRounds.find(r => r.round === selectedRound) || nextRace || lastRace
        : nextRace || lastRace;

    return (
        <Layout>
            <div className="max-w-full mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">COMPARE TIPS</h1>
                        <p className="text-gray-400">See what everyone else is predicting</p>
                    </div>

                    {/* Toggle */}
                    <div className="bg-paddock-gray p-1 rounded-lg flex">
                        <button
                            onClick={() => setViewMode('season')}
                            className={`px-6 py-2 rounded-md font-bold text-sm uppercase transition ${viewMode === 'season'
                                ? 'bg-paddock-red text-white'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            Season
                        </button>
                        <button
                            onClick={() => setViewMode('race')}
                            className={`px-6 py-2 rounded-md font-bold text-sm uppercase transition ${viewMode === 'race'
                                ? 'bg-paddock-red text-white'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            {nextRace ? `Round ${nextRace.round}` : (lastRace ? `Round ${lastRace.round}` : 'Race')}
                        </button>
                    </div>
                </div>

                {viewMode === 'season' ? (
                    <SeasonComparisonTable
                        users={users}
                        predictions={seasonPreds}
                        getDriverCode={getDriverCode}
                        getTeamName={getTeamName}
                    />
                ) : (
                    <div>
                        {/* Round Selector */}
                        {completedRounds.length > 0 && (
                            <div className="mb-4 flex items-center gap-3">
                                <label className="text-gray-400 text-sm font-bold uppercase tracking-wide whitespace-nowrap">
                                    View Round:
                                </label>
                                <select
                                    value={selectedRound ?? ''}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setSelectedRound(val ? parseInt(val) : null);
                                    }}
                                    className="bg-paddock-gray border border-paddock-lightgray text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-paddock-red"
                                >
                                    {nextRace && (
                                        <option value="">Round {nextRace.round} (Upcoming)</option>
                                    )}
                                    {[...completedRounds].reverse().map(r => (
                                        <option key={r.round} value={r.round}>
                                            Round {r.round} – {r.race_name}{r.race_location ? ` (${r.race_location})` : ''}
                                        </option>
                                    ))}
                                </select>
                                {selectedRound && roundResults && (
                                    <span className="text-green-400 text-xs font-bold uppercase tracking-wide">
                                        ✓ Results available
                                    </span>
                                )}
                            </div>
                        )}

                        {roundLoading ? (
                            <LoadingSpinner />
                        ) : (
                            <RaceComparisonTable
                                users={users}
                                predictions={racePreds}
                                getDriverCode={getDriverCode}
                                race={displayRace}
                                results={selectedRound ? roundResults?.results : null}
                            />
                        )}
                    </div>
                )}
            </div>
        </Layout>
    );
};
import { useAuth } from '../hooks/useAuth';

const SeasonComparisonTable = ({ users, predictions, getDriverCode, getTeamName }: any) => {
    const { user: currentUser } = useAuth();

    // Process users to put current user first
    const sortedUsers = [...users].sort((a, b) => {
        if (a.id === currentUser?.id) return -1;
        if (b.id === currentUser?.id) return 1;
        return a.display_name.localeCompare(b.display_name);
    });

    // Helper to render ordered list
    const renderOrderedList = (jsonString: string, type: 'driver' | 'team') => {
        try {
            const list = JSON.parse(jsonString);
            if (!Array.isArray(list)) return '-';
            return (
                <div className="space-y-1">
                    {list.map((id: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-1.5 text-xs whitespace-nowrap">
                            <span className="text-gray-500 w-3 text-[10px]">{idx + 1}.</span>
                            <span className={`truncate ${idx < 3 ? (idx === 0 ? 'text-yellow-400 font-bold' : idx === 1 ? 'text-gray-300 font-bold' : 'text-orange-400 font-bold') : 'text-gray-300'}`}>
                                {type === 'driver' ? getDriverCode(id) : getTeamName(id)}
                            </span>
                        </div>
                    ))}
                </div>
            );
        } catch (e) {
            return '-';
        }
    };

    // Helper to render Grid 2027
    const renderGrid2027 = (jsonString: string) => {
        try {
            const grid = JSON.parse(jsonString);
            if (!Array.isArray(grid)) return '-';

            // Group by team
            const byTeam: Record<string, string[]> = {};
            grid.forEach((pairing: any) => {
                if (!byTeam[pairing.constructor_api_id]) {
                    byTeam[pairing.constructor_api_id] = [];
                }
                byTeam[pairing.constructor_api_id].push(pairing.driver_api_id);
            });

            return (
                <div className="space-y-2 text-xs">
                    {Object.entries(byTeam).map(([teamId, driverIds]) => (
                        <div key={teamId}>
                            <div className="text-paddock-coral font-bold mb-0.5 truncate text-[10px] uppercase tracking-wider">{getTeamName(teamId)}</div>
                            <div className="pl-1.5 border-l border-gray-700 space-y-0.5">
                                {driverIds.map(dId => (
                                    <div key={dId} className="text-gray-300 truncate">{getDriverCode(dId)}</div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            );
        } catch (e) {
            return '-';
        }
    };

    return (
        <div className="overflow-x-auto relative shadow-xl rounded-lg border border-paddock-lightgray bg-paddock-darkgray">
            <table className="w-full text-sm text-left border-collapse table-fixed">
                <thead className="text-xs uppercase bg-paddock-gray text-gray-400 sticky top-0 z-40 shadow-sm">
                    <tr>
                        <th className="px-3 py-3 sticky left-0 z-50 bg-paddock-gray border-b border-paddock-lightgray w-[160px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">
                            Category
                        </th>
                        {sortedUsers.map(user => (
                            <th key={user.id} className={`px-2 py-3 border-b border-paddock-lightgray w-[120px] text-center truncate ${user.id === currentUser?.id ? 'text-paddock-coral font-bold bg-paddock-gray/80 backdrop-blur' : ''}`} title={user.display_name}>
                                {user.display_name}
                                {user.id === currentUser?.id && ' (You)'}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-paddock-lightgray">
                    {/* Drivers Championship */}
                    <tr className="bg-paddock-dark">
                        <td className="px-3 py-4 font-bold text-white sticky left-0 bg-paddock-dark border-r border-paddock-lightgray z-30 align-top shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">
                            Drivers Championship
                            <div className="text-xs text-gray-500 font-normal mt-1">Predicted Order</div>
                        </td>
                        {sortedUsers.map(user => {
                            const pred = predictions.find((p: any) => p.user_id === user.id);
                            return (
                                <td key={user.id} className="px-2 py-4 align-top border-r border-paddock-lightgray/10 last:border-r-0">
                                    {pred?.drivers_championship_order ? renderOrderedList(pred.drivers_championship_order, 'driver') : '-'}
                                </td>
                            );
                        })}
                    </tr>

                    <tr className="h-4 bg-paddock-darkgray/50 border-none"><td colSpan={sortedUsers.length + 1}></td></tr>

                    {/* Constructors Championship */}
                    <tr className="bg-paddock-dark">
                        <td className="px-3 py-4 font-bold text-white sticky left-0 bg-paddock-dark border-r border-paddock-lightgray z-30 align-top shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">
                            Constructors Championship
                            <div className="text-xs text-gray-500 font-normal mt-1">Predicted Order</div>
                        </td>
                        {sortedUsers.map(user => {
                            const pred = predictions.find((p: any) => p.user_id === user.id);
                            return (
                                <td key={user.id} className="px-2 py-4 align-top border-r border-paddock-lightgray/10 last:border-r-0">
                                    {pred?.constructors_championship_order ? renderOrderedList(pred.constructors_championship_order, 'team') : '-'}
                                </td>
                            );
                        })}
                    </tr>

                    <tr className="h-4 bg-paddock-darkgray/50 border-none"><td colSpan={sortedUsers.length + 1}></td></tr>

                    {/* First Career Win */}
                    <tr className="bg-paddock-dark">
                        <td className="px-3 py-4 font-bold text-green-400 sticky left-0 bg-paddock-dark border-r border-paddock-lightgray z-30 align-middle shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">
                            First Career Win
                        </td>
                        {sortedUsers.map(user => {
                            const pred = predictions.find((p: any) => p.user_id === user.id);
                            let content = '-';
                            if (pred?.first_career_race_winner) {
                                try {
                                    if (pred.first_career_race_winner.startsWith('[')) {
                                        const ids = JSON.parse(pred.first_career_race_winner);
                                        content = ids.map((id: string) => getDriverCode(id)).join(', ');
                                    } else {
                                        content = getDriverCode(pred.first_career_race_winner);
                                    }
                                } catch (e) { content = getDriverCode(pred.first_career_race_winner); }
                            }
                            return (
                                <td key={user.id} className="px-2 py-4 text-center text-white font-bold border-r border-paddock-lightgray/10 last:border-r-0 break-words">
                                    {content}
                                </td>
                            );
                        })}
                    </tr>

                    {/* Audi vs Cadillac */}
                    <tr className="bg-paddock-dark">
                        <td className="px-3 py-4 font-bold text-blue-400 sticky left-0 bg-paddock-dark border-r border-paddock-lightgray z-30 align-middle shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">
                            Audi or Cadillac?
                        </td>
                        {sortedUsers.map(user => {
                            const pred = predictions.find((p: any) => p.user_id === user.id);
                            return (
                                <td key={user.id} className="px-2 py-4 text-center text-gray-300 capitalize border-r border-paddock-lightgray/10 last:border-r-0">
                                    {pred?.audi_vs_cadillac || '-'}
                                </td>
                            );
                        })}
                    </tr>

                    <tr className="h-4 bg-paddock-darkgray/50 border-none"><td colSpan={sortedUsers.length + 1}></td></tr>

                    {/* 2027 Grid */}
                    <tr className="bg-paddock-dark">
                        <td className="px-3 py-4 font-bold text-white sticky left-0 bg-paddock-dark border-r border-paddock-lightgray z-30 align-top shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">
                            2027 Grid Lineup
                            <div className="text-xs text-gray-500 font-normal mt-1">Predictions</div>
                        </td>
                        {sortedUsers.map(user => {
                            const pred = predictions.find((p: any) => p.user_id === user.id);
                            return (
                                <td key={user.id} className="px-2 py-4 align-top border-r border-paddock-lightgray/10 last:border-r-0">
                                    {pred?.grid_2027 ? renderGrid2027(pred.grid_2027) : '-'}
                                </td>
                            );
                        })}
                    </tr>

                    <tr className="h-4 bg-paddock-darkgray/50 border-none"><td colSpan={sortedUsers.length + 1}></td></tr>

                    {/* Sackings */}
                    <tr className="bg-paddock-dark">
                        <td className="px-3 py-4 font-bold text-red-400 sticky left-0 bg-paddock-dark border-r border-paddock-lightgray z-30 align-top shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">
                            Mid-Season Sackings
                        </td>
                        {sortedUsers.map(user => {
                            const pred = predictions.find((p: any) => p.user_id === user.id);
                            return (
                                <td key={user.id} className="px-2 py-4 text-center text-gray-300 text-xs border-r border-paddock-lightgray/10 last:border-r-0 align-top">
                                    {pred?.mid_season_sackings && pred.mid_season_sackings !== '[]' ? (
                                        <div className="flex flex-col gap-1 items-center">
                                            {(() => {
                                                try {
                                                    const s = JSON.parse(pred.mid_season_sackings);
                                                    return s.map((id: string, idx: number) => (
                                                        <span key={idx} className="bg-red-900/50 px-2 py-1 rounded text-red-200 border border-red-800 break-words max-w-full">
                                                            {id}
                                                        </span>
                                                    ));
                                                } catch (e) { return 'Error'; }
                                            })()}
                                        </div>
                                    ) : <span className="text-gray-600 italic">None Predicted</span>}
                                </td>
                            );
                        })}
                    </tr>

                    <tr className="h-4 bg-paddock-darkgray/50 border-none"><td colSpan={sortedUsers.length + 1}></td></tr>

                    {/* Crazy Prediction */}
                    <tr className="bg-paddock-dark">
                        <td className="px-3 py-4 font-bold text-purple-400 sticky left-0 bg-paddock-dark border-r border-paddock-lightgray z-30 align-top shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">
                            Crazy Prediction
                        </td>
                        {sortedUsers.map(user => {
                            const pred = predictions.find((p: any) => p.user_id === user.id);
                            return (
                                <td key={user.id} className="px-2 py-4 text-center text-gray-300 text-xs border-r border-paddock-lightgray/10 last:border-r-0 align-top min-w-[120px]">
                                    <div className="whitespace-pre-wrap italic">
                                        "{pred?.crazy_prediction || '-'}"
                                    </div>
                                </td>
                            );
                        })}
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

// Tick/Cross indicator component
const ResultBadge = ({ correct }: { correct: boolean | null }) => {
    if (correct === null) return null;
    return correct ? (
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-600 ml-1 flex-shrink-0" title="Correct">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
        </span>
    ) : (
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-600 ml-1 flex-shrink-0" title="Incorrect">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
        </span>
    );
};

const RaceComparisonTable = ({ users, predictions, race, getDriverCode, results }: any) => {
    const { user: currentUser } = useAuth();

    const sortedUsers = [...users].sort((a: any, b: any) => {
        if (a.id === currentUser?.id) return -1;
        if (b.id === currentUser?.id) return 1;
        return a.display_name.localeCompare(b.display_name);
    });

    // Helper to get correctness from results
    const isCorrect = (predValue: string | null, resultValue: string | null): boolean | null => {
        if (!results || !resultValue) return null;
        return predValue === resultValue;
    };

    const hasSprintResults = results && (results.sprint_pole_driver_api_id || results.sprint_winner_driver_api_id);

    return (
        <div className="overflow-x-auto relative shadow-xl rounded-lg border border-paddock-lightgray bg-paddock-darkgray">
            <div className="p-4 bg-paddock-gray border-b border-paddock-lightgray sticky left-0 z-40 flex items-center justify-between">
                <div>
                    <h3 className="text-white font-bold">
                        {race
                            ? (typeof race.raceName === 'string' ? race.raceName : (race.race_name || `Round ${race.round}`)) + ' Predictions'
                            : 'Race Predictions'}
                    </h3>
                    {results && (
                        <p className="text-green-400 text-xs mt-0.5">Results in — ticks show correct predictions</p>
                    )}
                </div>
                {results && (
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-green-600">
                                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            </span>
                            Correct
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-600">
                                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                            </span>
                            Incorrect
                        </span>
                    </div>
                )}
            </div>

            <table className="w-full text-sm text-left border-collapse">
                <thead className="text-xs uppercase bg-paddock-gray text-gray-400 sticky top-0 z-30 shadow-sm">
                    <tr>
                        <th className="px-4 py-3 sticky left-0 z-40 bg-paddock-gray border-b border-paddock-lightgray min-w-[200px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">
                            Category
                        </th>
                        {sortedUsers.map((user: any) => (
                            <th key={user.id} className={`px-4 py-3 border-b border-paddock-lightgray min-w-[150px] text-center ${user.id === currentUser?.id ? 'text-paddock-coral font-bold bg-paddock-gray/80 backdrop-blur' : ''}`}>
                                {user.display_name}
                                {user.id === currentUser?.id && ' (You)'}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="">
                    {/* Pole Position */}
                    <tr className="bg-paddock-dark">
                        <td className="px-4 py-4 font-bold text-white sticky left-0 bg-paddock-dark z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)] border-r border-paddock-lightgray">
                            Pole Position
                            {results && (
                                <div className="text-xs text-gray-500 font-normal mt-0.5">
                                    Actual: <span className="text-white font-bold">{getDriverCode(results.pole_position_driver_api_id)}</span>
                                </div>
                            )}
                        </td>
                        {sortedUsers.map((user: any) => {
                            const pred = predictions.find((p: any) => p.user_id === user.id);
                            const correct = isCorrect(pred?.pole_position_driver_api_id ?? null, results?.pole_position_driver_api_id ?? null);
                            return (
                                <td key={user.id} className="px-4 py-4 text-center text-gray-300 border-r border-paddock-lightgray/10 last:border-r-0">
                                    <span className="inline-flex items-center justify-center gap-1">
                                        {getDriverCode(pred?.pole_position_driver_api_id)}
                                        <ResultBadge correct={correct} />
                                    </span>
                                </td>
                            );
                        })}
                    </tr>

                    <tr className="h-4 bg-paddock-darkgray/50 border-none"><td colSpan={sortedUsers.length + 1}></td></tr>

                    {/* Podium Group */}
                    <tr className="bg-paddock-dark border-b border-white/5">
                        <td className="px-4 py-3 font-bold text-yellow-500 sticky left-0 bg-paddock-dark z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)] border-r border-paddock-lightgray">
                            Winner (P1)
                            {results && (
                                <div className="text-xs text-gray-500 font-normal mt-0.5">
                                    Actual: <span className="text-white font-bold">{getDriverCode(results.podium_first_driver_api_id)}</span>
                                </div>
                            )}
                        </td>
                        {sortedUsers.map((user: any) => {
                            const pred = predictions.find((p: any) => p.user_id === user.id);
                            const correct = isCorrect(pred?.podium_first_driver_api_id ?? null, results?.podium_first_driver_api_id ?? null);
                            return (
                                <td key={user.id} className="px-4 py-3 text-center text-white font-bold border-r border-paddock-lightgray/10 last:border-r-0">
                                    <span className="inline-flex items-center justify-center gap-1">
                                        {getDriverCode(pred?.podium_first_driver_api_id)}
                                        <ResultBadge correct={correct} />
                                    </span>
                                </td>
                            );
                        })}
                    </tr>
                    <tr className="bg-paddock-dark border-b border-white/5">
                        <td className="px-4 py-3 font-bold text-gray-400 sticky left-0 bg-paddock-dark z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)] border-r border-paddock-lightgray">
                            Second (P2)
                            {results && (
                                <div className="text-xs text-gray-500 font-normal mt-0.5">
                                    Actual: <span className="text-white font-bold">{getDriverCode(results.podium_second_driver_api_id)}</span>
                                </div>
                            )}
                        </td>
                        {sortedUsers.map((user: any) => {
                            const pred = predictions.find((p: any) => p.user_id === user.id);
                            const correct = isCorrect(pred?.podium_second_driver_api_id ?? null, results?.podium_second_driver_api_id ?? null);
                            return (
                                <td key={user.id} className="px-4 py-3 text-center text-gray-300 border-r border-paddock-lightgray/10 last:border-r-0">
                                    <span className="inline-flex items-center justify-center gap-1">
                                        {getDriverCode(pred?.podium_second_driver_api_id)}
                                        <ResultBadge correct={correct} />
                                    </span>
                                </td>
                            );
                        })}
                    </tr>
                    <tr className="bg-paddock-dark">
                        <td className="px-4 py-3 font-bold text-orange-400 sticky left-0 bg-paddock-dark z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)] border-r border-paddock-lightgray">
                            Third (P3)
                            {results && (
                                <div className="text-xs text-gray-500 font-normal mt-0.5">
                                    Actual: <span className="text-white font-bold">{getDriverCode(results.podium_third_driver_api_id)}</span>
                                </div>
                            )}
                        </td>
                        {sortedUsers.map((user: any) => {
                            const pred = predictions.find((p: any) => p.user_id === user.id);
                            const correct = isCorrect(pred?.podium_third_driver_api_id ?? null, results?.podium_third_driver_api_id ?? null);
                            return (
                                <td key={user.id} className="px-4 py-3 text-center text-gray-300 border-r border-paddock-lightgray/10 last:border-r-0">
                                    <span className="inline-flex items-center justify-center gap-1">
                                        {getDriverCode(pred?.podium_third_driver_api_id)}
                                        <ResultBadge correct={correct} />
                                    </span>
                                </td>
                            );
                        })}
                    </tr>

                    <tr className="h-4 bg-paddock-darkgray/50 border-none"><td colSpan={sortedUsers.length + 1}></td></tr>

                    {/* Midfield Hero */}
                    <tr className="bg-paddock-dark">
                        <td className="px-4 py-4 font-bold text-blue-400 sticky left-0 bg-paddock-dark z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)] border-r border-paddock-lightgray">
                            Midfield Hero
                            {results && (
                                <div className="text-xs text-gray-500 font-normal mt-0.5">
                                    Actual: <span className="text-white font-bold">{getDriverCode(results.midfield_hero_driver_api_id)}</span>
                                </div>
                            )}
                        </td>
                        {sortedUsers.map((user: any) => {
                            const pred = predictions.find((p: any) => p.user_id === user.id);
                            const correct = isCorrect(pred?.midfield_hero_driver_api_id ?? null, results?.midfield_hero_driver_api_id ?? null);
                            return (
                                <td key={user.id} className="px-4 py-4 text-center text-gray-300 border-r border-paddock-lightgray/10 last:border-r-0">
                                    <span className="inline-flex items-center justify-center gap-1">
                                        {getDriverCode(pred?.midfield_hero_driver_api_id)}
                                        <ResultBadge correct={correct} />
                                    </span>
                                </td>
                            );
                        })}
                    </tr>

                    {/* Sprint rows - only show if sprint results exist */}
                    {hasSprintResults && (
                        <>
                            <tr className="h-4 bg-paddock-darkgray/50 border-none"><td colSpan={sortedUsers.length + 1}></td></tr>
                            <tr className="bg-paddock-dark border-b border-white/5">
                                <td className="px-4 py-3 font-bold text-purple-400 sticky left-0 bg-paddock-dark z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)] border-r border-paddock-lightgray">
                                    Sprint Pole
                                    {results?.sprint_pole_driver_api_id && (
                                        <div className="text-xs text-gray-500 font-normal mt-0.5">
                                            Actual: <span className="text-white font-bold">{getDriverCode(results.sprint_pole_driver_api_id)}</span>
                                        </div>
                                    )}
                                </td>
                                {sortedUsers.map((user: any) => {
                                    const pred = predictions.find((p: any) => p.user_id === user.id);
                                    const correct = isCorrect(pred?.sprint_pole_driver_api_id ?? null, results?.sprint_pole_driver_api_id ?? null);
                                    return (
                                        <td key={user.id} className="px-4 py-3 text-center text-gray-300 border-r border-paddock-lightgray/10 last:border-r-0">
                                            <span className="inline-flex items-center justify-center gap-1">
                                                {getDriverCode(pred?.sprint_pole_driver_api_id)}
                                                {results?.sprint_pole_driver_api_id && <ResultBadge correct={correct} />}
                                            </span>
                                        </td>
                                    );
                                })}
                            </tr>
                            {results?.sprint_winner_driver_api_id && (
                                <tr className="bg-paddock-dark">
                                    <td className="px-4 py-3 font-bold text-purple-300 sticky left-0 bg-paddock-dark z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)] border-r border-paddock-lightgray">
                                        Sprint Winner
                                        <div className="text-xs text-gray-500 font-normal mt-0.5">
                                            Actual: <span className="text-white font-bold">{getDriverCode(results.sprint_winner_driver_api_id)}</span>
                                        </div>
                                    </td>
                                    {sortedUsers.map((user: any) => {
                                        const pred = predictions.find((p: any) => p.user_id === user.id);
                                        const correct = isCorrect(pred?.sprint_winner_driver_api_id ?? null, results?.sprint_winner_driver_api_id ?? null);
                                        return (
                                            <td key={user.id} className="px-4 py-3 text-center text-gray-300 border-r border-paddock-lightgray/10 last:border-r-0">
                                                <span className="inline-flex items-center justify-center gap-1">
                                                    {getDriverCode(pred?.sprint_winner_driver_api_id)}
                                                    <ResultBadge correct={correct} />
                                                </span>
                                            </td>
                                        );
                                    })}
                                </tr>
                            )}
                        </>
                    )}

                    <tr className="h-4 bg-paddock-darkgray/50 border-none"><td colSpan={sortedUsers.length + 1}></td></tr>

                    {/* Crazy Prediction */}
                    <tr className="bg-paddock-dark">
                        <td className="px-4 py-4 font-bold text-purple-400 sticky left-0 bg-paddock-dark z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)] border-r border-paddock-lightgray">
                            Crazy Prediction
                        </td>
                        {sortedUsers.map((user: any) => {
                            const pred = predictions.find((p: any) => p.user_id === user.id);
                            return (
                                <td key={user.id} className="px-4 py-4 text-center text-gray-300 text-xs min-w-[200px] border-r border-paddock-lightgray/10 last:border-r-0">
                                    <div className="whitespace-pre-wrap italic">
                                        "{pred?.crazy_prediction || '-'}"
                                    </div>
                                </td>
                            );
                        })}
                    </tr>
                </tbody>
            </table>
        </div>
    );
};
