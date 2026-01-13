import db from '../db/database';
import { f1ApiService } from './f1ApiService';

/**
 * F1 Data Transformer Service
 * Transforms Jolpica API data into the application's database schema
 */
export class F1DataTransformer {
  /**
   * Import race results from API and populate race_results table
   * Also calculates scores automatically
   */
  async importRaceResults(year: number, round: number): Promise<{
    success: boolean;
    message: string;
    results?: any;
  }> {
    try {
      console.log(`\nImporting race results for ${year} Round ${round}...`);

      // Fetch data from API
      const [resultsData, qualifyingData] = await Promise.all([
        f1ApiService.fetchRaceResults(year, round, true),
        f1ApiService.fetchQualifyingResults(year, round, true)
      ]);

      // Try to fetch sprint data (might not exist)
      let sprintData = null;
      try {
        sprintData = await f1ApiService.fetchSprintResults(year, round, true);
      } catch (err) {
        console.log('  (No sprint data available)');
      }

      // Parse API responses
      const raceResults = resultsData?.MRData?.RaceTable?.Races?.[0]?.Results || [];
      const qualifyingResults = qualifyingData?.MRData?.RaceTable?.Races?.[0]?.QualifyingResults || [];
      const sprintResults = sprintData?.MRData?.RaceTable?.Races?.[0]?.SprintResults || [];

      if (raceResults.length === 0) {
        return {
          success: false,
          message: `No race results found for ${year} Round ${round}`
        };
      }

      // Find the race in our database
      const race = await db.prepare('SELECT id FROM races WHERE round_number = $1 AND season_id = (SELECT id FROM seasons WHERE year = $2)').get(round, year) as { id: number } | undefined;

      if (!race) {
        return {
          success: false,
          message: `Race not found in database for ${year} Round ${round}`
        };
      }

      // Extract pole position from qualifying
      let poleDriverId = null;
      if (qualifyingResults.length > 0) {
        const poleDriver = qualifyingResults[0];
        poleDriverId = await this.findDriverIdByApiId(poleDriver.Driver.driverId);
      }

      // Extract podium from race results
      const podiumFirst = raceResults[0];
      const podiumSecond = raceResults[1];
      const podiumThird = raceResults[2];

      const podiumFirstId = await this.findDriverIdByApiId(podiumFirst.Driver.driverId);
      const podiumSecondId = await this.findDriverIdByApiId(podiumSecond.Driver.driverId);
      const podiumThirdId = await this.findDriverIdByApiId(podiumThird.Driver.driverId);

      // Determine midfield hero (best finisher from non-top-3 teams)
      const midfieldHeroId = await this.findMidfieldHero(raceResults);

      // Handle sprint results if available
      let sprintPoleId = null;
      let sprintWinnerId = null;
      let sprintMidfieldHeroId = null;

      if (sprintResults.length > 0) {
        const sprintWinner = sprintResults[0];
        sprintWinnerId = await this.findDriverIdByApiId(sprintWinner.Driver.driverId);
        sprintMidfieldHeroId = await this.findMidfieldHero(sprintResults);
        // Sprint pole is typically the winner of sprint qualifying (not available in this API)
        // We'll leave it null unless we can determine it from sprint qualifying data
      }

      // Check if results already exist
      const existing = await db.prepare('SELECT id FROM race_results WHERE race_id = $1').get(race.id) as { id: number } | undefined;

      if (existing) {
        // Update existing results
        await db.prepare(`
          UPDATE race_results
          SET pole_position_driver_id = $1,
              podium_first_driver_id = $2,
              podium_second_driver_id = $3,
              podium_third_driver_id = $4,
              midfield_hero_driver_id = $5,
              sprint_pole_driver_id = $6,
              sprint_winner_driver_id = $7,
              sprint_midfield_hero_driver_id = $8,
              entered_at = CURRENT_TIMESTAMP
          WHERE id = $9
        `).run(
          poleDriverId,
          podiumFirstId,
          podiumSecondId,
          podiumThirdId,
          midfieldHeroId,
          sprintPoleId,
          sprintWinnerId,
          sprintMidfieldHeroId,
          existing.id
        );
        console.log('  ✓ Updated existing race results');
      } else {
        // Insert new results
        await db.prepare(`
          INSERT INTO race_results (
            race_id, pole_position_driver_id, podium_first_driver_id,
            podium_second_driver_id, podium_third_driver_id, midfield_hero_driver_id,
            sprint_pole_driver_id, sprint_winner_driver_id, sprint_midfield_hero_driver_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `).run(
          race.id,
          poleDriverId,
          podiumFirstId,
          podiumSecondId,
          podiumThirdId,
          midfieldHeroId,
          sprintPoleId,
          sprintWinnerId,
          sprintMidfieldHeroId
        );
        console.log('  ✓ Inserted new race results');
      }

      // Calculate scores for this race
      await this.calculateRaceScores(race.id);
      console.log('  ✓ Calculated prediction scores');

      const results = await db.prepare('SELECT * FROM race_results WHERE race_id = $1').get(race.id);

      return {
        success: true,
        message: `Successfully imported and scored results for ${year} Round ${round}`,
        results
      };
    } catch (error: any) {
      console.error('Error importing race results:', error);
      return {
        success: false,
        message: `Failed to import race results: ${error.message}`
      };
    }
  }

