export interface User {
  id: number;
  username: string;
  password_hash: string;
  display_name: string;
  is_admin: boolean;
  created_at: string;
}

export interface TeamPrincipal {
  id: number;
  name: string;
  constructor_id: string;
  season_year: number;
}

export interface DriverTeamPairing {
  driver_api_id: string;
  constructor_api_id: string;
}

export interface SeasonPrediction {
  id: number;
  user_id: number;
  season_year: number;
  drivers_championship_order: string; // JSON array of driver API IDs
  constructors_championship_order: string; // JSON array of constructor API IDs
  mid_season_sackings: string | null; // JSON array of principal/driver API IDs
  audi_vs_cadillac: string;
  crazy_prediction: string | null;
  first_career_race_winner: string | null; // JSON array of Driver API IDs of predicted first-time race winners
  grid_2027: string; // JSON array of DriverTeamPairing
  grid_2028: string; // JSON array of DriverTeamPairing
  points_earned: number;
  submitted_at: string;
}

export interface RacePrediction {
  id: number;
  user_id: number;
  season_year: number;
  round_number: number;
  pole_position_driver_api_id: string | null;
  podium_first_driver_api_id: string | null;
  podium_second_driver_api_id: string | null;
  podium_third_driver_api_id: string | null;
  midfield_hero_driver_api_id: string | null;
  crazy_prediction: string | null;
  sprint_pole_driver_api_id: string | null;
  sprint_winner_driver_api_id: string | null;
  sprint_midfield_hero_driver_api_id: string | null;
  points_earned: number;
  submitted_at: string;
}

export interface RaceResult {
  id: number;
  season_year: number;
  round_number: number;
  pole_position_driver_api_id: string | null;
  podium_first_driver_api_id: string | null;
  podium_second_driver_api_id: string | null;
  podium_third_driver_api_id: string | null;
  midfield_hero_driver_api_id: string | null;
  sprint_pole_driver_api_id: string | null;
  sprint_winner_driver_api_id: string | null;
  sprint_midfield_hero_driver_api_id: string | null;
  entered_at: string;
}

export interface SeasonResult {
  id: number;
  season_year: number;
  drivers_championship_order: string; // JSON array of driver API IDs
  constructors_championship_order: string; // JSON array of constructor API IDs
  mid_season_sackings: string | null;
  audi_vs_cadillac_winner: string;
  first_career_race_winner: string | null; // JSON array of Driver API IDs of actual first-time race winners
  actual_grid_2027: string | null;
  actual_grid_2028: string | null;
  entered_at: string;
}

export interface CrazyPredictionValidation {
  id: number;
  prediction_type: 'season' | 'race';
  prediction_id: number;
  validator_user_id: number;
  is_validated: boolean;
  validated_at: string;
}

export interface CrazyPredictionOutcome {
  id: number;
  prediction_type: 'season' | 'race';
  prediction_id: number;
  actually_happened: boolean;
  marked_at: string;
}

// Request/Response types
export interface RegisterRequest {
  username: string;
  password: string;
  display_name: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: number;
    username: string;
    display_name: string;
    is_admin: boolean;
  };
  token: string;
}

export interface SeasonPredictionRequest {
  drivers_championship_order: string[]; // Array of driver API IDs
  constructors_championship_order: string[]; // Array of constructor API IDs
  mid_season_sackings: string[]; // Array of principal/driver API IDs
  audi_vs_cadillac: 'audi' | 'cadillac';
  crazy_prediction: string;
  first_career_race_winner: string[]; // Array of Driver API IDs of predicted first-time race winners
  grid_2027: DriverTeamPairing[];
  grid_2028: DriverTeamPairing[];
}

export interface RacePredictionRequest {
  pole_position_driver_api_id: string;
  podium_first_driver_api_id: string;
  podium_second_driver_api_id: string;
  podium_third_driver_api_id: string;
  midfield_hero_driver_api_id: string;
  crazy_prediction: string;
  sprint_pole_driver_api_id?: string;
  sprint_winner_driver_api_id?: string;
  sprint_midfield_hero_driver_api_id?: string;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: number;
  display_name: string;
  total_points: number;
  season_points: number;
  race_points: number;
}
