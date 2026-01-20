import cron from 'node-cron';
import { backupService } from './services/backupService';
import { raceEmailService } from './services/raceEmailService';
import { f1ApiService } from './services/f1ApiService';
import { logger } from './utils/logger';

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
                        logger.log(`Found upcoming race: ${race.raceName} (Round ${race.round})`);
                        await raceEmailService.sendPreRaceEmailsToAll(currentYear, parseInt(race.round));
                    }
                }
            } catch (error) {
                logger.error('Pre-race email scheduler failed:', error);
            }
        });

        // Schedule post-race emails to check every day at 6 AM
        // 0 6 * * * (Every day at 6 AM)
        cron.schedule('0 6 * * *', async () => {
            logger.log('Checking for completed races to send post-race emails...');
            try {
                const now = new Date();
                const currentYear = now.getFullYear();

                // Fetch this year's schedule
                const scheduleData = await f1ApiService.fetchSchedule(currentYear);
                const races = scheduleData?.MRData?.RaceTable?.Races || [];

                // Find races that finished 10-14 hours ago (to send email ~12 hours after)
                for (const race of races) {
                    const raceDateTime = new Date(race.date + 'T' + (race.time || '14:00:00Z'));
                    const hoursAfterRace = (now.getTime() - raceDateTime.getTime()) / (1000 * 60 * 60);

                    // If race finished between 10-14 hours ago, send post-race emails
                    if (hoursAfterRace >= 10 && hoursAfterRace <= 14) {
                        logger.log(`Found completed race: ${race.raceName} (Round ${race.round})`);
                        await raceEmailService.sendPostRaceEmailsToAll(currentYear, parseInt(race.round));
                    }
                }
            } catch (error) {
                logger.error('Post-race email scheduler failed:', error);
            }
        });

        logger.log('Scheduler initialized successfully');
        logger.log('  - Weekly backups: Sundays at midnight');
        logger.log('  - Pre-race emails: Wednesdays at 9 AM');
        logger.log('  - Post-race emails: Daily at 6 AM (checks for completed races)');
    }
};
