/**
 * Verification Module - Exports
 */

export { VerificationService } from "./services/VerificationService";
export { useVerifications } from "./hooks/useVerifications";
export { VerificationCard } from "./components/VerificationCard";
export { VerificationBanner } from "./components/VerificationBanner";
export { default as AdminVerificationsPage } from "./pages/AdminVerificationsPage";

export type { PendingVerification, VerificationStats } from "./services/VerificationService";
