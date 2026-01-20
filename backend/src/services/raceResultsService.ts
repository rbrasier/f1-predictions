import db from '../db/database';
import { f1ApiService } from './f1ApiService';
import { logger } from '../utils/logger';

/**
 * Helper function to check if a crazy prediction is validated
 */
async function isCrazyPredictionValidated(predictionType: 'race' | 'season', predictionId: number): Promise<boolean> {
  const validations = await db.prepare(`
    SELECT COUNT(*) as count
    FROM crazy_prediction_validations
    WHERE prediction_type = $1 AND prediction_id = $2 AND is_validated = true
  `).get(predictionType, predictionId) as { count: number };

  const invalidations = await db.prepare(`
    SELECT COUNT(*) as count
    FROM crazy_prediction_validations
    WHERE prediction_type = $1 AND prediction_id = $2 AND is_validated = false
  `).get(predictionType, predictionId) as { count: number };

  // Need more validations than invalidations
  return validations.count > invalidations.count;
}

/**
 * Helper function to check if a crazy prediction actually happened
 */
async function didCrazyPredictionHappen(predictionType: 'race' | 'season', predictionId: number): Promise<boolean> {
  const outcome = await db.prepare(`
    SELECT actually_happened
    FROM crazy_prediction_outcomes
    WHERE prediction_type = $1 AND prediction_id = $2
  `).get(predictionType, predictionId) as { actually_happened: boolean } | undefined;

  return outcome?.actually_happened || false;
}

/**
 * Calculate scores for all predictions for a specific race
 */
async function calculateRaceScores(seasonYear: number, roundNumber: number): Promise<void> {
  const results = await db.prepare(`
    SELECT * FROM race_results
    WHERE season_year = $1 AND round_number = $2
  `).get(seasonYear, roundNumber) as any;

  if (!results) {
    return;
  }

  const predictions = await db.prepare(`
    SELECT * FROM race_predictions
    WHERE season_year = $1 AND round_number = $2
  `).all(seasonYear, roundNumber) as any[];

  for (const prediction of predictions) {
    let points = 0;

    // Pole position: 1 point
    if (prediction.pole_position_driver_api_id === results.pole_position_driver_api_id) {
      points += 1;
    }

    // Podium: 1 point per correct position (up to 3 points)
    if (prediction.podium_first_driver_api_id === results.podium_first_driver_api_id) {
      points += 1;
    }
    if (prediction.podium_second_driver_api_id === results.podium_second_driver_api_id) {
      points += 1;
    }
    if (prediction.podium_third_driver_api_id === results.podium_third_driver_api_id) {
      points += 1;
    }

    // Midfield hero: 1 point
    if (prediction.midfield_hero_driver_api_id === results.midfield_hero_driver_api_id) {
      points += 1;
    }

    // Sprint pole: 1 point
    if (prediction.sprint_pole_driver_api_id && prediction.sprint_pole_driver_api_id === results.sprint_pole_driver_api_id) {
      points += 1;
    }

    // Sprint winner: 1 point
    if (prediction.sprint_winner_driver_api_id && prediction.sprint_winner_driver_api_id === results.sprint_winner_driver_api_id) {
      points += 1;
    }

    // Sprint midfield hero: 1 point
    if (prediction.sprint_midfield_hero_driver_api_id && prediction.sprint_midfield_hero_driver_api_id === results.sprint_midfield_hero_driver_api_id) {
      points += 1;
    }

    // Crazy prediction: 1 point if validated AND actually happened
    if (prediction.crazy_prediction) {
      const isValidated = await isCrazyPredictionValidated('race', prediction.id);
      const actuallyHappened = await didCrazyPredictionHappen('race', prediction.id);

      if (isValidated && actuallyHappened) {
        points += 1;
      }
    }

    // Update prediction points
    await db.prepare('UPDATE race_predictions SET points_earned = $1 WHERE id = $2').run(points, prediction.id);
  }
}

/**
 * Service for importing race results and calculating scores
 */
