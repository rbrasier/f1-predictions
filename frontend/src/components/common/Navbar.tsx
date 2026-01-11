import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useState, useEffect } from 'react';
import { getPendingValidations } from '../../services/api';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const pending = await getPendingValidations();
        const notValidatedCount = pending.filter(p => p.already_validated === 0).length;
        setPendingCount(notValidatedCount);
      } catch (error) {
        console.error('Failed to fetch pending validations:', error);
      }
    };

    if (user) {
      fetchPending();
      // Refresh every minute
      const interval = setInterval(fetchPending, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  return (
    <nav className="bg-paddock-dark border-b border-paddock-lightgray">
      <div className="container mx-auto px-6">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition">
            <div className="w-8 h-8 bg-paddock-red flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 3h14l-1 14H4L3 3z"/>
              </svg>
            </div>
            <span className="text-xl font-bold tracking-wider">
              <span className="text-white">PADDOCK</span>
              <span className="text-paddock-red">PULSE</span>
            </span>
          </Link>

          {user && (
            <div className="flex items-center space-x-8">
              <Link to="/dashboard" className="text-white hover:text-paddock-red transition uppercase text-sm font-medium tracking-wide">
                Dashboard
              </Link>
              <Link to="/season-predictions" className="text-white hover:text-paddock-red transition uppercase text-sm font-medium tracking-wide">
                Season Predictions
              </Link>
              <Link to="/leaderboard" className="text-white hover:text-paddock-red transition uppercase text-sm font-medium tracking-wide">
                Leaderboard
              </Link>
              <Link to="/validations" className="hover:text-paddock-red transition uppercase text-sm font-medium tracking-wide relative">
                <span className={pendingCount > 0 ? 'text-paddock-red' : 'text-white'}>Validations</span>
                {pendingCount > 0 && (
                  <span className="absolute -top-2 -right-3 bg-paddock-red text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {pendingCount}
                  </span>
                )}
              </Link>
              {user.is_admin && (
                <Link to="/admin" className="text-white hover:text-paddock-red transition uppercase text-sm font-medium tracking-wide">
                  Admin
                </Link>
              )}
              <button
                onClick={logout}
                className="bg-white text-paddock-dark px-6 py-2 rounded font-bold hover:bg-gray-200 transition uppercase text-sm tracking-wide flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/>
                  <path d="M0 0h24v24H0z" fill="none"/>
                </svg>
                {user.display_name}
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