  /**
   * Import season championship standings and populate season_results
   */
  async importSeasonStandings(year: number): Promise<{
    success: boolean;
    message: string;
    results?: any;
  }> {
    try {
      console.log(`\nImporting season standings for ${year}...`);

      // Fetch data from API
      const [driverStandings, constructorStandings] = await Promise.all([
        f1ApiService.fetchDriverStandings(year, undefined, true),
        f1ApiService.fetchConstructorStandings(year, undefined, true)
      ]);

      // Parse API responses
      const driverStandingsList = driverStandings?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings || [];
      const constructorStandingsList = constructorStandings?.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings || [];

      if (driverStandingsList.length === 0 || constructorStandingsList.length === 0) {
        return {
          success: false,
          message: `Incomplete standings data for ${year}`
        };
      }

      // Find the season in our database
      const season = await db.prepare('SELECT id FROM seasons WHERE year = $1').get(year) as { id: number } | undefined;

      if (!season) {
        return {
          success: false,
          message: `Season ${year} not found in database`
        };
      }

      // Map driver standings to our driver IDs
      const driversOrder: number[] = [];
      for (const standing of driverStandingsList) {
        const driverId = await this.findDriverIdByApiId(standing.Driver.driverId);
        if (driverId) {
          driversOrder.push(driverId);
        }
      }

      // Map constructor standings to our team IDs
      const constructorsOrder: number[] = [];
      for (const standing of constructorStandingsList) {
        const teamId = await this.findTeamIdByApiId(standing.Constructor.constructorId);
        if (teamId) {
          constructorsOrder.push(teamId);
        }
      }

      if (driversOrder.length === 0 || constructorsOrder.length === 0) {
        return {
          success: false,
          message: 'Could not map API standings to database IDs'
        };
      }

      const driversJson = JSON.stringify(driversOrder);
      const constructorsJson = JSON.stringify(constructorsOrder);

      // Check if results already exist
      const existing = await db.prepare('SELECT id FROM season_results WHERE season_id = $1').get(season.id) as { id: number } | undefined;

      if (existing) {
        // Update existing results
        await db.prepare(`
          UPDATE season_results
          SET drivers_championship_order = $1,
              constructors_championship_order = $2,
              entered_at = CURRENT_TIMESTAMP
          WHERE id = $3
        `).run(driversJson, constructorsJson, existing.id);
        console.log('  ✓ Updated existing season results');
      } else {
        // Insert new results (with empty arrays for fields we don't have from API)
        await db.prepare(`
          INSERT INTO season_results (
            season_id, drivers_championship_order, constructors_championship_order,
            mid_season_sackings, audi_vs_cadillac_winner
          ) VALUES ($1, $2, $3, '[]', NULL)
        `).run(season.id, driversJson, constructorsJson);
        console.log('  ✓ Inserted new season results');
      }

      // Calculate scores for season predictions
      await this.calculateSeasonScores(season.id);
      console.log('  ✓ Calculated season prediction scores');

      const results = await db.prepare('SELECT * FROM season_results WHERE season_id = $1').get(season.id);

      return {
        success: true,
        message: `Successfully imported and scored standings for ${year}`,
        results
      };
    } catch (error: any) {
      console.error('Error importing season standings:', error);
      return {
        success: false,
        message: `Failed to import season standings: ${error.message}`
      };
    }
  }

  /**
   * Bulk import all race results for a season
   */
  async importAllRacesForSeason(year: number): Promise<{
    success: boolean;
    message: string;
    imported: number;
    failed: number;
  }> {
    try {
      console.log(`\nBulk importing all race results for ${year} season...`);

      // Fetch schedule to get number of races
      const scheduleData = await f1ApiService.fetchSchedule(year, true);
      const races = scheduleData?.MRData?.RaceTable?.Races || [];

      if (races.length === 0) {
        return {
          success: false,
          message: `No races found in ${year} schedule`,
          imported: 0,
          failed: 0
        };
      }

      let imported = 0;
      let failed = 0;

      // Import each race
      for (const race of races) {
        const round = parseInt(race.round);
        console.log(`\n  Processing Round ${round}: ${race.raceName}...`);

        const result = await this.importRaceResults(year, round);
        if (result.success) {
          imported++;
        } else {
          failed++;
          console.log(`    ✗ ${result.message}`);
        }

        // Small delay to avoid rate limiting
        await this.sleep(500);
      }

      return {
        success: true,
        message: `Imported ${imported} races, ${failed} failed`,
        imported,
        failed
      };
    } catch (error: any) {
      console.error('Error in bulk import:', error);
      return {
        success: false,
        message: `Bulk import failed: ${error.message}`,
        imported: 0,
        failed: 0
      };
    }
  }

