import cron from 'node-cron';
import { backupService } from './services/backupService';

export const scheduler = {
    init: () => {
        console.log('Initializing scheduler...');

        // Schedule backup to run at midnight every Sunday
        // 0 0 * * 0
        cron.schedule('0 0 * * 0', async () => {
            console.log('Running scheduled weekly backup...');
            try {
                await backupService.createBackup();
            } catch (error) {
                console.error('Scheduled backup failed:', error);
            }
        });

        console.log('Scheduler initialized successfully');
    }
};
