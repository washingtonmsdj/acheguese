import { type ElementType, type RefObject } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  BadgeCheck,
  Bike,
  Car,
  Check,
  CheckCheck,
  Flag,
  Home,
  Info,
  Laptop,
  MapPin,
  MessageCircle,
  MoreVertical,
  Package,
  Paperclip,
  Phone,
  Send,
  Shield,
  ShieldAlert,
  Shirt,
  Smile,
  Sofa,
  Star,
  X,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog';
import { cn } from '@/shared/utils/cn';
import {
  formatDateSeparator,
  formatMessageTime,
  getInitials,
  lastSeenText,
  type ClassifiedChatSeller,
  type GroupedMessages,
  type MockClassified,
} from './ClassificadoChatLandingPage.model';

const CATEGORY_ICONS: Record<string, ElementType> = {
  veiculos: Car,
  imoveis: Home,
  eletronicos: Laptop,
  roupas: Shirt,
  moveis: Sofa,
  esportes: Bike,
  outros: Package,
};

function getCategoryIcon(category: string): ElementType {
  return CATEGORY_ICONS[category] ?? Package;
}

export function ClassifiedChatNotFound() {
  const navigate = useNavigate();
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
        <h1 className="text-2xl font-bold text-foreground mb-2 font-heading">Conversa nÃ£o encontrada</h1>
        <p className="text-muted-foreground mb-6">O anÃºncio que vocÃª procura nÃ£o existe ou foi removido.</p>
        <Button
          onClick={() => navigate('/classificados')}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Ver classificados
        </Button>
      </div>
    </div>
  );
}

interface ChatHeaderProps {
  ad: MockClassified;
  seller: ClassifiedChatSeller;
  classifiedId?: string;
  showAdInfo: boolean;
  onToggleAdInfo: () => void;
  onShowAdInfo: () => void;
  onReport: () => void;
  onBlock: () => void;
}

export function ClassifiedChatHeader({
  ad,
  seller,
  classifiedId,
  showAdInfo,
  onToggleAdInfo,
  onShowAdInfo,
  onReport,
  onBlock,
}: ChatHeaderProps) {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border shrink-0">
      <div className="max-w-3xl mx-auto flex items-center gap-3 px-3 sm:px-4 h-16">
        <button
          onClick={() => navigate(`/classificado/${classifiedId}`)}
          className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors shrink-0"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>

        <div className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer" onClick={onToggleAdInfo}>
          <div className="relative shrink-0">
            {seller.avatar ? (
              <img src={seller.avatar} alt={seller.name} className="h-10 w-10 rounded-xl object-cover border-2 border-border" />
            ) : (
              <div className="h-10 w-10 rounded-xl border-2 border-border bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-sm">
                {getInitials(seller.name)}
              </div>
            )}
            <span
              className={cn(
                'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card',
                seller.is_online ? 'bg-success' : 'bg-muted-foreground/40',
              )}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-bold text-foreground truncate">{seller.name}</p>
              {seller.is_verified && <BadgeCheck className="h-4 w-4 text-primary shrink-0" />}
            </div>
            <p className="text-[11px] text-muted-foreground truncate">
              {lastSeenText(seller.last_seen, seller.is_online)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <a
            href={`https://wa.me/55${seller.whatsapp}?text=${encodeURIComponent(`OlÃ¡! Vi seu anÃºncio "${ad.titulo}" e tenho interesse.`)}`}
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
              <DropdownMenuItem onClick={() => navigate(`/classificado/${classifiedId}`)}>
                <Package className="h-4 w-4 mr-2" />
                Ver anÃºncio
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onShowAdInfo}>
                <Info className="h-4 w-4 mr-2" />
                InformaÃ§Ãµes do anÃºncio
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onReport} className="text-warning focus:text-warning">
                <Flag className="h-4 w-4 mr-2" />
                Denunciar conversa
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onBlock} className="text-destructive focus:text-destructive">
                <ShieldAlert className="h-4 w-4 mr-2" />
                Bloquear vendedor
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {showAdInfo ? null : null}
    </header>
  );
}

