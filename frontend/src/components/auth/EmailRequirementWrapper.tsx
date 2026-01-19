import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import EmailRequirementModal from './EmailRequirementModal';

interface EmailRequirementWrapperProps {
  children: React.ReactNode;
}

const EmailRequirementWrapper: React.FC<EmailRequirementWrapperProps> = ({ children }) => {
  const { shouldShowEmailModal, saveEmail, snoozeEmailReminder } = useAuth();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Check after a short delay to allow the page to load
    const timer = setTimeout(() => {
      if (shouldShowEmailModal()) {
        setShowModal(true);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [shouldShowEmailModal]);

  const handleSave = async (email: string) => {
    await saveEmail(email);
    setShowModal(false);
  };

  const handleSnooze = async () => {
    await snoozeEmailReminder();
    setShowModal(false);
  };

  return (
    <>
      {children}
      <EmailRequirementModal
        isOpen={showModal}
        onSave={handleSave}
        onSnooze={handleSnooze}
      />
    </>
  );
};

export default EmailRequirementWrapper;
