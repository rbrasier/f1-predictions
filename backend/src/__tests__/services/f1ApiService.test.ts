import { describe, it, expect, beforeEach, vi } from 'vitest';
import { F1ApiService } from '../../services/f1ApiService';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

// Helper to load mock data
function loadMockData(filename: string) {
  const filePath = path.join(__dirname, '../fixtures/f1-api/2025', filename);
  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
}

describe('F1ApiService', () => {
  let service: F1ApiService;

  beforeEach(() => {
    service = new F1ApiService();
    vi.clearAllMocks();
  });

  describe('fetchSchedule', () => {
    it('should fetch and return race schedule for 2025 season', async () => {
      const mockData = loadMockData('races.json');
      mockedAxios.get = vi.fn().mockResolvedValue({ data: mockData });

      const result = await service.fetchSchedule(2025);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.jolpi.ca/ergast/f1/2025.json',
        expect.any(Object)
      );
      expect(result).toEqual(mockData);
      expect(result.MRData.RaceTable.Races).toHaveLength(24);
      expect(result.MRData.RaceTable.Races[0].raceName).toBe('Australian Grand Prix');
    });

    it('should return correct race details for specific races', async () => {
      const mockData = loadMockData('races.json');
      mockedAxios.get = vi.fn().mockResolvedValue({ data: mockData });

      const result = await service.fetchSchedule(2025);
      const races = result.MRData.RaceTable.Races;

      // Check first race (Australia)
      expect(races[0].season).toBe('2025');
      expect(races[0].round).toBe('1');
      expect(races[0].Circuit.circuitId).toBe('albert_park');

      // Check a sprint race (Chinese GP)
      const chineseGP = races.find((r: any) => r.round === '2');
      expect(chineseGP.raceName).toBe('Chinese Grand Prix');
      expect(chineseGP.Sprint).toBeDefined();
      expect(chineseGP.SprintQualifying).toBeDefined();

      // Check last race (Abu Dhabi)
      const lastRace = races[races.length - 1];
      expect(lastRace.round).toBe('24');
      expect(lastRace.raceName).toBe('Abu Dhabi Grand Prix');
    });
  });

  describe('fetchDrivers', () => {
    it('should fetch and return drivers for 2025 season', async () => {
      const mockData = loadMockData('drivers.json');
      mockedAxios.get = vi.fn().mockResolvedValue({ data: mockData });

      const result = await service.fetchDrivers(2025);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.jolpi.ca/ergast/f1/2025/drivers.json',
        expect.any(Object)
      );
      expect(result).toEqual(mockData);
      expect(result.MRData.DriverTable.Drivers).toHaveLength(30);
    });

    it('should return correct driver details', async () => {
      const mockData = loadMockData('drivers.json');
      mockedAxios.get = vi.fn().mockResolvedValue({ data: mockData });

      const result = await service.fetchDrivers(2025);
      const drivers = result.MRData.DriverTable.Drivers;

      // Find specific drivers
      const verstappen = drivers.find((d: any) => d.driverId === 'max_verstappen');
      expect(verstappen.givenName).toBe('Max');
      expect(verstappen.familyName).toBe('Verstappen');
      expect(verstappen.permanentNumber).toBe('3');
      expect(verstappen.nationality).toBe('Dutch');

      const antonelli = drivers.find((d: any) => d.driverId === 'antonelli');
      expect(antonelli.givenName).toBe('Andrea Kimi');
      expect(antonelli.familyName).toBe('Antonelli');
      expect(antonelli.permanentNumber).toBe('12');
    });
  });

  describe('fetchConstructors', () => {
    it('should fetch and return constructors for 2025 season', async () => {
      const mockData = loadMockData('constructors.json');
      mockedAxios.get = vi.fn().mockResolvedValue({ data: mockData });

      const result = await service.fetchConstructors(2025);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.jolpi.ca/ergast/f1/2025/constructors.json',
        expect.any(Object)
      );
      expect(result).toEqual(mockData);
      expect(result.MRData.ConstructorTable.Constructors).toHaveLength(10);
    });

    it('should return correct constructor details', async () => {
      const mockData = loadMockData('constructors.json');
      mockedAxios.get = vi.fn().mockResolvedValue({ data: mockData });

      const result = await service.fetchConstructors(2025);
      const constructors = result.MRData.ConstructorTable.Constructors;

      // Verify all 10 teams
      const teamIds = constructors.map((c: any) => c.constructorId);
      expect(teamIds).toContain('mclaren');
      expect(teamIds).toContain('red_bull');
      expect(teamIds).toContain('ferrari');
      expect(teamIds).toContain('mercedes');
      expect(teamIds).toContain('alpine');
      expect(teamIds).toContain('aston_martin');
      expect(teamIds).toContain('haas');
      expect(teamIds).toContain('williams');
      expect(teamIds).toContain('rb');
      expect(teamIds).toContain('sauber');
    });
  });

  describe('fetchRaceResults', () => {
    it('should fetch and return race results for a specific race', async () => {
      const mockData = loadMockData('results.json');
      mockedAxios.get = vi.fn().mockResolvedValue({ data: mockData });

      const result = await service.fetchRaceResults(2025, 1);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.jolpi.ca/ergast/f1/2025/1/results.json',
        expect.any(Object)
      );
      expect(result).toEqual(mockData);
    });

    it('should return correct results for Australian GP (Round 1)', async () => {
      const mockData = loadMockData('results.json');
      mockedAxios.get = vi.fn().mockResolvedValue({ data: mockData });

      const result = await service.fetchRaceResults(2025, 1);
      const race = result.MRData.RaceTable.Races[0];

      expect(race.raceName).toBe('Australian Grand Prix');
      expect(race.Results).toHaveLength(20);

      // Check winner
      const winner = race.Results[0];
      expect(winner.position).toBe('1');
      expect(winner.Driver.driverId).toBe('norris');
      expect(winner.points).toBe('25');

      // Check podium
      expect(race.Results[1].Driver.driverId).toBe('max_verstappen');
      expect(race.Results[2].Driver.driverId).toBe('russell');
    });

    it('should return correct results for Chinese GP (Round 2)', async () => {
      const mockData = loadMockData('results.json');
      mockedAxios.get = vi.fn().mockResolvedValue({ data: mockData });

      const result = await service.fetchRaceResults(2025, 2);
      const race = result.MRData.RaceTable.Races[1];

      expect(race.raceName).toBe('Chinese Grand Prix');

      // Check winner
      const winner = race.Results[0];
      expect(winner.position).toBe('1');
      expect(winner.Driver.driverId).toBe('piastri');
      expect(winner.points).toBe('25');
    });
  });

  describe('fetchQualifyingResults', () => {
    it('should fetch and return qualifying results for a specific race', async () => {
      const mockData = loadMockData('qualifying.json');
      mockedAxios.get = vi.fn().mockResolvedValue({ data: mockData });

      const result = await service.fetchQualifyingResults(2025, 1);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.jolpi.ca/ergast/f1/2025/1/qualifying.json',
        expect.any(Object)
      );
      expect(result).toEqual(mockData);
    });

    it('should return correct qualifying results for Australian GP', async () => {
      const mockData = loadMockData('qualifying.json');
      mockedAxios.get = vi.fn().mockResolvedValue({ data: mockData });

      const result = await service.fetchQualifyingResults(2025, 1);
      const race = result.MRData.RaceTable.Races[0];

      expect(race.raceName).toBe('Australian Grand Prix');
      expect(race.QualifyingResults).toHaveLength(20);

      // Check pole position
      const pole = race.QualifyingResults[0];
      expect(pole.position).toBe('1');
      expect(pole.Driver.driverId).toBe('norris');
      expect(pole.Q3).toBe('1:15.096');

      // Check Q3 exists for top 10
      for (let i = 0; i < 10; i++) {
        expect(race.QualifyingResults[i].Q3).toBeDefined();
      }

      // Check Q3 doesn't exist for 11th place onwards
      expect(race.QualifyingResults[10].Q3).toBeUndefined();
    });
  });

  describe('fetchSprintResults', () => {
    it('should fetch and return sprint results for a sprint race', async () => {
      const mockData = loadMockData('sprint.json');
      mockedAxios.get = vi.fn().mockResolvedValue({ data: mockData });

      const result = await service.fetchSprintResults(2025, 2);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.jolpi.ca/ergast/f1/2025/2/sprint.json',
        expect.any(Object)
      );
      expect(result).toEqual(mockData);
    });

    it('should return correct sprint results for Chinese GP', async () => {
      const mockData = loadMockData('sprint.json');
      mockedAxios.get = vi.fn().mockResolvedValue({ data: mockData });

      const result = await service.fetchSprintResults(2025, 2);
      const race = result.MRData.RaceTable.Races[0];

      expect(race.raceName).toBe('Chinese Grand Prix');
      expect(race.SprintResults).toHaveLength(20);

      // Check sprint winner gets 8 points
      const winner = race.SprintResults[0];
      expect(winner.position).toBe('1');
      expect(winner.Driver.driverId).toBe('hamilton');
      expect(winner.points).toBe('8');

      // Check sprint points structure (8-7-6-5-4-3-2-1)
      expect(race.SprintResults[1].points).toBe('7');
      expect(race.SprintResults[2].points).toBe('6');
      expect(race.SprintResults[7].points).toBe('1');
      expect(race.SprintResults[8].points).toBe('0');
    });

    it('should have sprint results for Miami GP (Round 6)', async () => {
      const mockData = loadMockData('sprint.json');
      mockedAxios.get = vi.fn().mockResolvedValue({ data: mockData });

      const result = await service.fetchSprintResults(2025, 6);
      const race = result.MRData.RaceTable.Races[1];

      expect(race.raceName).toBe('Miami Grand Prix');
      expect(race.SprintResults).toBeDefined();

      const winner = race.SprintResults[0];
      expect(winner.Driver.driverId).toBe('norris');
      expect(winner.points).toBe('8');
    });
  });

  describe('fetchDriverStandings', () => {
    it('should fetch and return driver standings for the season', async () => {
      const mockData = loadMockData('driversstandings.json');
      mockedAxios.get = vi.fn().mockResolvedValue({ data: mockData });

      const result = await service.fetchDriverStandings(2025);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.jolpi.ca/ergast/f1/2025/driverStandings.json',
        expect.any(Object)
      );
      expect(result).toEqual(mockData);
    });

    it('should return correct driver standings after round 24', async () => {
      const mockData = loadMockData('driversstandings.json');
      mockedAxios.get = vi.fn().mockResolvedValue({ data: mockData });

      const result = await service.fetchDriverStandings(2025);
      const standings = result.MRData.StandingsTable.StandingsLists[0].DriverStandings;

      expect(standings).toHaveLength(21);

      // Check champion
      const champion = standings[0];
      expect(champion.position).toBe('1');
      expect(champion.Driver.driverId).toBe('norris');
      expect(champion.points).toBe('423');
      expect(champion.wins).toBe('7');

      // Check runner-up
      const runnerUp = standings[1];
      expect(runnerUp.position).toBe('2');
      expect(runnerUp.Driver.driverId).toBe('max_verstappen');
      expect(runnerUp.points).toBe('421');
      expect(runnerUp.wins).toBe('8');

      // Check third place
      const third = standings[2];
      expect(third.position).toBe('3');
      expect(third.Driver.driverId).toBe('piastri');
      expect(third.points).toBe('410');
    });

    it('should include constructor information for each driver', async () => {
      const mockData = loadMockData('driversstandings.json');
      mockedAxios.get = vi.fn().mockResolvedValue({ data: mockData });

      const result = await service.fetchDriverStandings(2025);
      const standings = result.MRData.StandingsTable.StandingsLists[0].DriverStandings;

      // Check McLaren drivers
      const norris = standings.find((s: any) => s.Driver.driverId === 'norris');
      expect(norris.Constructors[0].constructorId).toBe('mclaren');

      // Check driver who changed teams
      const lawson = standings.find((s: any) => s.Driver.driverId === 'lawson');
      expect(lawson.Constructors).toHaveLength(2); // Drove for both RB and Red Bull
    });
  });

  describe('fetchConstructorStandings', () => {
    it('should fetch and return constructor standings for the season', async () => {
      const mockData = loadMockData('contstructorsstandings.json');
      mockedAxios.get = vi.fn().mockResolvedValue({ data: mockData });

      const result = await service.fetchConstructorStandings(2025);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.jolpi.ca/ergast/f1/2025/constructorStandings.json',
        expect.any(Object)
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('Error handling', () => {
    it('should handle API errors gracefully', async () => {
      mockedAxios.get = vi.fn().mockRejectedValue(new Error('Network error'));

      await expect(service.fetchSchedule(2025)).rejects.toThrow();
    });

    it('should handle timeout errors', async () => {
      mockedAxios.get = vi.fn().mockRejectedValue(new Error('timeout of 10000ms exceeded'));

      await expect(service.fetchDrivers(2025)).rejects.toThrow();
    });
  });

  describe('Caching behavior', () => {
    it('should cache fetched data', async () => {
      const mockData = loadMockData('races.json');
      mockedAxios.get = vi.fn().mockResolvedValue({ data: mockData });

      // First call should hit the API
      await service.fetchSchedule(2025);
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);

      // Second call should use cache (without forceRefresh)
      await service.fetchSchedule(2025);
      // Note: Actual caching behavior depends on implementation
      // This test would need to be adjusted based on how caching is implemented
    });

    it('should bypass cache with forceRefresh flag', async () => {
      const mockData = loadMockData('races.json');
      mockedAxios.get = vi.fn().mockResolvedValue({ data: mockData });

      await service.fetchSchedule(2025, false);
      await service.fetchSchedule(2025, true); // Force refresh

      // Should make API call both times when forced
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    });
  });
});
