import cron from 'node-cron';
import { backupService } from './services/backupService';
import { raceEmailService } from './services/raceEmailService';
import { f1ApiService } from './services/f1ApiService';
import { logger } from './utils/logger';
import db from './db/database';

export const scheduler = {
    init: () => {
        logger.log('Initializing scheduler...');

        // Schedule backup to run at midnight every Sunday
        // 0 0 * * 0
        cron.schedule('0 0 * * 0', async () => {
            logger.log('Running scheduled weekly backup...');
            try {
                await backupService.createBackup();
            } catch (error) {
                logger.error('Scheduled backup failed:', error);
            }
        });

        // Schedule pre-race emails to check every Wednesday at 9 AM
        // 0 9 * * 3 (Wednesdays at 9 AM)
        cron.schedule('0 9 * * 3', async () => {
            logger.log('Checking for upcoming races to send pre-race emails...');
            try {
                const now = new Date();
                const currentYear = now.getFullYear();

                // Fetch this year's schedule
                const scheduleData = await f1ApiService.fetchSchedule(currentYear);
                const races = scheduleData?.MRData?.RaceTable?.Races || [];

                // Find races happening this weekend (within the next 4 days)
                for (const race of races) {
                    const raceDate = new Date(race.date);
                    const daysUntilRace = Math.ceil((raceDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                    // If race is happening this weekend (2-5 days from now)
                    if (daysUntilRace >= 2 && daysUntilRace <= 5) {
                        // Check if we've already sent pre-race emails
                        const emailLog = await db.prepare(`
                            SELECT id FROM race_email_log
                            WHERE season_year = $1 AND round_number = $2 AND email_type = 'pre_race'
                        `).get(currentYear, parseInt(race.round));

                        if (!emailLog) {
                            logger.log(`Found upcoming race: ${race.raceName} (Round ${race.round})`);
                            await raceEmailService.sendPreRaceEmailsToAll(currentYear, parseInt(race.round));
                        }
                    }
                }
            } catch (error) {
                logger.error('Pre-race email scheduler failed:', error);
            }
        });

        // Schedule post-race emails to check every 2 hours
        // 0 */2 * * * (Every 2 hours)
        cron.schedule('0 */2 * * *', async () => {
            logger.log('Checking for completed races to send post-race emails...');
            try {
                const now = new Date();
                const currentYear = now.getFullYear();

                // Fetch this year's schedule
                const scheduleData = await f1ApiService.fetchSchedule(currentYear);
                const races = scheduleData?.MRData?.RaceTable?.Races || [];

                // Find races that finished at least 12 hours ago and haven't had emails sent
                for (const race of races) {
                    const raceDateTime = new Date(race.date + 'T' + (race.time || '14:00:00Z'));
                    const hoursAfterRace = (now.getTime() - raceDateTime.getTime()) / (1000 * 60 * 60);

                    // Only process races that finished at least 12 hours ago
                    if (hoursAfterRace >= 12) {
                        // Check if we've already sent emails for this race
                        const emailLog = await db.prepare(`
                            SELECT id FROM race_email_log
                            WHERE season_year = $1 AND round_number = $2 AND email_type = 'post_race'
                        `).get(currentYear, parseInt(race.round));

                        if (!emailLog) {
                            logger.log(`Found completed race needing emails: ${race.raceName} (Round ${race.round})`);
                            await raceEmailService.sendPostRaceEmailsToAll(currentYear, parseInt(race.round));
                        }
                    }
                }
            } catch (error) {
                logger.error('Post-race email scheduler failed:', error);
            }
        });

        logger.log('Scheduler initialized successfully');
        logger.log('  - Weekly backups: Sundays at midnight');
        logger.log('  - Pre-race emails: Wednesdays at 9 AM');
        logger.log('  - Post-race emails: Every 2 hours (checks for completed races)');
    }
};
