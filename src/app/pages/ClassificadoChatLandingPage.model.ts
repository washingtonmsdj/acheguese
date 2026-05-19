export interface ClassifiedChatSeller {
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
}

export interface MockClassified {
  id: string;
  titulo: string;
  preco: number;
  categoria: string;
  bairro: string;
  foto: string | null;
  status: string;
  vendedor: ClassifiedChatSeller;
}

export interface MockMessage {
  id: string;
  text: string;
  sender_profile_id: string;
  created_at: string;
  read_at: string | null;
  type: 'text' | 'offer' | 'system';
}

export interface GroupedMessages {
  date: string;
  messages: MockMessage[];
}

const MOCK_CLASSIFIEDS: Record<string, MockClassified> = {
  '1': {
    id: '1',
    titulo: 'iPhone 13 Pro 256GB',
    preco: 3200,
    categoria: 'eletronicos',
    bairro: 'Pituba',
    foto: null,
    status: 'active',
    vendedor: {
      id: 'seller-1',
      name: 'Carlos Mendes',
      avatar: null,
      bairro: 'Pituba',
      whatsapp: '71999991111',
      rating: 4.9,
      reviews_count: 23,
      is_verified: true,
      is_online: true,
      last_seen: new Date().toISOString(),
    },
  },
  '2': {
    id: '2',
    titulo: 'SofÃ¡ 3 lugares retrÃ¡til e reclinÃ¡vel',
    preco: 850,
    categoria: 'moveis',
    bairro: 'Rio Vermelho',
    foto: null,
    status: 'active',
    vendedor: {
      id: 'seller-2',
      name: 'Ana Paula Silva',
      avatar: null,
      bairro: 'Rio Vermelho',
      whatsapp: '71988882222',
      rating: 4.7,
      reviews_count: 15,
      is_verified: true,
      is_online: false,
      last_seen: '2026-03-30T10:30:00Z',
    },
  },
  '3': {
    id: '3',
    titulo: 'Bicicleta MTB Caloi Elite 30',
    preco: 1100,
    categoria: 'esportes',
    bairro: 'Ondina',
    foto: null,
    status: 'active',
    vendedor: {
      id: 'seller-3',
      name: 'Roberto Lima',
      avatar: null,
      bairro: 'Ondina',
      whatsapp: '71977773333',
      rating: 5.0,
      reviews_count: 8,
      is_verified: false,
      is_online: false,
      last_seen: '2026-03-29T18:00:00Z',
    },
  },
};

export const QUICK_REPLIES = [
  'Ainda estÃ¡ disponÃ­vel?',
  'Aceita proposta?',
  'Pode enviar mais fotos?',
  'Onde podemos combinar?',
];

export function getMockClassifiedById(classifiedId?: string): MockClassified | null {
  if (!classifiedId) return null;
  return MOCK_CLASSIFIEDS[classifiedId] ?? null;
}

export function generateMockMessages(sellerId: string): MockMessage[] {
  const now = Date.now();
  return [
    {
      id: 'msg-sys-1',
      text: 'Conversa iniciada. Negocie com respeito e seguranÃ§a.',
      sender_profile_id: 'system',
      created_at: new Date(now - 3600000 * 2).toISOString(),
      read_at: new Date(now - 3600000).toISOString(),
      type: 'system',
    },
    {
      id: 'msg-1',
      text: 'OlÃ¡! Vi seu anÃºncio e tenho interesse. O produto ainda estÃ¡ disponÃ­vel?',
      sender_profile_id: 'current-user',
      created_at: new Date(now - 3600000 * 1.5).toISOString(),
      read_at: new Date(now - 3600000).toISOString(),
      type: 'text',
    },
    {
      id: 'msg-2',
      text: 'Sim, estÃ¡ disponÃ­vel! EstÃ¡ em perfeito estado. Quer marcar para ver?',
      sender_profile_id: sellerId,
      created_at: new Date(now - 3600000).toISOString(),
      read_at: new Date(now - 1800000).toISOString(),
      type: 'text',
    },
    {
      id: 'msg-3',
      text: 'Ã“timo! Qual seria o melhor horÃ¡rio e local para a gente se encontrar?',
      sender_profile_id: 'current-user',
      created_at: new Date(now - 1800000).toISOString(),
      read_at: new Date(now - 900000).toISOString(),
      type: 'text',
    },
    {
      id: 'msg-4',
      text: 'Pode ser amanhÃ£ Ã  tarde, no Shopping da Bahia? Fica fÃ¡cil para os dois.',
      sender_profile_id: sellerId,
      created_at: new Date(now - 900000).toISOString(),
      read_at: null,
      type: 'text',
    },
  ];
}

export function groupMessagesByDate(messages: MockMessage[]): GroupedMessages[] {
  return messages.reduce<GroupedMessages[]>((groups, message) => {
    const dateKey = new Date(message.created_at).toLocaleDateString('pt-BR');
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.date === dateKey) {
      lastGroup.messages.push(message);
      return groups;
    }
    groups.push({ date: dateKey, messages: [message] });
    return groups;
  }, []);
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

export function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function formatDateSeparator(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffDays === 0) return 'Hoje';
  if (diffDays === 1) return 'Ontem';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
}

export function lastSeenText(lastSeen: string, isOnline: boolean): string {
  if (isOnline) return 'Online agora';
  const diff = Date.now() - new Date(lastSeen).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `Visto hÃ¡ ${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Visto hÃ¡ ${hours}h`;
  return `Visto hÃ¡ ${Math.floor(hours / 24)}d`;
}

export function buildMockReplyMessage(sellerId?: string): MockMessage {
  const responses = [
    'Claro! Me diga mais sobre o que precisa saber.',
    'Perfeito, podemos combinar sim!',
    'Vou verificar e jÃ¡ te respondo.',
    'Obrigado pelo interesse! ðŸ˜Š',
  ];

  return {
    id: `msg-${Date.now()}-reply`,
    text: responses[Math.floor(Math.random() * responses.length)],
    sender_profile_id: sellerId || 'seller',
    created_at: new Date().toISOString(),
    read_at: null,
    type: 'text',
  };
}