export function ClassifiedChatAdInfoPanel({
  ad,
  seller,
  show,
  onClose,
}: {
  ad: MockClassified;
  seller: ClassifiedChatSeller;
  show: boolean;
  onClose: () => void;
}) {
  const CatIcon = getCategoryIcon(ad.categoria);
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden border-b border-border bg-card/80 backdrop-blur-sm shrink-0"
        >
          <div className="max-w-3xl mx-auto px-3 sm:px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 rounded-xl bg-secondary overflow-hidden shrink-0 border border-border">
                {ad.foto ? (
                  <img src={ad.foto} alt={ad.titulo} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                    <CatIcon className="h-7 w-7 text-primary/30" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{ad.titulo}</p>
                <p className="text-lg font-bold text-primary">R$ {ad.preco.toLocaleString('pt-BR')}</p>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {ad.bairro}
                  </span>
                  <Badge variant="outline" className="text-[10px] h-5 bg-success/10 text-success border-success/20">
                    DisponÃ­vel
                  </Badge>
                </div>
              </div>
              <button onClick={onClose} className="h-7 w-7 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>

            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Star className="h-3.5 w-3.5 text-primary fill-primary" />
                <span className="font-semibold text-foreground">{seller.rating.toFixed(1)}</span>
                <span>({seller.reviews_count} avaliaÃ§Ãµes)</span>
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
  );
}

export function ClassifiedChatSafetyBanner() {
  return (
    <div className="shrink-0 bg-warning/5 border-b border-warning/15">
      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-2 flex items-center justify-center gap-2">
        <Shield className="h-3.5 w-3.5 text-warning shrink-0" />
        <p className="text-[11px] text-muted-foreground text-center">
          Negocie pelo chat. NÃ£o compartilhe dados pessoais. Encontre-se em locais pÃºblicos.
        </p>
      </div>
    </div>
  );
}

interface MessagesAreaProps {
  ad: MockClassified;
  seller: ClassifiedChatSeller;
  groupedMessages: GroupedMessages[];
  messagesLength: number;
  currentUserId: string;
  sending: boolean;
  messagesEndRef: RefObject<HTMLDivElement>;
  onReport: () => void;
}

export function ClassifiedChatMessagesArea({
  ad,
  seller,
  groupedMessages,
  messagesLength,
  currentUserId,
  sending,
  messagesEndRef,
  onReport,
}: MessagesAreaProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 space-y-1">
        {messagesLength === 0 && (
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
            <div className="flex items-center justify-center my-4">
              <span className="bg-secondary text-muted-foreground text-[11px] font-medium px-3 py-1 rounded-full border border-border">
                {formatDateSeparator(group.messages[0].created_at)}
              </span>
            </div>

            {group.messages.map((msg, i) => {
              if (msg.type === 'system') {
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
                group.messages[i - 1].type !== 'system';

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className={cn('flex', isConsecutive ? 'mt-0.5' : 'mt-3', isMine ? 'justify-end' : 'justify-start')}
                >
                  {!isMine && !isConsecutive && (
                    <div className="mr-2 mt-auto shrink-0">
                      <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-[10px]">
                        {getInitials(seller.name)}
                      </div>
                    </div>
                  )}
                  {!isMine && isConsecutive && <div className="w-9 shrink-0" />}

                  <div className="group relative max-w-[75%] sm:max-w-[65%]">
                    <div
                      className={cn(
                        'px-3.5 py-2.5 text-sm leading-relaxed',
                        isMine
                          ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-md'
                          : 'bg-card border border-border text-foreground rounded-2xl rounded-bl-md',
                        isConsecutive && isMine && 'rounded-tr-2xl',
                        isConsecutive && !isMine && 'rounded-tl-2xl',
                      )}
                    >
                      <p className="break-words whitespace-pre-wrap">{msg.text}</p>
                      <div className={cn('flex items-center gap-1 mt-1', isMine ? 'justify-end' : 'justify-start')}>
                        <span className={cn('text-[10px]', isMine ? 'text-primary-foreground/50' : 'text-muted-foreground')}>
                          {formatMessageTime(msg.created_at)}
                        </span>
                        {isMine && (
                          <span className="text-primary-foreground/50">
                            {msg.read_at ? <CheckCheck className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                          </span>
                        )}
                      </div>
                    </div>

                    {!isMine && (
                      <button
                        onClick={onReport}
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

        {sending && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 mt-2">
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
  );
}

export function ClassifiedChatQuickReplies({
  show,
  replies,
  onSend,
}: {
  show: boolean;
  replies: string[];
  onSend: (reply: string) => void;
}) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="shrink-0 border-t border-border bg-card/50 overflow-hidden"
        >
          <div className="max-w-3xl mx-auto px-3 sm:px-4 py-2.5">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
              {replies.map((reply) => (
                <button
                  key={reply}
                  onClick={() => onSend(reply)}
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
  );
}

export function ClassifiedChatInputArea({
  isBlocked,
  sending,
  newMessage,
  inputRef,
  onMessageChange,
  onSend,
  onAttachment,
  onEmoji,
}: {
  isBlocked: boolean;
  sending: boolean;
  newMessage: string;
  inputRef: RefObject<HTMLInputElement>;
  onMessageChange: (value: string) => void;
  onSend: () => void;
  onAttachment: () => void;
  onEmoji: () => void;
}) {
  if (isBlocked) {
    return (
      <div className="shrink-0 border-t border-destructive/20 bg-destructive/5">
        <div className="max-w-3xl mx-auto px-4 py-4 text-center">
          <p className="text-sm text-destructive font-semibold flex items-center justify-center gap-2">
            <ShieldAlert className="h-4 w-4" />
            Conversa bloqueada
          </p>
          <p className="text-xs text-muted-foreground mt-1">NÃ£o Ã© possÃ­vel enviar ou receber mensagens</p>
        </div>
      </div>
    );
  }

  return (
    <div className="shrink-0 border-t border-border bg-card">
      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSend();
          }}
          className="flex items-end gap-2"
        >
          <button
            type="button"
            className="h-10 w-10 rounded-xl bg-secondary hover:bg-secondary/80 flex items-center justify-center shrink-0 transition-colors"
            onClick={onAttachment}
          >
            <Paperclip className="h-4 w-4 text-muted-foreground" />
          </button>

          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={newMessage}
              onChange={(e) => onMessageChange(e.target.value)}
              placeholder="Escreva sua mensagem..."
              className="rounded-xl h-10 text-sm bg-secondary border-border pr-10 focus-visible:ring-primary/30"
              disabled={sending}
              autoComplete="off"
            />
            <button type="button" className="absolute right-2.5 top-1/2 -translate-y-1/2" onClick={onEmoji}>
              <Smile className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
            </button>
          </div>

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
  );
}

export function ClassifiedChatDialogs({
  reportDialogOpen,
  blockDialogOpen,
  onReportOpenChange,
  onBlockOpenChange,
  onReport,
  onBlock,
}: {
  reportDialogOpen: boolean;
  blockDialogOpen: boolean;
  onReportOpenChange: (open: boolean) => void;
  onBlockOpenChange: (open: boolean) => void;
  onReport: () => void;
  onBlock: () => void;
}) {
  return (
    <>
      <AlertDialog open={reportDialogOpen} onOpenChange={onReportOpenChange}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Denunciar conversa</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Tem certeza que deseja denunciar esta conversa? Nossa equipe irÃ¡ analisar o conteÃºdo e tomar as medidas necessÃ¡rias.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={onReport} className="bg-warning text-warning-foreground hover:bg-warning/90 rounded-lg">
              <Flag className="h-4 w-4 mr-2" />
              Denunciar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={blockDialogOpen} onOpenChange={onBlockOpenChange}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Bloquear vendedor</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Ao bloquear, nenhum dos dois poderÃ¡ enviar mensagens nesta conversa. VocÃª tambÃ©m pode denunciar a conversa se houver conteÃºdo inadequado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={onBlock} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-lg">
              <ShieldAlert className="h-4 w-4 mr-2" />
              Bloquear
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
