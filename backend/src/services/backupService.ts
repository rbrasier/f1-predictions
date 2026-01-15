import db from '../db/database';

export interface Backup {
    id: number;
    backup_date: Date;
    data_json: string;
    created_at: Date;
}

export const backupService = {
    async createBackup() {
        console.log('Starting backup process...');
        try {
            // Fetch all data
            const users = await db.prepare('SELECT * FROM users').all();
            const seasonPredictions = await db.prepare('SELECT * FROM season_predictions').all();
            const racePredictions = await db.prepare('SELECT * FROM race_predictions').all();
            const leagues = await db.prepare('SELECT * FROM leagues').all();
            const userLeagues = await db.prepare('SELECT * FROM user_leagues').all();

            const backupData = {
                timestamp: new Date().toISOString(),
                users,
                season_predictions: seasonPredictions,
                race_predictions: racePredictions,
                leagues,
                user_leagues: userLeagues
            };

            const jsonString = JSON.stringify(backupData);

            await db.prepare(`
        INSERT INTO backups (backup_date, data_json)
        VALUES (CURRENT_TIMESTAMP, $1)
      `).run(jsonString);

            console.log('Backup created successfully');
            return true;
        } catch (error) {
            console.error('Backup failed:', error);
            throw error;
        }
    },

    async getBackups() {
        // Select everything EXCEPT the heavy data_json
        return await db.prepare(`
      SELECT id, backup_date, created_at 
      FROM backups 
      ORDER BY backup_date DESC
    `).all();
    },

    async getBackupById(id: number) {
        return await db.prepare(`
      SELECT * FROM backups WHERE id = $1
    `).get(id) as Backup | undefined;
    }
};
