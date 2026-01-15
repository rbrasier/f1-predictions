import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { League } from '../types';
import * as api from '../services/api';
import { useAuth } from '../hooks/useAuth';

interface LeagueContextType {
  leagues: League[];
  defaultLeague: League | null;
  loading: boolean;
  refreshLeagues: () => Promise<void>;
  setDefaultLeague: (leagueId: number) => Promise<void>;
  createLeague: (name: string) => Promise<League>;
  joinLeague: (inviteCode: string) => Promise<void>;
  joinWorldLeague: () => Promise<void>;
  leaveLeague: (leagueId: number) => Promise<void>;
}

const LeagueContext = createContext<LeagueContextType | undefined>(undefined);

export const LeagueProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [defaultLeague, setDefaultLeagueState] = useState<League | null>(null);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  const refreshLeagues = async () => {
    if (!isAuthenticated) {
      setLeagues([]);
      setDefaultLeagueState(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const userLeagues = await api.getUserLeagues();
      setLeagues(userLeagues);

      const defaultLg = userLeagues.find(l => l.is_default) || userLeagues[0] || null;
      setDefaultLeagueState(defaultLg);
    } catch (error) {
      console.error('Error fetching leagues:', error);
    } finally {
      setLoading(false);
    }
  };

  const setDefaultLeague = async (leagueId: number) => {
    try {
      await api.setDefaultLeague(leagueId);
      await refreshLeagues();
    } catch (error) {
      console.error('Error setting default league:', error);
      throw error;
    }
  };

  const createLeague = async (name: string): Promise<League> => {
    try {
      const league = await api.createLeague(name);
      await refreshLeagues();
      return league;
    } catch (error) {
      console.error('Error creating league:', error);
      throw error;
    }
  };

  const joinLeague = async (inviteCode: string) => {
    try {
      await api.joinLeague(inviteCode);
      await refreshLeagues();
    } catch (error) {
      console.error('Error joining league:', error);
      throw error;
    }
  };

  const joinWorldLeague = async () => {
    try {
      await api.joinWorldLeague();
      await refreshLeagues();
    } catch (error) {
      console.error('Error joining world league:', error);
      throw error;
    }
  };

  const leaveLeague = async (leagueId: number) => {
    try {
      await api.leaveLeague(leagueId);
      await refreshLeagues();
    } catch (error) {
      console.error('Error leaving league:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshLeagues();
    } else {
      setLeagues([]);
      setDefaultLeagueState(null);
      setLoading(false);
    }
  }, [isAuthenticated]);

  return (
    <LeagueContext.Provider
      value={{
        leagues,
        defaultLeague,
        loading,
        refreshLeagues,
        setDefaultLeague,
        createLeague,
        joinLeague,
        joinWorldLeague,
        leaveLeague
      }}
    >
      {children}
    </LeagueContext.Provider>
  );
};

export const useLeague = () => {
  const context = useContext(LeagueContext);
  if (!context) {
    throw new Error('useLeague must be used within LeagueProvider');
  }
  return context;
};
