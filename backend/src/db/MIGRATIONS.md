# Database Migrations

This project uses a custom migration system that automatically runs on server startup.

## How It Works

1. **Automatic Execution**: Migrations run automatically when the server starts via `initializeDatabase()`
2. **Tracking**: A `migrations` table tracks which migrations have been applied
3. **Sequential**: Migrations are run in alphabetical order by filename
4. **Idempotent**: Already-applied migrations are skipped

## Migration Files

Migrations are stored in `backend/src/db/migrations/` and follow this naming convention:

```
001_migration_name.ts
002_another_migration.ts
003_yet_another.ts
```

Each migration file must export:

```typescript
export const name = 'Human readable migration name';

export function up(db: any) {
  // Migration logic here
  db.prepare(`
    CREATE TABLE IF NOT EXISTS example (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    )
  `).run();

  console.log('  Migration completed');
}
```

## Creating a New Migration

1. Create a new file in `backend/src/db/migrations/` with the next sequential number:
   ```
   backend/src/db/migrations/003_add_new_feature.ts
   ```

2. Export `name` and `up` function:
   ```typescript
   export const name = 'Add new feature table';

   export function up(db: any) {
     db.prepare(`
       CREATE TABLE IF NOT EXISTS new_feature (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         data TEXT
       )
     `).run();
   }
   ```

3. Restart the server - the migration will run automatically

## Updating Grid Data

Grid data (teams, drivers, team principals) is stored in `backend/src/db/grid-data.json` and loaded by migration `002_seed_initial_data.ts`.

To add a new season:

1. Edit `grid-data.json` and add the new year:
   ```json
   "2028": {
     "season_start": "2028-03-12",
     "prediction_deadline": "2028-02-14T00:00:00Z",
     "is_active": false,
     "teams": [...],
     "replacements": []
   }
   ```

2. The data will be automatically loaded on next server restart

## No Manual Seeding Required

Unlike traditional approaches, you **do not** need to:
- Delete the database manually
- Run a separate seed script
- Worry about duplicate data

The migrations system handles all of this automatically on server startup.

## Restart Script

The `restart.sh` script will:
1. Kill processes on port 4001
2. Build the project
3. Start the server (which runs migrations automatically)

```bash
./restart.sh
```

## Production Deployment

Migrations will run automatically when your app starts on Railway or any other platform. No additional configuration needed.
