/**
 * Mock completo do Portal Nordeste
 * 
 * Dados fictícios para todas as seções de comunicação territorial
 * representando um portal de notícias regional do Nordeste brasileiro
 */

// Tipos base
export interface MediaAgent {
  id: string;
  name: string;
  type: 'portal' | 'radio' | 'collective' | 'newspaper' | 'influencer' | 'community';
  territory: string;
  verified: boolean;
  followers: number;
  avatar: string;
  description: string;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    youtube?: string;
    website?: string;
  };
}

export interface Publication {
  id: string;
  title: string;
  excerpt: string;
  content?: string;
  author: MediaAgent;
  publishedAt: string;
  category: string;
  tags: string[];
  image?: string;
  views: number;
  likes: number;
  comments: number;
  territory: string;
  featured?: boolean;
  trending?: boolean;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  organizer: MediaAgent;
  date: string;
  time: string;
  location: string;
  territory: string;
  category: 'culture' | 'music' | 'art' | 'sport' | 'community';
  image?: string;
  attendees: number;
}

export interface CoverageArea {
  id: string;
  name: string;
  type: 'neighborhood' | 'city' | 'region';
  activeAgents: number;
  recentPublications: number;
  description: string;
}

// Mock do Portal Nordeste como agente principal
export const portalNordeste: MediaAgent = {
  id: 'portal-nordeste-001',
  name: 'Portal Nordeste',
  type: 'portal',
  territory: 'Nordeste',
  verified: true,
  followers: 125000,
  avatar: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=200',
  description: 'Portal de notícias regional cobrindo todo o Nordeste brasileiro. Jornalismo independente, cultura e comunidade.',
  socialLinks: {
    instagram: '@portalnordeste',
    facebook: 'PortalNordesteOficial',
    twitter: '@portalnordeste',
    youtube: 'PortalNordesteTV',
    website: 'https://portalnordeste.com.br'
  }
};

// Outros agentes de comunicação do Nordeste
export const nordesteAgents: MediaAgent[] = [
  {
    id: 'radio-sol-nascente',
    name: 'Rádio Sol Nascente',
    type: 'radio',
    territory: 'Recife, PE',
    verified: true,
    followers: 45000,
    avatar: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=200',
    description: 'Rádio comunitária de Recife. Música, cultura e informação local.'
  },
  {
    id: 'coletivo-maracatu',
    name: 'Coletivo Maracatu Digital',
    type: 'collective',
    territory: 'Olinda, PE',
    verified: true,
    followers: 32000,
    avatar: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200',
    description: 'Coletivo cultural dedicado à preservação e divulgação do maracatu.'
  },
  {
    id: 'jornal-sertao',
    name: 'Jornal do Sertão',
    type: 'newspaper',
    territory: 'Caruaru, PE',
    verified: true,
    followers: 28000,
    avatar: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=200',
    description: 'Jornal regional cobrindo o agreste e sertão pernambucano.'
  },
  {
    id: 'influencer-cultura-nordestina',
    name: 'Maria do Nordeste',
    type: 'influencer',
    territory: 'Salvador, BA',
    verified: true,
    followers: 89000,
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
    description: 'Criadora de conteúdo sobre cultura, gastronomia e tradições nordestinas.'
  },
  {
    id: 'midia-comunitaria-favela',
    name: 'Voz da Comunidade',
    type: 'community',
    territory: 'Fortaleza, CE',
    verified: false,
    followers: 15000,
    avatar: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=200',
    description: 'Mídia comunitária dando voz às periferias de Fortaleza.'
  },
  portalNordeste
];

