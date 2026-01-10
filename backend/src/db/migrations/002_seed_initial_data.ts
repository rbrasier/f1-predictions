import { getOriginalGrid, getAllSeasons } from '../../utils/gridData';

export const name = 'Seed initial F1 data from grid-data.json';

export function up(db: any) {
  // Load grid data from JSON
  const seasons = getAllSeasons();
  console.log(`  Loading grid data from JSON for ${seasons.length} seasons: ${seasons.join(', ')}`);

  // Collect all unique teams across all seasons
  const allTeamsMap = new Map<string, { name: string; is_top_four: boolean }>();

  seasons.forEach((year) => {
    const grid = getOriginalGrid(year);
    grid.teams.forEach((team) => {
      if (!allTeamsMap.has(team.name)) {
        allTeamsMap.set(team.name, {
          name: team.name,
          is_top_four: team.is_top_four
        });
      }
    });
  });

  // Seed Teams
  const insertTeam = db.prepare('INSERT INTO teams (name, is_top_four, is_active) VALUES (?, ?, 1)');
  const teamIds: { [key: string]: number } = {};

  Array.from(allTeamsMap.values()).forEach((team: { name: string; is_top_four: boolean }) => {
    const result = insertTeam.run(team.name, team.is_top_four ? 1 : 0);
    teamIds[team.name] = Number(result.lastInsertRowid);
  });

  console.log(`  Seeded ${allTeamsMap.size} teams`);

  // Collect all unique drivers across all seasons
  const allDriversMap = new Map<string, { name: string; team: string }>();

  seasons.forEach((year) => {
    const grid = getOriginalGrid(year);
    grid.drivers.forEach((driver) => {
      if (!allDriversMap.has(driver.name)) {
        allDriversMap.set(driver.name, {
          name: driver.name,
          team: driver.team
        });
      }
    });
  });

  // Seed Drivers
  const insertDriver = db.prepare('INSERT INTO drivers (name, team_id, is_active) VALUES (?, ?, 1)');

  Array.from(allDriversMap.values()).forEach((driver: { name: string; team: string }) => {
    insertDriver.run(driver.name, teamIds[driver.team]);
  });

  console.log(`  Seeded ${allDriversMap.size} drivers`);

  // Collect all unique team principals across all seasons
  const allPrincipalsMap = new Map<string, { name: string; team: string }>();

  seasons.forEach((year) => {
    const grid = getOriginalGrid(year);
    grid.team_principals.forEach((principal) => {
      if (!allPrincipalsMap.has(principal.name)) {
        allPrincipalsMap.set(principal.name, {
          name: principal.name,
          team: principal.team
        });
      }
    });
  });

  // Seed Team Principals
  const insertPrincipal = db.prepare('INSERT INTO team_principals (name, team_id, is_active) VALUES (?, ?, 1)');

  Array.from(allPrincipalsMap.values()).forEach((principal: { name: string; team: string }) => {
    insertPrincipal.run(principal.name, teamIds[principal.team]);
  });

  console.log(`  Seeded ${allPrincipalsMap.size} team principals`);

  // Seed Seasons from JSON
  const insertSeason = db.prepare('INSERT INTO seasons (year, prediction_deadline, is_active) VALUES (?, ?, ?)');
  const seasonIds: { [key: string]: number } = {};

  seasons.forEach((year) => {
    const grid = getOriginalGrid(year);
    const result = insertSeason.run(parseInt(year), grid.prediction_deadline, grid.is_active ? 1 : 0);
    seasonIds[year] = Number(result.lastInsertRowid);
    console.log(`  Seeded season ${year} (${grid.is_active ? 'ACTIVE' : 'inactive'})`);
  });

  // Seed 2026 Race Calendar (24 races) if it exists
  const season2026Id = seasonIds['2026'];
  if (!season2026Id) {
    console.log('  Skipping 2026 race calendar (season not found)');
    return;
  }
  const races2026 = [
    { name: 'Australian GP', round: 1, fp1: '2026-03-15T01:30:00Z', race_date: '2026-03-17', location: 'Melbourne', is_sprint: false },
    { name: 'Chinese GP', round: 2, fp1: '2026-03-22T02:30:00Z', race_date: '2026-03-24', location: 'Shanghai', is_sprint: true },
    { name: 'Japanese GP', round: 3, fp1: '2026-04-05T02:00:00Z', race_date: '2026-04-07', location: 'Suzuka', is_sprint: false },
    { name: 'Bahrain GP', round: 4, fp1: '2026-04-12T12:30:00Z', race_date: '2026-04-14', location: 'Sakhir', is_sprint: false },
    { name: 'Saudi Arabian GP', round: 5, fp1: '2026-04-19T14:30:00Z', race_date: '2026-04-21', location: 'Jeddah', is_sprint: false },
    { name: 'Miami GP', round: 6, fp1: '2026-05-03T18:30:00Z', race_date: '2026-05-05', location: 'Miami', is_sprint: true },
    { name: 'Emilia Romagna GP', round: 7, fp1: '2026-05-17T12:30:00Z', race_date: '2026-05-19', location: 'Imola', is_sprint: false },
    { name: 'Monaco GP', round: 8, fp1: '2026-05-24T12:30:00Z', race_date: '2026-05-26', location: 'Monte Carlo', is_sprint: false },
    { name: 'Spanish GP', round: 9, fp1: '2026-05-31T12:30:00Z', race_date: '2026-06-02', location: 'Barcelona', is_sprint: false },
    { name: 'Canadian GP', round: 10, fp1: '2026-06-14T18:00:00Z', race_date: '2026-06-16', location: 'Montreal', is_sprint: false },
    { name: 'Austrian GP', round: 11, fp1: '2026-06-28T12:30:00Z', race_date: '2026-06-30', location: 'Spielberg', is_sprint: true },
    { name: 'British GP', round: 12, fp1: '2026-07-05T13:30:00Z', race_date: '2026-07-07', location: 'Silverstone', is_sprint: false },
    { name: 'Belgian GP', round: 13, fp1: '2026-07-26T12:30:00Z', race_date: '2026-07-28', location: 'Spa-Francorchamps', is_sprint: false },
    { name: 'Hungarian GP', round: 14, fp1: '2026-08-02T12:30:00Z', race_date: '2026-08-04', location: 'Budapest', is_sprint: false },
    { name: 'Dutch GP', round: 15, fp1: '2026-08-30T12:30:00Z', race_date: '2026-09-01', location: 'Zandvoort', is_sprint: false },
    { name: 'Italian GP', round: 16, fp1: '2026-09-06T12:30:00Z', race_date: '2026-09-08', location: 'Monza', is_sprint: false },
    { name: 'Azerbaijan GP', round: 17, fp1: '2026-09-20T10:30:00Z', race_date: '2026-09-22', location: 'Baku', is_sprint: false },
    { name: 'Singapore GP', round: 18, fp1: '2026-10-04T09:30:00Z', race_date: '2026-10-06', location: 'Marina Bay', is_sprint: false },
    { name: 'United States GP', round: 19, fp1: '2026-10-18T19:00:00Z', race_date: '2026-10-20', location: 'Austin', is_sprint: true },
    { name: 'Mexico City GP', round: 20, fp1: '2026-10-25T19:00:00Z', race_date: '2026-10-27', location: 'Mexico City', is_sprint: false },
    { name: 'São Paulo GP', round: 21, fp1: '2026-11-08T14:30:00Z', race_date: '2026-11-10', location: 'Interlagos', is_sprint: true },
    { name: 'Las Vegas GP', round: 22, fp1: '2026-11-21T06:00:00Z', race_date: '2026-11-23', location: 'Las Vegas', is_sprint: false },
    { name: 'Qatar GP', round: 23, fp1: '2026-11-29T13:30:00Z', race_date: '2026-12-01', location: 'Lusail', is_sprint: true },
    { name: 'Abu Dhabi GP', round: 24, fp1: '2026-12-06T10:30:00Z', race_date: '2026-12-08', location: 'Yas Marina', is_sprint: false }
  ];

  const insertRace = db.prepare(`
    INSERT INTO races (season_id, name, round_number, fp1_start, race_date, is_sprint_weekend, location)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  races2026.forEach((race: any) => {
    insertRace.run(season2026Id, race.name, race.round, race.fp1, race.race_date, race.is_sprint ? 1 : 0, race.location);
  });

  console.log(`  Seeded 2026 race calendar (${races2026.length} races)`);

  // Seed 2027 Race Calendar (24 races) if it exists
  const season2027Id = seasonIds['2027'];
  if (!season2027Id) {
    console.log('  Skipping 2027 race calendar (season not found)');
    return;
  }

  const races2027 = [
    { name: 'Australian GP', round: 1, fp1: '2027-03-14T01:30:00Z', race_date: '2027-03-16', location: 'Melbourne', is_sprint: false },
    { name: 'Chinese GP', round: 2, fp1: '2027-03-21T02:30:00Z', race_date: '2027-03-23', location: 'Shanghai', is_sprint: true },
    { name: 'Japanese GP', round: 3, fp1: '2027-04-04T02:00:00Z', race_date: '2027-04-06', location: 'Suzuka', is_sprint: false },
    { name: 'Bahrain GP', round: 4, fp1: '2027-04-11T12:30:00Z', race_date: '2027-04-13', location: 'Sakhir', is_sprint: false },
    { name: 'Saudi Arabian GP', round: 5, fp1: '2027-04-18T14:30:00Z', race_date: '2027-04-20', location: 'Jeddah', is_sprint: false },
    { name: 'Miami GP', round: 6, fp1: '2027-05-02T18:30:00Z', race_date: '2027-05-04', location: 'Miami', is_sprint: true },
    { name: 'Emilia Romagna GP', round: 7, fp1: '2027-05-16T12:30:00Z', race_date: '2027-05-18', location: 'Imola', is_sprint: false },
    { name: 'Monaco GP', round: 8, fp1: '2027-05-23T12:30:00Z', race_date: '2027-05-25', location: 'Monte Carlo', is_sprint: false },
    { name: 'Spanish GP', round: 9, fp1: '2027-05-30T12:30:00Z', race_date: '2027-06-01', location: 'Barcelona', is_sprint: false },
    { name: 'Canadian GP', round: 10, fp1: '2027-06-13T18:00:00Z', race_date: '2027-06-15', location: 'Montreal', is_sprint: false },
    { name: 'Austrian GP', round: 11, fp1: '2027-06-27T12:30:00Z', race_date: '2027-06-29', location: 'Spielberg', is_sprint: true },
    { name: 'British GP', round: 12, fp1: '2027-07-04T13:30:00Z', race_date: '2027-07-06', location: 'Silverstone', is_sprint: false },
    { name: 'Belgian GP', round: 13, fp1: '2027-07-25T12:30:00Z', race_date: '2027-07-27', location: 'Spa-Francorchamps', is_sprint: false },
    { name: 'Hungarian GP', round: 14, fp1: '2027-08-01T12:30:00Z', race_date: '2027-08-03', location: 'Budapest', is_sprint: false },
    { name: 'Dutch GP', round: 15, fp1: '2027-08-29T12:30:00Z', race_date: '2027-08-31', location: 'Zandvoort', is_sprint: false },
    { name: 'Italian GP', round: 16, fp1: '2027-09-05T12:30:00Z', race_date: '2027-09-07', location: 'Monza', is_sprint: false },
    { name: 'Azerbaijan GP', round: 17, fp1: '2027-09-19T10:30:00Z', race_date: '2027-09-21', location: 'Baku', is_sprint: false },
    { name: 'Singapore GP', round: 18, fp1: '2027-10-03T09:30:00Z', race_date: '2027-10-05', location: 'Marina Bay', is_sprint: false },
    { name: 'United States GP', round: 19, fp1: '2027-10-17T19:00:00Z', race_date: '2027-10-19', location: 'Austin', is_sprint: true },
    { name: 'Mexico City GP', round: 20, fp1: '2027-10-24T19:00:00Z', race_date: '2027-10-26', location: 'Mexico City', is_sprint: false },
    { name: 'São Paulo GP', round: 21, fp1: '2027-11-07T14:30:00Z', race_date: '2027-11-09', location: 'Interlagos', is_sprint: true },
    { name: 'Las Vegas GP', round: 22, fp1: '2027-11-20T06:00:00Z', race_date: '2027-11-22', location: 'Las Vegas', is_sprint: false },
    { name: 'Qatar GP', round: 23, fp1: '2027-11-28T13:30:00Z', race_date: '2027-11-30', location: 'Lusail', is_sprint: true },
    { name: 'Abu Dhabi GP', round: 24, fp1: '2027-12-05T10:30:00Z', race_date: '2027-12-07', location: 'Yas Marina', is_sprint: false }
  ];

  races2027.forEach((race: any) => {
    insertRace.run(season2027Id, race.name, race.round, race.fp1, race.race_date, race.is_sprint ? 1 : 0, race.location);
  });

  console.log(`  Seeded 2027 race calendar (${races2027.length} races)`);
}
