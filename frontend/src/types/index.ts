export interface User {
  id: number;
  username: string;
  display_name: string;
  is_admin: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
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
  mid_season_sackings: string | null;
  audi_vs_cadillac: string;
  crazy_prediction: string | null;
  first_career_race_winner: string | null; // Driver API ID of predicted first-time race winner
  grid_2027: string; // JSON array of DriverTeamPairing
  grid_2028: string; // JSON array of DriverTeamPairing
  points_earned: number;
  submitted_at: string;
  display_name?: string;
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
  display_name?: string;
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

export interface CrazyPredictionValidation {
  id: number;
  prediction_type: 'season' | 'race';
  prediction_id: number;
  validator_user_id: number;
  is_validated: boolean;
  validated_at: string;
  display_name?: string;
}

export interface PendingValidation {
  id: number;
  user_id: number;
  display_name: string;
  crazy_prediction: string;
  prediction_type: 'season' | 'race';
  year?: number;
  season_year?: number;
  round_number?: number;
  already_validated: number;
}

// F1 API Types
export interface F1Driver {
  driverId: string;
  givenName: string;
  familyName: string;
  code?: string;
  permanentNumber?: string;
  nationality: string;
  url: string;
  dateOfBirth?: string;
}

export interface F1DriverStanding {
  position: string;
  positionText: string;
  points: string;
  wins: string;
  Driver: F1Driver;
  Constructors: F1Constructor[];
  is_top_four_team?: boolean; // Added by backend
}

export interface F1Constructor {
  constructorId: string;
  name: string;
  nationality: string;
  url: string;
  is_top_four?: boolean; // Added by backend based on season config
}

export interface F1Race {
  season: string;
  round: string;
  raceName: string;
  Circuit: {
    circuitId: string;
    circuitName: string;
    Location: {
      lat: string;
      long: string;
      locality: string;
      country: string;
    };
  };
  date: string;
  time?: string;
  FirstPractice?: {
    date: string;
    time: string;
  };
  SecondPractice?: {
    date: string;
    time: string;
  };
  ThirdPractice?: {
    date: string;
    time: string;
  };
  Qualifying?: {
    date: string;
    time: string;
  };
  Sprint?: {
    date: string;
    time: string;
  };
  SprintQualifying?: {
    date: string;
    time: string;
  };
}

// Season configuration type (from backend API)
export interface Season {
  year: number;
  prediction_deadline: string;
  is_active: boolean;
  race_winners?: string[];
}

// League types
export interface League {
  id: number;
  name: string;
  invite_code: string;
  is_world_league: boolean;
  created_by_user_id: number | null;
  created_at: string;
  is_default?: boolean;
  joined_at?: string;
  member_count?: number;
}

export interface CreateLeagueRequest {
  name: string;
}

export interface JoinLeagueRequest {
  invite_code: string;
}

export interface LeagueUser {
  id: number;
  username: string;
  display_name: string;
  joined_at: string;
}

// Carousel types
export interface CarouselSlide {
  id: number;
  component: React.ReactNode;
  title: string;
  description: string;
}

export interface CarouselConfig {
  autoPlayInterval: number;
  pauseOnInteraction: boolean;
  transitionDuration: number;
}

// Convenience aliases for API types
export type Driver = F1Driver;
export type Team = F1Constructor;
export type Race = F1Race;
export type DriverStanding = F1DriverStanding;
