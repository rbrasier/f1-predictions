import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import OAuthTransitionModal from './OAuthTransitionModal';
import { CredentialResponse } from '@react-oauth/google';

interface OAuthTransitionWrapperProps {
  children: React.ReactNode;
}

export const OAuthTransitionWrapper: React.FC<OAuthTransitionWrapperProps> = ({ children }) => {
  const { user, shouldShowOAuthModal, snoozeOAuthMigration } = useAuth();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (user && shouldShowOAuthModal()) {
      // Add a small delay to avoid showing modal immediately on page load
      const timer = setTimeout(() => {
        setShowModal(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user, shouldShowOAuthModal]);

  const handleSnooze = async () => {
    try {
      await snoozeOAuthMigration();
      setShowModal(false);
    } catch (error) {
      console.error('Failed to snooze OAuth migration:', error);
    }
  };

  const handleClose = () => {
    setShowModal(false);
  };

  const handleGoogleSuccess = (credentialResponse: CredentialResponse) => {
    // Redirect to Google OAuth flow
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';
    window.location.href = `${apiUrl}/auth/google`;
  };

  return (
    <>
      {children}
      <OAuthTransitionModal
        isOpen={showModal}
        onClose={handleClose}
        onGoogleSuccess={handleGoogleSuccess}
        onSnooze={handleSnooze}
      />
    </>
  );
};
