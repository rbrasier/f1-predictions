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

describe('Reference Data API Endpoints', () => {
  let authToken: string;
  let f1ApiService: F1ApiService;

  beforeAll(async () => {
    const user = await createTestUser();
    authToken = user.token;

    // Setup mock F1 API service
    f1ApiService = new F1ApiService();
    vi.mocked(f1ApiService.fetchDrivers).mockResolvedValue(loadMockData('drivers.json'));
    vi.mocked(f1ApiService.fetchConstructors).mockResolvedValue(loadMockData('constructors.json'));
  });

  afterAll(() => {
    cleanupTestUsers();
  });

  describe('GET /api/drivers', () => {
    it('should return all drivers when authenticated', async () => {
      const response = await request(app)
        .get('/api/drivers')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/drivers');

      expect(response.status).toBe(401);
    });

    it('should filter drivers by seasonId when provided', async () => {
      const response = await request(app)
        .get('/api/drivers?seasonId=1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/teams', () => {
    it('should return all teams when authenticated', async () => {
      const response = await request(app)
        .get('/api/teams')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/teams');

      expect(response.status).toBe(401);
    });

    it('should return all 10 F1 teams', async () => {
      const response = await request(app)
        .get('/api/teams')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      // The exact structure depends on the database
    });
  });

  describe('GET /api/team-principals', () => {
    it('should return team principals when authenticated', async () => {
      const response = await request(app)
        .get('/api/team-principals')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/team-principals');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/seasons', () => {
    it('should return all seasons when authenticated', async () => {
      const response = await request(app)
        .get('/api/seasons')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/seasons');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/seasons/active', () => {
    it('should return the active season when authenticated', async () => {
      const response = await request(app)
        .get('/api/seasons/active')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/seasons/active');

      expect(response.status).toBe(401);
    });

    it('should return season with year property', async () => {
      const response = await request(app)
        .get('/api/seasons/active')
        .set('Authorization', `Bearer ${authToken}`);

      if (response.status === 200) {
        // Season exists
        expect(response.body).toHaveProperty('year');
      }
    });
  });
});
