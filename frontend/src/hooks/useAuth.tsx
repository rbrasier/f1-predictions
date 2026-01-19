import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import * as api from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string, inviteCode?: string) => Promise<void>;
  register: (username: string, password: string, displayName: string, inviteCode?: string) => Promise<void>;
  logout: () => void;
  loginWithToken: (token: string) => Promise<void>;
  snoozeOAuthMigration: () => Promise<void>;
  shouldShowOAuthModal: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const userData = await api.getMe();
          setUser(userData);
          setToken(storedToken);
        } catch (error) {
          console.error('Failed to fetch user:', error);
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string, inviteCode?: string) => {
    const response = await api.login(username, password, inviteCode);
    localStorage.setItem('token', response.token);
    setToken(response.token);
    setUser(response.user);
  };

  const register = async (username: string, password: string, displayName: string, inviteCode?: string) => {
    const response = await api.register(username, password, displayName, inviteCode);
    localStorage.setItem('token', response.token);
    setToken(response.token);
    setUser(response.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const loginWithToken = async (newToken: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    const userData = await api.getMe();
    setUser(userData);
  };

  const snoozeOAuthMigration = async () => {
    await api.snoozeOAuthMigration();
    // Refresh user data to get updated snooze_until
    const userData = await api.getMe();
    setUser(userData);
  };

  const shouldShowOAuthModal = (): boolean => {
    if (!user || user.google_id) {
      return false; // User not logged in or already has Google account
    }

    if (!user.oauth_snooze_until) {
      return true; // Never snoozed, show modal
    }

    const snoozeUntil = new Date(user.oauth_snooze_until);
    const now = new Date();
    return now >= snoozeUntil; // Show if snooze period has expired
  };

  const isAuthenticated = !!user && !!token;

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      isAuthenticated,
      login,
      register,
      logout,
      loginWithToken,
      snoozeOAuthMigration,
      shouldShowOAuthModal
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
