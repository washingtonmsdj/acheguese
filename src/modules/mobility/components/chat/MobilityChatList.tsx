import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSessionContext } from "@/core/session";
import { ChatWindow } from "./ChatWindow";
import {
  MessageCircle,
  Search,
  Car,
  MapPin,
  Clock,
  Phone,
  ChevronRight,
  ArrowRight,
  Star,
  Package,
  CheckCircle2,
  User,
} from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { cn } from "@/shared/utils/cn";
import { motion, AnimatePresence } from "framer-motion";
import { RIDE_STATUS, USER_ROLE } from "@/shared/types/constants";
import { FILTER_TYPES } from "@/core/mobility/constants";
import { logger } from "@/shared/utils/logger";
import { profileService } from "@/core/profiles/services/ProfileService";
import {
  getMobilityConversations,
  getRideBasicInfo,
  getLastMessage,
  getUnreadCount,
} from "@/core/mobility/services/mobility.queries";

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

const statusConfig: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  pending: {
    label: "Aguardando",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
  },
  accepted: { label: "Aceita", color: "text-cyan-400", bg: "bg-cyan-500/10" },
  in_progress: {
    label: "Em andamento",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  completed: { label: "Finalizada", color: "text-gray-400", bg: "bg-white/5" },
  cancelled: { label: "Cancelada", color: "text-red-400", bg: "bg-red-500/10" },
};

