import db, { initializeDatabase } from './database';

function seedDatabase() {
  console.log('Starting database seed...');

  // Initialize database tables
  initializeDatabase();

  // Check if already seeded
  const existingTeams = db.prepare('SELECT COUNT(*) as count FROM teams').get() as { count: number };
  if (existingTeams.count > 0) {
    console.log('Database already seeded. Skipping...');
    return;
  }

  // Seed Teams (2027 grid)
  const teams = [
    { name: 'Red Bull Racing', is_top_four: 1 },
    { name: 'Mercedes', is_top_four: 1 },
    { name: 'Ferrari', is_top_four: 1 },
    { name: 'McLaren', is_top_four: 1 },
    { name: 'Aston Martin', is_top_four: 0 },
    { name: 'Alpine', is_top_four: 0 },
    { name: 'Williams', is_top_four: 0 },
    { name: 'RB (AlphaTauri)', is_top_four: 0 },
    { name: 'Kick Sauber (Audi)', is_top_four: 0 },
    { name: 'Cadillac F1', is_top_four: 0 }
  ];

  const insertTeam = db.prepare('INSERT INTO teams (name, is_top_four, is_active) VALUES (?, ?, 1)');
  const teamIds: { [key: string]: number } = {};

  teams.forEach(team => {
    const result = insertTeam.run(team.name, team.is_top_four);
    teamIds[team.name] = Number(result.lastInsertRowid);
  });

  console.log('Teams seeded successfully');

  // Seed Drivers (2027 grid - realistic predictions)
  const drivers = [
    { name: 'Max Verstappen', team: 'Red Bull Racing' },
    { name: 'Liam Lawson', team: 'Red Bull Racing' },
    { name: 'George Russell', team: 'Mercedes' },
    { name: 'Andrea Kimi Antonelli', team: 'Mercedes' },
    { name: 'Charles Leclerc', team: 'Ferrari' },
    { name: 'Lewis Hamilton', team: 'Ferrari' },
    { name: 'Oscar Piastri', team: 'McLaren' },
    { name: 'Lando Norris', team: 'McLaren' },
    { name: 'Fernando Alonso', team: 'Aston Martin' },
    { name: 'Lance Stroll', team: 'Aston Martin' },
    { name: 'Pierre Gasly', team: 'Alpine' },
    { name: 'Jack Doohan', team: 'Alpine' },
    { name: 'Alex Albon', team: 'Williams' },
    { name: 'Carlos Sainz', team: 'Williams' },
    { name: 'Yuki Tsunoda', team: 'RB (AlphaTauri)' },
    { name: 'Isack Hadjar', team: 'RB (AlphaTauri)' },
    { name: 'Nico Hulkenberg', team: 'Kick Sauber (Audi)' },
    { name: 'Gabriel Bortoleto', team: 'Kick Sauber (Audi)' },
    { name: 'TBA Driver 1', team: 'Cadillac F1' },
    { name: 'TBA Driver 2', team: 'Cadillac F1' }
  ];

  const insertDriver = db.prepare('INSERT INTO drivers (name, team_id, is_active) VALUES (?, ?, 1)');

  drivers.forEach(driver => {
    insertDriver.run(driver.name, teamIds[driver.team]);
  });

  console.log('Drivers seeded successfully');

  // Seed Team Principals (2027)
  const principals = [
    { name: 'Christian Horner', team: 'Red Bull Racing' },
    { name: 'Toto Wolff', team: 'Mercedes' },
    { name: 'Fred Vasseur', team: 'Ferrari' },
    { name: 'Andrea Stella', team: 'McLaren' },
    { name: 'Mike Krack', team: 'Aston Martin' },
    { name: 'Oliver Oakes', team: 'Alpine' },
    { name: 'James Vowles', team: 'Williams' },
    { name: 'Laurent Mekies', team: 'RB (AlphaTauri)' },
    { name: 'Jonathan Wheatley', team: 'Kick Sauber (Audi)' },
    { name: 'TBA Principal', team: 'Cadillac F1' }
  ];

  const insertPrincipal = db.prepare('INSERT INTO team_principals (name, team_id, is_active) VALUES (?, ?, 1)');

  principals.forEach(principal => {
    insertPrincipal.run(principal.name, teamIds[principal.team]);
  });

  console.log('Team principals seeded successfully');

  // Seed 2027 Season
  const insertSeason = db.prepare('INSERT INTO seasons (year, prediction_deadline, is_active) VALUES (?, ?, 1)');
  // Pre-season testing typically starts mid-February
  const seasonResult = insertSeason.run(2027, '2027-02-15T00:00:00Z');
  const seasonId = Number(seasonResult.lastInsertRowid);

  console.log('Season seeded successfully');

  // Seed 2027 Race Calendar (24 races)
  const races = [
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

  const insertRace = db.prepare(`
    INSERT INTO races (season_id, name, round_number, fp1_start, race_date, is_sprint_weekend, location)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  races.forEach(race => {
    insertRace.run(seasonId, race.name, race.round, race.fp1, race.race_date, race.is_sprint ? 1 : 0, race.location);
  });

  console.log('Race calendar seeded successfully');
  console.log('Database seed completed!');
}

// Run seed if called directly
if (require.main === module) {
  seedDatabase();
  db.close();
}

export { seedDatabase };
