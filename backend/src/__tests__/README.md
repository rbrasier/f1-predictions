# F1 Predictions API Tests

This directory contains comprehensive tests for the F1 Predictions application API and services.

## Test Structure

### Fixtures (`fixtures/f1-api/2025/`)
Contains mock data from the Jolpica F1 API for the 2025 season:
- `races.json` - Complete 2025 race schedule (24 races)
- `drivers.json` - All 2025 F1 drivers (30 drivers)
- `constructors.json` - All 2025 F1 teams (10 constructors)
- `results.json` - Race results for completed races
- `qualifying.json` - Qualifying results
- `sprint.json` - Sprint race results
- `driversstandings.json` - Driver championship standings
- `contstructorsstandings.json` - Constructor championship standings

### Test Suites

#### 1. F1 API Service Tests (`services/f1ApiService.test.ts`)
Tests all F1 API service methods:
- `fetchSchedule()` - Fetch race schedule
- `fetchDrivers()` - Fetch drivers list
- `fetchConstructors()` - Fetch constructors/teams
- `fetchRaceResults()` - Fetch race results
- `fetchQualifyingResults()` - Fetch qualifying results
- `fetchSprintResults()` - Fetch sprint results
- `fetchDriverStandings()` - Fetch driver championship standings
- `fetchConstructorStandings()` - Fetch constructor championship standings

**Coverage:**
- ✅ Data fetching and parsing
- ✅ Response structure validation
- ✅ Specific data point verification (winners, podiums, points)
- ✅ Error handling
- ✅ Caching behavior

#### 2. Race API Endpoint Tests (`routes/races.test.ts`)
Tests all race-related API endpoints:
- `GET /api/races` - Get all races (with optional seasonId filter)
- `GET /api/races/next` - Get next upcoming race
- `GET /api/races/upcoming` - Get upcoming races (with limit)
- `GET /api/races/:raceId` - Get specific race details

**Coverage:**
- ✅ Authentication requirements
- ✅ Query parameter handling
- ✅ Error responses (401, 404)

#### 3. Reference Data API Tests (`routes/reference.test.ts`)
Tests reference data endpoints:
- `GET /api/drivers` - Get all drivers (with optional seasonId filter)
- `GET /api/teams` - Get all teams
- `GET /api/team-principals` - Get team principals
- `GET /api/seasons` - Get all seasons
- `GET /api/seasons/active` - Get active season

**Coverage:**
- ✅ Authentication requirements
- ✅ Data filtering
- ✅ Response structure

#### 4. Admin API Endpoint Tests (`routes/admin.test.ts`)
Tests all admin-only endpoints including:

**F1 Data Management:**
- `GET /api/admin/f1-data/refresh/:year` - Refresh all season data
- `GET /api/admin/f1-data/refresh/:year/:round` - Refresh specific race
- `GET /api/admin/f1-data/cache-status` - Get cache statistics
- `DELETE /api/admin/f1-data/cache/:year` - Clear year cache
- `DELETE /api/admin/f1-data/cache` - Clear all cache

**Data Import:**
- `POST /api/admin/f1-data/import-race/:year/:round` - Import race results
- `POST /api/admin/f1-data/import-standings/:year` - Import season standings
- `POST /api/admin/f1-data/import-season/:year` - Bulk import season
- `POST /api/admin/f1-data/populate-driver-images/:year` - Populate driver images

**Results Management:**
- `POST /api/admin/races/:raceId/results` - Enter race results
- `GET /api/admin/races/:raceId/results` - Get race results
- `POST /api/admin/seasons/:seasonId/results` - Enter season results
- `GET /api/admin/seasons/:seasonId/results` - Get season results
- `POST /api/admin/recalculate-scores` - Recalculate all scores

**Coverage:**
- ✅ Admin authentication requirements
- ✅ Non-admin access prevention (403 responses)
- ✅ All CRUD operations
- ✅ Data validation

### Helpers (`helpers/`)
- `auth.helper.ts` - Test authentication utilities
  - `createTestUser()` - Create test user with token
  - `createTestAdmin()` - Create admin user with token
  - `cleanupTestUsers()` - Remove test users

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Test Coverage

The test suite covers:
- ✅ 8 F1 API service methods with comprehensive data validation
- ✅ 4 race endpoint tests
- ✅ 5 reference data endpoint tests
- ✅ 30+ admin endpoint tests
- ✅ Authentication and authorization
- ✅ Error handling and edge cases
- ✅ Mock data from real 2025 F1 season

## Mock Data Source

All mock data is sourced from the Jolpica F1 API (https://api.jolpi.ca/ergast/f1/), which is the successor to the Ergast API. The data represents the actual 2025 F1 season including:
- 24 races (Australia to Abu Dhabi)
- 6 sprint races (China, Miami, Belgium, USA, Brazil, Qatar)
- 30 drivers including rookies (Antonelli, Bortoleto, Bearman, Hadjar, Doohan)
- 10 constructors/teams
- Complete championship standings

## Notes

- Tests use mocked F1 API service to avoid external API calls
- Database is initialized before each test suite
- Test users are automatically cleaned up after tests
- Authentication tokens are generated for testing protected endpoints
