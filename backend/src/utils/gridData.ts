import gridDataJson from '../db/grid-data.json';

export interface Driver {
  name: string;
  number: number;
  joined: string;
}

export interface TeamPrincipal {
  name: string;
  joined: string;
}

export interface Team {
  name: string;
  is_top_four: boolean;
  team_principal: TeamPrincipal;
  drivers: Driver[];
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
    const team = gridAtDate.teams.find((t) => t.name === replacement.team);
    if (!team) {
      console.warn(`Team ${replacement.team} not found for replacement`);
      return;
    }

    if (replacement.type === 'driver') {
      // Replace driver
      const driverIndex = team.drivers.findIndex((d) => d.name === replacement.out);
      if (driverIndex !== -1) {
        team.drivers[driverIndex] = {
          name: replacement.in,
          number: team.drivers[driverIndex].number, // Keep same number or could add to replacement
          joined: replacement.date
        };
      }
    } else if (replacement.type === 'team_principal') {
      // Replace team principal
      if (team.team_principal.name === replacement.out) {
        team.team_principal = {
          name: replacement.in,
          joined: replacement.date
        };
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
  const drivers: Driver[] = [];

  grid.teams.forEach((team) => {
    drivers.push(...team.drivers);
  });

  return drivers;
}

/**
 * Get a list of all team principals for a season at a given date
 */
export function getAllTeamPrincipalsAtDate(year: string, date: Date = new Date()): (TeamPrincipal & { team: string })[] {
  const grid = getGridAtDate(year, date);

  return grid.teams.map((team) => ({
    ...team.team_principal,
    team: team.name
  }));
}

export default gridData;
