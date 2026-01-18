import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useLeague } from '../../contexts/LeagueContext';
import { useState, useEffect } from 'react';
import { getPendingValidations } from '../../services/api';
import InviteModal from '../leagues/InviteModal';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { defaultLeague } = useLeague();
  const [pendingCount, setPendingCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const pending = await getPendingValidations(defaultLeague?.id);
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
  }, [user, defaultLeague]);

  return (
    <nav className="bg-paddock-dark border-b border-paddock-lightgray">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition z-50">
            <span className="text-2xl sm:text-3xl">🏁</span>
            <span className="text-lg sm:text-xl font-bold tracking-wider">
              <span className="text-white">PADDOCK</span>
              <span className="text-paddock-red">PULSE</span>
            </span>
          </Link>

          {user && (
            <>
              {/* Icon Buttons Group */}
              <div className="flex items-center gap-2">
                {/* Invite Friends Icon Button */}
                <button
                  onClick={() => setInviteModalOpen(true)}
                  className="z-50 p-2 text-white hover:text-paddock-red transition"
                  aria-label="Invite friends"
                  disabled={!defaultLeague}
                  title="Invite friends to this league"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </button>

                {/* Hamburger Menu Button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="z-50 p-2 text-white hover:text-paddock-red transition"
                  aria-label="Toggle menu"
                >
                {mobileMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
                </button>
              </div>

              {/* Menu */}
              {mobileMenuOpen && (
                <>
                  {/* Backdrop overlay with blur */}
                  <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
                    onClick={() => setMobileMenuOpen(false)}
                  />
                  {/* Sliding menu panel */}
                  <div className="fixed top-0 right-0 h-screen w-[92vw] bg-paddock-dark z-40 pt-20 shadow-2xl animate-in slide-in-from-right duration-300">
                    <div className="flex flex-col space-y-4 px-6 py-4 overflow-y-auto h-full">
                    {defaultLeague && (
                      <div className="text-gray-400 text-sm border-b border-gray-700 pb-4 mb-2">
                        League: <span className="text-white font-medium">{defaultLeague.name}</span>
                      </div>
                    )}
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setInviteModalOpen(true);
                      }}
                      disabled={!defaultLeague}
                      className="w-full bg-paddock-red hover:bg-red-600 text-white px-6 py-3 rounded font-bold uppercase text-sm tracking-wide transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      Invite Friends
                    </button>
                    <Link
                      to="/dashboard"
                      className="text-white hover:text-paddock-red transition uppercase text-lg font-medium tracking-wide py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/compare-tips"
                      className="text-white hover:text-paddock-red transition uppercase text-lg font-medium tracking-wide py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Compare Tips
                    </Link>
                    <Link
                      to="/leaderboard"
                      className="text-white hover:text-paddock-red transition uppercase text-lg font-medium tracking-wide py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Leaderboard
                    </Link>
                    <Link
                      to="/validations"
                      className="hover:text-paddock-red transition uppercase text-lg font-medium tracking-wide py-2 relative inline-block"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span className={pendingCount > 0 ? 'text-paddock-red' : 'text-white'}>Validations</span>
                      {pendingCount > 0 && (
                        <span className="ml-2 bg-paddock-red text-white text-xs rounded-full px-2 py-1">
                          {pendingCount}
                        </span>
                      )}
                    </Link>
                    <Link
                      to="/settings"
                      className="text-white hover:text-paddock-red transition uppercase text-lg font-medium tracking-wide py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Settings
                    </Link>
                    {user.is_admin && (
                      <Link
                        to="/admin"
                        className="text-white hover:text-paddock-red transition uppercase text-lg font-medium tracking-wide py-2"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Admin
                      </Link>
                    )}
                    <div className="pt-4 border-t border-gray-700">
                      <div className="text-gray-400 text-sm mb-2">Signed in as:</div>
                      <div className="text-white font-medium mb-4">{user.display_name}</div>
                      <button
                        onClick={() => {
                          setMobileMenuOpen(false);
                          logout();
                        }}
                        className="w-full bg-white text-paddock-dark px-6 py-3 rounded font-bold hover:bg-gray-200 transition uppercase text-sm tracking-wide"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
      <InviteModal isOpen={inviteModalOpen} onClose={() => setInviteModalOpen(false)} />
    </nav>
  );
};
