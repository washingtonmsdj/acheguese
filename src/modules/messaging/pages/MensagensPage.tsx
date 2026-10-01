import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowLeft,
  Building2,
  Loader2,
  MessageCircle,
  Search,
  Send,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import {
  getMessagingProvider,
  isMessagingProviderId,
  messagingRoutes,
  type MessagingInboxMessage,
  type MessagingInboxProvider,
  type MessagingInboxThread,
  type MessagingProviderId,
} from "@/core/messaging";
import { useSessionContext } from "@/core/session/hooks/useSessionContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/utils/cn";
import { logger } from "@/shared/utils/logger";
import { ActiveProfileIdentity, type ActiveProfileIdentityData } from "@/shared/components/ActiveProfileIdentity";
import "./MensagensPage.css";

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function initials(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export interface MensagensPageProps {
  providerIds: readonly MessagingProviderId[];
}

export type MessagingScreenProvider = Omit<MessagingInboxProvider, "subscribeToThread"> & {
  subscribeToThread(threadId: string, callback: (message: MessagingInboxMessage) => void): { unsubscribe(): void };
};

export default function MensagensPage({ providerIds }: MensagensPageProps) {
  const { activeProfile, isLoading } = useSessionContext();
  const providers = useMemo(
    () => providerIds.map(getMessagingProvider).filter((provider): provider is MessagingInboxProvider => provider !== null),
    [providerIds],
  );
  return <MessagingInboxScreen providers={providers} activeProfile={activeProfile} sessionLoading={isLoading} />;
}

/** Shared screen; real and isolated preview adapters supply the same contract. */
export function MessagingInboxScreen({ providers, activeProfile, sessionLoading = false }: {
  providers: readonly MessagingScreenProvider[];
  activeProfile: ActiveProfileIdentityData | null;
  sessionLoading?: boolean;
}) {
  const navigate = useNavigate();
  const { providerId, threadId } = useParams<{
    providerId?: string;
    threadId?: string;
  }>();

  const [threads, setThreads] = useState<MessagingInboxThread[]>([]);
  const [messages, setMessages] = useState<MessagingInboxMessage[]>([]);
  const [search, setSearch] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const draftKey = `${activeProfile?.id ?? ""}:${providerId ?? ""}:${threadId ?? ""}`;
  const draft = drafts[draftKey] ?? "";
  const setDraft = (value: string) => setDrafts((current) => ({ ...current, [draftKey]: value }));
  const [inboxLoading, setInboxLoading] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const followLatestRef = useRef(true);
  const [awayFromLatest, setAwayFromLatest] = useState(false);
  const visibleThreads = unreadOnly ? threads.filter((thread) => thread.unreadCount > 0) : threads;

  const showLatestMessages = useCallback(() => {
    followLatestRef.current = true;
    setAwayFromLatest(false);
    const list = messageListRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, []);

  useEffect(() => {
    if (followLatestRef.current) showLatestMessages();
  }, [messages, threadLoading, showLatestMessages]);

  const activeProvider = useMemo<MessagingScreenProvider | null>(() => {
    if (!isMessagingProviderId(providerId)) return null;
    return providers.find((provider) => provider.id === providerId) ?? null;
  }, [providerId, providers]);

  const selectedThread = useMemo(
    () =>
      threads.find(
        (thread) =>
          thread.providerId === providerId && thread.threadId === threadId,
      ) ?? null,
    [providerId, threadId, threads],
  );

  const loadInbox = useCallback(async () => {
    if (!activeProfile) {
      setThreads([]);
      setInboxLoading(false);
      return;
    }

    setInboxLoading(true);
    setError(null);
    try {
      const pages = await Promise.all(
        providers.map((provider) =>
          provider.listThreads({
            profileId: activeProfile.id,
            limit: 40,
            search: search.trim() || undefined,
          }),
        ),
      );

      const nextThreads = pages
        .flatMap((page) => page.items)
        .sort(
          (a, b) =>
            new Date(b.lastMessageAt).getTime() -
            new Date(a.lastMessageAt).getTime(),
        );
      setThreads(nextThreads);
    } catch (cause) {
      logger.error("[MessagingInbox] failed to load threads", cause);
      setError("Não foi possível carregar suas conversas.");
    } finally {
      setInboxLoading(false);
    }
  }, [activeProfile, providers, search]);

  useEffect(() => {
    const timeout = globalThis.setTimeout(() => {
      void loadInbox();
    }, search ? 250 : 0);

    return () => globalThis.clearTimeout(timeout);
  }, [loadInbox, search]);

  useEffect(() => {
    if (!providerId || !threadId || !activeProfile) {
      setMessages([]);
      return;
    }

    if (!activeProvider) {
      navigate(messagingRoutes.inbox(), { replace: true });
      return;
    }

    let disposed = false;
    followLatestRef.current = true;
    setAwayFromLatest(false);
    setMessages([]);
    setThreadLoading(true);
    setError(null);

    void activeProvider
      .listMessagePage({
        profileId: activeProfile.id,
        threadId,
        limit: 50,
      })
      .then(async (page) => {
        if (disposed) return;
        setMessages(page.items);
        await activeProvider.markThreadRead(activeProfile.id, threadId);
        if (!disposed) {
          setThreads((current) =>
            current.map((thread) =>
              thread.providerId === providerId && thread.threadId === threadId
                ? { ...thread, unreadCount: 0 }
                : thread,
            ),
          );
        }
      })
      .catch((cause) => {
        if (disposed) return;
        logger.error("[MessagingInbox] failed to load thread", cause);
        setError("Não foi possível abrir esta conversa.");
      })
      .finally(() => {
        if (!disposed) setThreadLoading(false);
      });

    const subscription = activeProvider.subscribeToThread(threadId, (message) => {
      if (disposed) return;
      setMessages((current) =>
        current.some((item) => item.id === message.id)
          ? current
          : [...current, message],
      );
      setThreads((current) =>
        current
          .map((thread) =>
            thread.providerId === providerId && thread.threadId === threadId
              ? {
                  ...thread,
                  lastMessageAt: message.createdAt,
                  lastMessageText: message.body,
                  unreadCount: 0,
                }
              : thread,
          )
          .sort(
            (a, b) =>
              new Date(b.lastMessageAt).getTime() -
              new Date(a.lastMessageAt).getTime(),
          ),
      );
      void activeProvider.markThreadRead(activeProfile.id, threadId);
    });

    return () => {
      disposed = true;
      subscription.unsubscribe();
    };
  }, [activeProfile, activeProvider, navigate, providerId, threadId]);

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      !activeProfile ||
      !activeProvider ||
      !threadId ||
      !draft.trim() ||
      sending || threadLoading
    ) {
      return;
    }

    setSending(true);
    setError(null);
    try {
      const message = await activeProvider.sendMessage({
        profileId: activeProfile.id,
        threadId,
        body: draft,
      });
      setDraft("");
      followLatestRef.current = true;
      setMessages((current) =>
        current.some((item) => item.id === message.id)
          ? current
          : [...current, message],
      );
      setThreads((current) =>
        current
          .map((thread) =>
            thread.providerId === providerId && thread.threadId === threadId
              ? {
                  ...thread,
                  lastMessageAt: message.createdAt,
                  lastMessageText: message.body,
                  unreadCount: 0,
                }
              : thread,
          )
          .sort(
            (a, b) =>
              new Date(b.lastMessageAt).getTime() -
              new Date(a.lastMessageAt).getTime(),
          ),
      );
    } catch (cause) {
      logger.error("[MessagingInbox] failed to send message", cause);
      setError("Não foi possível enviar a mensagem.");
    } finally {
      setSending(false);
    }
  }

  if (sessionLoading) {
    return (
      <main
        id="main-content"
        className="flex min-h-[100dvh] items-center justify-center bg-background"
      >
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </main>
    );
  }

  if (!activeProfile) {
    return (
      <main
        id="main-content"
        className="mx-auto flex min-h-[100dvh] max-w-xl items-center px-5"
      >
        <div className="w-full rounded-2xl border bg-card p-6 text-center">
          <MessageCircle className="mx-auto h-8 w-8 text-primary" />
          <h1 className="mt-4 text-xl font-semibold">Mensagens</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Selecione um perfil ativo para acessar suas conversas.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      id="main-content"
      data-page="messaging-inbox"
      className="messaging-inbox min-h-0 bg-background text-foreground"
    >
      <header className="messaging-inbox__profile" aria-label="Perfil usado nesta caixa de mensagens">
        <ActiveProfileIdentity profile={activeProfile} context="conversando como" />
      </header>
      <div className="mx-auto grid h-full w-full max-w-7xl md:grid-cols-[22rem_minmax(0,1fr)]">
        <aside
          aria-label="Conversas"
          aria-busy={inboxLoading}
          className={cn(
            "min-h-0 border-r bg-card/40",
            threadId ? "hidden md:flex md:flex-col" : "flex flex-col",
          )}
        >
          <div className="border-b p-4">
            <div className="flex items-center gap-3">
              <MessageCircle className="h-5 w-5 text-primary" />
              <div>
                <h1 className="font-semibold">Mensagens</h1>
              </div>
            </div>
            <div className="relative mt-4">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar conversa"
                className="pl-9"
                aria-label="Buscar conversas"
              />
            </div>
            <label className="mt-3 flex min-h-11 items-center gap-2 text-sm text-foreground">
              <input type="checkbox" checked={unreadOnly} onChange={(event) => setUnreadOnly(event.target.checked)} className="h-4 w-4 accent-primary" />
              Somente não lidas
            </label>
            {error && !threadId ? (
              <p className="mt-3 text-sm text-destructive" role="alert">{error}</p>
            ) : null}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {inboxLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : visibleThreads.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                {error ? "Suas conversas não puderam ser carregadas." : unreadOnly ? "Nenhuma conversa não lida nesta busca." : search.trim() ? "Nenhuma conversa corresponde à sua busca." : "Nenhuma conversa ainda."}
              </div>
            ) : (
              <div className="divide-y">
                {visibleThreads.map((thread) => (
                  <button
                    key={`${thread.providerId}:${thread.threadId}`}
                    type="button"
                    aria-pressed={selectedThread?.threadId === thread.threadId && selectedThread.providerId === thread.providerId}
                    onClick={() => navigate(messagingRoutes.thread(thread.providerId, thread.threadId))}
                    className={cn(
                      "flex w-full gap-3 p-3 text-left transition hover:bg-accent/60 sm:p-4",
                      selectedThread?.threadId === thread.threadId &&
                        selectedThread.providerId === thread.providerId &&
                        "bg-accent",
                    )}
                  >
                    <Avatar className="h-11 w-11">
                      <AvatarImage
                        src={thread.avatarUrl ?? undefined}
                        alt=""
                      />
                      <AvatarFallback>
                        {initials(thread.title) || (
                          <Building2 className="h-4 w-4" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-sm font-semibold">
                          {thread.title}
                        </p>
                        <span className="shrink-0 text-[0.68rem] text-muted-foreground">
                          {formatTimestamp(thread.lastMessageAt)}
                        </span>
                      </div>
                      {thread.subtitle ? (
                        <p className="truncate text-xs text-muted-foreground">
                          {thread.subtitle}
                        </p>
                      ) : null}
                      <div className="mt-1 flex items-center gap-2">
                        <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                          {thread.lastMessageText || "Conversa iniciada"}
                        </p>
                        {thread.unreadCount > 0 ? (
                          <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[0.65rem] font-semibold text-primary-foreground">
                            {thread.unreadCount}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        <section
          aria-label="Conversa selecionada"
          className={cn(
            "min-h-0 flex-col",
            threadId ? "flex" : "hidden md:flex",
          )}
        >
          {!threadId ? (
            <div className="flex flex-1 items-center justify-center p-8 text-center">
              <div>
                <MessageCircle className="mx-auto h-9 w-9 text-muted-foreground" />
                <h2 className="mt-4 font-semibold">Selecione uma conversa</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Suas conversas com empresas aparecem aqui.
                </p>
              </div>
            </div>
          ) : (
            <>
              <header className="flex min-h-16 items-center gap-3 border-b px-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => navigate(messagingRoutes.inbox())}
                  aria-label="Voltar para conversas"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Avatar className="h-9 w-9">
                  <AvatarImage
                    src={selectedThread?.avatarUrl ?? undefined}
                    alt=""
                  />
                  <AvatarFallback>
                    {initials(selectedThread?.title ?? "") || (
                      <Building2 className="h-4 w-4" />
                    )}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <h2 className="break-words text-sm font-semibold">
                    {selectedThread?.title ?? "Conversa"}
                  </h2>
                  <p className="truncate text-xs text-muted-foreground">
                    {selectedThread?.subtitle ?? "Mensagem privada"}
                  </p>
                </div>
              </header>

              <div
                ref={messageListRef}
                role="log"
                aria-label="Histórico da conversa"
                aria-live="polite"
                aria-busy={threadLoading}
                onScroll={(event) => {
                  const list = event.currentTarget;
                  const away = list.scrollHeight - list.scrollTop - list.clientHeight > 80;
                  followLatestRef.current = !away;
                  setAwayFromLatest(away);
                }}
                className="messaging-inbox__messages min-h-0 flex-1 overflow-y-auto p-3 sm:p-4"
              >
                {threadLoading ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="mx-auto max-w-sm py-12 text-center text-sm text-muted-foreground">
                    Inicie a conversa. Não compartilhe senhas, códigos de
                    autenticação ou dados financeiros sensíveis.
                  </div>
                ) : (
                  <div className="mx-auto flex max-w-3xl flex-col gap-2">
                    {messages.map((message) => {
                      const own = message.senderProfileId === activeProfile.id;
                      return (
                        <div
                          key={message.id}
                          className={cn(
                            "flex",
                            own ? "justify-end" : "justify-start",
                          )}
                        >
                          <div
                            className={cn(
                              "max-w-[82%] rounded-2xl px-3 py-2 text-sm",
                              own
                                ? "bg-primary/10 text-foreground"
                                : "bg-muted",
                            )}
                          >
                            <p className="whitespace-pre-wrap break-words">
                              {message.isRemoved
                                ? "Mensagem removida"
                                : message.body}
                            </p>
                            <p className="mt-1 text-[0.65rem] text-muted-foreground">
                              {formatTimestamp(message.createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {awayFromLatest ? (
                <div className="flex shrink-0 justify-center border-t bg-card px-3 py-1">
                  <Button type="button" variant="ghost" onClick={showLatestMessages}>Ir para mensagens recentes</Button>
                </div>
              ) : null}

              <form
                onSubmit={handleSend}
                className="border-t bg-background p-3 sm:p-4"
              >
                {error ? (
                  <p className="mb-2 text-xs text-destructive" role="alert">
                    {error}
                  </p>
                ) : null}
                {selectedThread?.closedAt || selectedThread?.blockedByMe || selectedThread?.blockedByOther ? (
                  <p role="status" className="mb-2 text-sm text-muted-foreground">
                    {selectedThread.closedAt ? "Esta conversa está encerrada." : "O envio está indisponível nesta conversa por bloqueio."}
                  </p>
                ) : null}
                <div className="mx-auto flex max-w-3xl items-end gap-2">
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="Escreva uma mensagem"
                    rows={2}
                    className="messaging-inbox__draft"
                    maxLength={4000}
                    disabled={
                      sending || threadLoading ||
                      selectedThread?.blockedByMe ||
                      selectedThread?.blockedByOther ||
                      Boolean(selectedThread?.closedAt)
                    }
                    aria-label="Mensagem"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={
                      sending || threadLoading ||
                      !draft.trim() ||
                      selectedThread?.blockedByMe ||
                      selectedThread?.blockedByOther ||
                      Boolean(selectedThread?.closedAt)
                    }
                    aria-label="Enviar mensagem"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="mx-auto mt-2 max-w-3xl text-xs text-muted-foreground">Mensagens de texto · anexos ainda não disponíveis.</p>
              </form>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
