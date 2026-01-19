import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/common/Layout';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { CountdownTimer } from '../components/dashboard/CountdownTimer';
import { getActiveSeason, getNextRace, getUpcomingRaces, getAllUsers, getLeaderboard, getPendingValidations, getDrivers, getTeams, getTeamPrincipals, getMyRacePrediction, getMySeasonPrediction, getAllRacePredictions, getAllSeasonPredictions, getValidationsForPrediction, getLastRoundResults, getLastSeasonResults, validateCrazyPrediction, getDriverStandings } from '../services/api';
import { Season, Race, User, RacePrediction, LeaderboardEntry, Driver, SeasonPrediction, Team, TeamPrincipal, DriverStanding } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useLeague } from '../contexts/LeagueContext';

export const DashboardPage = () => {
  const { user: currentUser } = useAuth();
  const { defaultLeague } = useLeague();
  const [season, setSeason] = useState<Season | null>(null);
  const [nextRace, setNextRace] = useState<Race | null>(null);
  const [upcomingRaces, setUpcomingRaces] = useState<Race[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamPrincipals, setTeamPrincipals] = useState<TeamPrincipal[]>([]);
  const [driverStandings, setDriverStandings] = useState<DriverStanding[]>([]);
  const [myRacePrediction, setMyRacePrediction] = useState<RacePrediction | null>(null);
  const [mySeasonPrediction, setMySeasonPrediction] = useState<SeasonPrediction | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [crazyPredictionsWithValidations, setCrazyPredictionsWithValidations] = useState<any[]>([]);
  const [seasonCrazyPredictionsWithValidations, setSeasonCrazyPredictionsWithValidations] = useState<any[]>([]);
  const [lastRoundData, setLastRoundData] = useState<any>(null);
  const [lastSeasonData, setLastSeasonData] = useState<any>(null);
  const [votingOnPrediction, setVotingOnPrediction] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSeasonExpanded, setIsSeasonExpanded] = useState(false);
  const [isRaceExpanded, setIsRaceExpanded] = useState(false);

  // Helper to get driver name from API ID
  const getDriverName = (apiId: string | null): string => {
    if (!apiId) return 'Not Set';
    const driver = drivers.find(d => d.driverId === apiId);
    return driver ? `${driver.givenName} ${driver.familyName}` : 'Unknown Driver';
  };

  // Helper to get team name from API ID
  const getTeamName = (apiId: string | null): string => {
    if (!apiId) return 'Unknown Team';
    const team = teams.find(t => t.constructorId === apiId);
    if (team) return team.name;
    // Special cases for new teams
    if (apiId === 'cadillac') return 'Cadillac F1 Team';
    if (apiId === 'audi') return 'Audi (Kick Sauber)';
    // Fallback: capitalize the ID
    return apiId.charAt(0).toUpperCase() + apiId.slice(1);
  };

  // Helper to generate WhatsApp share message for season predictions
  const generateSeasonShareMessage = (): string => {
    if (!mySeasonPrediction || !season) return '';

    const driversOrder = JSON.parse(mySeasonPrediction.drivers_championship_order);
    const constructorsOrder = JSON.parse(mySeasonPrediction.constructors_championship_order);
    const sackings = mySeasonPrediction.mid_season_sackings ? JSON.parse(mySeasonPrediction.mid_season_sackings) : [];
    const grid2027 = JSON.parse(mySeasonPrediction.grid_2027);

    let message = `My F1 Season ${season.year} Predictions:\n\n`;

    // Top 5 drivers
    message += `🏆 DRIVERS CHAMPIONSHIP (Top 5):\n`;
    driversOrder.slice(0, 5).forEach((driverId: string, index: number) => {
      message += `${index + 1}. ${getDriverName(driverId)}\n`;
    });

    // Top 5 constructors
    message += `\n🏁 CONSTRUCTORS CHAMPIONSHIP (Top 5):\n`;
    constructorsOrder.slice(0, 5).forEach((teamId: string, index: number) => {
      message += `${index + 1}. ${getTeamName(teamId)}\n`;
    });

    // Mid-season sackings
    message += `\n❌ MID-SEASON SACKINGS:\n`;
    if (sackings.length === 0) {
      message += `None\n`;
    } else {
      sackings.forEach((id: string) => {
        // Check if it's a driver or team principal
        const driver = drivers.find(d => d.driverId === id);
        const principal = teamPrincipals.find(p => p.constructor_id === id);
        if (driver) {
          message += `• ${getDriverName(id)}\n`;
        } else if (principal) {
          message += `• ${principal.name} (${getTeamName(id)})\n`;
        }
      });
    }

    // Crazy prediction
    if (mySeasonPrediction.crazy_prediction) {
      message += `\n🎲 CRAZY PREDICTION:\n"${mySeasonPrediction.crazy_prediction}"\n`;
    }

    // Lineup changes for 2027
    message += `\n🔄 2027 LINEUP CHANGES:\n`;
    let changesFound = false;

    // Create a map of current driver teams
    const currentDriverTeams = new Map<string, string>();
    driverStandings.forEach(standing => {
      const driverId = standing.Driver.driverId;
      const teamId = standing.Constructors[0]?.constructorId;
      if (teamId) {
        currentDriverTeams.set(driverId, teamId);
      }
    });

    // Check for changes in 2027 grid
    grid2027.forEach((pairing: any) => {
      const driverId = pairing.driver_api_id;
      const predictedTeam = pairing.constructor_api_id;

      if (driverId && predictedTeam) {
        const currentTeam = currentDriverTeams.get(driverId);
        // Only show if driver exists in current standings and team is different
        if (currentTeam && currentTeam !== predictedTeam) {
          const driverName = getDriverName(driverId);
          const currentTeamName = getTeamName(currentTeam);
          const predictedTeamName = getTeamName(predictedTeam);
          message += `• ${driverName}: ${currentTeamName} → ${predictedTeamName}\n`;
          changesFound = true;
        }
      }
    });

    if (!changesFound) {
      message += `No driver moves predicted\n`;
    }

    return message;
  };

  // Helper to get race ID from F1Race
  const getRaceId = (race: Race): string => {
    return `${race.season}-${race.round}`;
  };

  // Helper to get race location
  const getRaceLocation = (race: Race): string => {
    return `${race.Circuit.Location.locality}, ${race.Circuit.Location.country}`;
  };

  // Helper to get FP1 start datetime
  const getFP1Start = (race: Race): string | null => {
    if (!race.FirstPractice) return null;
    return `${race.FirstPractice.date}T${race.FirstPractice.time}`;
  };

  // Handle voting on crazy prediction
  const handleVoteCrazyPrediction = async (predictionId: number, isValid: boolean, predictionType: 'race' | 'season' = 'race') => {
    try {
      setVotingOnPrediction(predictionId);
      await validateCrazyPrediction(predictionType, predictionId, isValid);

      // Refresh last round data to show updated validations (if available)
      if (season && predictionType === 'race') {
        try {
          const lastRound = await getLastRoundResults(season.year, defaultLeague?.id);
          setLastRoundData(lastRound);
        } catch (err) {
          // No last round data available yet (no completed races)
          console.log('No last round data to refresh');
        }
      }

      // Refresh last season data to show updated validations (if available)
      if (season && predictionType === 'season') {
        try {
          const lastSeasonResults = await getLastSeasonResults(season.year, defaultLeague?.id);
          setLastSeasonData(lastSeasonResults);
        } catch (err) {
          // No last season data available yet (season not completed)
          console.log('No last season data to refresh');
        }
      }

      // Refresh current round crazy predictions to show updated validations
      if (nextRace && predictionType === 'race') {
        const raceId = `${nextRace.season}-${nextRace.round}`;
        const allPredictions = await getAllRacePredictions(raceId, 10, defaultLeague?.id);
        const predictionsWithValidations = await Promise.all(
          allPredictions
            .filter(p => p.crazy_prediction)
            .map(async (p) => {
              try {
                const validations = await getValidationsForPrediction('race', p.id);
                const agreeCount = validations.filter(v => v.is_validated).length;
                const userHasVoted = validations.some(v => v.validator_user_id === currentUser?.id);
                return { ...p, agreeCount, userHasVoted };
              } catch {
                return { ...p, agreeCount: 0, userHasVoted: false };
              }
            })
        );
        setCrazyPredictionsWithValidations(predictionsWithValidations);
      }

      // Refresh season crazy predictions to show updated validations
      if (season && predictionType === 'season') {
        const allSeasonPredictions = await getAllSeasonPredictions(season.year, defaultLeague?.id);
        const seasonPredictionsWithValidations = await Promise.all(
          allSeasonPredictions
            .filter(p => p.crazy_prediction)
            .map(async (p) => {
              try {
                const validations = await getValidationsForPrediction('season', p.id);
                const agreeCount = validations.filter(v => v.is_validated).length;
                const userHasVoted = validations.some(v => v.validator_user_id === currentUser?.id);
                return { ...p, agreeCount, userHasVoted };
              } catch {
                return { ...p, agreeCount: 0, userHasVoted: false };
              }
            })
        );
        setSeasonCrazyPredictionsWithValidations(seasonPredictionsWithValidations);
      }
    } catch (err) {
      console.error('Error voting on crazy prediction:', err);
    } finally {
      setVotingOnPrediction(null);
    }
  };

  useEffect(() => {
    if (!defaultLeague) return;

    const fetchData = async () => {
      try {
        const [seasonData, raceData, upcomingRacesData, allUsers, leaderboardData, driversData, teamsData, principalsData] = await Promise.all([
          getActiveSeason().catch(() => null),
          getNextRace().catch(() => null),
          getUpcomingRaces(5),
          getAllUsers(),
          getLeaderboard(undefined, 5, defaultLeague?.id).catch(() => []),
          getDrivers().catch(() => []),
          getTeams().catch(() => []),
          getTeamPrincipals().catch(() => [])
        ]);

        setSeason(seasonData);
        setNextRace(raceData);
        setUpcomingRaces(upcomingRacesData);
        setUsers(allUsers);
        setLeaderboard(leaderboardData);
        setDrivers(driversData);
        setTeams(teamsData);
        setTeamPrincipals(principalsData);

        // Fetch driver standings if we have a season
        if (seasonData) {
          try {
            const standings = await getDriverStandings(seasonData.year);
            setDriverStandings(standings);
          } catch (err) {
            console.log('Failed to fetch driver standings');
          }
        }

        // Fetch race predictions if there's a next race
        if (raceData) {
          try {
            const raceId = `${raceData.season}-${raceData.round}`;
            const [myPrediction, allPredictions] = await Promise.all([
              getMyRacePrediction(raceId).catch(() => null),
              getAllRacePredictions(raceId, 10, defaultLeague?.id).catch(() => [])
            ]);
            setMyRacePrediction(myPrediction);

            // Fetch crazy predictions with validation counts
            const predictionsWithValidations = await Promise.all(
              allPredictions
                .filter(p => p.crazy_prediction)
                .map(async (p) => {
                  try {
                    const validations = await getValidationsForPrediction('race', p.id);
                    const agreeCount = validations.filter(v => v.is_validated).length;
                    const userHasVoted = validations.some(v => v.validator_user_id === currentUser?.id);
                    return { ...p, agreeCount, userHasVoted };
                  } catch {
                    return { ...p, agreeCount: 0, userHasVoted: false };
                  }
                })
            );
            setCrazyPredictionsWithValidations(predictionsWithValidations);
          } catch (err) {
            console.error('Error loading race predictions:', err);
          }
        }

        // Fetch season prediction
        if (seasonData) {
          try {
            const mySeasonPred = await getMySeasonPrediction(seasonData.year);
            setMySeasonPrediction(mySeasonPred);
          } catch (err) {
            // No season prediction yet
          }

          // Fetch season crazy predictions with validation counts (only if before deadline)
          const seasonDeadline = new Date(seasonData.prediction_deadline);
          const now = new Date();
          if (now <= seasonDeadline) {
            try {
              const allSeasonPredictions = await getAllSeasonPredictions(seasonData.year, defaultLeague?.id);
              const seasonPredictionsWithValidations = await Promise.all(
                allSeasonPredictions
                  .filter(p => p.crazy_prediction)
                  .map(async (p) => {
                    try {
                      const validations = await getValidationsForPrediction('season', p.id);
                      const agreeCount = validations.filter(v => v.is_validated).length;
                      const userHasVoted = validations.some(v => v.validator_user_id === currentUser?.id);
                      return { ...p, agreeCount, userHasVoted };
                    } catch {
                      return { ...p, agreeCount: 0, userHasVoted: false };
                    }
                  })
              );
              setSeasonCrazyPredictionsWithValidations(seasonPredictionsWithValidations);
            } catch (err) {
              console.error('Error loading season crazy predictions:', err);
            }
          }
        }

        // Fetch pending crazy prediction validations
        try {
          await getPendingValidations(defaultLeague?.id);
        } catch (err) {
          // Ignore errors for pending validations
        }

        // Fetch last round results if season exists
        if (seasonData) {
          try {
            const lastRound = await getLastRoundResults(seasonData.year, defaultLeague?.id);
            setLastRoundData(lastRound);
          } catch (err) {
            // No last round data available yet (no completed races or results not entered)
            console.log('No last round data available');
          }

          // Fetch last season results if season exists
          try {
            const lastSeasonResults = await getLastSeasonResults(seasonData.year, defaultLeague?.id);
            setLastSeasonData(lastSeasonResults);
          } catch (err) {
            // No last season data available yet (season not completed or results not entered)
            console.log('No last season data available');
          }
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser, defaultLeague]);

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </Layout>
    );
  }

  const seasonDeadlinePassed = season && new Date() > new Date(season.prediction_deadline);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="mb-12">
          <h1 className="text-2xl font-bold italic tracking-tight leading-tight flex items-center gap-4">
            <span className="text-white">
              {defaultLeague?.name || 'League'} ({defaultLeague?.member_count || 0} members)
            </span>
            <Link
              to="/leaderboard"
              className="text-sm font-normal not-italic text-paddock-red hover:text-paddock-coral underline"
            >
              View leaderboard
            </Link>
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Left Side */}
          <div className="lg:col-span-2 space-y-6">
            {/* Season Predictions Countdown - only show if deadline hasn't passed or no prediction submitted */}
            {season && !seasonDeadlinePassed && (
              <div className="bg-gradient-to-r from-purple-900/40 to-black rounded-lg border border-paddock-lightgray overflow-hidden">
                <div
                  className="p-4 md:p-6 cursor-pointer"
                  onClick={(e) => {
                    // Only toggle if not clicking on a button/link
                    if ((e.target as HTMLElement).closest('a')) return;
                    if (mySeasonPrediction) {
                      setIsSeasonExpanded(!isSeasonExpanded);
                    }
                  }}
                >
                  <div className="flex items-start gap-3 mb-3">
                    {/* Tick icon when prediction is submitted */}
                    {mySeasonPrediction && (
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="text-purple-400 text-xs md:text-sm font-bold uppercase tracking-wide mb-1">
                        Season {season.year}
                      </div>
                      <h2 className="text-xl md:text-3xl font-bold text-white mb-1">
                        SEASON PREDICTIONS
                      </h2>
                      <p className="text-gray-400 text-sm">Championship Predictions Close</p>
                    </div>

                    {/* Collapse/Expand indicator */}
                    {mySeasonPrediction && (
                      <div className="flex-shrink-0 mt-1">
                        <svg
                          className={`w-6 h-6 text-gray-400 transition-transform ${isSeasonExpanded ? 'rotate-90' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Buttons */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Link
                      to="/compare-tips?mode=season"
                      className="bg-purple-800 hover:bg-purple-900 text-white px-3 py-2 rounded font-bold uppercase text-xs tracking-wide transition border border-purple-600"
                    >
                      Compare
                    </Link>
                    <Link
                      to="/season-predictions"
                      className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded font-bold uppercase text-xs tracking-wide transition"
                    >
                      {mySeasonPrediction ? 'Edit Tips' : 'Submit Predictions'}
                    </Link>
                    {mySeasonPrediction && (
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(generateSeasonShareMessage())}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded font-bold uppercase text-xs tracking-wide transition"
                      >
                        Share
                      </a>
                    )}
                  </div>

                  {/* Countdown Timer - hidden when collapsed */}
                  {(!mySeasonPrediction || isSeasonExpanded) && (
                    <CountdownTimer
                      targetDate={season.prediction_deadline}
                      label=""
                    />
                  )}
                </div>
              </div>
            )}

            {/* PADDOCK PREDICTIONS Section - moved above races */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-paddock-red inline-block"></span>
                PADDOCK PREDICTIONS
              </h2>

              {/* Current Round - Show user tips if submitted */}
              {nextRace && (
                <div className="bg-gradient-to-r from-red-900/40 to-black rounded-lg border border-paddock-lightgray mb-4 overflow-hidden">
                  <div
                    className="p-3 md:p-4 cursor-pointer"
                    onClick={(e) => {
                      // Only toggle if not clicking on a button/link
                      if ((e.target as HTMLElement).closest('a')) return;
                      if (myRacePrediction) {
                        setIsRaceExpanded(!isRaceExpanded);
                      }
                    }}
                  >
                    <div className="flex items-start gap-3 mb-2">
                      {/* Tick icon when prediction is submitted */}
                      {myRacePrediction && (
                        <div className="flex-shrink-0 mt-1">
                          <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="text-paddock-coral text-xs font-bold uppercase tracking-wide mb-1">
                          Round {nextRace.round}
                        </div>
                        <h3 className="text-lg md:text-xl font-bold text-white mb-1">
                          {nextRace.raceName.toUpperCase()}
                        </h3>
                        <p className="text-gray-400 text-xs md:text-sm">{getRaceLocation(nextRace)}</p>
                      </div>

                      {/* Collapse/Expand indicator */}
                      {myRacePrediction && (
                        <div className="flex-shrink-0 mt-1">
                          <svg
                            className={`w-6 h-6 text-gray-400 transition-transform ${isRaceExpanded ? 'rotate-90' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Buttons */}
                    <div className="flex flex-wrap gap-2 mb-2">
                      <Link
                        to="/compare-tips?mode=race"
                        className="bg-paddock-darkred hover:bg-red-900 text-white px-3 py-2 rounded font-bold uppercase text-xs tracking-wide transition border border-paddock-red"
                      >
                        Compare
                      </Link>
                      <Link
                        to={`/race/${getRaceId(nextRace)}`}
                        className="bg-paddock-red hover:bg-red-600 text-white px-3 py-2 rounded font-bold uppercase text-xs tracking-wide transition"
                      >
                        {myRacePrediction ? 'Edit Tips' : 'Submit Tips'}
                      </Link>
                      {myRacePrediction && (
                        <a
                          href={`https://wa.me/?text=${encodeURIComponent(
                            `My F1 Predictions for ${nextRace.raceName}:\n\n` +
                            `Pole: ${getDriverName(myRacePrediction.pole_position_driver_api_id)}\n\n` +
                            `P1: ${getDriverName(myRacePrediction.podium_first_driver_api_id)}\n` +
                            `P2: ${getDriverName(myRacePrediction.podium_second_driver_api_id)}\n` +
                            `P3: ${getDriverName(myRacePrediction.podium_third_driver_api_id)}\n\n` +
                            `Midfield Hero: ${getDriverName(myRacePrediction.midfield_hero_driver_api_id)}\n` +
                            `Crazy Prediction: ${myRacePrediction.crazy_prediction}`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded font-bold uppercase text-xs tracking-wide transition"
                        >
                          Share
                        </a>
                      )}
                    </div>

                    {/* Predictions and countdown - hidden when collapsed */}
                    {(!myRacePrediction || isRaceExpanded) && (
                      myRacePrediction ? (
                        <div>
                          <div className="grid grid-cols-3 gap-2 mb-2">
                            <div className="bg-paddock-gray rounded p-2 border border-paddock-lightgray">
                              <div className="text-paddock-coral text-xs font-bold uppercase mb-1">P1</div>
                              <div className="text-white font-bold text-sm">
                                {getDriverName(myRacePrediction.podium_first_driver_api_id)}
                              </div>
                            </div>
                            <div className="bg-paddock-gray rounded p-2 border border-paddock-lightgray">
                              <div className="text-paddock-coral text-xs font-bold uppercase mb-1">P2</div>
                              <div className="text-white font-bold text-sm">
                                {getDriverName(myRacePrediction.podium_second_driver_api_id)}
                              </div>
                            </div>
                            <div className="bg-paddock-gray rounded p-2 border border-paddock-lightgray">
                              <div className="text-paddock-coral text-xs font-bold uppercase mb-1">P3</div>
                              <div className="text-white font-bold text-sm">
                                {getDriverName(myRacePrediction.podium_third_driver_api_id)}
                              </div>
                            </div>
                          </div>
                          {getFP1Start(nextRace) && (
                            <div className="text-xs">
                              <CountdownTimer targetDate={getFP1Start(nextRace)!} label="" />
                            </div>
                          )}
                        </div>
                      ) : (
                        getFP1Start(nextRace) && (
                          <CountdownTimer targetDate={getFP1Start(nextRace)!} label="" />
                        )
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Crazy Predictions from Others */}
              {crazyPredictionsWithValidations.length > 0 && (
                <div className="bg-paddock-gray rounded-lg border border-paddock-lightgray mb-4">
                  <div className="p-3 bg-purple-900/40 border-b border-paddock-lightgray">
                    <h4 className="text-white font-bold text-sm uppercase">Crazy Predictions This Round</h4>
                  </div>
                  <div className="divide-y divide-paddock-lightgray">
                    {crazyPredictionsWithValidations.slice(0, 3).map((prediction) => {
                      const user = users.find(u => u.id === prediction.user_id);
                      if (!user) return null;

                      const isOwnPrediction = prediction.user_id === currentUser?.id;
                      const canVote = !isOwnPrediction && !prediction.userHasVoted;

                      return (
                        <div key={prediction.id} className="p-3">
                          <div className="flex items-start gap-2">
                            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                              {user.display_name.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-white font-bold text-sm">{user.display_name}</span>
                                <span className="text-green-400 text-xs">
                                  {prediction.agreeCount} {prediction.agreeCount === 1 ? 'agrees' : 'agree'}
                                </span>
                              </div>
                              <p className="text-gray-300 text-xs italic mb-2">
                                "{prediction.crazy_prediction}"
                              </p>

                              {/* Voting buttons */}
                              {canVote && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleVoteCrazyPrediction(prediction.id, true)}
                                    disabled={votingOnPrediction === prediction.id}
                                    className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded font-bold disabled:opacity-50 transition"
                                  >
                                    Legit
                                  </button>
                                  <button
                                    onClick={() => handleVoteCrazyPrediction(prediction.id, false)}
                                    disabled={votingOnPrediction === prediction.id}
                                    className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded font-bold disabled:opacity-50 transition"
                                  >
                                    Not crazy enough
                                  </button>
                                </div>
                              )}
                              {prediction.userHasVoted && !isOwnPrediction && (
                                <span className="text-xs text-gray-500 italic">You voted</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Season Crazy Predictions from Others - only show if deadline hasn't passed */}
              {!seasonDeadlinePassed && seasonCrazyPredictionsWithValidations.length > 0 && (
                <div className="bg-paddock-gray rounded-lg border border-paddock-lightgray mb-4">
                  <div className="p-3 bg-purple-900/40 border-b border-paddock-lightgray">
                    <h4 className="text-white font-bold text-sm uppercase">Crazy Predictions This Season</h4>
                  </div>
                  <div className="divide-y divide-paddock-lightgray">
                    {seasonCrazyPredictionsWithValidations.slice(0, 3).map((prediction) => {
                      const user = users.find(u => u.id === prediction.user_id);
                      if (!user) return null;

                      const isOwnPrediction = prediction.user_id === currentUser?.id;
                      const canVote = !isOwnPrediction && !prediction.userHasVoted;

                      return (
                        <div key={prediction.id} className="p-3">
                          <div className="flex items-start gap-2">
                            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                              {user.display_name.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-white font-bold text-sm">{user.display_name}</span>
                                <span className="text-green-400 text-xs">
                                  {prediction.agreeCount} {prediction.agreeCount === 1 ? 'agrees' : 'agree'}
                                </span>
                              </div>
                              <p className="text-gray-300 text-xs italic mb-2">
                                "{prediction.crazy_prediction}"
                              </p>

                              {/* Voting buttons */}
                              {canVote && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleVoteCrazyPrediction(prediction.id, true, 'season')}
                                    disabled={votingOnPrediction === prediction.id}
                                    className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded font-bold disabled:opacity-50 transition"
                                  >
                                    Legit
                                  </button>
                                  <button
                                    onClick={() => handleVoteCrazyPrediction(prediction.id, false, 'season')}
                                    disabled={votingOnPrediction === prediction.id}
                                    className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded font-bold disabled:opacity-50 transition"
                                  >
                                    Not crazy enough
                                  </button>
                                </div>
                              )}
                              {prediction.userHasVoted && !isOwnPrediction && (
                                <span className="text-xs text-gray-500 italic">You voted</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Last Round Results & Voting */}
              {lastRoundData && lastRoundData.predictions && lastRoundData.predictions.length > 0 && (
                <div className="bg-paddock-gray rounded-lg border border-paddock-lightgray">
                  <div className="p-3 bg-green-900/40 border-b border-paddock-lightgray">
                    <h4 className="text-white font-bold text-sm uppercase">Last Round Results (Round {lastRoundData.round})</h4>
                  </div>

                  {/* Leaderboard for last round */}
                  <div className="p-3 bg-paddock-darkgray border-b border-paddock-lightgray">
                    <div className="text-xs text-gray-400 mb-2">Points Scored</div>
                    <div className="space-y-1">
                      {lastRoundData.predictions.slice(0, 5).map((pred: any, idx: number) => (
                        <div key={pred.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold ${idx === 0 ? 'text-yellow-400' : 'text-gray-400'}`}>
                              {idx + 1}.
                            </span>
                            <span className={`text-sm ${pred.user_id === currentUser?.id ? 'text-paddock-coral font-bold' : 'text-white'}`}>
                              {pred.display_name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-green-400 font-bold">{pred.calculated_score} pts</span>
                            {pred.score_breakdown && (
                              <div className="flex gap-1">
                                {pred.score_breakdown.pole && <span className="text-xs text-gray-400" title="Pole">P</span>}
                                {pred.score_breakdown.p1 && <span className="text-xs text-yellow-400" title="P1">1</span>}
                                {pred.score_breakdown.p2 && <span className="text-xs text-gray-300" title="P2">2</span>}
                                {pred.score_breakdown.p3 && <span className="text-xs text-orange-400" title="P3">3</span>}
                                {pred.score_breakdown.midfield && <span className="text-xs text-blue-400" title="Midfield">M</span>}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Crazy Predictions Voting */}
                  {lastRoundData.predictions.filter((p: any) => p.crazy_prediction).length > 0 && (
                    <div className="divide-y divide-paddock-lightgray">
                      <div className="p-3 bg-purple-900/20">
                        <h5 className="text-white text-xs font-bold uppercase mb-2">Vote on Crazy Predictions</h5>
                        <p className="text-gray-400 text-xs">Did these predictions come true?</p>
                      </div>
                      {lastRoundData.predictions
                        .filter((p: any) => p.crazy_prediction)
                        .map((pred: any) => {
                          const user = users.find(u => u.id === pred.user_id);
                          const validations = lastRoundData.crazy_validations.filter(
                            (v: any) => v.prediction_id === pred.id
                          );
                          const yesVotes = validations.filter((v: any) => v.is_validated).length;
                          const noVotes = validations.filter((v: any) => !v.is_validated).length;
                          const userVoted = validations.some((v: any) => v.validator_user_id === currentUser?.id);

                          return (
                            <div key={pred.id} className="p-3">
                              <div className="flex items-start gap-2 mb-2">
                                <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                                  {user?.display_name.substring(0, 2).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-white font-bold text-sm mb-1">{user?.display_name}</div>
                                  <p className="text-gray-300 text-xs italic mb-2">"{pred.crazy_prediction}"</p>

                                  <div className="flex items-center gap-3">
                                    <div className="text-xs text-gray-400">
                                      <span className="text-green-400">{yesVotes} Yes</span> •
                                      <span className="text-red-400"> {noVotes} No</span>
                                    </div>
                                    {!userVoted && (
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => handleVoteCrazyPrediction(pred.id, true)}
                                          disabled={votingOnPrediction === pred.id}
                                          className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded font-bold disabled:opacity-50"
                                        >
                                          ✓ Yes
                                        </button>
                                        <button
                                          onClick={() => handleVoteCrazyPrediction(pred.id, false)}
                                          disabled={votingOnPrediction === pred.id}
                                          className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded font-bold disabled:opacity-50"
                                        >
                                          ✗ No
                                        </button>
                                      </div>
                                    )}
                                    {userVoted && (
                                      <span className="text-xs text-gray-500 italic">You voted</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}

              {/* Season Results & Voting */}
              {lastSeasonData && lastSeasonData.predictions && lastSeasonData.predictions.length > 0 && (
                <div className="bg-paddock-gray rounded-lg border border-paddock-lightgray">
                  <div className="p-3 bg-green-900/40 border-b border-paddock-lightgray">
                    <h4 className="text-white font-bold text-sm uppercase">Season {lastSeasonData.season_year} Results</h4>
                  </div>

                  {/* Crazy Predictions Voting */}
                  {lastSeasonData.predictions.filter((p: any) => p.crazy_prediction).length > 0 && (
                    <div className="divide-y divide-paddock-lightgray">
                      <div className="p-3 bg-purple-900/20">
                        <h5 className="text-white text-xs font-bold uppercase mb-2">Vote on Season Crazy Predictions</h5>
                        <p className="text-gray-400 text-xs">Did these predictions come true?</p>
                      </div>
                      {lastSeasonData.predictions
                        .filter((p: any) => p.crazy_prediction)
                        .map((pred: any) => {
                          const user = users.find(u => u.id === pred.user_id);
                          const validations = lastSeasonData.crazy_validations.filter(
                            (v: any) => v.prediction_id === pred.id
                          );
                          const yesVotes = validations.filter((v: any) => v.is_validated).length;
                          const noVotes = validations.filter((v: any) => !v.is_validated).length;
                          const userVoted = validations.some((v: any) => v.validator_user_id === currentUser?.id);

                          return (
                            <div key={pred.id} className="p-3">
                              <div className="flex items-start gap-2 mb-2">
                                <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                                  {user?.display_name.substring(0, 2).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-white font-bold text-sm mb-1">{user?.display_name}</div>
                                  <p className="text-gray-300 text-xs italic mb-2">"{pred.crazy_prediction}"</p>

                                  <div className="flex items-center gap-3">
                                    <div className="text-xs text-gray-400">
                                      <span className="text-green-400">{yesVotes} Yes</span> •
                                      <span className="text-red-400"> {noVotes} No</span>
                                    </div>
                                    {!userVoted && (
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => handleVoteCrazyPrediction(pred.id, true, 'season')}
                                          disabled={votingOnPrediction === pred.id}
                                          className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded font-bold disabled:opacity-50"
                                        >
                                          ✓ Yes
                                        </button>
                                        <button
                                          onClick={() => handleVoteCrazyPrediction(pred.id, false, 'season')}
                                          disabled={votingOnPrediction === pred.id}
                                          className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded font-bold disabled:opacity-50"
                                        >
                                          ✗ No
                                        </button>
                                      </div>
                                    )}
                                    {userVoted && (
                                      <span className="text-xs text-gray-500 italic">You voted</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Upcoming Races Section */}
            {upcomingRaces.length > 1 && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-paddock-red inline-block"></span>
                  UPCOMING RACES
                </h2>
                <div className="bg-paddock-gray rounded-lg border border-paddock-lightgray">
                  <div className="divide-y divide-paddock-lightgray">
                    {upcomingRaces.slice(1).map((race) => {
                      const fp1Start = getFP1Start(race);
                      return (
                        <Link
                          key={getRaceId(race)}
                          to={`/race/${getRaceId(race)}`}
                          className="flex items-center justify-between p-4 hover:bg-paddock-lightgray transition"
                        >
                          <div className="flex-1">
                            <div className="text-paddock-coral text-xs font-bold uppercase tracking-wide mb-1">
                              Round {race.round}
                            </div>
                            <div className="text-white font-bold text-lg">
                              {race.raceName}
                            </div>
                            <div className="text-gray-400 text-sm">
                              {getRaceLocation(race)}
                            </div>
                            {fp1Start && (
                              <div className="text-gray-500 text-xs mt-1">
                                {new Date(fp1Start).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </div>
                            )}
                          </div>
                          <div className="text-paddock-red hover:text-paddock-coral font-bold uppercase text-sm">
                            Predict →
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Season Predictions Link - show if deadline passed and user has prediction */}
            {season && seasonDeadlinePassed && mySeasonPrediction && (
              <div className="bg-gradient-to-r from-purple-900/40 to-black rounded-lg p-4 border border-paddock-lightgray">
                <div className="text-purple-400 text-xs font-bold uppercase tracking-wide mb-2">
                  Season {season.year}
                </div>
                <h3 className="text-white font-bold mb-2">Your Season Predictions</h3>
                <p className="text-gray-400 text-xs mb-3">View your championship predictions (locked)</p>
                <Link
                  to="/season-predictions"
                  className="text-purple-400 hover:text-purple-300 text-sm font-bold uppercase"
                >
                  View Predictions →
                </Link>
              </div>
            )}

            {/* The Standings */}
            <div className="bg-paddock-gray rounded-lg border border-paddock-lightgray overflow-hidden">
              <div className="bg-paddock-red px-4 py-3">
                <h2 className="text-white font-bold uppercase tracking-wide italic text-lg">
                  THE STANDINGS
                </h2>
              </div>
              <div className="p-4">
                <div className="space-y-1 mb-4">
                  <div className="flex text-xs text-gray-500 uppercase tracking-wide px-2">
                    <div className="w-12">POS</div>
                    <div className="flex-1">PLAYER</div>
                    <div className="w-16 text-right">PTS</div>
                  </div>
                  {leaderboard.slice(0, 5).map((entry) => (
                    <div
                      key={entry.user_id}
                      className={`flex items-center py-2 px-2 rounded ${entry.user_id === currentUser?.id ? 'bg-paddock-red/20' : ''
                        }`}
                    >
                      <div className="w-12 text-white font-bold">
                        {entry.rank <= 3 ? (
                          <span className="text-xl">
                            {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
                          </span>
                        ) : (
                          <span className="text-gray-400">0{entry.rank}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <span className={entry.user_id === currentUser?.id ? 'text-paddock-coral' : 'text-white'}>
                          {entry.display_name}
                          {entry.user_id === currentUser?.id && ' (PaddockKing)'}
                        </span>
                      </div>
                      <div className="w-16 text-right text-paddock-coral font-bold">
                        {entry.total_points}
                      </div>
                    </div>
                  ))}
                </div>
                <Link
                  to="/leaderboard"
                  className="block text-center text-paddock-red hover:text-paddock-coral uppercase text-sm font-bold tracking-wide"
                >
                  View Full Leaderboard
                </Link>
              </div>
            </div>

            {/* Season Stats */}
            <div className="bg-paddock-gray rounded-lg border border-paddock-lightgray p-4">
              <h3 className="text-white font-bold uppercase tracking-wide mb-4">
                Season Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Races Completed</span>
                  <span className="text-white font-bold">
                    {upcomingRaces.length > 0 ? (parseInt(nextRace?.round || '1')) - 1 : 0}/24
                  </span>
                </div>
                {currentUser && leaderboard.length > 0 && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Best Prediction</span>
                      <span className="text-white font-bold">Australia</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Points per Race (Avg)</span>
                      <span className="text-white font-bold">
                        {leaderboard.find(e => e.user_id === currentUser.id)
                          ? Math.round((leaderboard.find(e => e.user_id === currentUser.id)!.race_points / Math.max((parseInt(nextRace?.round || '1')) - 1, 1)) * 10) / 10
                          : '0.0'}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
