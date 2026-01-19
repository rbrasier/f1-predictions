import axios from 'axios';
import type {
  AuthResponse,
  User,
  Driver,
  DriverStanding,
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
  CrazyPredictionValidation,
  League,
  LeagueUser
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Public API instance (no auth required)
const publicApi = axios.create({
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
export const register = async (username: string, email: string, password: string, display_name: string, invite_code?: string): Promise<AuthResponse> => {
  const { data} = await api.post('/auth/register', { username, email, password, display_name, invite_code });
  return data;
};

export const login = async (username: string, password: string, invite_code?: string): Promise<AuthResponse> => {
  const { data } = await api.post('/auth/login', { username, password, invite_code });
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

export const grantAdminAccess = async (userId: number): Promise<any> => {
  const { data } = await api.post(`/auth/users/${userId}/grant-admin`);
  return data;
};

export const snoozeOAuthMigration = async (): Promise<{ message: string; snooze_until: string }> => {
  const { data } = await api.post('/auth/oauth/snooze');
  return data;
};

export const updateDisplayName = async (displayName: string): Promise<{ message: string; user: User }> => {
  const { data } = await api.post('/auth/update-display-name', { display_name: displayName });
  return data;
};

export const saveEmail = async (email: string): Promise<{ message: string; user: User }> => {
  const { data } = await api.post('/auth/save-email', { email });
  return data;
};

export const snoozeEmailReminder = async (): Promise<{ message: string; email_reminder_snooze_until: string }> => {
  const { data } = await api.post('/auth/email-reminder/snooze');
  return data;
};

// Reference Data
export const getDrivers = async (year?: number): Promise<Driver[]> => {
  const params = year ? { year } : {};
  const { data } = await api.get('/drivers', { params });
  return data;
};

export const getDriverStandings = async (year?: number): Promise<DriverStanding[]> => {
  const params = year ? { year } : {};
  const { data } = await api.get('/driver-standings', { params });
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

export const getRace = async (raceId: string): Promise<Race> => {
  const { data } = await api.get(`/races/${raceId}`);
  return data;
};

export const getNextRace = async (): Promise<Race> => {
  const { data } = await api.get('/races/next');
  return data;
};

export const getUpcomingRaces = async (limit?: number): Promise<Race[]> => {
  const params = limit ? { limit: limit.toString() } : {};
  const { data } = await api.get('/races/upcoming', { params });
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

export const getAllSeasonPredictions = async (seasonId: number, leagueId?: number): Promise<SeasonPrediction[]> => {
  const params = leagueId ? { leagueId } : {};
  const { data } = await api.get(`/seasons/${seasonId}/predictions`, { params });
  return data;
};

// Race Predictions
export const submitRacePrediction = async (raceId: string, prediction: RacePredictionRequest): Promise<RacePrediction> => {
  const { data } = await api.post(`/races/${raceId}/predictions`, prediction);
  return data;
};

export const getMyRacePrediction = async (raceId: string): Promise<RacePrediction> => {
  const { data } = await api.get(`/races/${raceId}/predictions/me`);
  return data;
};

export const getAllRacePredictions = async (raceId: string, limit?: number, leagueId?: number): Promise<RacePrediction[]> => {
  const params: any = {};
  if (limit) params.limit = limit.toString();
  if (leagueId) params.leagueId = leagueId;
  const { data } = await api.get(`/races/${raceId}/predictions`, { params });
  return data;
};

export const getLastRoundResults = async (seasonYear: number, leagueId?: number): Promise<any> => {
  const params = leagueId ? { leagueId } : {};
  const { data } = await api.get(`/races/last-round/${seasonYear}`, { params });
  return data;
};

export const getLastSeasonResults = async (seasonYear: number, leagueId?: number): Promise<any> => {
  const params = leagueId ? { leagueId } : {};
  const { data } = await api.get(`/seasons/season-results/${seasonYear}`, { params });
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

export const getPendingValidations = async (leagueId?: number): Promise<PendingValidation[]> => {
  const params = leagueId ? { leagueId } : {};
  const { data } = await api.get('/crazy-predictions/pending', { params });
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
export const getLeaderboard = async (seasonId?: number, limit?: number, leagueId?: number): Promise<LeaderboardEntry[]> => {
  const params: any = {};
  if (seasonId) params.seasonYear = seasonId;
  if (limit) params.limit = limit;
  if (leagueId) params.leagueId = leagueId;
  const { data } = await api.get('/leaderboard', { params });
  return data;
};

export const getUserBreakdown = async (userId: number, seasonId?: number): Promise<any> => {
  const { data } = await api.get(`/leaderboard/${userId}`, { params: { seasonYear: seasonId } });
  return data;
};

export const exportLeaderboard = async (seasonId?: number, leagueId?: number): Promise<Blob> => {
  const params: any = {};
  if (seasonId) params.seasonYear = seasonId;
  if (leagueId) params.leagueId = leagueId;
  const { data } = await api.get('/leaderboard/export', {
    params,
    responseType: 'blob'
  });
  return data;
};

// Admin - Race Results
export const enterRaceResults = async (year: number, round: number, results: any): Promise<any> => {
  const { data } = await api.post(`/admin/races/${year}/${round}/results`, results);
  return data;
};

export const getRaceResults = async (year: number, round: number): Promise<any> => {
  const { data } = await api.get(`/admin/races/${year}/${round}/results`);
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

// Backups
export const getBackups = async (): Promise<any[]> => {
  const { data } = await api.get('/admin/backups');
  return data;
};

export const downloadBackup = async (id: number): Promise<void> => {
  const response = await api.get(`/admin/backups/${id}/download`, {
    responseType: 'blob'
  });

  // Create download link
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;

  // Extract filename from header if possible, or generate one
  const date = new Date().toISOString().split('T')[0];
  const contentDisposition = response.headers['content-disposition'];
  let filename = `f1-tips-backup-${date}.json`;

  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
    if (filenameMatch && filenameMatch.length === 2) {
      filename = filenameMatch[1];
    }
  }

  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.parentNode?.removeChild(link);
};

export const triggerBackup = async (): Promise<any> => {
  const { data } = await api.post('/admin/backups/trigger');
  return data;
};

// Leagues
export const createLeague = async (name: string): Promise<League> => {
  const { data } = await api.post('/leagues', { name });
  return data;
};

export const getUserLeagues = async (): Promise<League[]> => {
  const { data} = await api.get('/leagues');
  return data;
};

export const getDefaultLeague = async (): Promise<League> => {
  const { data } = await api.get('/leagues/default');
  return data;
};

export const joinLeague = async (invite_code: string): Promise<any> => {
  const { data } = await api.post('/leagues/join', { invite_code });
  return data;
};

export const joinWorldLeague = async (): Promise<any> => {
  const { data } = await api.post('/leagues/world/join');
  return data;
};

export const setDefaultLeague = async (leagueId: number): Promise<any> => {
  const { data } = await api.put(`/leagues/${leagueId}/set-default`);
  return data;
};

export const getLeagueUsers = async (leagueId: number): Promise<LeagueUser[]> => {
  const { data } = await api.get(`/leagues/${leagueId}/users`);
  return data;
};

export const leaveLeague = async (leagueId: number): Promise<any> => {
  const { data } = await api.delete(`/leagues/${leagueId}/leave`);
  return data;
};

export const getLeagueByInviteCode = async (invite_code: string): Promise<League & { member_count: number }> => {
  const { data } = await api.get(`/leagues/invite/${invite_code}`);
  return data;
};

// Public endpoints (no authentication required)
export const getActiveSeasonPublic = async (): Promise<Season> => {
  const { data } = await publicApi.get('/public/seasons/active');
  return data;
};

export const getUpcomingRacesPublic = async (limit?: number): Promise<Race[]> => {
  const params = limit ? { limit: limit.toString() } : {};
  const { data } = await publicApi.get('/public/races/upcoming', { params });
  return data;
};

export default api;
