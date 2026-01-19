import { useState, FormEvent, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getLeagueByInviteCode } from '../../services/api';

const ENABLE_GOOGLE_OAUTH = import.meta.env.VITE_ENABLE_GOOGLE_OAUTH === 'true';

export const RegisterForm = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | undefined>(undefined);
  const [leagueInfo, setLeagueInfo] = useState<{ name: string; member_count: number } | null>(null);
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const invite = searchParams.get('invite');
    if (invite) {
      const code = invite.toUpperCase();
      setInviteCode(code);

      // Fetch league info
      getLeagueByInviteCode(code)
        .then((league) => {
          setLeagueInfo({
            name: league.name,
            member_count: league.member_count
          });
        })
        .catch(() => {
          // If league not found, we'll just show the invite code
          setLeagueInfo(null);
        });
    }
  }, [searchParams]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(username, email, password, displayName, inviteCode);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // Build OAuth URL with invite code if present
  const oauthUrl = inviteCode
    ? `${import.meta.env.VITE_API_URL || 'http://localhost:4001/api'}/auth/google?invite=${inviteCode}`
    : `${import.meta.env.VITE_API_URL || 'http://localhost:4001/api'}/auth/google`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-f1-dark to-f1-gray flex items-center justify-center">
      {/* Container for both hero and form */}
      <div className="w-full max-w-md px-4">
        {/* Hero Section Box */}
        <div className="p-8 mb-4">
          <h1 className="text-2xl font-bold mb-4 italic tracking-tight leading-tight">
            <span className="text-white">LIGHTS OUT</span>

            <span className="text-white"> &</span>{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-paddock-red to-paddock-coral">
              AWAY WE GO
            </span>
          </h1>
          <p className="text-gray-400 text-base">
            The ultimate tipping battleground for you and your mates. Predict the podium, best of the rest, and crazy outcomes to claim the Championship Trophy.
          </p>
        </div>

        {/* Form Box */}
        <div className="bg-white p-8 rounded-lg shadow-xl">
          <h2 className="text-3xl font-bold text-center mb-2 text-f1-red flex items-center justify-center gap-2">
            🏁 Paddock Pulse
          </h2>
          <p className="text-center text-gray-600 mb-6">Create your account</p>

        {inviteCode && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {leagueInfo ? (
              <>
                🎉 You've been invited to <strong>{leagueInfo.name}</strong> (joining {leagueInfo.member_count} other competitor{leagueInfo.member_count !== 1 ? 's' : ''}).
                <br />
                Invite code: <strong>{inviteCode}</strong>
              </>
            ) : (
              <>
                🎉 You're joining a league! Invite code: <strong>{inviteCode}</strong>
              </>
            )}
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {ENABLE_GOOGLE_OAUTH && (
          <>
            <a
              href={oauthUrl}
              className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 text-gray-700 py-2.5 px-4 rounded-md hover:bg-gray-50 hover:border-gray-400 transition-colors mb-4"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign up with Google
            </a>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-f1-red text-gray-900"
              minLength={3}
              maxLength={30}
              pattern="[a-zA-Z0-9_]+"
              title="Username must be 3-30 characters and contain only letters, numbers, and underscores"
              required
            />
            <p className="text-xs text-gray-500 mt-1">3-30 characters, letters, numbers, and underscores only</p>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-f1-red text-gray-900"
              required
            />
          </div>

          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
              Display Name
            </label>
            <input
              type="text"
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-f1-red text-gray-900"
              maxLength={50}
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-f1-red text-gray-900"
              minLength={6}
              required
            />
            <p className="text-xs text-gray-500 mt-1">At least 6 characters</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-f1-red text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-f1-red focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

          <p className="mt-4 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <a href={inviteCode ? `/login?invite=${inviteCode}` : "/login"} className="text-f1-red hover:underline">
              Sign in here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
