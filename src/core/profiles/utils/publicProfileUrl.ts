export function buildPublicProfileUrl(usernameOrHandle: string): string {
  return `/u/${usernameOrHandle}`;
}

export function buildProfileEditUrl(profileId: string): string {
  return `/perfil/editar/${profileId}`;
}

export function buildProfileSettingsUrl(
  tab?: "privacy" | "links" | "members",
): string {
  return tab ? `/perfil/configuracoes?tab=${tab}` : "/perfil/configuracoes";
}