  /**
   * Find driver ID in our database by API driver ID
   */
  private async findDriverIdByApiId(apiDriverId: string): Promise<number | null> {
    // Try exact match on name first
    // Common mappings for API IDs to driver names
    const driverMap: Record<string, string[]> = {
      'max_verstappen': ['Max Verstappen', 'Verstappen'],
      'leclerc': ['Charles Leclerc', 'Leclerc'],
      'sainz': ['Carlos Sainz', 'Sainz'],
      'perez': ['Sergio Perez', 'Perez', 'Sergio Pérez'],
      'russell': ['George Russell', 'Russell'],
      'hamilton': ['Lewis Hamilton', 'Hamilton'],
      'alonso': ['Fernando Alonso', 'Alonso'],
      'stroll': ['Lance Stroll', 'Stroll'],
      'norris': ['Lando Norris', 'Norris'],
      'piastri': ['Oscar Piastri', 'Piastri'],
      'gasly': ['Pierre Gasly', 'Gasly'],
      'ocon': ['Esteban Ocon', 'Ocon'],
      'albon': ['Alexander Albon', 'Albon'],
      'sargeant': ['Logan Sargeant', 'Sargeant'],
      'bottas': ['Valtteri Bottas', 'Bottas'],
      'zhou': ['Zhou Guanyu', 'Zhou'],
      'hulkenberg': ['Nico Hulkenberg', 'Hülkenberg', 'Hulkenberg'],
      'magnussen': ['Kevin Magnussen', 'Magnussen'],
      'tsunoda': ['Yuki Tsunoda', 'Tsunoda'],
      'ricciardo': ['Daniel Ricciardo', 'Ricciardo'],
      'lawson': ['Liam Lawson', 'Lawson'],
      'colapinto': ['Franco Colapinto', 'Colapinto'],
      'bearman': ['Oliver Bearman', 'Bearman'],
      'antonelli': ['Andrea Kimi Antonelli', 'Antonelli'],
      'hadjar': ['Isack Hadjar', 'Hadjar'],
      'bortoleto': ['Gabriel Bortoleto', 'Bortoleto'],
      'doohan': ['Jack Doohan', 'Doohan']
    };

    // Try to find driver by mapped names
    const possibleNames = driverMap[apiDriverId] || [];
    for (const name of possibleNames) {
      const driver = await db.prepare('SELECT id FROM drivers WHERE name ILIKE $1').get(`%${name}%`) as { id: number } | undefined;
      if (driver) {
        return driver.id;
      }
    }

    // Fallback: try searching by last name from API ID
    const lastName = apiDriverId.split('_').pop() || '';
    if (lastName) {
      const driver = await db.prepare('SELECT id FROM drivers WHERE name ILIKE $1').get(`%${lastName}%`) as { id: number } | undefined;
      if (driver) {
        return driver.id;
      }
    }

    console.warn(`  ⚠ Could not find driver for API ID: ${apiDriverId}`);
    return null;
  }

  /**
   * Find team ID in our database by API constructor ID
   */
  private async findTeamIdByApiId(apiConstructorId: string): Promise<number | null> {
    const teamMap: Record<string, string[]> = {
      'red_bull': ['Red Bull Racing', 'Red Bull'],
      'ferrari': ['Ferrari'],
      'mercedes': ['Mercedes'],
      'mclaren': ['McLaren'],
      'aston_martin': ['Aston Martin'],
      'alpine': ['Alpine'],
      'williams': ['Williams'],
      'rb': ['RB', 'Racing Bulls', 'VCARB'],
      'kick_sauber': ['Kick Sauber', 'Sauber'],
      'haas': ['Haas']
    };

    const possibleNames = teamMap[apiConstructorId] || [];
    for (const name of possibleNames) {
      const team = await db.prepare('SELECT id FROM teams WHERE name ILIKE $1').get(`%${name}%`) as { id: number } | undefined;
      if (team) {
        return team.id;
      }
    }

    console.warn(`  ⚠ Could not find team for API ID: ${apiConstructorId}`);
    return null;
  }