// Publicações em destaque
export const featuredPublications: Publication[] = [
  {
    id: 'pub-001',
    title: 'São João 2024: Caruaru se prepara para maior festa junina do país',
    excerpt: 'Prefeitura anuncia programação com mais de 100 atrações e espera receber 2 milhões de visitantes durante o período festivo.',
    author: portalNordeste,
    publishedAt: '2024-05-10T08:00:00Z',
    category: 'Cultura',
    tags: ['São João', 'Caruaru', 'Festa Junina', 'Turismo'],
    image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800',
    views: 45000,
    likes: 3200,
    comments: 456,
    territory: 'Caruaru, PE',
    featured: true,
    trending: true
  },
  {
    id: 'pub-002',
    title: 'Novo corredor de ônibus BRT muda mobilidade em Recife',
    excerpt: 'Inauguração da linha Norte-Sul promete reduzir tempo de deslocamento em até 40% para moradores da periferia.',
    author: portalNordeste,
    publishedAt: '2024-05-09T14:30:00Z',
    category: 'Mobilidade',
    tags: ['Transporte', 'Recife', 'BRT', 'Infraestrutura'],
    image: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800',
    views: 32000,
    likes: 2100,
    comments: 287,
    territory: 'Recife, PE',
    featured: true
  },
  {
    id: 'pub-003',
    title: 'Artesãos do Alto do Moura ganham espaço em feira internacional',
    excerpt: 'Cerâmica de Caruaru será destaque em exposição na França, levando arte nordestina para o mundo.',
    author: nordesteAgents[3],
    publishedAt: '2024-05-08T10:15:00Z',
    category: 'Arte',
    tags: ['Artesanato', 'Cerâmica', 'Alto do Moura', 'Exportação'],
    image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800',
    views: 28000,
    likes: 1850,
    comments: 198,
    territory: 'Caruaru, PE',
    featured: true
  }
];

// Últimas publicações
export const latestPublications: Publication[] = [
  {
    id: 'pub-004',
    title: 'Chuvas intensas causam alagamentos em bairros de Fortaleza',
    excerpt: 'Defesa Civil emite alerta e orienta moradores de áreas de risco.',
    author: nordesteAgents[4],
    publishedAt: '2024-05-10T16:45:00Z',
    category: 'Emergência',
    tags: ['Chuva', 'Fortaleza', 'Defesa Civil', 'Alerta'],
    image: 'https://images.unsplash.com/photo-1527482797697-8795b05a13fe?w=800',
    views: 18000,
    likes: 890,
    comments: 156,
    territory: 'Fortaleza, CE'
  },
  {
    id: 'pub-005',
    title: 'Festival de Cinema do Recife anuncia programação 2024',
    excerpt: 'Evento traz 150 filmes de 30 países e homenageia cinema pernambucano.',
    author: portalNordeste,
    publishedAt: '2024-05-10T12:00:00Z',
    category: 'Cinema',
    tags: ['Cinema', 'Festival', 'Recife', 'Cultura'],
    image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800',
    views: 15000,
    likes: 1200,
    comments: 89,
    territory: 'Recife, PE'
  },
  {
    id: 'pub-006',
    title: 'Projeto social ensina programação para jovens da periferia',
    excerpt: 'Iniciativa já formou 200 alunos e garante empregabilidade de 80%.',
    author: nordesteAgents[4],
    publishedAt: '2024-05-09T18:20:00Z',
    category: 'Educação',
    tags: ['Tecnologia', 'Educação', 'Inclusão', 'Fortaleza'],
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800',
    views: 22000,
    likes: 1650,
    comments: 234,
    territory: 'Fortaleza, CE',
    trending: true
  },
  {
    id: 'pub-007',
    title: 'Maracatu Nação Pernambuco celebra 150 anos de tradição',
    excerpt: 'Cortejo especial reúne milhares de pessoas no centro de Olinda.',
    author: nordesteAgents[1],
    publishedAt: '2024-05-09T09:30:00Z',
    category: 'Cultura',
    tags: ['Maracatu', 'Olinda', 'Tradição', 'Carnaval'],
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800',
    views: 19000,
    likes: 1420,
    comments: 167,
    territory: 'Olinda, PE'
  },
  {
    id: 'pub-008',
    title: 'Feira de agricultura familiar movimenta economia local',
    excerpt: 'Produtores rurais vendem direto ao consumidor em novo espaço.',
    author: nordesteAgents[2],
    publishedAt: '2024-05-08T15:00:00Z',
    category: 'Economia',
    tags: ['Agricultura', 'Feira', 'Economia Local', 'Sertão'],
    image: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800',
    views: 12000,
    likes: 780,
    comments: 92,
    territory: 'Caruaru, PE'
  }
];

