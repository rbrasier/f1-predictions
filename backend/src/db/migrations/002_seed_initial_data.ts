import { getOriginalGrid, getAllSeasons } from '../../utils/gridData';

export const name = 'Seed team principals from grid-data.json';

export function up(db: any) {
  // Load grid data from JSON
  const seasons = getAllSeasons();
  console.log(`  Loading team principals from grid-data.json for ${seasons.length} seasons: ${seasons.join(', ')}`);

  // Seed Team Principals for each season with constructorId from API
  const insertPrincipal = db.prepare('INSERT OR IGNORE INTO team_principals (name, constructor_id, season_year) VALUES (?, ?, ?)');
  let principalsCount = 0;

  seasons.forEach((year) => {
    const grid = getOriginalGrid(year);
    grid.team_principals.forEach((principal: any) => {
      insertPrincipal.run(principal.name, principal.constructorId, parseInt(year));
      principalsCount++;
    });
    console.log(`  Seeded ${grid.team_principals.length} team principals for season ${year}`);
  });

  console.log(`  Total: Seeded ${principalsCount} team principals across all seasons`);
}
