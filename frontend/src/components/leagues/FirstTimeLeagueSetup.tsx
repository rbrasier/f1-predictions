import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useLeague } from '../../contexts/LeagueContext';
import LeagueSelectionModal from './LeagueSelectionModal';

interface FirstTimeLeagueSetupProps {
  children: React.ReactNode;
}

export const FirstTimeLeagueSetup: React.FC<FirstTimeLeagueSetupProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { leagues, loading } = useLeague();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Show modal if user is authenticated, leagues are loaded, and user has no leagues
    if (isAuthenticated && !loading && leagues.length === 0) {
      setShowModal(true);
    } else {
      setShowModal(false);
    }
  }, [isAuthenticated, loading, leagues]);

  const handleClose = () => {
    // Don't allow closing if user has no leagues - they must join one
    if (leagues.length === 0) {
      return;
    }
    setShowModal(false);
  };

  return (
    <>
      {children}
      <LeagueSelectionModal isOpen={showModal} onClose={handleClose} />
    </>
  );
};