// Eventos culturais
export const culturalEvents: Event[] = [
  {
    id: 'event-001',
    title: 'Festival Pernambuco Nação Cultural',
    description: 'Três dias de música, dança, teatro e gastronomia celebrando a diversidade cultural pernambucana.',
    organizer: portalNordeste,
    date: '2024-06-15',
    time: '14:00',
    location: 'Parque Dona Lindu, Boa Viagem',
    territory: 'Recife, PE',
    category: 'culture',
    image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800',
    attendees: 5000
  },
  {
    id: 'event-002',
    title: 'Sarau Poético da Periferia',
    description: 'Encontro mensal de poetas, músicos e artistas da comunidade.',
    organizer: nordesteAgents[4],
    date: '2024-05-20',
    time: '19:00',
    location: 'Centro Cultural Bom Jardim',
    territory: 'Fortaleza, CE',
    category: 'art',
    image: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800',
    attendees: 200
  },
  {
    id: 'event-003',
    title: 'Campeonato de Futebol de Várzea',
    description: 'Final do torneio comunitário com times de 12 bairros.',
    organizer: nordesteAgents[4],
    date: '2024-05-25',
    time: '16:00',
    location: 'Campo do Conjunto Ceará',
    territory: 'Fortaleza, CE',
    category: 'sport',
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
    attendees: 1500
  },
  {
    id: 'event-004',
    title: 'Oficina de Cerâmica do Alto do Moura',
    description: 'Aprenda técnicas tradicionais com mestres artesãos.',
    organizer: nordesteAgents[3],
    date: '2024-06-01',
    time: '09:00',
    location: 'Alto do Moura',
    territory: 'Caruaru, PE',
    category: 'art',
    image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800',
    attendees: 30
  },
  {
    id: 'event-005',
    title: 'Show de Forró Pé de Serra',
    description: 'Noite especial com bandas tradicionais do forró nordestino.',
    organizer: nordesteAgents[0],
    date: '2024-06-10',
    time: '20:00',
    location: 'Pátio de São Pedro',
    territory: 'Recife, PE',
    category: 'music',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
    attendees: 3000
  }
];

// Áreas de cobertura ativa
export const coverageAreas: CoverageArea[] = [
  {
    id: 'area-001',
    name: 'Recife e Região Metropolitana',
    type: 'region',
    activeAgents: 45,
    recentPublications: 234,
    description: 'Capital pernambucana e municípios vizinhos'
  },
  {
    id: 'area-002',
    name: 'Agreste Pernambucano',
    type: 'region',
    activeAgents: 28,
    recentPublications: 156,
    description: 'Caruaru, Garanhuns e região'
  },
  {
    id: 'area-003',
    name: 'Fortaleza',
    type: 'city',
    activeAgents: 38,
    recentPublications: 198,
    description: 'Capital cearense'
  },
  {
    id: 'area-004',
    name: 'Salvador',
    type: 'city',
    activeAgents: 52,
    recentPublications: 287,
    description: 'Capital baiana'
  },
  {
    id: 'area-005',
    name: 'Olinda',
    type: 'city',
    activeAgents: 22,
    recentPublications: 89,
    description: 'Cidade histórica de Pernambuco'
  }
];

