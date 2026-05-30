export function getDpoEmail(): string {
  const configuredEmail =
    import.meta.env.VITE_DPO_EMAIL ||
    import.meta.env.VITE_PRIVACY_DPO_EMAIL ||
    import.meta.env.VITE_CONTACT_EMAIL ||
    "";

  const normalizedEmail = configuredEmail.trim().toLowerCase();
  return normalizedEmail;
}
