/**
 * useEmail Hook
 * 
 * React hook for email operations.
 */

import { useQuery } from '@tanstack/react-query';
import { EmailService, type EmailLog } from '../services/EmailService';

export function useEmail(userId?: string) {
  // Get email logs
  const {
    data: emailLogs,
    isLoading: isLoadingLogs,
    error: logsError,
    refetch: refetchLogs,
  } = useQuery<EmailLog[]>({
    queryKey: ['email-logs', userId],
    queryFn: () => (userId ? EmailService.getEmailLogs(userId) : Promise.resolve([])),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    // Data
    emailLogs: emailLogs || [],
    
    // Loading states
    isLoadingLogs,
    
    // Errors
    logsError,
    
    // Actions
    refetchLogs,
    
    // Email sending methods (direct access to service)
    sendWelcomeEmail: EmailService.sendWelcomeEmail,
    sendPasswordResetEmail: EmailService.sendPasswordResetEmail,
    sendMFASetupEmail: EmailService.sendMFASetupEmail,
    sendNewDeviceLoginEmail: EmailService.sendNewDeviceLoginEmail,
    sendPaymentConfirmationEmail: EmailService.sendPaymentConfirmationEmail,
    sendSubscriptionExpiringEmail: EmailService.sendSubscriptionExpiringEmail,
    sendSecurityAlertEmail: EmailService.sendSecurityAlertEmail,
  };
}