// Notícias locais por categoria
export const localNewsByCategory = {
  politics: [
    {
      id: 'news-pol-001',
      title: 'Câmara de Recife aprova novo plano diretor',
      excerpt: 'Projeto prevê expansão de áreas verdes e mobilidade sustentável.',
      author: portalNordeste,
      publishedAt: '2024-05-10T11:00:00Z',
      category: 'Política',
      tags: ['Política', 'Recife', 'Urbanismo'],
      views: 8500,
      likes: 420,
      comments: 78,
      territory: 'Recife, PE'
    }
  ],
  health: [
    {
      id: 'news-health-001',
      title: 'Campanha de vacinação contra gripe começa segunda-feira',
      excerpt: 'Postos de saúde estarão abertos em horário estendido.',
      author: portalNordeste,
      publishedAt: '2024-05-09T08:00:00Z',
      category: 'Saúde',
      tags: ['Saúde', 'Vacinação', 'Prevenção'],
      views: 12000,
      likes: 890,
      comments: 134,
      territory: 'Nordeste'
    }
  ],
  education: [
    {
      id: 'news-edu-001',
      title: 'Escolas municipais recebem novos laboratórios de ciências',
      excerpt: 'Investimento beneficia 50 unidades de ensino.',
      author: portalNordeste,
      publishedAt: '2024-05-08T14:00:00Z',
      category: 'Educação',
      tags: ['Educação', 'Ciência', 'Investimento'],
      views: 9500,
      likes: 670,
      comments: 92,
      territory: 'Recife, PE'
    }
  ],
  security: [
    {
      id: 'news-sec-001',
      title: 'Operação policial reduz índices de criminalidade em 30%',
      excerpt: 'Ação integrada entre polícias civil e militar mostra resultados.',
      author: portalNordeste,
      publishedAt: '2024-05-07T16:00:00Z',
      category: 'Segurança',
      tags: ['Segurança', 'Polícia', 'Criminalidade'],
      views: 15000,
      likes: 980,
      comments: 245,
      territory: 'Fortaleza, CE'
    }
  ]
};

// Conteúdo multimídia
export const multimediaContent = {
  videos: [
    {
      id: 'video-001',
      title: 'Bastidores do São João de Caruaru 2024',
      thumbnail: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400',
      duration: '12:34',
      views: 45000,
      author: portalNordeste,
      publishedAt: '2024-05-09T10:00:00Z'
    },
    {
      id: 'video-002',
      title: 'Documentário: Artesãos do Alto do Moura',
      thumbnail: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=400',
      duration: '28:15',
      views: 32000,
      author: nordesteAgents[3],
      publishedAt: '2024-05-08T15:00:00Z'
    }
  ],
  podcasts: [
    {
      id: 'podcast-001',
      title: 'Papo Nordestino #45: Cultura Popular',
      thumbnail: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400',
      duration: '45:20',
      plays: 12000,
      author: nordesteAgents[0],
      publishedAt: '2024-05-10T06:00:00Z'
    }
  ],
  photoGalleries: [
    {
      id: 'gallery-001',
      title: 'Recife em 20 fotos: belezas da capital',
      coverImage: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800',
      photoCount: 20,
      views: 28000,
      author: portalNordeste,
      publishedAt: '2024-05-07T12:00:00Z'
    }
  ]
};

// Utilidade pública
export const publicUtilityInfo = [
  {
    id: 'util-001',
    title: 'Calendário de Coleta Seletiva',
    description: 'Confira os dias e horários da coleta em seu bairro',
    category: 'Meio Ambiente',
    link: '/utilidade-publica/coleta-seletiva',
    icon: 'recycle'
  },
  {
    id: 'util-002',
    title: 'Postos de Vacinação',
    description: 'Locais, horários e vacinas disponíveis',
    category: 'Saúde',
    link: '/utilidade-publica/vacinacao',
    icon: 'health'
  },
  {
    id: 'util-003',
    title: 'Linhas de Ônibus',
    description: 'Consulte rotas, horários e tarifas',
    category: 'Transporte',
    link: '/utilidade-publica/onibus',
    icon: 'bus'
  },
  {
    id: 'util-004',
    title: 'Defesa Civil - Alertas',
    description: 'Avisos de emergência e áreas de risco',
    category: 'Emergência',
    link: '/utilidade-publica/defesa-civil',
    icon: 'alert'
  }
];

