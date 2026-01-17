import { useState, FormEvent, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getLeagueByInviteCode } from '../../services/api';

export const RegisterForm = () => {
  const [username, setUsername] = useState('');
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
      await register(username, password, displayName, inviteCode);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

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
            <a href="/login" className="text-f1-red hover:underline">
              Sign in here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
