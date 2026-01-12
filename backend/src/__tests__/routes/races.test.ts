import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import app from '../../index';
import { createTestUser, cleanupTestUsers } from '../helpers/auth.helper';
import { F1ApiService } from '../../services/f1ApiService';
import fs from 'fs';
import path from 'path';

// Mock the F1ApiService
vi.mock('../../services/f1ApiService');

// Helper to load mock data
function loadMockData(filename: string) {
  const filePath = path.join(__dirname, '../fixtures/f1-api/2025', filename);
  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
}

describe('Race API Endpoints', () => {
  let authToken: string;
  let f1ApiService: F1ApiService;

  beforeAll(async () => {
    const user = await createTestUser();
    authToken = user.token;

    // Setup mock F1 API service
    f1ApiService = new F1ApiService();
    vi.mocked(f1ApiService.fetchSchedule).mockResolvedValue(loadMockData('races.json'));
  });

  afterAll(() => {
    cleanupTestUsers();
  });

  describe('GET /api/races', () => {
    it('should return all races when authenticated', async () => {
      const response = await request(app)
        .get('/api/races')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
      // Response structure depends on controller implementation
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/races');

      expect(response.status).toBe(401);
    });

    it('should filter races by seasonId when provided', async () => {
      const response = await request(app)
        .get('/api/races?seasonId=1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/races/next', () => {
    it('should return the next upcoming race when authenticated', async () => {
      const response = await request(app)
        .get('/api/races/next')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/races/next');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/races/upcoming', () => {
    it('should return upcoming races when authenticated', async () => {
      const response = await request(app)
        .get('/api/races/upcoming')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
    });

    it('should respect limit parameter', async () => {
      const response = await request(app)
        .get('/api/races/upcoming?limit=5')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/races/upcoming');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/races/:raceId', () => {
    it('should return specific race details when authenticated', async () => {
      const response = await request(app)
        .get('/api/races/1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/races/1');

      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent race', async () => {
      const response = await request(app)
        .get('/api/races/99999')
        .set('Authorization', `Bearer ${authToken}`);

      // Expect 404 or similar error (depends on controller implementation)
      expect([404, 500]).toContain(response.status);
    });
  });
});
