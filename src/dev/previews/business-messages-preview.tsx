import { createRoot } from "react-dom/client";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { PublicBrandHeader } from "@/app/components/navigation/PublicBrandHeader";
import { MessagingInboxScreen, type MessagingScreenProvider } from "@/modules/messaging/pages/MensagensPage";
import type { MessagingInboxThread, MessagingInboxMessage } from "@/core/messaging/inboxTypes";
import { LAUNCH_URLS } from "@/core/routing/config/territory";
import "@/index.css";

// Local-only data adapter. Never registered in the production provider registry.
const profile = { id: "preview-business", displayName: "Empresa de demonstração" };
const names = ["Ana Silva", "Carlos Mendes", "Mariana Costa", "José Almeida", "Fernanda Santos"];
const questions = ["Olá! Gostaria de saber se ainda há vagas.", "Quais são os horários de atendimento?", "Vocês oferecem atividades extras?", "Como faço para chegar?", "Preciso de informações sobre os serviços."];
const threads: MessagingInboxThread[] = names.map((name, index) => ({
  providerId: "business", threadId: `preview-${index}`, title: name,
  subtitle: "Conversa de exemplo", avatarUrl: null, counterpartyProfileId: `person-${index}`,
  lastMessageAt: `2026-10-01T10:${24 - index}:00-03:00`, lastMessageText: questions[index],
  unreadCount: index < 2 ? 1 : 0, blockedByMe: false, blockedByOther: false, closedAt: null,
}));
const messages: MessagingInboxMessage[] = threads.flatMap((thread, index) => [
  { providerId: "business" as const, id: `${thread.threadId}-1`, threadId: thread.threadId, senderProfileId: `person-${index}`, body: questions[index], isRemoved: false, createdAt: thread.lastMessageAt },
  { providerId: "business" as const, id: `${thread.threadId}-2`, threadId: thread.threadId, senderProfileId: profile.id, body: "Olá! Podemos ajudar. Qual informação você precisa?", isRemoved: false, createdAt: thread.lastMessageAt },
]);
const provider: MessagingScreenProvider = {
  id: "business", label: "Empresas",
  async listThreads(query) {
    return { items: threads.filter((thread) => `${thread.title} ${thread.lastMessageText}`.toLocaleLowerCase("pt-BR").includes((query.search ?? "").toLocaleLowerCase("pt-BR"))).map((thread) => ({ ...thread })), nextCursor: null };
  },
  async listMessagePage(query) { return { items: messages.filter((message) => message.threadId === query.threadId), nextCursor: null }; },
  async sendMessage(input) {
    const message: MessagingInboxMessage = { providerId: "business", id: crypto.randomUUID(), threadId: input.threadId, senderProfileId: input.profileId, body: input.body, isRemoved: false, createdAt: new Date().toISOString() };
    messages.push(message);
    const thread = threads.find((item) => item.threadId === input.threadId);
    if (thread) { thread.lastMessageText = message.body; thread.lastMessageAt = message.createdAt; }
    return message;
  },
  async markThreadRead(_profileId, threadId) { const thread = threads.find((item) => item.threadId === threadId); if (thread) thread.unreadCount = 0; },
  subscribeToThread() { return { unsubscribe() {} }; },
};
const providers = [provider];

createRoot(document.getElementById("root")!).render(
  <MemoryRouter initialEntries={["/mensagens/business/preview-0"]}>
    <div className="light pt-page messaging-shell">
      <PublicBrandHeader urls={LAUNCH_URLS} accountHref="/conta" />
      <p role="note" className="shrink-0 border-b px-4 py-2 text-xs text-muted-foreground">Demonstração: conversas fictícias. Envios ficam apenas nesta prévia e desaparecem ao recarregar.</p>
      <Routes>
        <Route path="/mensagens" element={<MessagingInboxScreen providers={providers} activeProfile={profile} />} />
        <Route path="/mensagens/:providerId/:threadId" element={<MessagingInboxScreen providers={providers} activeProfile={profile} />} />
      </Routes>
    </div>
  </MemoryRouter>,
);
