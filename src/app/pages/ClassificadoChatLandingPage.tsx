/**
 * ClassificadoChatLandingPage — Chat público de classificado
 * Estilo consistente com ClassificadoDetailLandingPage (dark + teal)
 * Rota: /classificado/:id/chat
 */

import { useParams, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Send,
  MessageCircle,
  Shield,
  MoreVertical,
  Flag,
  ShieldAlert,
  ImageIcon,
  Smile,
  Paperclip,
  Check,
  CheckCheck,
  Clock,
  MapPin,
  Star,
  BadgeCheck,
  Phone,
  ChevronRight,
  AlertTriangle,
  Package,
  Car,
  Home,
  Laptop,
  Shirt,
  Sofa,
  Bike,
  Info,
  X,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Badge } from "@/shared/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/shared/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { useAuth } from "@/core/auth/hooks/useAuth";
import { TERRITORY_CONFIG } from "@/config/territory";
import { cn } from "@/shared/utils/cn";
import { toast } from "sonner";

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  veiculos: Car,
  imoveis: Home,
  eletronicos: Laptop,
  roupas: Shirt,
  moveis: Sofa,
  esportes: Bike,
  outros: Package,
};

const getCategoryIcon = (category: string): React.ElementType =>
  CATEGORY_ICONS[category] ?? Package;

interface MockClassified {
  id: string;
  titulo: string;
  preco: number;
  categoria: string;
  bairro: string;
  foto: string | null;
  status: string;
  vendedor: {
    id: string;
    name: string;
    avatar: string | null;
    bairro: string;
    whatsapp: string;
    rating: number;
    reviews_count: number;
    is_verified: boolean;
    is_online: boolean;
    last_seen: string;
  };
}

const MOCK_CLASSIFIEDS: Record<string, MockClassified> = {
  "1": {
    id: "1",
    titulo: "iPhone 13 Pro 256GB",
    preco: 3200,
    categoria: "eletronicos",
    bairro: "Pituba",
    foto: null,
    status: "active",
    vendedor: {
      id: "seller-1",
      name: "Carlos Mendes",
      avatar: null,
      bairro: "Pituba",
      whatsapp: "71999991111",
      rating: 4.9,
      reviews_count: 23,
      is_verified: true,
      is_online: true,
      last_seen: new Date().toISOString(),
    },
  },
  "2": {
    id: "2",
    titulo: "Sofá 3 lugares retrátil e reclinável",
    preco: 850,
    categoria: "moveis",
    bairro: "Rio Vermelho",
    foto: null,
    status: "active",
    vendedor: {
      id: "seller-2",
      name: "Ana Paula Silva",
      avatar: null,
      bairro: "Rio Vermelho",
      whatsapp: "71988882222",
      rating: 4.7,
      reviews_count: 15,
      is_verified: true,
      is_online: false,
      last_seen: "2026-03-30T10:30:00Z",
    },
  },
  "3": {
    id: "3",
    titulo: "Bicicleta MTB Caloi Elite 30",
    preco: 1100,
    categoria: "esportes",
    bairro: "Ondina",
    foto: null,
    status: "active",
    vendedor: {
      id: "seller-3",
      name: "Roberto Lima",
      avatar: null,
      bairro: "Ondina",
      whatsapp: "71977773333",
      rating: 5.0,
      reviews_count: 8,
      is_verified: false,
      is_online: false,
      last_seen: "2026-03-29T18:00:00Z",
    },
  },
};

function getMockClassifiedById(classifiedId?: string): MockClassified | null {
  if (!classifiedId) {
    return null;
  }

  switch (classifiedId) {
    case "1":
      return MOCK_CLASSIFIEDS["1"];
    case "2":
      return MOCK_CLASSIFIEDS["2"];
    case "3":
      return MOCK_CLASSIFIEDS["3"];
    default:
      return null;
  }
}

interface MockMessage {
  id: string;
  text: string;
  sender_profile_id: string;
  created_at: string;
  read_at: string | null;
  type: "text" | "offer" | "system";
}

