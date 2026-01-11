import axios from 'axios';
import type {
  AuthResponse,
  User,
  Driver,
  Team,
  TeamPrincipal,
  Season,
  Race,
  SeasonPrediction,
  SeasonPredictionRequest,
  RacePrediction,
  RacePredictionRequest,
  LeaderboardEntry,
  PendingValidation,
  CrazyPredictionValidation
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const register = async (username: string, password: string, display_name: string): Promise<AuthResponse> => {
  const { data } = await api.post('/auth/register', { username, password, display_name });
  return data;
};

export const login = async (username: string, password: string): Promise<AuthResponse> => {
  const { data } = await api.post('/auth/login', { username, password });
  return data;
};

export const getMe = async (): Promise<User> => {
  const { data } = await api.get('/auth/me');
  return data;
};

export const getAllUsers = async (): Promise<User[]> => {
  const { data } = await api.get('/auth/users');
  return data;
};

// Reference Data
export const getDrivers = async (): Promise<Driver[]> => {
  const { data } = await api.get('/drivers');
  return data;
};

export const getTeams = async (): Promise<Team[]> => {
  const { data } = await api.get('/teams');
  return data;
};

export const getTeamPrincipals = async (): Promise<TeamPrincipal[]> => {
  const { data } = await api.get('/team-principals');
  return data;
};

export const getSeasons = async (): Promise<Season[]> => {
  const { data } = await api.get('/seasons');
  return data;
};

export const getActiveSeason = async (): Promise<Season> => {
  const { data } = await api.get('/seasons/active');
  return data;
};

// Races
export const getRaces = async (seasonId?: number): Promise<Race[]> => {
  const { data } = await api.get('/races', { params: { seasonId } });
  return data;
};

export const getRace = async (raceId: number): Promise<Race> => {
  const { data } = await api.get(`/races/${raceId}`);
  return data;
};

export const getNextRace = async (): Promise<Race> => {
  const { data } = await api.get('/races/next');
  return data;
};

// Season Predictions
export const submitSeasonPrediction = async (seasonId: number, prediction: SeasonPredictionRequest): Promise<SeasonPrediction> => {
  const { data } = await api.post(`/seasons/${seasonId}/predictions`, prediction);
  return data;
};

export const getMySeasonPrediction = async (seasonId: number): Promise<SeasonPrediction> => {
  const { data } = await api.get(`/seasons/${seasonId}/predictions/me`);
  return data;
};

export const getAllSeasonPredictions = async (seasonId: number): Promise<SeasonPrediction[]> => {
  const { data } = await api.get(`/seasons/${seasonId}/predictions`);
  return data;
};

// Race Predictions
export const submitRacePrediction = async (raceId: number, prediction: RacePredictionRequest): Promise<RacePrediction> => {
  const { data } = await api.post(`/races/${raceId}/predictions`, prediction);
  return data;
};

export const getMyRacePrediction = async (raceId: number): Promise<RacePrediction> => {
  const { data } = await api.get(`/races/${raceId}/predictions/me`);
  return data;
};

export const getAllRacePredictions = async (raceId: number): Promise<RacePrediction[]> => {
  const { data } = await api.get(`/races/${raceId}/predictions`);
  return data;
};

// Crazy Predictions
export const validateCrazyPrediction = async (
  prediction_type: 'season' | 'race',
  prediction_id: number,
  is_validated: boolean
): Promise<CrazyPredictionValidation> => {
  const { data } = await api.post('/crazy-predictions/validate', {
    prediction_type,
    prediction_id,
    is_validated
  });
  return data;
};

export const getPendingValidations = async (): Promise<PendingValidation[]> => {
  const { data } = await api.get('/crazy-predictions/pending');
  return data;
};

export const getValidationsForPrediction = async (
  predictionType: 'season' | 'race',
  predictionId: number
): Promise<CrazyPredictionValidation[]> => {
  const { data } = await api.get(`/crazy-predictions/${predictionType}/${predictionId}/validations`);
  return data;
};

// Leaderboard
export const getLeaderboard = async (seasonId?: number): Promise<LeaderboardEntry[]> => {
  const { data } = await api.get('/leaderboard', { params: { seasonId } });
  return data;
};

export const getUserBreakdown = async (userId: number, seasonId?: number): Promise<any> => {
  const { data } = await api.get(`/leaderboard/${userId}`, { params: { seasonId } });
  return data;
};

export const exportLeaderboard = async (seasonId?: number): Promise<Blob> => {
  const { data } = await api.get('/leaderboard/export', {
    params: { seasonId },
    responseType: 'blob'
  });
  return data;
};

// Admin - Race Results
export const enterRaceResults = async (raceId: number, results: any): Promise<any> => {
  const { data } = await api.post(`/admin/races/${raceId}/results`, results);
  return data;
};

export const getRaceResults = async (raceId: number): Promise<any> => {
  const { data } = await api.get(`/admin/races/${raceId}/results`);
  return data;
};

// Admin - Season Results
export const enterSeasonResults = async (seasonId: number, results: any): Promise<any> => {
  const { data } = await api.post(`/admin/seasons/${seasonId}/results`, results);
  return data;
};

export const getSeasonResults = async (seasonId: number): Promise<any> => {
  const { data } = await api.get(`/admin/seasons/${seasonId}/results`);
  return data;
};

// Admin - Recalculate Scores
export const recalculateAllScores = async (): Promise<any> => {
  const { data } = await api.post('/admin/recalculate-scores');
  return data;
};

// Admin - F1 API Data Management
export const refreshSeasonData = async (year: number): Promise<any> => {
  const { data } = await api.get(`/admin/f1-data/refresh/${year}`);
  return data;
};

export const refreshRaceResults = async (year: number, round: number): Promise<any> => {
  const { data } = await api.get(`/admin/f1-data/refresh/${year}/${round}`);
  return data;
};

export const getCacheStatus = async (): Promise<any> => {
  const { data } = await api.get('/admin/f1-data/cache-status');
  return data;
};

export const clearSeasonCache = async (year: number): Promise<any> => {
  const { data } = await api.delete(`/admin/f1-data/cache/${year}`);
  return data;
};

export const clearAllCache = async (): Promise<any> => {
  const { data } = await api.delete('/admin/f1-data/cache');
  return data;
};

// Admin - F1 Data Import (auto-populate from API)
export const importRaceResults = async (year: number, round: number): Promise<any> => {
  const { data } = await api.post(`/admin/f1-data/import-race/${year}/${round}`);
  return data;
};

export const importSeasonStandings = async (year: number): Promise<any> => {
  const { data } = await api.post(`/admin/f1-data/import-standings/${year}`);
  return data;
};

export const bulkImportSeason = async (year: number): Promise<any> => {
  const { data } = await api.post(`/admin/f1-data/import-season/${year}`);
  return data;
};

export default api;
