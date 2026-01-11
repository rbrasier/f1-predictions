import gridDataJson from '../db/grid-data.json';

export interface TeamPrincipal {
  name: string;
  constructorId: string;
}

export interface SeasonData {
  season_start: string;
  prediction_deadline: string;
  is_active: boolean;
  top_four_teams: string[]; // Array of constructor IDs
  team_principals: TeamPrincipal[];
}

export interface GridData {
  [year: string]: SeasonData;
}

const gridData = gridDataJson as GridData;

/**
 * Get the current active season
 */
export function getActiveSeason(): string | null {
  for (const [year, data] of Object.entries(gridData)) {
    if (data.is_active) {
      return year;
    }
  }
  return null;
}

/**
 * Get all available seasons
 */
export function getAllSeasons(): string[] {
  return Object.keys(gridData).sort();
}

/**
 * Get the original (start of season) grid for a year
 */
export function getOriginalGrid(year: string): SeasonData {
  const seasonData = gridData[year];
  if (!seasonData) {
    throw new Error(`No grid data found for year ${year}`);
  }
  return seasonData;
}

export default gridData;
