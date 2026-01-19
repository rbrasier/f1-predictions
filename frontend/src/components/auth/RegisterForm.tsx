import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getLeagueByInviteCode } from '../../services/api';

export const RegisterForm = () => {
  const [inviteCode, setInviteCode] = useState<string | undefined>(undefined);
  const [leagueInfo, setLeagueInfo] = useState<{ name: string; member_count: number } | null>(null);
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

        <div className="space-y-4">
          <a
            href={oauthUrl}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 text-gray-700 py-2.5 px-4 rounded-md hover:bg-gray-50 hover:border-gray-400 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign up with Google
          </a>

          <p className="mt-4 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <a href={inviteCode ? `/login?invite=${inviteCode}` : "/login"} className="text-f1-red hover:underline">
              Sign in here
            </a>
          </p>
        </div>
        </div>
      </div>
    </div>
  );
};
