export const communicationRoutes = {
  home: "/comunicacao",
  request: "/comunicacao/solicitar",
  agent: (channelSlug: string) => `/comunicacao/agente/${channelSlug}`,
  agentPublication: (channelSlug: string, publicationId: string) =>
    `/comunicacao/agente/${channelSlug}/publicacao/${publicationId}`,
} as const;

export type CommunicationRoutes = typeof communicationRoutes;
