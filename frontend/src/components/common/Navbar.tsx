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
    <nav className="bg-f1-dark text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/dashboard" className="text-2xl font-bold text-f1-red hover:text-red-400">
            F1 Tipping
          </Link>

          {user && (
            <div className="flex items-center space-x-6">
              <Link to="/dashboard" className="hover:text-f1-red transition">
                Dashboard
              </Link>
              <Link to="/leaderboard" className="hover:text-f1-red transition">
                Leaderboard
              </Link>
              <Link to="/validations" className="hover:text-f1-red transition relative">
                Validations
                {pendingCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-f1-red text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {pendingCount}
                  </span>
                )}
              </Link>
              {user.is_admin && (
                <Link to="/admin" className="hover:text-f1-red transition">
                  Admin
                </Link>
              )}
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-300">{user.display_name}</span>
                <button
                  onClick={logout}
                  className="bg-f1-red hover:bg-red-700 px-4 py-2 rounded transition"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
