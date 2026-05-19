/**
 * ClassificadoChatLandingPage â€” Chat pÃºblico de classificado
 * Rota: /classificado/:id/chat
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/core/auth/hooks/useAuth';
import {
  buildMockReplyMessage,
  generateMockMessages,
  getMockClassifiedById,
  groupMessagesByDate,
  QUICK_REPLIES,
  type MockMessage,
} from './ClassificadoChatLandingPage.model';
import {
  ClassifiedChatAdInfoPanel,
  ClassifiedChatDialogs,
  ClassifiedChatHeader,
  ClassifiedChatInputArea,
  ClassifiedChatMessagesArea,
  ClassifiedChatNotFound,
  ClassifiedChatQuickReplies,
  ClassifiedChatSafetyBanner,
} from './ClassificadoChatLandingPage.sections';

export default function ClassificadoChatLandingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [messages, setMessages] = useState<MockMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
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
  const currentUserId = user?.id || 'current-user';

  useEffect(() => {
    if (seller) {
      setMessages(generateMockMessages(seller.id));
    }
  }, [seller]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = async (text?: string) => {
    const messageText = (text || newMessage).trim();
    if (!messageText || sending || isBlocked) return;

    setNewMessage('');
    setSending(true);
    setShowQuickReplies(false);

    const newMsg: MockMessage = {
      id: `msg-${Date.now()}`,
      text: messageText,
      sender_profile_id: currentUserId,
      created_at: new Date().toISOString(),
      read_at: null,
      type: 'text',
    };

    setMessages((prev) => [...prev, newMsg]);

    setTimeout(() => {
      setMessages((prev) => [...prev, buildMockReplyMessage(seller?.id)]);
    }, 1500 + Math.random() * 2000);

    setSending(false);
    inputRef.current?.focus();
  };

  const handleReport = () => {
    toast.success('DenÃºncia enviada. Nossa equipe vai analisar.');
    setReportDialogOpen(false);
  };

  const handleBlock = () => {
    setIsBlocked(true);
    toast.success('UsuÃ¡rio bloqueado. VocÃª nÃ£o receberÃ¡ mais mensagens.');
    setBlockDialogOpen(false);
  };

  if (!ad || !seller) {
    return <ClassifiedChatNotFound />;
  }

  const groupedMessages = groupMessagesByDate(messages);

  return (
    <div className="min-h-screen h-screen bg-background text-foreground flex flex-col">
      <ClassifiedChatHeader
        ad={ad}
        seller={seller}
        classifiedId={id}
        showAdInfo={showAdInfo}
        onToggleAdInfo={() => setShowAdInfo((prev) => !prev)}
        onShowAdInfo={() => setShowAdInfo(true)}
        onReport={() => setReportDialogOpen(true)}
        onBlock={() => setBlockDialogOpen(true)}
      />

      <ClassifiedChatAdInfoPanel
        ad={ad}
        seller={seller}
        show={showAdInfo}
        onClose={() => setShowAdInfo(false)}
      />

      <ClassifiedChatSafetyBanner />

      <ClassifiedChatMessagesArea
        ad={ad}
        seller={seller}
        groupedMessages={groupedMessages}
        messagesLength={messages.length}
        currentUserId={currentUserId}
        sending={sending}
        messagesEndRef={messagesEndRef}
        onReport={() => setReportDialogOpen(true)}
      />

      <ClassifiedChatQuickReplies
        show={showQuickReplies && messages.length <= 5 && !isBlocked}
        replies={QUICK_REPLIES}
        onSend={(reply) => void handleSend(reply)}
      />

      <ClassifiedChatInputArea
        isBlocked={isBlocked}
        sending={sending}
        newMessage={newMessage}
        inputRef={inputRef}
        onMessageChange={setNewMessage}
        onSend={() => void handleSend()}
        onAttachment={() => toast.info('Envio de fotos em breve!')}
        onEmoji={() => toast.info('Emojis em breve!')}
      />

      <ClassifiedChatDialogs
        reportDialogOpen={reportDialogOpen}
        blockDialogOpen={blockDialogOpen}
        onReportOpenChange={setReportDialogOpen}
        onBlockOpenChange={setBlockDialogOpen}
        onReport={handleReport}
        onBlock={handleBlock}
      />
    </div>
  );
}
