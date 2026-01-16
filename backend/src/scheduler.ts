import cron from 'node-cron';
import { backupService } from './services/backupService';
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

        logger.log('Scheduler initialized successfully');
    }
};
