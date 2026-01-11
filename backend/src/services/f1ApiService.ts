import db from '../db/database';
import axios from 'axios';

const JOLPICA_BASE_URL = 'https://api.jolpi.ca/ergast/f1';
const CACHE_DURATION_HOURS = 24; // Cache data for 24 hours

export interface F1ApiCacheRecord {
  id: number;
  resource_type: string;
  season_year: number | null;
  round_number: number | null;
  resource_id: string | null;
  data_json: string;
  last_fetched_at: string;
}

export type ResourceType =
  | 'schedule'        // Race schedule for a season
  | 'drivers'         // Drivers list
  | 'constructors'    // Constructors/teams list
  | 'driverStandings' // Driver championship standings
  | 'constructorStandings' // Constructor championship standings
  | 'results'         // Race results
  | 'qualifying'      // Qualifying results
  | 'sprint';         // Sprint results

/**
 * F1 API Service
 * Handles fetching data from Jolpica F1 API and caching it locally
 */
export class F1ApiService {
  /**
   * Fetch race schedule for a season
   */
  async fetchSchedule(year: number, forceRefresh = false): Promise<any> {
    return this.fetchAndCache('schedule', year, null, null, forceRefresh,
      `${JOLPICA_BASE_URL}/${year}.json`
    );
  }

  /**
   * Fetch drivers for a season
   */
  async fetchDrivers(year: number, forceRefresh = false): Promise<any> {
    return this.fetchAndCache('drivers', year, null, null, forceRefresh,
      `${JOLPICA_BASE_URL}/${year}/drivers.json`
    );
  }

  /**
   * Fetch constructors for a season
   */
  async fetchConstructors(year: number, forceRefresh = false): Promise<any> {
    return this.fetchAndCache('constructors', year, null, null, forceRefresh,
      `${JOLPICA_BASE_URL}/${year}/constructors.json`
    );
  }

  /**
   * Fetch driver standings for a season (or after a specific round)
   */
  async fetchDriverStandings(year: number, round?: number, forceRefresh = false): Promise<any> {
    const endpoint = round
      ? `${JOLPICA_BASE_URL}/${year}/${round}/driverStandings.json`
      : `${JOLPICA_BASE_URL}/${year}/driverStandings.json`;

    return this.fetchAndCache('driverStandings', year, round || null, null, forceRefresh, endpoint);
  }

  /**
   * Fetch constructor standings for a season (or after a specific round)
   */
  async fetchConstructorStandings(year: number, round?: number, forceRefresh = false): Promise<any> {
    const endpoint = round
      ? `${JOLPICA_BASE_URL}/${year}/${round}/constructorStandings.json`
      : `${JOLPICA_BASE_URL}/${year}/constructorStandings.json`;

    return this.fetchAndCache('constructorStandings', year, round || null, null, forceRefresh, endpoint);
  }

  /**
   * Fetch race results for a specific race
   */
  async fetchRaceResults(year: number, round: number, forceRefresh = false): Promise<any> {
    return this.fetchAndCache('results', year, round, null, forceRefresh,
      `${JOLPICA_BASE_URL}/${year}/${round}/results.json`
    );
  }

  /**
   * Fetch qualifying results for a specific race
   */
  async fetchQualifyingResults(year: number, round: number, forceRefresh = false): Promise<any> {
    return this.fetchAndCache('qualifying', year, round, null, forceRefresh,
      `${JOLPICA_BASE_URL}/${year}/${round}/qualifying.json`
    );
  }

  /**
   * Fetch sprint results for a specific race
   */
  async fetchSprintResults(year: number, round: number, forceRefresh = false): Promise<any> {
    return this.fetchAndCache('sprint', year, round, null, forceRefresh,
      `${JOLPICA_BASE_URL}/${year}/${round}/sprint.json`
    );
  }

  /**
   * Refresh all data for a season
   * This will fetch schedule, drivers, constructors, and standings
   */
  async refreshSeasonData(year: number): Promise<void> {
    console.log(`Refreshing all data for ${year} season...`);

    try {
      await Promise.all([
        this.fetchSchedule(year, true),
        this.fetchDrivers(year, true),
        this.fetchConstructors(year, true),
        this.fetchDriverStandings(year, true),
        this.fetchConstructorStandings(year, true)
      ]);

      console.log(`✓ Successfully refreshed all data for ${year} season`);
    } catch (error) {
      console.error(`✗ Error refreshing season data:`, error);
      throw error;
    }
  }

  /**
   * Refresh results for a specific race
   */
  async refreshRaceResults(year: number, round: number): Promise<void> {
    console.log(`Refreshing results for ${year} Round ${round}...`);

    try {
      await Promise.all([
        this.fetchRaceResults(year, round, true),
        this.fetchQualifyingResults(year, round, true),
        // Sprint results might not exist for all races, so we'll try but not fail if it doesn't exist
        this.fetchSprintResults(year, round, true).catch(() => {
          console.log(`  (No sprint data for Round ${round})`);
        })
      ]);

      console.log(`✓ Successfully refreshed results for ${year} Round ${round}`);
    } catch (error) {
      console.error(`✗ Error refreshing race results:`, error);
      throw error;
    }
  }

