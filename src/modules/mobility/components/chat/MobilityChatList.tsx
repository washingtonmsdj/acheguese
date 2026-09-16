import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Car,
  ChevronRight,
  MessageCircle,
  MapPin,
  Package,
  Phone,
  RefreshCw,
  Search,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  FILTER_TYPES,
  RIDE_STATUS,
  RIDE_STATUS_LABELS,
} from "@/core/mobility/constants";
import type { MobilityConversationSummary } from "@/core/mobility/services/mobility.ride-read-queries";
import { getMobilityConversations } from "@/core/mobility/services/mobility.queries";
import { profileService } from "@/core/profiles/services/ProfileService";
import { useAppUrls } from "@/core/routing/hooks/useAppUrls";
import { useSessionContext } from "@/core/session";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { USER_ROLE } from "@/shared/types/constants";
import { cn } from "@/shared/utils/cn";
import { formatBrl } from "@/shared/utils/currency";
import { logger } from "@/shared/utils/logger";
import { ChatWindow } from "./ChatWindow";

interface RideChatPreview {
  id: string;
  ride_id: string;
  other_user_id: string;
  other_user_name: string;
  other_user_avatar: string;
  ride_origin: string;
  ride_destination: string;
  ride_type: "viagem" | "entrega";
  ride_status: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  ride_price: number;
}

interface MobilityChatListProps {
  role: "driver" | "passenger";
}

const EMPTY_CHATS: RideChatPreview[] = [];

const ACTIVE_RIDE_STATUSES = new Set<string>([
  RIDE_STATUS.PENDING,
  RIDE_STATUS.REQUESTED,
  RIDE_STATUS.SEARCHING_DRIVER,
  RIDE_STATUS.DRIVER_ASSIGNED,
  RIDE_STATUS.DRIVER_ACCEPTED,
  RIDE_STATUS.DRIVER_ARRIVING,
  RIDE_STATUS.DRIVER_ON_THE_WAY,
  RIDE_STATUS.DRIVER_ARRIVED,
  RIDE_STATUS.PASSENGER_BOARDED,
  RIDE_STATUS.PASSENGER_ON_BOARD,
  RIDE_STATUS.IN_PROGRESS,
  RIDE_STATUS.PICKUP_CONFIRMED,
  RIDE_STATUS.IN_DELIVERY,
]);

const CLOSED_RIDE_STATUSES = new Set<string>([
  RIDE_STATUS.COMPLETED,
  RIDE_STATUS.DELIVERED,
  RIDE_STATUS.CANCELLED,
  RIDE_STATUS.CANCELLED_BY_DRIVER,
  RIDE_STATUS.CANCELLED_BY_PASSENGER,
  RIDE_STATUS.EXPIRED,
  RIDE_STATUS.FAILED,
  RIDE_STATUS.FAILED_DELIVERY,
]);

function getStatusClasses(status: string): string {
  if (status === RIDE_STATUS.COMPLETED || status === RIDE_STATUS.DELIVERED) {
    return "bg-success/10 text-success";
  }
  if (
    status === RIDE_STATUS.CANCELLED ||
    status === RIDE_STATUS.CANCELLED_BY_DRIVER ||
    status === RIDE_STATUS.CANCELLED_BY_PASSENGER ||
    status === RIDE_STATUS.FAILED ||
    status === RIDE_STATUS.FAILED_DELIVERY
  ) {
    return "bg-destructive/10 text-destructive";
  }
  if (
    status === RIDE_STATUS.PENDING ||
    status === RIDE_STATUS.REQUESTED ||
    status === RIDE_STATUS.SEARCHING_DRIVER ||
    status === RIDE_STATUS.EXPIRED
  ) {
    return "bg-warning/10 text-warning";
  }
  return "bg-category-mobility/10 text-category-mobility";
}

function getStatusLabel(status: string): string {
  return RIDE_STATUS_LABELS[status] ?? "Status atualizado";
}