export class RaceResultsService {
  /**
   * Fetch race results from F1 API, import them, and calculate scores
   * Returns true if results were successfully imported, false if results are not available yet
   */
  async importAndScoreRace(seasonYear: number, roundNumber: number): Promise<boolean> {
    try {
      logger.log(`📥 Attempting to import results for ${seasonYear} Round ${roundNumber}...`);

      // Refresh cache to get latest data from F1 API
      await f1ApiService.fetchRaceResults(seasonYear, roundNumber, true);
      await f1ApiService.fetchQualifyingResults(seasonYear, roundNumber, true);

      // Try to fetch sprint results (may not exist for all races)
      try {
        await f1ApiService.fetchSprintResults(seasonYear, roundNumber, true);
      } catch (error) {
        // Sprint results may not exist for this race - that's okay
        logger.log(`ℹ️ No sprint results for ${seasonYear} Round ${roundNumber} (this is normal for non-sprint races)`);
      }

      // Get cached race results
      const resultsData = await f1ApiService.getCachedData('results', seasonYear, roundNumber);
      const qualifyingData = await f1ApiService.getCachedData('qualifying', seasonYear, roundNumber);
      const sprintData = await f1ApiService.getCachedData('sprint', seasonYear, roundNumber);

      if (!resultsData) {
        logger.log(`⚠️ Race results not yet available from F1 API for ${seasonYear} Round ${roundNumber}`);
        return false;
      }

      // Extract race results from API response
      const race = resultsData.MRData?.RaceTable?.Races?.[0];
      if (!race || !race.Results) {
        logger.log(`⚠️ Invalid race results data format for ${seasonYear} Round ${roundNumber}`);
        return false;
      }

      // Get podium (top 3 finishers)
      const podium = race.Results.slice(0, 3);
      const podiumFirst = podium[0]?.Driver?.driverId;
      const podiumSecond = podium[1]?.Driver?.driverId;
      const podiumThird = podium[2]?.Driver?.driverId;

      // Get pole position from qualifying
      let polePosition = null;
      if (qualifyingData) {
        const qualifyingRace = qualifyingData.MRData?.RaceTable?.Races?.[0];
        if (qualifyingRace?.QualifyingResults?.[0]) {
          polePosition = qualifyingRace.QualifyingResults[0].Driver?.driverId;
        }
      }

      // Get midfield hero (best finisher from positions 6-10)
      const midfieldResults = race.Results.slice(5, 10);
      const midfieldHero = midfieldResults[0]?.Driver?.driverId;

      // Get sprint data if available
      let sprintPole = null;
      let sprintWinner = null;
      let sprintMidfieldHero = null;

      if (sprintData) {
        const sprintRace = sprintData.MRData?.RaceTable?.Races?.[0];
        if (sprintRace?.SprintResults) {
          sprintWinner = sprintRace.SprintResults[0]?.Driver?.driverId;
          const sprintMidfield = sprintRace.SprintResults.slice(5, 10);
          sprintMidfieldHero = sprintMidfield[0]?.Driver?.driverId;
          // Sprint pole would need sprint qualifying data - skip for now
        }
      }

      // Check if results already exist
      const existing = await db.prepare(`
        SELECT id FROM race_results
        WHERE season_year = $1 AND round_number = $2
      `).get(seasonYear, roundNumber) as { id: number } | undefined;

      if (existing) {
        // Update existing results
        await db.prepare(`
          UPDATE race_results
          SET pole_position_driver_api_id = $1,
              podium_first_driver_api_id = $2,
              podium_second_driver_api_id = $3,
              podium_third_driver_api_id = $4,
              midfield_hero_driver_api_id = $5,
              sprint_pole_driver_api_id = $6,
              sprint_winner_driver_api_id = $7,
              sprint_midfield_hero_driver_api_id = $8,
              entered_at = CURRENT_TIMESTAMP
          WHERE id = $9
        `).run(
          polePosition,
          podiumFirst,
          podiumSecond,
          podiumThird,
          midfieldHero,
          sprintPole,
          sprintWinner,
          sprintMidfieldHero,
          existing.id
        );
        logger.log(`✅ Updated existing results for ${seasonYear} Round ${roundNumber}`);
      } else {
        // Insert new results
        await db.prepare(`
          INSERT INTO race_results (
            season_year, round_number,
            pole_position_driver_api_id, podium_first_driver_api_id,
            podium_second_driver_api_id, podium_third_driver_api_id,
            midfield_hero_driver_api_id, sprint_pole_driver_api_id,
            sprint_winner_driver_api_id, sprint_midfield_hero_driver_api_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `).run(
          seasonYear,
          roundNumber,
          polePosition,
          podiumFirst,
          podiumSecond,
          podiumThird,
          midfieldHero,
          sprintPole,
          sprintWinner,
          sprintMidfieldHero
        );
        logger.log(`✅ Inserted new results for ${seasonYear} Round ${roundNumber}`);
      }

      // Calculate scores for this race
      logger.log(`🧮 Calculating scores for ${seasonYear} Round ${roundNumber}...`);
      await calculateRaceScores(seasonYear, roundNumber);
      logger.log(`✅ Successfully imported results and calculated scores for ${seasonYear} Round ${roundNumber}`);

      return true;
    } catch (error: any) {
      logger.error(`Failed to import race results for ${seasonYear} Round ${roundNumber}:`, error);
      return false;
    }
  }
}

// Export singleton instance
export const raceResultsService = new RaceResultsService();
