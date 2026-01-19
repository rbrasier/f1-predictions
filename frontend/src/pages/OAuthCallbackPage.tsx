import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const OAuthCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const error = searchParams.get('oauth_error');

      if (error) {
        // Handle OAuth error
        if (error === 'account_exists') {
          const email = searchParams.get('email');
          navigate(`/login?oauth_error=account_exists&email=${encodeURIComponent(email || '')}`);
        } else {
          navigate('/login?oauth_error=failed');
        }
        return;
      }

      if (token) {
        try {
          await loginWithToken(token);
          navigate('/dashboard');
        } catch (error) {
          console.error('Failed to login with OAuth token:', error);
          navigate('/login?oauth_error=failed');
        }
      } else {
        navigate('/login?oauth_error=no_token');
      }
    };

    handleCallback();
  }, [searchParams, navigate, loginWithToken]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-f1-dark to-f1-gray flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-f1-red border-solid mx-auto mb-4"></div>
        <p className="text-white text-lg">Completing sign in...</p>
      </div>
    </div>
  );
};
