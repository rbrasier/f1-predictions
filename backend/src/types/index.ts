export interface User {
  id: number;
  username: string;
  password_hash: string;
  display_name: string;
  is_admin: boolean;
  created_at: string;
}

export interface Season {
  id: number;
  year: number;
  prediction_deadline: string;
  is_active: boolean;
}

export interface Driver {
  id: number;
  name: string;
  team_id: number | null;
  is_active: boolean;
}

export interface Team {
  id: number;
  name: string;
  is_top_four: boolean;
  is_active: boolean;
}

export interface TeamPrincipal {
  id: number;
  name: string;
  team_id: number | null;
  is_active: boolean;
}

export interface DriverTeamPairing {
  driver_id: number;
  team_id: number;
}

export interface SeasonPrediction {
  id: number;
  user_id: number;
  season_id: number;
  drivers_championship_order: string; // JSON array of driver IDs
  constructors_championship_order: string; // JSON array of team IDs
  mid_season_sackings: string | null; // JSON array of driver/principal IDs
  audi_vs_cadillac: string;
  crazy_prediction: string | null;
  grid_2027: string; // JSON array of DriverTeamPairing
  grid_2028: string; // JSON array of DriverTeamPairing
  points_earned: number;
  submitted_at: string;
}

export interface Race {
  id: number;
  season_id: number;
  name: string;
  round_number: number;
  fp1_start: string;
  race_date: string;
  is_sprint_weekend: boolean;
  location: string;
}

export interface RacePrediction {
  id: number;
  user_id: number;
  race_id: number;
  pole_position_driver_id: number | null;
  podium_first_driver_id: number | null;
  podium_second_driver_id: number | null;
  podium_third_driver_id: number | null;
  midfield_hero_driver_id: number | null;
  crazy_prediction: string | null;
  sprint_pole_driver_id: number | null;
  sprint_winner_driver_id: number | null;
  sprint_midfield_hero_driver_id: number | null;
  points_earned: number;
  submitted_at: string;
}

export interface RaceResult {
  id: number;
  race_id: number;
  pole_position_driver_id: number | null;
  podium_first_driver_id: number | null;
  podium_second_driver_id: number | null;
  podium_third_driver_id: number | null;
  midfield_hero_driver_id: number | null;
  sprint_pole_driver_id: number | null;
  sprint_winner_driver_id: number | null;
  sprint_midfield_hero_driver_id: number | null;
  entered_at: string;
}

export interface SeasonResult {
  id: number;
  season_id: number;
  drivers_championship_order: string;
  constructors_championship_order: string;
  mid_season_sackings: string | null;
  audi_vs_cadillac_winner: string;
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
  drivers_championship_order: number[];
  constructors_championship_order: number[];
  mid_season_sackings: number[];
  audi_vs_cadillac: 'audi' | 'cadillac';
  crazy_prediction: string;
  grid_2027: DriverTeamPairing[];
  grid_2028: DriverTeamPairing[];
}

export interface RacePredictionRequest {
  pole_position_driver_id: number;
  podium_first_driver_id: number;
  podium_second_driver_id: number;
  podium_third_driver_id: number;
  midfield_hero_driver_id: number;
  crazy_prediction: string;
  sprint_pole_driver_id?: number;
  sprint_winner_driver_id?: number;
  sprint_midfield_hero_driver_id?: number;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: number;
  display_name: string;
  total_points: number;
  season_points: number;
  race_points: number;
}