  /**
   * Find midfield hero (best finisher from non-top-3 teams)
   */
  private async findMidfieldHero(results: any[]): Promise<number | null> {
    // Get top 3 teams (teams marked as is_top_four in database, but we'll use top 3)
    const topTeams = await db.prepare('SELECT id FROM teams WHERE is_top_four = true').all() as { id: number }[];
    const topTeamIds = new Set(topTeams.map(t => t.id));

    // Find first finisher not from a top team
    for (const result of results) {
      const driverId = await this.findDriverIdByApiId(result.Driver.driverId);
      if (!driverId) continue;

      // Get driver's team
      const driver = await db.prepare('SELECT team_id FROM drivers WHERE id = $1').get(driverId) as { team_id: number } | undefined;
      if (!driver) continue;

      // If driver's team is not in top teams, they're the midfield hero
      if (!topTeamIds.has(driver.team_id)) {
        return driverId;
      }
    }

    return null;
  }

  /**
   * Calculate scores for a race (copy of logic from adminController)
   */
  private async calculateRaceScores(raceId: number) {
    const results = await db.prepare('SELECT * FROM race_results WHERE race_id = $1').get(raceId) as any;
    if (!results) return;

    const predictions = await db.prepare('SELECT * FROM race_predictions WHERE race_id = $1').all(raceId) as any[];

    for (const prediction of predictions) {
      let points = 0;

      if (prediction.pole_position_driver_id === results.pole_position_driver_id) points += 1;
      if (prediction.podium_first_driver_id === results.podium_first_driver_id) points += 1;
      if (prediction.podium_second_driver_id === results.podium_second_driver_id) points += 1;
      if (prediction.podium_third_driver_id === results.podium_third_driver_id) points += 1;
      if (prediction.midfield_hero_driver_id === results.midfield_hero_driver_id) points += 1;

      if (prediction.sprint_pole_driver_id && prediction.sprint_pole_driver_id === results.sprint_pole_driver_id) points += 1;
      if (prediction.sprint_winner_driver_id && prediction.sprint_winner_driver_id === results.sprint_winner_driver_id) points += 1;
      if (prediction.sprint_midfield_hero_driver_id && prediction.sprint_midfield_hero_driver_id === results.sprint_midfield_hero_driver_id) points += 1;

      // Crazy prediction scoring (simplified - would need full validation logic)
      if (prediction.crazy_prediction) {
        const isValidated = await this.isCrazyPredictionValidated('race', prediction.id);
        const actuallyHappened = await this.didCrazyPredictionHappen('race', prediction.id);
        if (isValidated && actuallyHappened) points += 1;
      }

      await db.prepare('UPDATE race_predictions SET points_earned = $1 WHERE id = $2').run(points, prediction.id);
    }
  }

  /**
   * Calculate scores for season predictions
   */
  private async calculateSeasonScores(seasonId: number) {
    const results = await db.prepare('SELECT * FROM season_results WHERE season_id = $1').get(seasonId) as any;
    if (!results) return;

    const predictions = await db.prepare('SELECT * FROM season_predictions WHERE season_id = $1').all(seasonId) as any[];

    const actualDriversOrder = JSON.parse(results.drivers_championship_order);
    const actualConstructorsOrder = JSON.parse(results.constructors_championship_order);

    for (const prediction of predictions) {
      let points = 0;

      const predictedDrivers = JSON.parse(prediction.drivers_championship_order);
      for (let i = 0; i < predictedDrivers.length; i++) {
        if (predictedDrivers[i] === actualDriversOrder[i]) points += 1;
      }

      const predictedConstructors = JSON.parse(prediction.constructors_championship_order);
      for (let i = 0; i < predictedConstructors.length; i++) {
        if (predictedConstructors[i] === actualConstructorsOrder[i]) points += 1;
      }

      await db.prepare('UPDATE season_predictions SET points_earned = $1 WHERE id = $2').run(points, prediction.id);
    }
  }

  private async isCrazyPredictionValidated(type: string, predictionId: number): Promise<boolean> {
    const validations = await db.prepare('SELECT is_validated FROM crazy_prediction_validations WHERE prediction_type = $1 AND prediction_id = $2').all(type, predictionId) as { is_validated: boolean }[];
    if (validations.length === 0) return true;
    return validations.some(v => v.is_validated === true);
  }

  private async didCrazyPredictionHappen(type: string, predictionId: number): Promise<boolean> {
    const outcome = await db.prepare('SELECT actually_happened FROM crazy_prediction_outcomes WHERE prediction_type = $1 AND prediction_id = $2').get(type, predictionId) as { actually_happened: boolean } | undefined;
    return outcome?.actually_happened === true;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const f1DataTransformer = new F1DataTransformer();
