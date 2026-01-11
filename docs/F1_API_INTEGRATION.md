# F1 API Integration - Jolpica API

This document describes the integration of the Jolpica F1 API (https://api.jolpi.ca/ergast) into the F1 Tipping application.

## Overview

The application now supports pulling live F1 data from the Jolpica API instead of relying solely on static JSON files. Data is cached locally in a SQLite database to minimize API calls and improve performance.

## Architecture

### 1. Database Layer - F1 API Cache

**Migration:** `backend/src/db/migrations/003_add_f1_api_cache.ts`

A new table `f1_api_cache` stores JSON blobs from the API:

```sql
CREATE TABLE f1_api_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  resource_type TEXT NOT NULL,        -- 'schedule', 'drivers', 'constructors', etc.
  season_year INTEGER,                -- Season year (e.g., 2024)
  round_number INTEGER,               -- Race round number (1-24)
  resource_id TEXT,                   -- Additional identifier if needed
  data_json TEXT NOT NULL,            -- Raw JSON response from API
  last_fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(resource_type, season_year, round_number, resource_id)
);
```

**Features:**
- Stores any type of F1 data as JSON blobs
- Supports season-level and race-level data
- Tracks when data was last fetched
- Prevents duplicate entries with unique constraint

### 2. Service Layer - F1 API Service

**File:** `backend/src/services/f1ApiService.ts`

The `F1ApiService` class handles all interactions with the Jolpica API:

**Key Methods:**

- `fetchSchedule(year)` - Get race calendar for a season
- `fetchDrivers(year)` - Get drivers list for a season
- `fetchConstructors(year)` - Get constructors/teams for a season
- `fetchDriverStandings(year, round?)` - Get driver championship standings
- `fetchConstructorStandings(year, round?)` - Get constructor championship standings
- `fetchRaceResults(year, round)` - Get race results for a specific round
- `fetchQualifyingResults(year, round)` - Get qualifying results
- `fetchSprintResults(year, round)` - Get sprint results (if applicable)

**Convenience Methods:**

- `refreshSeasonData(year)` - Fetches all season data at once
- `refreshRaceResults(year, round)` - Fetches all race results at once
- `getCachedData(resourceType, ...)` - Retrieve cached data without API call
- `isCacheFresh(resourceType, ...)` - Check if cached data is still fresh
- `clearCache()` - Clear all cached data
- `clearSeasonCache(year)` - Clear cached data for a specific season

**Caching Strategy:**

- Data is cached for 24 hours by default
- If cache is fresh, returns cached data instead of making API call
- If API call fails, returns stale cached data as fallback
- Force refresh option available on all fetch methods

### 3. API Layer - Admin Endpoints

**File:** `backend/src/controllers/adminController.ts`
**Routes:** `backend/src/routes/admin.ts`

New admin endpoints for managing F1 API data:

```
GET  /api/admin/f1-data/refresh/:year          - Refresh all season data
GET  /api/admin/f1-data/refresh/:year/:round   - Refresh race results
GET  /api/admin/f1-data/cache-status           - Get cache statistics
DELETE /api/admin/f1-data/cache/:year          - Clear cache for a season
DELETE /api/admin/f1-data/cache                - Clear all cache
```

**Authentication:** All endpoints require admin authentication.

### 4. Frontend Layer - Admin UI

**File:** `frontend/src/pages/AdminPage.tsx`

New "F1 Data Management" tab in the Admin Panel with:

1. **Refresh Data Section**
   - Refresh full season data (schedule, drivers, constructors, standings)
   - Refresh specific race results (results, qualifying, sprint)
   - Year and round number selectors

2. **Cache Status Section**
   - View total cached records and size
   - See cached data by season
   - Last updated timestamps
   - Clear cache buttons for individual seasons or all data

3. **Documentation Panel**
   - API information
   - Rate limits
   - Cache duration details

## Jolpica API Details

### Base URL
```
https://api.jolpi.ca/ergast/f1/
```

### Rate Limits
- 200 requests per hour (unauthenticated)
- No authentication required for basic usage

### API Compatibility
- Backwards compatible with the deprecated Ergast API
- JSON only (no XML support)
- Comprehensive F1 data from 1950 to present

### Common Endpoints

```
GET /f1/{year}.json                           - Season schedule
GET /f1/{year}/drivers.json                   - Drivers list
GET /f1/{year}/constructors.json              - Constructors list
GET /f1/{year}/driverStandings.json           - Driver standings
GET /f1/{year}/constructorStandings.json      - Constructor standings
GET /f1/{year}/{round}/results.json           - Race results
GET /f1/{year}/{round}/qualifying.json        - Qualifying results
GET /f1/{year}/{round}/sprint.json            - Sprint results
```

## Installation & Setup

### 1. Install Dependencies

```bash
cd backend
npm install axios
```

### 2. Run Migration

The migration will run automatically on next server start, or you can run it manually:

```bash
npm run dev  # Migration runs on startup
```

### 3. Verify Installation

1. Start the backend: `npm run dev`
2. Start the frontend: `npm run dev`
3. Log in as admin
4. Navigate to Admin Panel > F1 Data Management tab
5. Try refreshing data for the 2024 season

## Usage Examples

### Backend - Service Usage

```typescript
import { f1ApiService } from './services/f1ApiService';

// Refresh all 2024 season data
await f1ApiService.refreshSeasonData(2024);

// Get cached drivers (won't make API call if cache is fresh)
const drivers = await f1ApiService.fetchDrivers(2024);

// Force refresh race results
const results = await f1ApiService.fetchRaceResults(2024, 5, true);

// Get cached data without API call
const cachedSchedule = f1ApiService.getCachedData('schedule', 2024);

// Check if cache is fresh
const isFresh = f1ApiService.isCacheFresh('drivers', 2024);
```

### Frontend - Admin UI

1. **Refresh Season Data:**
   - Go to Admin Panel > F1 Data Management
   - Enter season year (e.g., 2024)
   - Click "Refresh Season"
   - Wait for success message

2. **Refresh Race Results:**
   - Enter season year and round number
   - Click "Refresh Race"
   - Data will be cached for 24 hours

3. **View Cache Status:**
   - Click "Refresh Status" button
   - View total records, cache size, and data by season
   - See last updated timestamps

4. **Clear Cache:**
   - Click "Clear" next to a specific season, OR
   - Click "Clear All Cache" to remove all cached data

## API Response Structure

### Example: Drivers Response

```json
{
  "MRData": {
    "xmlns": "http://ergast.com/mrd/1.5",
    "series": "f1",
    "url": "http://api.jolpi.ca/ergast/f1/2024/drivers.json",
    "limit": "30",
    "offset": "0",
    "total": "20",
    "DriverTable": {
      "season": "2024",
      "Drivers": [
        {
          "driverId": "max_verstappen",
          "permanentNumber": "33",
          "code": "VER",
          "url": "http://en.wikipedia.org/wiki/Max_Verstappen",
          "givenName": "Max",
          "familyName": "Verstappen",
          "dateOfBirth": "1997-09-30",
          "nationality": "Dutch"
        },
        // ... more drivers
      ]
    }
  }
}
```

## Future Enhancements

### Planned Features

1. **Automatic Data Sync**
   - Schedule automatic data refresh after races
   - Background jobs to keep cache up to date

2. **Data Transformation**
   - Transform API data into application's database schema
   - Auto-populate drivers, teams, and race results

3. **Historical Data Import**
   - Bulk import historical seasons (2020-2024)
   - Backfill race results automatically

4. **Smart Caching**
   - Shorter cache duration during race weekends
   - Longer cache for historical data
   - Cache invalidation on manual data updates

5. **API Monitoring**
   - Track API usage and rate limits
   - Alert when approaching rate limit
   - Log API failures and retry logic

## Troubleshooting

### API Call Fails

**Problem:** API requests return errors or timeout

**Solutions:**
- Check internet connectivity
- Verify API is not rate limited (200 req/hour)
- Check if api.jolpi.ca is accessible
- Use cached data as fallback

### Cache Not Working

**Problem:** Data is fetched from API every time

**Solutions:**
- Verify migration 003 ran successfully
- Check `f1_api_cache` table exists
- Look for error logs in console
- Clear and rebuild cache

### Stale Data

**Problem:** Cached data is outdated

**Solutions:**
- Use "Refresh Season" button to force update
- Clear cache for specific season
- Data automatically refreshes after 24 hours

## Resources

- **Jolpica F1 API:** https://github.com/jolpica/jolpica-f1
- **API Documentation:** https://github.com/jolpica/jolpica-f1/blob/main/docs/README.md
- **Original Ergast API Docs:** http://ergast.com/mrd/

## Support

For issues or questions about the F1 API integration:

1. Check this documentation
2. Review service logs in backend console
3. Test API directly: `curl https://api.jolpi.ca/ergast/f1/2024/drivers.json`
4. Clear cache and retry