  /**
   * Get cached data without fetching
   */
  getCachedData(
    resourceType: ResourceType,
    seasonYear?: number,
    roundNumber?: number,
    resourceId?: string
  ): any | null {
    try {
      const query = `
        SELECT data_json, last_fetched_at
        FROM f1_api_cache
        WHERE resource_type = ?
          AND (season_year = ? OR (season_year IS NULL AND ? IS NULL))
          AND (round_number = ? OR (round_number IS NULL AND ? IS NULL))
          AND (resource_id = ? OR (resource_id IS NULL AND ? IS NULL))
      `;

      const row = db.prepare(query).get(
        resourceType,
        seasonYear || null, seasonYear || null,
        roundNumber || null, roundNumber || null,
        resourceId || null, resourceId || null
      ) as { data_json: string; last_fetched_at: string } | undefined;

      if (!row) {
        return null;
      }

      return JSON.parse(row.data_json);
    } catch (error) {
      console.error('Error getting cached data:', error);
      return null;
    }
  }

  /**
   * Check if cached data exists and is fresh
   */
  isCacheFresh(
    resourceType: ResourceType,
    seasonYear?: number,
    roundNumber?: number,
    resourceId?: string
  ): boolean {
    try {
      const query = `
        SELECT last_fetched_at
        FROM f1_api_cache
        WHERE resource_type = ?
          AND (season_year = ? OR (season_year IS NULL AND ? IS NULL))
          AND (round_number = ? OR (round_number IS NULL AND ? IS NULL))
          AND (resource_id = ? OR (resource_id IS NULL AND ? IS NULL))
      `;

      const row = db.prepare(query).get(
        resourceType,
        seasonYear || null, seasonYear || null,
        roundNumber || null, roundNumber || null,
        resourceId || null, resourceId || null
      ) as { last_fetched_at: string } | undefined;

      if (!row) {
        return false;
      }

      const lastFetched = new Date(row.last_fetched_at);
      const now = new Date();
      const hoursSinceLastFetch = (now.getTime() - lastFetched.getTime()) / (1000 * 60 * 60);

      return hoursSinceLastFetch < CACHE_DURATION_HOURS;
    } catch (error) {
      console.error('Error checking cache freshness:', error);
      return false;
    }
  }

  /**
   * Core method to fetch data from API and cache it
   */
  private async fetchAndCache(
    resourceType: ResourceType,
    seasonYear: number | null,
    roundNumber: number | null,
    resourceId: string | null,
    forceRefresh: boolean,
    apiUrl: string
  ): Promise<any> {
    // Check if we have fresh cached data and don't need to refresh
    if (!forceRefresh && this.isCacheFresh(resourceType, seasonYear || undefined, roundNumber || undefined, resourceId || undefined)) {
      const cached = this.getCachedData(resourceType, seasonYear || undefined, roundNumber || undefined, resourceId || undefined);
      if (cached) {
        console.log(`  Using cached ${resourceType} data`);
        return cached;
      }
    }

    // Fetch fresh data from API
    console.log(`  Fetching ${resourceType} from API: ${apiUrl}`);

    try {
      const response = await axios.get(apiUrl, {
        timeout: 10000,
        headers: {
          'Accept': 'application/json'
        }
      });

      const data = response.data;

      // Cache the data
      this.cacheData(resourceType, seasonYear, roundNumber, resourceId, data);

      return data;
    } catch (error: any) {
      console.error(`Error fetching ${resourceType}:`, error.message);

      // If fetch fails, try to return stale cached data if available
      const cached = this.getCachedData(resourceType, seasonYear || undefined, roundNumber || undefined, resourceId || undefined);
      if (cached) {
        console.log(`  Returning stale cached ${resourceType} data due to API error`);
        return cached;
      }

      throw error;
    }
  }

  /**
   * Store data in cache
   */
  private cacheData(
    resourceType: ResourceType,
    seasonYear: number | null,
    roundNumber: number | null,
    resourceId: string | null,
    data: any
  ): void {
    try {
      const dataJson = JSON.stringify(data);
      const now = new Date().toISOString();

      // Use INSERT OR REPLACE to update existing cache or create new
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO f1_api_cache
        (resource_type, season_year, round_number, resource_id, data_json, last_fetched_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      stmt.run(resourceType, seasonYear, roundNumber, resourceId, dataJson, now);

      console.log(`  ✓ Cached ${resourceType} data`);
    } catch (error) {
      console.error('Error caching data:', error);
      // Don't throw - caching failure shouldn't break the API fetch
    }
  }

  /**
   * Clear all cached data (useful for testing or manual refresh)
   */
  clearCache(): void {
    try {
      db.prepare('DELETE FROM f1_api_cache').run();
      console.log('✓ Cleared all cached F1 API data');
    } catch (error) {
      console.error('Error clearing cache:', error);
      throw error;
    }
  }

  /**
   * Clear cached data for a specific season
   */
  clearSeasonCache(year: number): void {
    try {
      db.prepare('DELETE FROM f1_api_cache WHERE season_year = ?').run(year);
      console.log(`✓ Cleared cached data for ${year} season`);
    } catch (error) {
      console.error('Error clearing season cache:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const f1ApiService = new F1ApiService();
