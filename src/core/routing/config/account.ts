export const ACCOUNT_PATHS = {
  home: "/conta",
  profiles: "/conta?section=profiles",
  security: "/conta/seguranca",
  access: "/conta/seguranca#acesso",
  email: "/conta/seguranca#email",
  password: "/conta/seguranca#senha",
  notifications: "/conta/notificacoes",
  privacy: "/conta/privacidade",
  exportData: "/conta/privacidade#exportar",
  preferences: "/conta/preferencias",
  accessibility: "/conta/preferencias#acessibilidade",
  addresses: "/conta/enderecos",
  profileSettings: "/conta/perfil/configuracoes",
} as const;

export const ACCOUNT_SETTINGS_SHELL_PATHS = new Set<string>([
  ACCOUNT_PATHS.home,
  ACCOUNT_PATHS.security,
  ACCOUNT_PATHS.notifications,
  ACCOUNT_PATHS.privacy,
  ACCOUNT_PATHS.preferences,
]);
