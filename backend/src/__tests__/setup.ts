import { beforeAll, afterAll, afterEach } from 'vitest';
import { initializeDatabase } from '../db/database';

// Setup and teardown for tests
beforeAll(async () => {
  // Ensure database is initialized with all tables
  await initializeDatabase();
  console.log('Test setup: Database initialized');
});

afterEach(() => {
  // Clean up test data between tests
  // Note: We're not clearing cache here to avoid errors
});

afterAll(() => {
  // Cleanup
  console.log('Test teardown complete');
});
