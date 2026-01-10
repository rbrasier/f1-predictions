import gridDataJson from '../db/grid-data.json';

export interface Driver {
  name: string;
  team: string;
}

export interface TeamPrincipal {
  name: string;
  team: string;
}

export interface Team {
  name: string;
  is_top_four: boolean;
}

export interface Replacement {
  type: 'driver' | 'team_principal';
  date: string;
  team: string;
  out: string;
  in: string;
  reason?: string;
}

export interface SeasonData {
  season_start: string;
  prediction_deadline: string;
  is_active: boolean;
  teams: Team[];
  drivers: Driver[];
  team_principals: TeamPrincipal[];
  replacements: Replacement[];
}

export interface GridData {
  [year: string]: SeasonData;
}

const gridData = gridDataJson as GridData;

/**
 * Get the grid lineup for a specific season at a given date
 * Takes into account any replacements that occurred before the date
 */
export function getGridAtDate(year: string, date: Date = new Date()): SeasonData {
  const seasonData = gridData[year];
  if (!seasonData) {
    throw new Error(`No grid data found for year ${year}`);
  }

  // Clone the season data to avoid mutating the original
  const gridAtDate: SeasonData = JSON.parse(JSON.stringify(seasonData));

  // Apply all replacements that occurred before the given date
  const applicableReplacements = seasonData.replacements.filter(
    (replacement) => new Date(replacement.date) <= date
  );

  applicableReplacements.forEach((replacement) => {
    if (replacement.type === 'driver') {
      // Replace driver
      const driverIndex = gridAtDate.drivers.findIndex(
        (d) => d.name === replacement.out && d.team === replacement.team
      );
      if (driverIndex !== -1) {
        gridAtDate.drivers[driverIndex] = {
          name: replacement.in,
          team: replacement.team
        };
      } else {
        console.warn(`Driver ${replacement.out} not found in team ${replacement.team} for replacement`);
      }
    } else if (replacement.type === 'team_principal') {
      // Replace team principal
      const principalIndex = gridAtDate.team_principals.findIndex(
        (tp) => tp.name === replacement.out && tp.team === replacement.team
      );
      if (principalIndex !== -1) {
        gridAtDate.team_principals[principalIndex] = {
          name: replacement.in,
          team: replacement.team
        };
      } else {
        console.warn(`Team principal ${replacement.out} not found in team ${replacement.team} for replacement`);
      }
    }
  });

  return gridAtDate;
}

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

/**
 * Get the current grid (as of today) for a year
 */
export function getCurrentGrid(year: string): SeasonData {
  return getGridAtDate(year, new Date());
}

/**
 * Get all replacements for a season up to a given date
 */
export function getReplacementsUpToDate(year: string, date: Date = new Date()): Replacement[] {
  const seasonData = gridData[year];
  if (!seasonData) {
    throw new Error(`No grid data found for year ${year}`);
  }

  return seasonData.replacements.filter(
    (replacement) => new Date(replacement.date) <= date
  );
}

/**
 * Get a list of all drivers across all teams for a season at a given date
 */
export function getAllDriversAtDate(year: string, date: Date = new Date()): Driver[] {
  const grid = getGridAtDate(year, date);
  return grid.drivers;
}

/**
 * Get a list of all team principals for a season at a given date
 */
export function getAllTeamPrincipalsAtDate(year: string, date: Date = new Date()): TeamPrincipal[] {
  const grid = getGridAtDate(year, date);
  return grid.team_principals;
}

export default gridData;
