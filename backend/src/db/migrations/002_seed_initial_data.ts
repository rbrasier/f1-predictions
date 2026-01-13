import { getOriginalGrid, getAllSeasons } from '../../utils/gridData';

export const name = 'Seed team principals from grid-data.json';

export async function up(db: any) {
  // Load grid data from JSON
  const seasons = getAllSeasons();
  console.log(`  Loading team principals from grid-data.json for ${seasons.length} seasons: ${seasons.join(', ')}`);

  let principalsCount = 0;

  for (const year of seasons) {
    const grid = getOriginalGrid(year);

    for (const principal of grid.team_principals) {
      await db.query(
        'INSERT INTO team_principals (name, constructor_id, season_year) VALUES ($1, $2, $3) ON CONFLICT (name, season_year) DO NOTHING',
        [principal.name, principal.constructorId, parseInt(year)]
      );
      principalsCount++;
    }

    console.log(`  Seeded ${grid.team_principals.length} team principals for season ${year}`);
  }

  console.log(`  Total: Seeded ${principalsCount} team principals across all seasons`);
}
