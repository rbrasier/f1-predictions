import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import DisplayNameModal from './DisplayNameModal';
import * as api from '../../services/api';

interface DisplayNameWrapperProps {
  children: React.ReactNode;
}

export const DisplayNameWrapper: React.FC<DisplayNameWrapperProps> = ({ children }) => {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Check if user needs to set display name (ends with _temp)
    if (user && user.display_name?.endsWith('_temp')) {
      setShowModal(true);
    }
  }, [user]);

  const handleSubmit = async (displayName: string) => {
    setIsSubmitting(true);
    try {
      await api.updateDisplayName(displayName);
      // Refresh page to reload user data
      window.location.reload();
    } catch (error) {
      console.error('Failed to update display name:', error);
      alert('Failed to update display name. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {children}
      <DisplayNameModal
        isOpen={showModal && !isSubmitting}
        onSubmit={handleSubmit}
        currentDisplayName={user?.display_name}
      />
    </>
  );
};