function generateMockMessages(sellerId: string): MockMessage[] {
  const now = Date.now();
  return [
    {
      id: "msg-sys-1",
      text: "Conversa iniciada. Negocie com respeito e segurança.",
      sender_profile_id: "system",
      created_at: new Date(now - 3600000 * 2).toISOString(),
      read_at: new Date(now - 3600000).toISOString(),
      type: "system",
    },
    {
      id: "msg-1",
      text: "Olá! Vi seu anúncio e tenho interesse. O produto ainda está disponível?",
      sender_profile_id: "current-user",
      created_at: new Date(now - 3600000 * 1.5).toISOString(),
      read_at: new Date(now - 3600000).toISOString(),
      type: "text",
    },
    {
      id: "msg-2",
      text: "Sim, está disponível! Está em perfeito estado. Quer marcar para ver?",
      sender_profile_id: sellerId,
      created_at: new Date(now - 3600000).toISOString(),
      read_at: new Date(now - 1800000).toISOString(),
      type: "text",
    },
    {
      id: "msg-3",
      text: "Ótimo! Qual seria o melhor horário e local para a gente se encontrar?",
      sender_profile_id: "current-user",
      created_at: new Date(now - 1800000).toISOString(),
      read_at: new Date(now - 900000).toISOString(),
      type: "text",
    },
    {
      id: "msg-4",
      text: "Pode ser amanhã à tarde, no Shopping da Bahia? Fica fácil para os dois.",
      sender_profile_id: sellerId,
      created_at: new Date(now - 900000).toISOString(),
      read_at: null,
      type: "text",
    },
  ];
}

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function formatDateSeparator(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffDays === 0) return "Hoje";
  if (diffDays === 1) return "Ontem";
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });
}

function lastSeenText(lastSeen: string, isOnline: boolean): string {
  if (isOnline) return "Online agora";
  const diff = Date.now() - new Date(lastSeen).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `Visto há ${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Visto há ${hours}h`;
  return `Visto há ${Math.floor(hours / 24)}d`;
}

const QUICK_REPLIES = [
  "Ainda está disponível?",
  "Aceita proposta?",
  "Pode enviar mais fotos?",
  "Onde podemos combinar?",
];


