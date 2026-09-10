/**
 * useEmail Hook
 *
 * React query facade for the authenticated user's email delivery history.
 * Password recovery belongs to AuthService; MFA recovery codes never transit
 * through the email notification channel.
 */

import { useQuery } from '@tanstack/react-query';
import { EmailService, type EmailLog } from '../services/EmailService';

export function useEmail(userId?: string) {
  const {
    data: emailLogs,
    isLoading: isLoadingLogs,
    error: logsError,
    refetch: refetchLogs,
  } = useQuery<EmailLog[]>({
    queryKey: ['email-logs', userId],
    queryFn: () => (userId ? EmailService.getEmailLogs(userId) : Promise.resolve([])),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });

  return {
    emailLogs: emailLogs || [],
    isLoadingLogs,
    logsError,
    refetchLogs,

    // Valid authenticated self-email operations only.
    sendWelcomeEmail: EmailService.sendWelcomeEmail,
    sendMFASetupConfirmationEmail: EmailService.sendMFASetupConfirmationEmail,
    sendNewDeviceLoginEmail: EmailService.sendNewDeviceLoginEmail,
    sendPaymentConfirmationEmail: EmailService.sendPaymentConfirmationEmail,
    sendSubscriptionExpiringEmail: EmailService.sendSubscriptionExpiringEmail,
    sendSecurityAlertEmail: EmailService.sendSecurityAlertEmail,
  };
}