export function MobilityChatList({ role }: MobilityChatListProps) {
  const navigate = useNavigate();
  const appUrls = useAppUrls();
  const { activeProfile } = useSessionContext();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "completed">(
    FILTER_TYPES.ALL,
  );
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [conversations, setConversations] = useState<RideChatPreview[]>([]);
  const [selectedRideId, setSelectedRideId] = useState<string | null>(null);

  useEffect(() => {
    if (!activeProfile) {
      setConversations(EMPTY_CHATS);
      setLoadError(null);
      setLoading(false);
      return;
    }

    let active = true;

    const loadConversations = async () => {
      try {
        setLoading(true);
        setLoadError(null);

        const summaries =
          (await getMobilityConversations()) as MobilityConversationSummary[];
        if (!active) return;

        const roleScoped = summaries.filter((conversation) =>
          role === USER_ROLE.DRIVER
            ? conversation.driver_profile_id === activeProfile.id
            : conversation.passenger_profile_id === activeProfile.id,
        );

        const mapped: RideChatPreview[] = await Promise.all(
          roleScoped.map(async (conversation) => {
            const otherUserId =
              role === USER_ROLE.DRIVER
                ? conversation.passenger_profile_id
                : conversation.driver_profile_id;
            const profile = await profileService.getProfileById(otherUserId);

            return {
              id: conversation.id,
              ride_id: conversation.ride_id,
              other_user_id: otherUserId,
              other_user_name: profile?.name || "Usuário",
              other_user_avatar: profile?.avatar_url || "",
              ride_origin: conversation.origin || "Origem",
              ride_destination: conversation.destination || "Destino",
              ride_type:
                conversation.ride_mode === "motoboy" ? "entrega" : "viagem",
              ride_status: conversation.ride_status || RIDE_STATUS.PENDING,
              last_message: conversation.last_message || "Sem mensagens",
              last_message_at:
                conversation.last_message_at || conversation.updated_at,
              unread_count: Number(conversation.unread_count) || 0,
              ride_price:
                conversation.final_price ?? conversation.suggested_price ?? 0,
            };
          }),
        );

        if (active) setConversations(mapped);
      } catch (conversationError) {
        logger.error("[MobilityChatList] Erro ao carregar conversas:", conversationError);
        if (active) {
          setLoadError("Não foi possível carregar as conversas de Mobilidade.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadConversations();

    return () => {
      active = false;
    };
  }, [activeProfile, reloadKey, role]);

  const filtered = useMemo(
    () =>
      conversations.filter((chat) => {
        const normalizedSearch = search.trim().toLowerCase();
        const matchSearch =
          !normalizedSearch ||
          chat.other_user_name.toLowerCase().includes(normalizedSearch) ||
          chat.ride_origin.toLowerCase().includes(normalizedSearch) ||
          chat.ride_destination.toLowerCase().includes(normalizedSearch);

        const matchFilter =
          filter === FILTER_TYPES.ALL ||
          (filter === FILTER_TYPES.ACTIVE &&
            ACTIVE_RIDE_STATUSES.has(chat.ride_status)) ||
          (filter === FILTER_TYPES.COMPLETED &&
            CLOSED_RIDE_STATUSES.has(chat.ride_status));

        return matchSearch && matchFilter;
      }),
    [conversations, filter, search],
  );

  const totalUnread = conversations.reduce(
    (sum, conversation) => sum + conversation.unread_count,
    0,
  );

  const selectedConversation = useMemo(
    () =>
      conversations.find(
        (conversation) => conversation.ride_id === selectedRideId,
      ) ?? null,
    [conversations, selectedRideId],
  );

  return (
    <div className="space-y-4">
      {selectedRideId && selectedConversation ? (
        <div className="fixed inset-0 z-50 bg-background md:relative md:inset-auto md:overflow-hidden md:rounded-2xl md:border md:border-border">
          <ChatWindow
            rideId={selectedRideId}
            otherUserName={selectedConversation.other_user_name}
            otherUserAvatar={selectedConversation.other_user_avatar}
            rideInfo={{
              origin: selectedConversation.ride_origin,
              destination: selectedConversation.ride_destination,
              status: selectedConversation.ride_status,
            }}
            onBack={() => setSelectedRideId(null)}
          />
        </div>
      ) : null}

      <div className={cn(selectedRideId && "hidden md:block")}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <MessageCircle
              className="h-5 w-5 text-category-mobility"
              aria-hidden="true"
            />
            <h3 className="text-sm font-bold text-foreground">
              {role === USER_ROLE.DRIVER
                ? "Chat com passageiros"
                : "Chat com motoristas"}
            </h3>
            {totalUnread > 0 ? (
              <Badge className="h-5 rounded-full bg-category-mobility/15 px-1.5 text-[0.6rem] text-category-mobility">
                {totalUnread} nova{totalUnread > 1 ? "s" : ""}
              </Badge>
            ) : null}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(appUrls.messages)}
            className="h-8 text-xs text-muted-foreground"
          >
            Ver todas
            <ChevronRight className="ml-1 h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </div>

        <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { key: FILTER_TYPES.ALL, label: "Todas" },
            { key: FILTER_TYPES.ACTIVE, label: "Ativas" },
            { key: FILTER_TYPES.COMPLETED, label: "Finalizadas" },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              aria-pressed={filter === item.key}
              onClick={() => setFilter(item.key)}
              className={cn(
                "shrink-0 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                filter === item.key
                  ? "border-category-mobility/30 bg-category-mobility/10 text-category-mobility"
                  : "border-border bg-background text-muted-foreground hover:bg-muted/50 hover:text-foreground",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        {conversations.length > 3 ? (
          <div className="relative mt-3">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              placeholder="Buscar por nome ou endereço..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-10 rounded-xl pl-9 text-sm"
            />
          </div>
        ) : null}

        <div className="mt-3">
          {loading ? (
            <div className="space-y-3" aria-label="Carregando conversas">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-center gap-3 p-3">
                  <Skeleton className="h-12 w-12 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              ))}
            </div>
          ) : loadError ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-center">
              <p className="text-sm font-semibold text-foreground">Conversas indisponíveis</p>
              <p className="mt-1 text-xs text-muted-foreground">{loadError}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => setReloadKey((current) => current + 1)}
              >
                <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
                Tentar novamente
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
                <MessageCircle
                  className="h-8 w-8 text-muted-foreground"
                  aria-hidden="true"
                />
              </div>
              <p className="text-sm font-bold text-foreground">Nenhuma conversa</p>
              <p className="mt-1 max-w-[220px] text-xs text-muted-foreground">
                {role === USER_ROLE.DRIVER
                  ? "Suas conversas com passageiros aparecerão aqui quando houver uma corrida vinculada."
                  : "Suas conversas com motoristas aparecerão aqui quando houver uma viagem vinculada."}
              </p>
            </motion.div>
          ) : (
            <AnimatePresence>
              <div className="space-y-2">
                {filtered.map((chat, index) => {
                  const isActive = ACTIVE_RIDE_STATUSES.has(chat.ride_status);
                  const statusClasses = getStatusClasses(chat.ride_status);

                  return (
                    <motion.div
                      key={chat.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`Abrir conversa com ${chat.other_user_name}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.04 }}
                      onClick={() => setSelectedRideId(chat.ride_id)}
                      onKeyDown={(event) => {
                        if (event.key !== "Enter" && event.key !== " ") return;
                        event.preventDefault();
                        setSelectedRideId(chat.ride_id);
                      }}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-2xl border p-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        isActive
                          ? "border-category-mobility/20 bg-category-mobility/5 hover:bg-category-mobility/10"
                          : "border-border bg-card hover:bg-muted/30",
                        chat.unread_count > 0 && "border-category-mobility/30",
                      )}
                    >
                      <div className="relative shrink-0">
                        <div
                          className={cn(
                            "flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl text-sm font-bold",
                            isActive
                              ? "bg-category-mobility/15 text-category-mobility"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {chat.other_user_avatar ? (
                            <img
                              src={chat.other_user_avatar}
                              alt={`Foto de ${chat.other_user_name}`}
                              className="h-full w-full rounded-xl object-cover"
                            />
                          ) : (
                            (chat.other_user_name || "?").charAt(0)
                          )}
                        </div>
                        <div
                          className={cn(
                            "absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-background text-primary-foreground",
                            chat.ride_type === "viagem"
                              ? "bg-category-mobility"
                              : "bg-warning",
                          )}
                        >
                          {chat.ride_type === "viagem" ? (
                            <Car className="h-2.5 w-2.5" aria-hidden="true" />
                          ) : (
                            <Package className="h-2.5 w-2.5" aria-hidden="true" />
                          )}
                        </div>
                        {chat.ride_status === RIDE_STATUS.IN_PROGRESS ? (
                          <div
                            className="absolute -right-0.5 -top-0.5 h-3 w-3 animate-pulse rounded-full border-2 border-background bg-success"
                            aria-hidden="true"
                          />
                        ) : null}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="mb-0.5 flex items-center justify-between gap-2">
                          <p
                            className={cn(
                              "truncate text-sm text-foreground",
                              chat.unread_count > 0 ? "font-bold" : "font-medium",
                            )}
                          >
                            {chat.other_user_name}
                          </p>
                          <span className="shrink-0 text-[10px] text-muted-foreground">
                            {getTimeLabel(chat.last_message_at)}
                          </span>
                        </div>

                        <div className="mb-1 flex items-center gap-1 text-muted-foreground">
                          <MapPin className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
                          <p className="flex min-w-0 items-center gap-1 truncate text-[10px]">
                            <span className="truncate">{chat.ride_origin}</span>
                            <ArrowRight className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
                            <span className="truncate">{chat.ride_destination}</span>
                          </p>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <p
                            className={cn(
                              "truncate text-xs",
                              chat.unread_count > 0
                                ? "font-medium text-foreground"
                                : "text-muted-foreground",
                            )}
                          >
                            {chat.last_message}
                          </p>
                          {chat.unread_count > 0 ? (
                            <span className="flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-category-mobility px-1.5 text-[10px] font-bold text-category-mobility-foreground">
                              {chat.unread_count}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <Badge
                          className={cn(
                            "rounded-lg border-0 px-1.5 py-0.5 text-[9px]",
                            statusClasses,
                          )}
                        >
                          {getStatusLabel(chat.ride_status)}
                        </Badge>
                        <span className="text-[11px] font-semibold text-success">
                          {formatBrl(chat.ride_price)}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </AnimatePresence>
          )}
        </div>

        {filtered.some((chat) => chat.ride_status === RIDE_STATUS.IN_PROGRESS) ? (
          <div className="mt-3 flex items-center gap-3 rounded-2xl border border-category-mobility/20 bg-category-mobility/5 p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-category-mobility/15">
              <Phone
                className="h-4 w-4 text-category-mobility"
                aria-hidden="true"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-category-mobility">
                Corrida em andamento
              </p>
              <p className="text-[10px] text-muted-foreground">
                {role === USER_ROLE.DRIVER
                  ? "Use a conversa vinculada para falar com o passageiro."
                  : "Use a conversa vinculada para falar com o motorista."}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function getTimeLabel(dateStr: string): string {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - date.getTime());
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Agora";
  if (diffMin < 60) return `${diffMin}min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Ontem";
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}
