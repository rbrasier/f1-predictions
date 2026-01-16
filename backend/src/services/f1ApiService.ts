import db from '../db/database';
import axios from 'axios';
import { logger } from '../utils/logger';

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
    logger.log(`Refreshing all data for ${year} season...`);

    try {
      await Promise.all([
        this.fetchSchedule(year, true),
        this.fetchDrivers(year, true),
        this.fetchConstructors(year, true),
        this.fetchDriverStandings(year, undefined, true),
        this.fetchConstructorStandings(year, undefined, true)
      ]);

      logger.log(`✓ Successfully refreshed all data for ${year} season`);
    } catch (error) {
      logger.error(`✗ Error refreshing season data:`, error);
      throw error;
    }
  }

  /**
   * Refresh results for a specific race
   */
  async refreshRaceResults(year: number, round: number): Promise<void> {
    logger.log(`Refreshing results for ${year} Round ${round}...`);

    try {
      await Promise.all([
        this.fetchRaceResults(year, round, true),
        this.fetchQualifyingResults(year, round, true),
        // Sprint results might not exist for all races, so we'll try but not fail if it doesn't exist
        this.fetchSprintResults(year, round, true).catch(() => {
          logger.log(`  (No sprint data for Round ${round})`);
        })
      ]);

      logger.log(`✓ Successfully refreshed results for ${year} Round ${round}`);
    } catch (error) {
      logger.error(`✗ Error refreshing race results:`, error);
      throw error;
    }
  }

  /**
   * Get cached data without fetching
   */
  async getCachedData(
    resourceType: ResourceType,
    seasonYear?: number,
    roundNumber?: number,
    resourceId?: string
  ): Promise<any | null> {
    try {
      const query = `
        SELECT data_json, last_fetched_at
        FROM f1_api_cache
        WHERE resource_type = $1
          AND (season_year = $2 OR (season_year IS NULL AND $2 IS NULL))
          AND (round_number = $3 OR (round_number IS NULL AND $3 IS NULL))
          AND (resource_id = $4 OR (resource_id IS NULL AND $4 IS NULL))
      `;

      const row = await db.prepare(query).get(
        resourceType,
        seasonYear || null,
        roundNumber || null,
        resourceId || null
      ) as { data_json: string; last_fetched_at: string } | undefined;

      if (!row) {
        return null;
      }

      return JSON.parse(row.data_json);
    } catch (error) {
      logger.error('Error getting cached data:', error);
      return null;
    }
  }

  /**
   * Check if cached data exists and is fresh
   */
  async isCacheFresh(
    resourceType: ResourceType,
    seasonYear?: number,
    roundNumber?: number,
    resourceId?: string
  ): Promise<boolean> {
    try {
      const query = `
        SELECT last_fetched_at
        FROM f1_api_cache
        WHERE resource_type = $1
          AND season_year IS NOT DISTINCT FROM $2
          AND round_number IS NOT DISTINCT FROM $3
          AND resource_id IS NOT DISTINCT FROM $4
      `;

      const row = await db.prepare(query).get(
        resourceType,
        seasonYear || null,
        roundNumber || null,
        resourceId || null
      ) as { last_fetched_at: string } | undefined;

      if (!row) {
        return false;
      }

      const lastFetched = new Date(row.last_fetched_at);
      const now = new Date();
      const hoursSinceLastFetch = (now.getTime() - lastFetched.getTime()) / (1000 * 60 * 60);

      return hoursSinceLastFetch < CACHE_DURATION_HOURS;
    } catch (error) {
      logger.error('Error checking cache freshness:', error);
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
    if (!forceRefresh && await this.isCacheFresh(resourceType, seasonYear || undefined, roundNumber || undefined, resourceId || undefined)) {
      const cached = this.getCachedData(resourceType, seasonYear || undefined, roundNumber || undefined, resourceId || undefined);
      if (cached) {
        logger.log(`  Using cached ${resourceType} data`);
        return cached;
      }
    }

    // Fetch fresh data from API
    logger.log(`  Fetching ${resourceType} from API: ${apiUrl}`);

    try {
      const response = await axios.get(apiUrl, {
        timeout: 10000,
        headers: {
          'Accept': 'application/json'
        }
      });

      const data = response.data;

      // Cache the data
      await this.cacheData(resourceType, seasonYear, roundNumber, resourceId, data);

      return data;
    } catch (error: any) {
      logger.error(`Error fetching ${resourceType}:`, error.message);

      // If fetch fails, try to return stale cached data if available
      const cached = this.getCachedData(resourceType, seasonYear || undefined, roundNumber || undefined, resourceId || undefined);
      if (cached) {
        logger.log(`  Returning stale cached ${resourceType} data due to API error`);
        return cached;
      }

      throw error;
    }
  }

  /**
   * Store data in cache
   */
  private async cacheData(
    resourceType: ResourceType,
    seasonYear: number | null,
    roundNumber: number | null,
    resourceId: string | null,
    data: any
  ): Promise<void> {
    try {
      const dataJson = JSON.stringify(data);
      const now = new Date().toISOString();

      // Use UPSERT (INSERT ... ON CONFLICT) for PostgreSQL
      const stmt = db.prepare(`
        INSERT INTO f1_api_cache
        (resource_type, season_year, round_number, resource_id, data_json, last_fetched_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (resource_type, season_year, round_number, resource_id)
        DO UPDATE SET data_json = $5, last_fetched_at = $6
      `);

      await stmt.run(resourceType, seasonYear, roundNumber, resourceId, dataJson, now);

      logger.log(`  ✓ Cached ${resourceType} data`);
    } catch (error) {
      logger.error('Error caching data:', error);
      // Don't throw - caching failure shouldn't break the API fetch
    }
  }

  /**
   * Clear all cached data (useful for testing or manual refresh)
   */
  async clearCache(): Promise<void> {
    try {
      await db.prepare('DELETE FROM f1_api_cache').run();
      logger.log('✓ Cleared all cached F1 API data');
    } catch (error) {
      logger.error('Error clearing cache:', error);
      throw error;
    }
  }

  /**
   * Clear cached data for a specific season
   */
  async clearSeasonCache(year: number): Promise<void> {
    try {
      await db.prepare('DELETE FROM f1_api_cache WHERE season_year = $1').run(year);
      logger.log(`✓ Cleared cached data for ${year} season`);
    } catch (error) {
      logger.error('Error clearing season cache:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const f1ApiService = new F1ApiService();
