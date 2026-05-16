type ManagedAsset = {
  id: string;
  kind: "business" | "service" | "classified" | "event";
  title: string;
  status: string;
  updatedAt?: string;
};

type NotificationStatsPayload = {
  total?: number;
  unread?: number;
  by_type?: Record<string, number>;
  by_priority?: { low?: number; medium?: number; high?: number; urgent?: number };
};

type RecentNotification = {
  id: string;
  type?: string;
  title?: string;
  priority?: "low" | "medium" | "high" | "urgent";
  read?: boolean;
  created_at?: string;
};

export function buildManagedAssets(params: {
  businesses: Array<{ id: string; name?: string; aberto?: boolean }>;
  services: Array<{ id: string; name?: string; updated_at?: string; is_accepting_clients?: boolean }>;
  classifieds: Array<{ id: string; title?: string; updated_at?: string; is_active?: boolean }>;
  events: Array<{ id: string; title?: string; status?: string; updated_at?: string }>;
}): ManagedAsset[] {
  const { businesses, services, classifieds, events } = params;
  return [
    ...businesses.slice(0, 4).map((business) => ({
      id: business.id,
      kind: "business" as const,
      title: business.name || "Empresa",
      status: business.aberto === false ? "inativa" : "ativa",
      updatedAt: undefined,
    })),
    ...services.slice(0, 3).map((service) => ({
      id: service.id,
      kind: "service" as const,
      title: service.name || "Servico profissional",
      status: service.is_accepting_clients === false ? "pausado" : "ativo",
      updatedAt: service.updated_at,
    })),
    ...classifieds.slice(0, 3).map((classified) => ({
      id: classified.id,
      kind: "classified" as const,
      title: classified.title || "Classificado",
      status: classified.is_active === false ? "inativo" : "ativo",
      updatedAt: classified.updated_at,
    })),
    ...events.slice(0, 3).map((event) => ({
      id: event.id,
      kind: "event" as const,
      title: event.title || "Evento",
      status: event.status || "upcoming",
      updatedAt: event.updated_at,
    })),
  ].sort((a, b) => {
    const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return dateB - dateA;
  });
}

export function normalizeNotificationPayload(
  payload: NotificationStatsPayload | null,
): Required<NotificationStatsPayload> {
  return {
    total: payload?.total || 0,
    unread: payload?.unread || 0,
    by_type: payload?.by_type || {},
    by_priority: {
      low: payload?.by_priority?.low || 0,
      medium: payload?.by_priority?.medium || 0,
      high: payload?.by_priority?.high || 0,
      urgent: payload?.by_priority?.urgent || 0,
    },
  };
}

export function mapRecentNotifications(items: RecentNotification[]) {
  return items.map((item) => ({
    id: item.id,
    type: item.type || "general",
    title: item.title || "Notificacao",
    priority: item.priority || "medium",
    read: Boolean(item.read),
    createdAt: item.created_at || new Date().toISOString(),
  }));
}

export function buildWorkspaceOperations(params: {
  profilesCount: number;
  businessesCount: number;
  servicesCount: number;
  classifiedsCount: number;
  postsCount: number;
  eventsCount: number;
  alertsCount: number;
  issuesCount: number;
  favoritesGiven: number;
  favoritesReceived: number;
  notificationsTotal: number;
  notificationsUnread: number;
  ridesTotal: number;
  activeRides: number;
}) {
  return {
    managedProfiles: params.profilesCount,
    businesses: params.businessesCount,
    services: params.servicesCount,
    classifieds: params.classifiedsCount,
    posts: params.postsCount,
    events: params.eventsCount,
    alerts: params.alertsCount,
    issues: params.issuesCount,
    favoritesGiven: params.favoritesGiven,
    favoritesReceived: params.favoritesReceived,
    notificationsTotal: params.notificationsTotal,
    notificationsUnread: params.notificationsUnread,
    ridesTotal: params.ridesTotal,
    activeRides: params.activeRides,
  };
}

export function countActiveRides(
  rides: unknown[],
  activeStatuses: Set<string>,
): number {
  return rides.filter((ride) => {
    const status =
      typeof ride === "object" && ride !== null && "status" in ride
        ? String((ride as { status?: unknown }).status ?? "")
        : "";
    return activeStatuses.has(status);
  }).length;
}

export function buildPermissionMatrix(permissions: {
  canPost: boolean;
  canComment: boolean;
  canMessage: boolean;
  canCreateBusiness: boolean;
  canModerate: boolean;
}) {
  return [
    { key: "canPost" as const, label: "Publicar conteudo", allowed: permissions.canPost },
    {
      key: "canComment" as const,
      label: "Comentar e interagir",
      allowed: permissions.canComment,
    },
    { key: "canMessage" as const, label: "Enviar mensagens", allowed: permissions.canMessage },
    {
      key: "canCreateBusiness" as const,
      label: "Criar e gerir empresa",
      allowed: permissions.canCreateBusiness,
    },
    {
      key: "canModerate" as const,
      label: "Moderar conteudo",
      allowed: permissions.canModerate,
    },
  ];
}