export function MobilityChatList({ role }: MobilityChatListProps) {
  const navigate = useNavigate();
  const { activeProfile } = useSessionContext();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "completed">(FILTER_TYPES.ALL);
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<RideChatPreview[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);

  // Buscar conversas reais do banco
  useEffect(() => {
    if (!activeProfile) return;

    const loadConversations = async () => {
      try {
        setLoading(true);

        // ✅ SSOT - Buscar conversas via MobilityService
        const conversations = (await getMobilityConversations(activeProfile.id)) as Array<{
          id: string;
          ride_id: string;
          passenger_profile_id: string;
          driver_profile_id: string;
          updated_at: string;
        }>;

        if (!conversations || conversations.length === 0) {
          setConversations(EMPTY_CHATS);
          setLoading(false);
          return;
        }

        // Filtrar por role
        const filteredConversations = conversations.filter(conv => 
          role === USER_ROLE.DRIVER 
            ? conv.driver_profile_id === activeProfile.id
            : conv.passenger_profile_id === activeProfile.id
        );

        // Buscar informações das viagens e perfis
        const mapped: RideChatPreview[] = await Promise.all(
          filteredConversations.map(async (conv) => {
            // ✅ SSOT - Buscar viagem via MobilityService
            const ride = (await getRideBasicInfo(conv.ride_id)) as {
              origin?: string | null;
              destination?: string | null;
              status?: string | null;
              final_price?: number | null;
              suggested_price?: number | null;
            } | null;

            // ✅ SSOT - Buscar perfil do outro usuário via ProfileService
            const otherUserId =
              role === USER_ROLE.DRIVER
                ? conv.passenger_profile_id
                : conv.driver_profile_id;
            const profile = await profileService.getProfileById(otherUserId);

            // ✅ SSOT - Buscar última mensagem via MobilityService
            const lastMsg = (await getLastMessage(conv.id)) as { message?: string | null } | null;

            // ✅ SSOT - Contar não lidas via MobilityService
            const unreadCount = await getUnreadCount(conv.id, activeProfile.id);

            return {
              id: conv.id,
              ride_id: conv.ride_id,
              other_user_id: otherUserId,
              other_user_name: profile?.name || "Usuário",
              other_user_avatar: profile?.avatar_url || "",
              ride_origin: ride?.origin || "Origem",
              ride_destination: ride?.destination || "Destino",
              ride_type: "viagem" as const,
              ride_status: ride?.status || RIDE_STATUS.PENDING,
              last_message: lastMsg?.message || "Sem mensagens",
              last_message_at: conv.updated_at,
              unread_count: unreadCount,
              ride_price: ride?.final_price || ride?.suggested_price || 0,
            };
          }),
        );

        setConversations(mapped);
      } catch (error) {
        logger.error("Erro:", error);
        setConversations(EMPTY_CHATS);
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, [activeProfile, role]);

  const filtered = conversations.filter((chat) => {
    const matchSearch =
      !search ||
      chat.other_user_name.toLowerCase().includes(search.toLowerCase()) ||
      chat.ride_origin.toLowerCase().includes(search.toLowerCase()) ||
      chat.ride_destination.toLowerCase().includes(search.toLowerCase());

    const matchFilter =
      (filter === FILTER_TYPES.ALL ||
      (filter === FILTER_TYPES.ACTIVE &&
        ([RIDE_STATUS.PENDING, RIDE_STATUS.DRIVER_ACCEPTED, RIDE_STATUS.IN_PROGRESS] as string[]).includes(
          chat.ride_status,
        )) ||
      (filter === FILTER_TYPES.COMPLETED &&
        ([RIDE_STATUS.COMPLETED, RIDE_STATUS.CANCELLED] as string[]).includes(chat.ride_status)));

    return matchSearch && matchFilter;
  });

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread_count, 0);

  const handleOpenChat = (chat: RideChatPreview) => {
    setSelectedChat(chat.id);
  };

  return (
    <div className="space-y-4">
      {/* Se há conversa selecionada, mostrar ChatWindow */}
      {selectedChat && (
        <div className="fixed inset-0 z-50 bg-[#12181B] md:relative md:inset-auto md:rounded-2xl md:border md:border-white/10 md:overflow-hidden">
          <ChatWindow
            conversationId={selectedChat}
            otherUserName={
              conversations.find((c) => c.id === selectedChat)
                ?.other_user_name || "Usuário"
            }
            otherUserAvatar={
              conversations.find((c) => c.id === selectedChat)
                ?.other_user_avatar
            }
            rideInfo={{
              origin:
                conversations.find((c) => c.id === selectedChat)?.ride_origin ||
                "",
              destination:
                conversations.find((c) => c.id === selectedChat)
                  ?.ride_destination || "",
              status:
                conversations.find((c) => c.id === selectedChat)?.ride_status ||
                "",
            }}
            onBack={() => setSelectedChat(null)}
          />
        </div>
      )}

      {/* Lista de conversas (ocultar quando chat aberto no mobile) */}
      <div className={cn(selectedChat && "hidden md:block")}>
        {/* Header with unread badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-teal-400" />
            <h3 className="text-sm font-bold text-white">
              {role === USER_ROLE.DRIVER
                ? "Chat com Passageiros"
                : "Chat com Motoristas"}
            </h3>
            {totalUnread > 0 && (
              <Badge className="bg-teal-500/30 text-teal-400 text-[0.6rem] px-1.5 h-5 rounded-full animate-pulse">
                {totalUnread} nova{totalUnread > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/mensagens")}
            className="text-gray-400 hover:text-white text-xs h-8"
          >
            Ver todas
            <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          {[
            { key: FILTER_TYPES.ALL, label: "Todas" },
            { key: FILTER_TYPES.ACTIVE, label: "Ativas" },
            { key: FILTER_TYPES.COMPLETED, label: "Finalizadas" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all",
                filter === f.key
                  ? "bg-teal-500/20 text-teal-400 border border-teal-500/30"
                  : "bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search */}
        {conversations.length > 3 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Buscar por nome ou endereço..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 text-sm rounded-xl bg-white/5 border-white/10 text-white placeholder:text-gray-500"
            />
          </div>
        )}

        {/* Chat list */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <Skeleton className="h-12 w-12 rounded-xl bg-white/5" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32 bg-white/5" />
                  <Skeleton className="h-3 w-48 bg-white/5" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-12 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
              <MessageCircle className="h-8 w-8 text-gray-600" />
            </div>
            <p className="text-sm font-bold text-white">Nenhuma conversa</p>
            <p className="text-xs text-gray-500 mt-1 max-w-[220px]">
              {role === USER_ROLE.DRIVER
                ? "Suas conversas com passageiros aparecerão aqui quando aceitar corridas"
                : "Suas conversas com motoristas aparecerão aqui quando solicitar viagens"}
            </p>
          </motion.div>
        ) : (
          <AnimatePresence>
            <div className="space-y-2">
              {filtered.map((chat, i) => {
                const status =
                  statusConfig[chat.ride_status] || statusConfig.pending;
                const isActive = ([
                  RIDE_STATUS.PENDING,
                  RIDE_STATUS.DRIVER_ACCEPTED,
                  RIDE_STATUS.IN_PROGRESS,
                ] as string[]).includes(chat.ride_status);

                return (
                  <motion.div
                    key={chat.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => handleOpenChat(chat)}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-2xl cursor-pointer transition-all border",
                      isActive
                        ? "bg-white/[0.03] border-white/10 hover:bg-white/[0.06]"
                        : "bg-white/[0.01] border-white/5 hover:bg-white/[0.04]",
                      chat.unread_count > 0 &&
                        "border-teal-500/20 bg-teal-500/[0.03]",
                    )}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div
                        className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center text-white text-sm font-bold",
                          isActive
                            ? "bg-gradient-to-br from-teal-500 to-cyan-500"
                            : "bg-white/10",
                        )}
                      >
                        {chat.other_user_avatar ? (
                          <img
                            src={chat.other_user_avatar}
                            alt=""
                            className="h-full w-full object-cover rounded-xl"
                          />
                        ) : (
                          (chat.other_user_name ?? '?').charAt(0)
                        )}
                      </div>
                      {/* Type badge */}
                      <div
                        className={cn(
                          "absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#12181B]",
                          chat.ride_type === "viagem"
                            ? "bg-teal-500"
                            : "bg-amber-500",
                        )}
                      >
                        {chat.ride_type === "viagem" ? (
                          <Car className="h-2.5 w-2.5 text-white" />
                        ) : (
                          <Package className="h-2.5 w-2.5 text-white" />
                        )}
                      </div>
                      {/* Online indicator for active */}
                      {chat.ride_status === RIDE_STATUS.IN_PROGRESS && (
                        <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#12181B] animate-pulse" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <p
                          className={cn(
                            "text-sm truncate",
                            chat.unread_count > 0
                              ? "font-bold text-white"
                              : "font-medium text-gray-200",
                          )}
                        >
                          {chat.other_user_name}
                        </p>
                        <span className="text-[10px] text-gray-500 shrink-0">
                          {getTimeLabel(chat.last_message_at)}
                        </span>
                      </div>

                      {/* Route info */}
                      <div className="flex items-center gap-1 mb-1">
                        <MapPin className="h-2.5 w-2.5 text-gray-500 shrink-0" />
                        <p className="flex items-center gap-1 text-[10px] text-gray-500 truncate">
                          <span className="truncate">{chat.ride_origin}</span>
                          <ArrowRight className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
                          <span className="truncate">{chat.ride_destination}</span>
                        </p>
                      </div>

                      {/* Last message + unread */}
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className={cn(
                            "text-xs truncate",
                            chat.unread_count > 0
                              ? "text-gray-200 font-medium"
                              : "text-gray-500",
                          )}
                        >
                          {chat.last_message}
                        </p>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {chat.unread_count > 0 && (
                            <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-teal-500 text-white text-[10px] font-bold flex items-center justify-center">
                              {chat.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right side — status + price */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <Badge
                        className={cn(
                          "text-[9px] px-1.5 py-0.5 rounded-lg border-0",
                          status.bg,
                          status.color,
                        )}
                      >
                        {status.label}
                      </Badge>
                      <span className="text-[11px] font-semibold text-emerald-400">
                        R$ {chat.ride_price.toFixed(2)}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        )}

        {/* Quick action */}
        {filtered.some((c) => c.ride_status === RIDE_STATUS.IN_PROGRESS) && (
          <div className="rounded-2xl border border-teal-500/20 bg-teal-500/5 p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 flex items-center justify-center shrink-0">
              <Phone className="h-4 w-4 text-teal-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-teal-400">
                Corrida em andamento
              </p>
              <p className="text-[10px] text-gray-400">
                {role === USER_ROLE.DRIVER
                  ? "Comunique-se com seu passageiro em tempo real"
                  : "Acompanhe e converse com seu motorista"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function getTimeLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
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