// Comunidades em movimento
export const communitiesInMotion = [
  {
    id: 'comm-001',
    name: 'Coletivo Periferia Criativa',
    description: 'Arte e cultura nas comunidades de Fortaleza',
    members: 450,
    recentActivity: 'Organizou festival de grafite',
    territory: 'Fortaleza, CE',
    image: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400'
  },
  {
    id: 'comm-002',
    name: 'Horta Comunitária do Coque',
    description: 'Agricultura urbana e segurança alimentar',
    members: 120,
    recentActivity: 'Colheita de 200kg de hortaliças',
    territory: 'Recife, PE',
    image: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400'
  },
  {
    id: 'comm-003',
    name: 'Biblioteca Popular da Vila',
    description: 'Incentivo à leitura e educação comunitária',
    members: 280,
    recentActivity: 'Inaugurou espaço infantil',
    territory: 'Olinda, PE',
    image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400'
  }
];

// Trending topics territoriais
export const trendingTopics = [
  {
    id: 'trend-001',
    topic: '#SãoJoãoCaruaru',
    mentions: 45000,
    growth: '+320%',
    category: 'Cultura'
  },
  {
    id: 'trend-002',
    topic: '#NovoMetroRecife',
    mentions: 32000,
    growth: '+180%',
    category: 'Mobilidade'
  },
  {
    id: 'trend-003',
    topic: '#ArtesanatoNordestino',
    mentions: 28000,
    growth: '+95%',
    category: 'Arte'
  },
  {
    id: 'trend-004',
    topic: '#TecnologiaNaPeiferia',
    mentions: 22000,
    growth: '+150%',
    category: 'Educação'
  }
];

// Canais verificados
export const verifiedChannels = nordesteAgents.filter(agent => agent.verified);

// Estatísticas gerais
export const portalStats = {
  totalAgents: 156,
  totalPublications: 2340,
  totalReaders: 450000,
  territoriesCovered: 45,
  activeEvents: 89,
  verifiedChannels: 67
};

// Export consolidado para uso nas páginas
export const portalNordesteMock = {
  // Agentes
  mainAgent: portalNordeste,
  agents: nordesteAgents,
  verifiedChannels,
  
  // Publicações
  featuredPublications,
  latestPublications,
  allPublications: [...featuredPublications, ...latestPublications],
  
  // Eventos
  culturalEvents,
  
  // Áreas
  coverageAreas,
  
  // Notícias por categoria
  localNews: localNewsByCategory,
  
  // Multimídia
  multimedia: multimediaContent,
  
  // Utilidade
  publicUtility: publicUtilityInfo,
  
  // Comunidades
  communities: communitiesInMotion,
  
  // Trending
  trending: trendingTopics,
  
  // Estatísticas
  stats: portalStats
};

// Funções auxiliares para filtrar dados
export const getPublicationsByTerritory = (territory: string) => {
  return portalNordesteMock.allPublications.filter(
    pub => pub.territory.includes(territory)
  );
};

export const getPublicationsByCategory = (category: string) => {
  return portalNordesteMock.allPublications.filter(
    pub => pub.category === category
  );
};

export const getAgentsByType = (type: MediaAgent['type']) => {
  return portalNordesteMock.agents.filter(agent => agent.type === type);
};

export const getEventsByCategory = (category: Event['category']) => {
  return portalNordesteMock.culturalEvents.filter(
    event => event.category === category
  );
};

export const getTrendingPublications = () => {
  return portalNordesteMock.allPublications.filter(pub => pub.trending);
};

export const getFeaturedPublications = () => {
  return portalNordesteMock.allPublications.filter(pub => pub.featured);
};

// Export default
export default portalNordesteMock;