export default function ClassificadoChatLandingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [messages, setMessages] = useState<MockMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [showAdInfo, setShowAdInfo] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const ad = getMockClassifiedById(id);
  const seller = ad?.vendedor;
  const CatIcon = ad ? getCategoryIcon(ad.categoria) : Package;
  const currentUserId = user?.id || "current-user";

  useEffect(() => {
    if (seller) {
      setMessages(generateMockMessages(seller.id));
    }
  }, [seller]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = async (text?: string) => {
    const messageText = (text || newMessage).trim();
    if (!messageText || sending || isBlocked) return;

    setNewMessage("");
    setSending(true);
    setShowQuickReplies(false);

    const newMsg: MockMessage = {
      id: `msg-${Date.now()}`,
      text: messageText,
      sender_profile_id: currentUserId,
      created_at: new Date().toISOString(),
      read_at: null,
      type: "text",
    };

    setMessages((prev) => [...prev, newMsg]);

    setTimeout(() => {
      const responses = [
        "Claro! Me diga mais sobre o que precisa saber.",
        "Perfeito, podemos combinar sim!",
        "Vou verificar e já te respondo.",
        "Obrigado pelo interesse! 😊",
      ];
      const replyMsg: MockMessage = {
        id: `msg-${Date.now()}-reply`,
        text: responses[Math.floor(Math.random() * responses.length)],
        sender_profile_id: seller?.id || "seller",
        created_at: new Date().toISOString(),
        read_at: null,
        type: "text",
      };
      setMessages((prev) => [...prev, replyMsg]);
    }, 1500 + Math.random() * 2000);

    setSending(false);
    inputRef.current?.focus();
  };

  const handleReport = () => {
    toast.success("Denúncia enviada. Nossa equipe vai analisar.");
    setReportDialogOpen(false);
  };

  const handleBlock = () => {
    setIsBlocked(true);
    toast.success("Usuário bloqueado. Você não receberá mais mensagens.");
    setBlockDialogOpen(false);
  };

  if (!ad || !seller) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center h-14">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm font-medium">Voltar</span>
            </button>
          </div>
        </nav>
        <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
          <MessageCircle className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2 font-heading">
            Conversa não encontrada
          </h1>
          <p className="text-muted-foreground mb-6">
            O anúncio que você procura não existe ou foi removido.
          </p>
          <Button
            onClick={() => navigate("/classificados")}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Ver classificados
          </Button>
        </div>
      </div>
    );
  }

  const groupedMessages: { date: string; messages: MockMessage[] }[] = [];
  messages.forEach((msg) => {
    const dateKey = new Date(msg.created_at).toLocaleDateString("pt-BR");
    const lastGroup = groupedMessages[groupedMessages.length - 1];
    if (lastGroup && lastGroup.date === dateKey) {
      lastGroup.messages.push(msg);
    } else {
      groupedMessages.push({ date: dateKey, messages: [msg] });
    }
  });

  return (
    <div className="min-h-screen h-screen bg-background text-foreground flex flex-col">
      {/* ── HEADER ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border shrink-0">
        <div className="max-w-3xl mx-auto flex items-center gap-3 px-3 sm:px-4 h-16">
          {/* Back button */}
          <button
            onClick={() => navigate(`/classificado/${id}`)}
            className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors shrink-0"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>

          {/* Seller info */}
          <div
            className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
            onClick={() => setShowAdInfo(!showAdInfo)}
          >
            {/* Avatar */}
            <div className="relative shrink-0">
              {seller.avatar ? (
                <img
                  src={seller.avatar}
                  alt={seller.name}
                  className="h-10 w-10 rounded-xl object-cover border-2 border-border"
                />
              ) : (
                <div className="h-10 w-10 rounded-xl border-2 border-border bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-sm">
                  {getInitials(seller.name)}
                </div>
              )}
              {/* Online indicator */}
              <span
                className={cn(
                  "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card",
                  seller.is_online ? "bg-success" : "bg-muted-foreground/40"
                )}
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-bold text-foreground truncate">
                  {seller.name}
                </p>
                {seller.is_verified && (
                  <BadgeCheck className="h-4 w-4 text-primary shrink-0" />
                )}
              </div>
              <p className="text-[11px] text-muted-foreground truncate">
                {lastSeenText(seller.last_seen, seller.is_online)}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <a
              href={`https://wa.me/55${seller.whatsapp}?text=${encodeURIComponent(`Olá! Vi seu anúncio "${ad.titulo}" e tenho interesse.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="h-9 w-9 rounded-xl bg-success/10 flex items-center justify-center hover:bg-success/20 transition-colors"
            >
              <Phone className="h-4 w-4 text-success" />
            </a>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="h-9 w-9 rounded-xl hover:bg-secondary flex items-center justify-center transition-colors">
                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={() => navigate(`/classificado/${id}`)}>
                  <Package className="h-4 w-4 mr-2" />
                  Ver anúncio
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowAdInfo(true)}>
                  <Info className="h-4 w-4 mr-2" />
                  Informações do anúncio
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setReportDialogOpen(true)}
                  className="text-warning focus:text-warning"
                >
                  <Flag className="h-4 w-4 mr-2" />
                  Denunciar conversa
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setBlockDialogOpen(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <ShieldAlert className="h-4 w-4 mr-2" />
                  Bloquear vendedor
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* ── AD INFO PANEL (collapsible) ────────────────────────── */}
      <AnimatePresence>
        {showAdInfo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-b border-border bg-card/80 backdrop-blur-sm shrink-0"
          >
            <div className="max-w-3xl mx-auto px-3 sm:px-4 py-3">
              <div className="flex items-center gap-3">
                {/* Ad thumbnail */}
                <div className="h-16 w-16 rounded-xl bg-secondary overflow-hidden shrink-0 border border-border">
                  {ad.foto ? (
                    <img src={ad.foto} alt={ad.titulo} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                      <CatIcon className="h-7 w-7 text-primary/30" />
                    </div>
                  )}
                </div>
                {/* Ad details */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{ad.titulo}</p>
                  <p className="text-lg font-bold text-primary">
                    R$ {ad.preco.toLocaleString("pt-BR")}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {ad.bairro}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] h-5 bg-success/10 text-success border-success/20"
                    >
                      Disponível
                    </Badge>
                  </div>
                </div>
                {/* Close */}
                <button
                  onClick={() => setShowAdInfo(false)}
                  className="h-7 w-7 rounded-lg bg-secondary flex items-center justify-center shrink-0"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>

              {/* Seller stats mini */}
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Star className="h-3.5 w-3.5 text-primary fill-primary" />
                  <span className="font-semibold text-foreground">{seller.rating.toFixed(1)}</span>
                  <span>({seller.reviews_count} avaliações)</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  {seller.bairro}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SAFETY BANNER ──────────────────────────────────────── */}
      <div className="shrink-0 bg-warning/5 border-b border-warning/15">
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-2 flex items-center justify-center gap-2">
          <Shield className="h-3.5 w-3.5 text-warning shrink-0" />
          <p className="text-[11px] text-muted-foreground text-center">
            Negocie pelo chat. Não compartilhe dados pessoais. Encontre-se em locais públicos.
          </p>
        </div>
      </div>

      {/* ── MESSAGES AREA ──────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 space-y-1">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center py-16">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-4"
              >
                <MessageCircle className="h-10 w-10 text-primary" />
              </motion.div>
              <h3 className="text-lg font-bold text-foreground mb-1">Iniciar conversa</h3>
              <p className="text-sm text-muted-foreground max-w-[280px]">
                Envie uma mensagem para o vendedor sobre "{ad.titulo}"
              </p>
            </div>
          )}

          {groupedMessages.map((group) => (
            <div key={group.date}>
              {/* Date separator */}
              <div className="flex items-center justify-center my-4">
                <span className="bg-secondary text-muted-foreground text-[11px] font-medium px-3 py-1 rounded-full border border-border">
                  {formatDateSeparator(group.messages[0].created_at)}
                </span>
              </div>

              {group.messages.map((msg, i) => {
                if (msg.type === "system") {
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-center my-3"
                    >
                      <div className="bg-secondary/50 border border-border rounded-lg px-3 py-1.5 max-w-[85%]">
                        <p className="text-[11px] text-muted-foreground text-center flex items-center gap-1.5">
                          <Shield className="h-3 w-3 text-primary" />
                          {msg.text}
                        </p>
                      </div>
                    </motion.div>
                  );
                }

                const isMine = msg.sender_profile_id === currentUserId;
                const isConsecutive =
                  i > 0 &&
                  group.messages[i - 1].sender_profile_id === msg.sender_profile_id &&
                  group.messages[i - 1].type !== "system";

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      "flex",
                      isConsecutive ? "mt-0.5" : "mt-3",
                      isMine ? "justify-end" : "justify-start"
                    )}
                  >
                    {/* Avatar for other user (first in consecutive group) */}
                    {!isMine && !isConsecutive && (
                      <div className="mr-2 mt-auto shrink-0">
                        <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-[10px]">
                          {getInitials(seller.name)}
                        </div>
                      </div>
                    )}
                    {!isMine && isConsecutive && <div className="w-9 shrink-0" />}

                    <div
                      className={cn(
                        "group relative max-w-[75%] sm:max-w-[65%]",
                      )}
                    >
                      <div
                        className={cn(
                          "px-3.5 py-2.5 text-sm leading-relaxed",
                          isMine
                            ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md"
                            : "bg-card border border-border text-foreground rounded-2xl rounded-bl-md",
                          isConsecutive && isMine && "rounded-tr-2xl",
                          isConsecutive && !isMine && "rounded-tl-2xl"
                        )}
                      >
                        <p className="break-words whitespace-pre-wrap">{msg.text}</p>
                        <div
                          className={cn(
                            "flex items-center gap-1 mt-1",
                            isMine ? "justify-end" : "justify-start"
                          )}
                        >
                          <span
                            className={cn(
                              "text-[10px]",
                              isMine ? "text-primary-foreground/50" : "text-muted-foreground"
                            )}
                          >
                            {formatMessageTime(msg.created_at)}
                          </span>
                          {isMine && (
                            <span className="text-primary-foreground/50">
                              {msg.read_at ? (
                                <CheckCheck className="h-3.5 w-3.5" />
                              ) : (
                                <Check className="h-3.5 w-3.5" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Report button for other user */}
                      {!isMine && (
                        <button
                          onClick={() => setReportDialogOpen(true)}
                          className="absolute -right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 h-6 w-6 rounded-lg bg-secondary border border-border flex items-center justify-center transition-all"
                        >
                          <Flag className="h-3 w-3 text-muted-foreground" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ))}

          {/* Typing indicator (shown briefly after sending) */}
          {sending && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 mt-2"
            >
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-[10px] shrink-0">
                {getInitials(seller.name)}
              </div>
              <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="h-2 w-2 rounded-full bg-muted-foreground/40"
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ── QUICK REPLIES ──────────────────────────────────────── */}
      <AnimatePresence>
        {showQuickReplies && messages.length <= 5 && !isBlocked && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="shrink-0 border-t border-border bg-card/50 overflow-hidden"
          >
            <div className="max-w-3xl mx-auto px-3 sm:px-4 py-2.5">
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
                {QUICK_REPLIES.map((reply) => (
                  <button
                    key={reply}
                    onClick={() => handleSend(reply)}
                    className="shrink-0 text-xs font-medium bg-secondary hover:bg-secondary/80 text-foreground px-3.5 py-2 rounded-full border border-border transition-colors whitespace-nowrap"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── INPUT AREA ─────────────────────────────────────────── */}
      {isBlocked ? (
        <div className="shrink-0 border-t border-destructive/20 bg-destructive/5">
          <div className="max-w-3xl mx-auto px-4 py-4 text-center">
            <p className="text-sm text-destructive font-semibold flex items-center justify-center gap-2">
              <ShieldAlert className="h-4 w-4" />
              Conversa bloqueada
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Não é possível enviar ou receber mensagens
            </p>
          </div>
        </div>
      ) : (
        <div className="shrink-0 border-t border-border bg-card">
          <div className="max-w-3xl mx-auto px-3 sm:px-4 py-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-end gap-2"
            >
              {/* Attachment button */}
              <button
                type="button"
                className="h-10 w-10 rounded-xl bg-secondary hover:bg-secondary/80 flex items-center justify-center shrink-0 transition-colors"
                onClick={() => toast.info("Envio de fotos em breve!")}
              >
                <Paperclip className="h-4 w-4 text-muted-foreground" />
              </button>

              {/* Input */}
              <div className="flex-1 relative">
                <Input
                  ref={inputRef}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Escreva sua mensagem..."
                  className="rounded-xl h-10 text-sm bg-secondary border-border pr-10 focus-visible:ring-primary/30"
                  disabled={sending}
                  autoComplete="off"
                />
                <button
                  type="button"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2"
                  onClick={() => toast.info("Emojis em breve!")}
                >
                  <Smile className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                </button>
              </div>

              {/* Send button */}
              <motion.div whileTap={{ scale: 0.9 }}>
                <Button
                  type="submit"
                  size="icon"
                  className="h-10 w-10 rounded-xl shrink-0 bg-primary hover:bg-primary/90"
                  disabled={!newMessage.trim() || sending}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </motion.div>
            </form>
          </div>
        </div>
      )}

      {/* ── REPORT DIALOG ──────────────────────────────────────── */}
      <AlertDialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Denunciar conversa</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Tem certeza que deseja denunciar esta conversa? Nossa equipe irá analisar o conteúdo
              e tomar as medidas necessárias.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReport}
              className="bg-warning text-warning-foreground hover:bg-warning/90 rounded-lg"
            >
              <Flag className="h-4 w-4 mr-2" />
              Denunciar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── BLOCK DIALOG ───────────────────────────────────────── */}
      <AlertDialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Bloquear vendedor</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Ao bloquear, nenhum dos dois poderá enviar mensagens nesta conversa. Você também pode
              denunciar a conversa se houver conteúdo inadequado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBlock}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-lg"
            >
              <ShieldAlert className="h-4 w-4 mr-2" />
              Bloquear
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


