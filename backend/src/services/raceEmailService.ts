import db from '../db/database';
import { emailService } from './emailService';
import { weatherService } from './weatherService';
import { f1ApiService } from './f1ApiService';
import { logger } from '../utils/logger';
import { generatePreRaceEmailHTML, generatePreRaceEmailText, PreRaceEmailData } from '../templates/emails/preRaceEmail';
import { generatePostRaceEmailHTML, generatePostRaceEmailText, PostRaceEmailData } from '../templates/emails/postRaceEmail';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:4000';

/**
 * Service for sending race-related emails
 */
export class RaceEmailService {
  /**
   * Send pre-race email to a single user
   */
  async sendPreRaceEmail(userId: number, raceYear: number, raceRound: number): Promise<boolean> {
    try {
      // Get user details and check email preferences
      const user = await db.prepare(`
        SELECT id, username, display_name, email, race_reminder_emails
        FROM users
        WHERE id = $1
      `).get(userId);

      if (!user || !user.email || !user.race_reminder_emails) {
        logger.log(`Skipping pre-race email for user ${userId}: no email or reminders disabled`);
        return false;
      }

      // Get race details
      const scheduleData = await f1ApiService.fetchSchedule(raceYear);
      const races = scheduleData?.MRData?.RaceTable?.Races || [];
      const race = races.find((r: any) => r.round === raceRound.toString());

      if (!race) {
        logger.error(`Race not found: ${raceYear} Round ${raceRound}`);
        return false;
      }

      // Get user's default league
      const defaultLeague = await db.prepare(`
        SELECT l.id, l.name
        FROM leagues l
        INNER JOIN user_leagues ul ON l.id = ul.league_id
        WHERE ul.user_id = $1 AND ul.is_default = true
        LIMIT 1
      `).get(userId);

      const leagueId = defaultLeague?.id;
      const leagueName = defaultLeague?.name || 'World League';

      // Get weather forecast
      const fridayDate = race.FirstPractice?.date || race.date;
      const weather = await weatherService.getRaceWeekendForecast(
        parseFloat(race.Circuit.Location.lat),
        parseFloat(race.Circuit.Location.long),
        fridayDate
      );

      // Get user's prediction
      const userPrediction = await db.prepare(`
        SELECT * FROM race_predictions
        WHERE user_id = $1 AND season_year = $2 AND round_number = $3
      `).get(userId, raceYear, raceRound);

      // Get driver names for predictions
      const driversData = await f1ApiService.fetchDrivers(raceYear);
      const drivers = driversData?.MRData?.DriverTable?.Drivers || [];

      const getDriverName = (driverId: string | null) => {
        if (!driverId) return null;
        const driver = drivers.find((d: any) => d.driverId === driverId);
        return driver ? `${driver.givenName} ${driver.familyName}` : driverId;
      };

      // Get crazy predictions from league (limit 10)
      const crazyPredictions = await db.prepare(`
        SELECT rp.id, rp.crazy_prediction, u.display_name
        FROM race_predictions rp
        INNER JOIN users u ON rp.user_id = u.id
        ${leagueId ? 'INNER JOIN user_leagues ul ON u.id = ul.user_id' : ''}
        WHERE rp.season_year = $1 AND rp.round_number = $2
        AND rp.crazy_prediction IS NOT NULL AND rp.crazy_prediction != ''
        AND rp.user_id != $3
        ${leagueId ? 'AND ul.league_id = $4' : ''}
        ORDER BY rp.submitted_at DESC
        LIMIT 10
      `).all(...(leagueId ? [raceYear, raceRound, userId, leagueId] : [raceYear, raceRound, userId]));

      // Get league standings (top 3)
      const leagueStandings = await db.prepare(`
        SELECT
          u.id,
          u.display_name,
          COALESCE(SUM(rp.points_earned), 0) + COALESCE(SUM(sp.points_earned), 0) as total_points
        FROM users u
        ${leagueId ? 'INNER JOIN user_leagues ul ON u.id = ul.user_id' : ''}
        LEFT JOIN race_predictions rp ON u.id = rp.user_id AND rp.season_year = $1
        LEFT JOIN season_predictions sp ON u.id = sp.user_id AND sp.season_year = $1
        ${leagueId ? 'WHERE ul.league_id = $2' : ''}
        GROUP BY u.id, u.display_name
        ORDER BY total_points DESC
      `).all(...(leagueId ? [raceYear, leagueId] : [raceYear]));

      const userStanding = leagueStandings.find((s: any) => s.id === userId);
      const userPosition = leagueStandings.findIndex((s: any) => s.id === userId) + 1;

      // Get recent implemented features from feedback
      const recentChanges = await db.prepare(`
        SELECT
          title,
          COALESCE(implementation_note, description) as description,
          implementation_date as release_date
        FROM feedback
        WHERE type = 'feature' AND status = 'implemented' AND implementation_date IS NOT NULL
        ORDER BY implementation_date DESC
        LIMIT 3
      `).all();

      // Calculate time remaining until FP1
      const fp1DateTime = race.FirstPractice
        ? `${race.FirstPractice.date} ${race.FirstPractice.time}`
        : `${race.date} ${race.time || '00:00:00'}`;

      const fp1Date = new Date(fp1DateTime.replace(' ', 'T'));
      const now = new Date();
      const timeRemaining = this.formatTimeRemaining(fp1Date.getTime() - now.getTime());

      // Build email data
      const emailData: PreRaceEmailData = {
        displayName: user.display_name,
        raceName: race.raceName,
        raceDate: new Date(race.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
        circuitName: race.Circuit.circuitName,
        country: race.Circuit.Location.country,
        fp1DateTime: fp1Date.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }),
        fp1TimeRemaining: timeRemaining,
        raceUrl: `${FRONTEND_URL}/races/${raceYear}-${raceRound}`,
        weatherFriday: weather.friday,
        weatherSaturday: weather.saturday,
        weatherSunday: weather.sunday,
        userHasSubmittedPrediction: !!userPrediction,
        userPredictions: userPrediction ? {
          pole: getDriverName(userPrediction.pole_position_driver_api_id),
          podium1: getDriverName(userPrediction.podium_first_driver_api_id),
          podium2: getDriverName(userPrediction.podium_second_driver_api_id),
          podium3: getDriverName(userPrediction.podium_third_driver_api_id),
          midfieldHero: getDriverName(userPrediction.midfield_hero_driver_api_id),
          crazyPrediction: userPrediction.crazy_prediction
        } : undefined,
        crazyPredictions: crazyPredictions.map((cp: any) => ({
          id: cp.id,
          userName: cp.display_name,
          prediction: cp.crazy_prediction,
          voteUrl: `${FRONTEND_URL}/vote/${cp.id}`
        })),
        leagueName,
        topThree: leagueStandings.slice(0, 3).map((s: any, idx: number) => ({
          position: idx + 1,
          displayName: s.display_name,
          points: s.total_points
        })),
        userPosition: userPosition > 3 ? userPosition : null,
        userPoints: userStanding?.total_points || 0,
        recentChanges: recentChanges.map((c: any) => ({
          title: c.title,
          description: c.description,
          date: c.release_date
        })),
        unsubscribeReminderUrl: `${FRONTEND_URL}/settings?unsubscribe=reminders`
      };

      // Generate and send email
      const htmlContent = generatePreRaceEmailHTML(emailData);
      const textContent = generatePreRaceEmailText(emailData);

      await emailService.sendEmail({
        to: user.email,
        subject: `🏁 ${race.raceName} - Race Weekend Reminder`,
        text: textContent,
        html: htmlContent
      });

      logger.log(`✅ Pre-race email sent to ${user.display_name} (${user.email})`);
      return true;
    } catch (error) {
      logger.error(`Error sending pre-race email to user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Send pre-race emails to all users for a specific race
   */
  async sendPreRaceEmailsToAll(raceYear: number, raceRound: number): Promise<{ sent: number; failed: number }> {
    try {
      // Get all users with email and reminders enabled
      const users = await db.prepare(`
        SELECT id FROM users
        WHERE email IS NOT NULL AND race_reminder_emails = true
      `).all();

      logger.log(`📧 Sending pre-race emails to ${users.length} users for ${raceYear} Round ${raceRound}`);

      let sent = 0;
      let failed = 0;

      for (const user of users) {
        const success = await this.sendPreRaceEmail(user.id, raceYear, raceRound);
        if (success) {
          sent++;
        } else {
          failed++;
        }

        // Small delay to avoid overwhelming the email service
        await new Promise(resolve => setTimeout(resolve, 100));
      }


      logger.log(`✅ Pre-race emails sent: ${sent} successful, ${failed} failed`);
      
      // Log that emails were sent
      await db.prepare(`
        INSERT INTO race_email_log (season_year, round_number, email_type, users_sent_to)
        VALUES ($1, $2, 'pre_race', $3)
        ON CONFLICT (season_year, round_number, email_type) DO UPDATE
        SET users_sent_to = $3, sent_at = CURRENT_TIMESTAMP
      `).run(raceYear, raceRound, sent);
      
      return { sent, failed };

    } catch (error) {
      logger.error('Error sending pre-race emails to all users:', error);
      throw error;
    }
  }

  /**
   * Send post-race email to a single user
   */
  async sendPostRaceEmail(userId: number, raceYear: number, raceRound: number): Promise<boolean> {
    try {
      // Get user details and check email preferences
      const user = await db.prepare(`
        SELECT id, username, display_name, email, race_results_emails
        FROM users
        WHERE id = $1
      `).get(userId);

      if (!user || !user.email || !user.race_results_emails) {
        logger.log(`Skipping post-race email for user ${userId}: no email or results disabled`);
        return false;
      }

      // Get race details
      const scheduleData = await f1ApiService.fetchSchedule(raceYear);
      const races = scheduleData?.MRData?.RaceTable?.Races || [];
      const race = races.find((r: any) => r.round === raceRound.toString());

      if (!race) {
        logger.error(`Race not found: ${raceYear} Round ${raceRound}`);
        return false;
      }

      // Get user's default league
      const defaultLeague = await db.prepare(`
        SELECT l.id, l.name
        FROM leagues l
        INNER JOIN user_leagues ul ON l.id = ul.league_id
        WHERE ul.user_id = $1 AND ul.is_default = true
        LIMIT 1
      `).get(userId);

      const leagueId = defaultLeague?.id;
      const leagueName = defaultLeague?.name || 'World League';

      // Get user's prediction and points
      const userPrediction = await db.prepare(`
        SELECT * FROM race_predictions
        WHERE user_id = $1 AND season_year = $2 AND round_number = $3
      `).get(userId, raceYear, raceRound);

      // Get race results to check correctness
      const raceResults = await db.prepare(`
        SELECT * FROM race_results
        WHERE race_id = (
          SELECT id FROM races WHERE season_id = (SELECT id FROM seasons WHERE year = $1) AND round_number = $2
        )
      `).get(raceYear, raceRound);

      // Get driver names
      const driversData = await f1ApiService.fetchDrivers(raceYear);
      const drivers = driversData?.MRData?.DriverTable?.Drivers || [];

      const getDriverName = (driverId: string | null) => {
        if (!driverId) return null;
        const driver = drivers.find((d: any) => d.driverId === driverId);
        return driver ? `${driver.givenName} ${driver.familyName}` : driverId;
      };

      // Check prediction correctness
      const userPredictionsFormatted = userPrediction ? {
        pole: getDriverName(userPrediction.pole_position_driver_api_id),
        poleCorrect: raceResults && userPrediction.pole_position_driver_api_id === raceResults.pole_position_driver_api_id,
        podium1: getDriverName(userPrediction.podium_first_driver_api_id),
        podium1Correct: raceResults && userPrediction.podium_first_driver_api_id === raceResults.podium_first_driver_api_id,
        podium2: getDriverName(userPrediction.podium_second_driver_api_id),
        podium2Correct: raceResults && userPrediction.podium_second_driver_api_id === raceResults.podium_second_driver_api_id,
        podium3: getDriverName(userPrediction.podium_third_driver_api_id),
        podium3Correct: raceResults && userPrediction.podium_third_driver_api_id === raceResults.podium_third_driver_api_id,
        midfieldHero: getDriverName(userPrediction.midfield_hero_driver_api_id),
        midfieldHeroCorrect: raceResults && userPrediction.midfield_hero_driver_api_id === raceResults.midfield_hero_driver_api_id,
        crazyPrediction: userPrediction.crazy_prediction
      } : undefined;

      // Get round results (all users' scores for this race)
      const roundResults = await db.prepare(`
        SELECT
          u.id,
          u.display_name,
          COALESCE(rp.points_earned, 0) as points
        FROM users u
        ${leagueId ? 'INNER JOIN user_leagues ul ON u.id = ul.user_id' : ''}
        LEFT JOIN race_predictions rp ON u.id = rp.user_id
          AND rp.season_year = $1 AND rp.round_number = $2
        ${leagueId ? 'WHERE ul.league_id = $3' : ''}
        ORDER BY points DESC
      `).all(...(leagueId ? [raceYear, raceRound, leagueId] : [raceYear, raceRound]));

      const topScorer = roundResults[0] || { display_name: 'N/A', points: 0 };

      // Get crazy predictions to confirm
      const crazyPredictionsToConfirm = await db.prepare(`
        SELECT rp.id, rp.crazy_prediction, u.display_name
        FROM race_predictions rp
        INNER JOIN users u ON rp.user_id = u.id
        ${leagueId ? 'INNER JOIN user_leagues ul ON u.id = ul.user_id' : ''}
        WHERE rp.season_year = $1 AND rp.round_number = $2
        AND rp.crazy_prediction IS NOT NULL AND rp.crazy_prediction != ''
        AND rp.user_id != $3
        ${leagueId ? 'AND ul.league_id = $4' : ''}
        AND NOT EXISTS (
          SELECT 1 FROM crazy_prediction_outcomes cpc
          WHERE cpc.prediction_id = rp.id AND cpc.user_id = $3
        )
        LIMIT 10
      `).all(...(leagueId ? [raceYear, raceRound, userId, leagueId] : [raceYear, raceRound, userId]));

      // Get next race
      const nextRace = races.find((r: any) => parseInt(r.round) === raceRound + 1);
      const nextRaceData = nextRace ? {
        name: nextRace.raceName,
        date: new Date(nextRace.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
        daysUntil: Math.ceil((new Date(nextRace.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      } : null;

      // Build email data
      const emailData: PostRaceEmailData = {
        displayName: user.display_name,
        raceName: race.raceName,
        raceDate: new Date(race.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
        circuitName: race.Circuit.circuitName,
        country: race.Circuit.Location.country,
        userPoints: userPrediction?.points_earned || 0,
        userPredictions: userPredictionsFormatted,
        topScorer: {
          displayName: topScorer.display_name,
          points: topScorer.points
        },
        leagueName,
        roundResults: roundResults.map((r: any, idx: number) => ({
          position: idx + 1,
          displayName: r.display_name,
          points: r.points
        })),
        crazyPredictionsToConfirm: crazyPredictionsToConfirm.map((cp: any) => ({
          id: cp.id,
          userName: cp.display_name,
          prediction: cp.crazy_prediction,
          confirmUrl: `${FRONTEND_URL}/confirm/${cp.id}`
        })),
        nextRace: nextRaceData,
        unsubscribeResultsUrl: `${FRONTEND_URL}/settings?unsubscribe=results`
      };

      // Generate and send email
      const htmlContent = generatePostRaceEmailHTML(emailData);
      const textContent = generatePostRaceEmailText(emailData);

      await emailService.sendEmail({
        to: user.email,
        subject: `🏁 ${race.raceName} - Race Results`,
        text: textContent,
        html: htmlContent
      });

      logger.log(`✅ Post-race email sent to ${user.display_name} (${user.email})`);
      return true;
    } catch (error) {
      logger.error(`Error sending post-race email to user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Send post-race emails to all users for a specific race
   */
  async sendPostRaceEmailsToAll(raceYear: number, raceRound: number): Promise<{ sent: number; failed: number }> {
    try {
      // CRITICAL: Verify race results exist before sending emails
      const raceResults = await db.prepare(`
        SELECT id FROM race_results
        WHERE race_id = (
          SELECT id FROM races WHERE season_id = (SELECT id FROM seasons WHERE year = $1) AND round_number = $2
        )
      `).get(raceYear, raceRound);

      if (!raceResults) {
        logger.log(`⚠️ Race results not yet available for ${raceYear} Round ${raceRound}, skipping post-race emails`);
        return { sent: 0, failed: 0 };
      }

      // Verify at least one prediction has been scored (has non-null points)
      const scoredPrediction = await db.prepare(`
        SELECT id FROM race_predictions
        WHERE season_year = $1 AND round_number = $2 AND points_earned IS NOT NULL
        LIMIT 1
      `).get(raceYear, raceRound);

      if (!scoredPrediction) {
        logger.log(`⚠️ Predictions not yet scored for ${raceYear} Round ${raceRound}, skipping post-race emails`);
        return { sent: 0, failed: 0 };
      }

      logger.log(`✅ Race results and scores confirmed for ${raceYear} Round ${raceRound}, proceeding with emails`);

      // Get all users with email and results enabled
      const users = await db.prepare(`
        SELECT id FROM users
        WHERE email IS NOT NULL AND race_results_emails = true
      `).all();

      logger.log(`📧 Sending post-race emails to ${users.length} users for ${raceYear} Round ${raceRound}`);

      let sent = 0;
      let failed = 0;

      for (const user of users) {
        const success = await this.sendPostRaceEmail(user.id, raceYear, raceRound);
        if (success) {
          sent++;
        } else {
          failed++;
        }

        // Small delay to avoid overwhelming the email service
        await new Promise(resolve => setTimeout(resolve, 100));
      }


      logger.log(`✅ Post-race emails sent: ${sent} successful, ${failed} failed`);
      
      // Log that emails were sent
      await db.prepare(`
        INSERT INTO race_email_log (season_year, round_number, email_type, users_sent_to)
        VALUES ($1, $2, 'post_race', $3)
        ON CONFLICT (season_year, round_number, email_type) DO UPDATE
        SET users_sent_to = $3, sent_at = CURRENT_TIMESTAMP
      `).run(raceYear, raceRound, sent);
      
      return { sent, failed };

    } catch (error) {
      logger.error('Error sending post-race emails to all users:', error);
      throw error;
    }
  }

  /**
   * Send pre-race sample emails to admin users
   */
  async sendPreRaceEmailsToAdmins(raceYear: number, raceRound: number): Promise<{ sent: number; token: string }> {
    try {
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

      // Get all admin users with email
      const admins = await db.prepare(`
        SELECT id, display_name, email FROM users
        WHERE email IS NOT NULL AND is_admin = true
      `).all();

      logger.log(`📧 Sending pre-race sample emails to ${admins.length} admin users for ${raceYear} Round ${raceRound}`);

      let sent = 0;

      for (const admin of admins) {
        try {
          // Get race details
          const scheduleData = await f1ApiService.fetchSchedule(raceYear);
          const races = scheduleData?.MRData?.RaceTable?.Races || [];
          const race = races.find((r: any) => r.round === raceRound.toString());

          if (!race) {
            logger.error(`Race not found: ${raceYear} Round ${raceRound}`);
            continue;
          }

          // Get weather forecast
          const fridayDate = race.FirstPractice?.date || race.date;
          const weather = await weatherService.getRaceWeekendForecast(
            parseFloat(race.Circuit.Location.lat),
            parseFloat(race.Circuit.Location.long),
            fridayDate
          );

          // Calculate time remaining until FP1
          const fp1DateTime = race.FirstPractice
            ? `${race.FirstPractice.date} ${race.FirstPractice.time}`
            : `${race.date} ${race.time || '00:00:00'}`;

          const fp1Date = new Date(fp1DateTime.replace(' ', 'T'));
          const now = new Date();
          const timeRemaining = this.formatTimeRemaining(fp1Date.getTime() - now.getTime());

          // Build minimal email data for sample
          const emailData: PreRaceEmailData = {
            displayName: admin.display_name,
            raceName: race.raceName,
            raceDate: new Date(race.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
            circuitName: race.Circuit.circuitName,
            country: race.Circuit.Location.country,
            fp1DateTime: fp1Date.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }),
            fp1TimeRemaining: timeRemaining,
            raceUrl: `${FRONTEND_URL}/races/${raceYear}-${raceRound}`,
            weatherFriday: weather.friday,
            weatherSaturday: weather.saturday,
            weatherSunday: weather.sunday,
            userHasSubmittedPrediction: false,
            crazyPredictions: [],
            leagueName: 'World League',
            topThree: [],
            userPosition: null,
            userPoints: null,
            recentChanges: [],
            unsubscribeReminderUrl: `${FRONTEND_URL}/settings?unsubscribe=reminders`,
            adminReleaseUrl: `${FRONTEND_URL}/admin/release-emails?token=${token}&type=pre_race&year=${raceYear}&round=${raceRound}`,
            isAdminSample: true
          };

          const htmlContent = generatePreRaceEmailHTML(emailData);
          const textContent = generatePreRaceEmailText(emailData);

          await emailService.sendEmail({
            to: admin.email,
            subject: `[ADMIN SAMPLE] 🏁 ${race.raceName} - Race Weekend Reminder`,
            text: textContent,
            html: htmlContent
          });

          logger.log(`✅ Pre-race sample email sent to admin ${admin.display_name} (${admin.email})`);
          sent++;
        } catch (error) {
          logger.error(`Error sending pre-race sample email to admin ${admin.id}:`, error);
        }
      }

      // Log the sample send with token
      await db.prepare(`
        INSERT INTO race_email_log (season_year, round_number, email_type, ready_at)
        VALUES ($1, $2, 'pre_race', CURRENT_TIMESTAMP)
        ON CONFLICT (season_year, round_number, email_type) DO UPDATE
        SET ready_at = CURRENT_TIMESTAMP
      `).run(raceYear, raceRound);

      logger.log(`✅ Pre-race sample emails sent: ${sent} successful`);

      return { sent, token };
    } catch (error) {
      logger.error('Error sending pre-race sample emails to admins:', error);
      throw error;
    }
  }

  /**
   * Send post-race sample emails to admin users
   */
  async sendPostRaceEmailsToAdmins(raceYear: number, raceRound: number): Promise<{ sent: number; token: string }> {
    try {
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

      // Get all admin users with email
      const admins = await db.prepare(`
        SELECT id, display_name, email FROM users
        WHERE email IS NOT NULL AND is_admin = true
      `).all();

      logger.log(`📧 Sending post-race sample emails to ${admins.length} admin users for ${raceYear} Round ${raceRound}`);

      let sent = 0;

      for (const admin of admins) {
        try {
          // Get race details
          const scheduleData = await f1ApiService.fetchSchedule(raceYear);
          const races = scheduleData?.MRData?.RaceTable?.Races || [];
          const race = races.find((r: any) => r.round === raceRound.toString());

          if (!race) {
            logger.error(`Race not found: ${raceYear} Round ${raceRound}`);
            continue;
          }

          // Get next race
          const nextRace = races.find((r: any) => parseInt(r.round) === raceRound + 1);
          const nextRaceData = nextRace ? {
            name: nextRace.raceName,
            date: new Date(nextRace.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
            daysUntil: Math.ceil((new Date(nextRace.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          } : null;

          // Build minimal email data for sample
          const emailData: PostRaceEmailData = {
            displayName: admin.display_name,
            raceName: race.raceName,
            raceDate: new Date(race.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
            circuitName: race.Circuit.circuitName,
            country: race.Circuit.Location.country,
            userPoints: 0,
            topScorer: { displayName: 'N/A', points: 0 },
            leagueName: 'World League',
            roundResults: [],
            crazyPredictionsToConfirm: [],
            nextRace: nextRaceData,
            unsubscribeResultsUrl: `${FRONTEND_URL}/settings?unsubscribe=results`,
            adminReleaseUrl: `${FRONTEND_URL}/admin/release-emails?token=${token}&type=post_race&year=${raceYear}&round=${raceRound}`,
            isAdminSample: true
          };

          const htmlContent = generatePostRaceEmailHTML(emailData);
          const textContent = generatePostRaceEmailText(emailData);

          await emailService.sendEmail({
            to: admin.email,
            subject: `[ADMIN SAMPLE] 🏁 ${race.raceName} - Race Results`,
            text: textContent,
            html: htmlContent
          });

          logger.log(`✅ Post-race sample email sent to admin ${admin.display_name} (${admin.email})`);
          sent++;
        } catch (error) {
          logger.error(`Error sending post-race sample email to admin ${admin.id}:`, error);
        }
      }

      // Log the sample send with token
      await db.prepare(`
        INSERT INTO race_email_log (season_year, round_number, email_type, ready_at)
        VALUES ($1, $2, 'post_race', CURRENT_TIMESTAMP)
        ON CONFLICT (season_year, round_number, email_type) DO UPDATE
        SET ready_at = CURRENT_TIMESTAMP
      `).run(raceYear, raceRound);

      logger.log(`✅ Post-race sample emails sent: ${sent} successful`);

      return { sent, token };
    } catch (error) {
      logger.error('Error sending post-race sample emails to admins:', error);
      throw error;
    }
  }

  /**
   * Release pre-race emails to all users (called by admin via link)
   */
  async releasePreRaceEmails(raceYear: number, raceRound: number, releasedByUserId: number): Promise<{ sent: number; failed: number }> {
    try {
      logger.log(`🚀 Releasing pre-race emails for ${raceYear} Round ${raceRound} by user ${releasedByUserId}`);

      // Send to all users
      const result = await this.sendPreRaceEmailsToAll(raceYear, raceRound);

      // Update log with release info
      await db.prepare(`
        UPDATE race_email_log
        SET released_at = CURRENT_TIMESTAMP, released_by_user_id = $1
        WHERE season_year = $2 AND round_number = $3 AND email_type = 'pre_race'
      `).run(releasedByUserId, raceYear, raceRound);

      logger.log(`✅ Pre-race emails released: ${result.sent} sent, ${result.failed} failed`);

      return result;
    } catch (error) {
      logger.error('Error releasing pre-race emails:', error);
      throw error;
    }
  }

  /**
   * Release post-race emails to all users (called by admin via link)
   */
  async releasePostRaceEmails(raceYear: number, raceRound: number, releasedByUserId: number): Promise<{ sent: number; failed: number }> {
    try {
      logger.log(`🚀 Releasing post-race emails for ${raceYear} Round ${raceRound} by user ${releasedByUserId}`);

      // Send to all users
      const result = await this.sendPostRaceEmailsToAll(raceYear, raceRound);

      // Update log with release info
      await db.prepare(`
        UPDATE race_email_log
        SET released_at = CURRENT_TIMESTAMP, released_by_user_id = $1
        WHERE season_year = $2 AND round_number = $3 AND email_type = 'post_race'
      `).run(releasedByUserId, raceYear, raceRound);

      logger.log(`✅ Post-race emails released: ${result.sent} sent, ${result.failed} failed`);

      return result;
    } catch (error) {
      logger.error('Error releasing post-race emails:', error);
      throw error;
    }
  }

  /**
   * Format milliseconds into a human-readable time remaining string
   */
  private formatTimeRemaining(ms: number): string {
    if (ms < 0) return 'Deadline passed';

    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return `${days}d ${hours}h remaining`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    } else {
      return `${minutes}m remaining`;
    }
  }
}

// Export singleton instance
export const raceEmailService = new RaceEmailService();
