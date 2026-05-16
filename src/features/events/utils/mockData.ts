/**
 * 🎭 MOCK DATA - Events V2
 *
 * Dados de demonstração para a V2
 * Remover quando integrar com backend real
 *
 * @version 2.0.0
 */

import type { Event } from '../types';

export const MOCK_EVENTS: Event[] = [
  {
    id: 'evt-001',
    slug: 'roda-de-samba-nordeste',
    title: 'Grande Roda de Samba do Nordeste',
    subtitle: 'Uma celebração da cultura afro-brasileira com os melhores sambistas da região',
    description: `<p>Prepare-se para uma noite inesquecível de samba, cultura e comunidade!</p>

<p>A Grande Roda de Samba do Nordeste é mais do que um evento musical - é uma celebração da nossa identidade cultural, das nossas raízes e da força da nossa comunidade.</p>

<h3>O que esperar:</h3>
<ul>
<li>Apresentações de grupos locais renomados</li>
<li>Feira de empreendedores do bairro</li>
<li>Gastronomia típica baiana</li>
<li>Espaço kids com oficinas culturais</li>
<li>Roda de capoeira</li>
</ul>

<p>Venha fazer parte dessa festa que celebra a cultura do Complexo do Nordeste de Amaralina!</p>`,
    short_description: 'Samba de roda com artistas locais e feira de empreendedores do Complexo.',
    cover_image_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
    banner_image_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1920',
    category: 'cultural',
    tags: ['samba', 'cultura', 'música', 'comunidade'],
    type: 'presencial',
    status: 'publicado',
    start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    timezone: 'America/Bahia',
    duration_minutes: 240,
    location: {
      type: 'physical',
      venue_name: 'Largo do Nordeste de Amaralina',
      address: 'Rua do Nordeste, s/n',
      city: 'Salvador',
      state: 'BA',
      neighborhood: 'Nordeste de Amaralina',
      latitude: -13.0032,
      longitude: -38.4698,
      instructions: 'Próximo à quadra comunitária. Acesso por transporte público: linhas 1003, 1004.'
    },
    organizer: {
      id: 'org-001',
      name: 'Associação Cultural do Nordeste',
      avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=ACN',
      bio: 'Promovendo cultura e arte no Complexo do Nordeste há mais de 15 anos',
      verified: true,
      contact: {
        email: 'contato@culturanordeste.org',
        phone: '(71) 99999-9999',
        whatsapp: '5571999999999',
        instagram: 'culturanordeste',
        website: 'https://culturanordeste.org'
      },
      stats: {
        events_created: 47,
        total_participants: 12500,
        rating: 4.8
      }
    },
    ticket_type: 'hibrido',
    tickets: [
      {
        id: 'tkt-001',
        name: 'Entrada Gratuita',
        description: 'Acesso livre ao evento',
        price: 0,
        currency: 'BRL',
        quantity_total: 500,
        quantity_available: 234,
        quantity_sold: 266,
        status: 'disponivel',
        is_free: true,
        max_per_order: 4
      },
      {
        id: 'tkt-002',
        name: 'Apoiador',
        description: 'Contribua com o evento e ganhe kit exclusivo + acesso VIP',
        price: 30,
        currency: 'BRL',
        quantity_total: 100,
        quantity_available: 23,
        quantity_sold: 77,
        status: 'disponivel',
        is_free: false,
        max_per_order: 2
      }
    ],
    is_free: false,
    capacity: 600,
    participants_count: 343,
    waitlist_enabled: true,
    schedule: [
      {
        id: 'sch-001',
        time: '18:00',
        title: 'Abertura e Recepção',
        description: 'Chegada dos participantes e abertura da feira de empreendedores',
        duration_minutes: 30
      },
      {
        id: 'sch-002',
        time: '18:30',
        title: 'Roda de Capoeira',
        description: 'Apresentação do Grupo Capoeira Angola',
        duration_minutes: 45,
        speaker: 'Mestre João'
      },
      {
        id: 'sch-003',
        time: '19:30',
        title: 'Início da Roda de Samba',
        description: 'Samba de raiz com os melhores grupos locais',
        duration_minutes: 180,
        speaker: 'Grupo Samba do Nordeste'
      },
      {
        id: 'sch-004',
        time: '22:00',
        title: 'Encerramento',
        description: 'Última música e agradecimentos',
        duration_minutes: 30
      }
    ],
    requirements: [
      'Não é necessário experiência prévia',
      'Evento familiar - todas as idades são bem-vindas',
      'Recomendamos chegar com antecedência'
    ],
    what_to_bring: [
      'Documento de identificação',
      'Roupa confortável',
      'Garrafa de água',
      'Protetor solar (evento ao ar livre)'
    ],
    accessibility_info: 'Local com acessibilidade para cadeirantes. Banheiros adaptados disponíveis.',
    age_restriction: 'Livre para todas as idades',
    features: {
      has_certificate: false,
      has_recording: false,
      has_networking: true,
      has_food: true,
      has_parking: false,
      is_accessible: true
    },
    views_count: 2847,
    favorites_count: 156,
    shares_count: 89,
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    published_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    meta_title: 'Grande Roda de Samba do Nordeste | Achegue-se',
    meta_description: 'Participe da maior roda de samba do Complexo do Nordeste de Amaralina. Música, cultura e comunidade em um só lugar!',
    meta_keywords: ['samba', 'nordeste', 'salvador', 'cultura', 'evento']
  },
  {
    id: 'evt-002',
    slug: 'workshop-empreendedorismo-digital',
    title: 'Workshop de Empreendedorismo Digital',
    subtitle: 'Aprenda a criar e gerenciar seu negócio online',
    description: `<p>Transforme sua ideia em um negócio digital de sucesso!</p>

<p>Neste workshop intensivo, você vai aprender:</p>

<ul>
<li>Como validar sua ideia de negócio</li>
<li>Estratégias de marketing digital</li>
<li>Vendas online e redes sociais</li>
<li>Gestão financeira básica</li>
<li>Ferramentas gratuitas essenciais</li>
</ul>

<p>Ideal para empreendedores iniciantes e quem quer digitalizar seu negócio!</p>`,
    short_description: 'Workshop prático sobre empreendedorismo digital e vendas online.',
    cover_image_url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800',
    banner_image_url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1920',
    category: 'educacional',
    tags: ['empreendedorismo', 'digital', 'negócios', 'workshop'],
    type: 'hibrido',
    status: 'publicado',
    start_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    timezone: 'America/Bahia',
    duration_minutes: 180,
    location: {
      type: 'hybrid',
      venue_name: 'Centro Social Urbano - Nordeste',
      address: 'Av. Principal, 123',
      city: 'Salvador',
      state: 'BA',
      neighborhood: 'Nordeste de Amaralina',
      latitude: -13.0014,
      longitude: -38.4711,
      online_platform: 'Google Meet',
      online_url: 'https://meet.google.com/xxx-xxxx-xxx',
      instructions: 'Link será enviado 1 hora antes do evento'
    },
    organizer: {
      id: 'org-002',
      name: 'Instituto de Desenvolvimento Local',
      avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=IDL',
      bio: 'Capacitação e desenvolvimento de empreendedores locais',
      verified: true,
      contact: {
        email: 'contato@idl.org.br',
        whatsapp: '5571988888888',
        instagram: 'idl_salvador'
      },
      stats: {
        events_created: 32,
        total_participants: 1850,
        rating: 4.9
      }
    },
    ticket_type: 'gratuito',
    tickets: [
      {
        id: 'tkt-003',
        name: 'Inscrição Gratuita',
        description: 'Acesso completo ao workshop + material digital',
        price: 0,
        currency: 'BRL',
        quantity_total: 50,
        quantity_available: 12,
        quantity_sold: 38,
        status: 'disponivel',
        is_free: true,
        max_per_order: 1
      }
    ],
    is_free: true,
    capacity: 50,
    participants_count: 38,
    waitlist_enabled: true,
    schedule: [
      {
        id: 'sch-005',
        time: '14:00',
        title: 'Abertura e Apresentações',
        duration_minutes: 15
      },
      {
        id: 'sch-006',
        time: '14:15',
        title: 'Módulo 1: Validação de Ideias',
        description: 'Como testar se sua ideia tem mercado',
        duration_minutes: 45,
        speaker: 'Ana Silva'
      },
      {
        id: 'sch-007',
        time: '15:00',
        title: 'Módulo 2: Marketing Digital',
        description: 'Estratégias práticas para divulgar seu negócio',
        duration_minutes: 45,
        speaker: 'Carlos Santos'
      },
      {
        id: 'sch-008',
        time: '15:45',
        title: 'Intervalo',
        duration_minutes: 15
      },
      {
        id: 'sch-009',
        time: '16:00',
        title: 'Módulo 3: Vendas Online',
        description: 'Plataformas e técnicas de vendas',
        duration_minutes: 45,
        speaker: 'Maria Oliveira'
      },
      {
        id: 'sch-010',
        time: '16:45',
        title: 'Q&A e Encerramento',
        duration_minutes: 15
      }
    ],
    requirements: [
      'Ter uma ideia de negócio (mesmo que inicial)',
      'Notebook ou smartphone para acompanhar',
      'Vontade de aprender e empreender'
    ],
    what_to_bring: [
      'Notebook (recomendado)',
      'Caderno para anotações',
      'Documento de identificação'
    ],
    features: {
      has_certificate: true,
      has_recording: true,
      has_networking: true,
      has_food: false,
      has_parking: true,
      is_accessible: true
    },
    views_count: 1523,
    favorites_count: 89,
    shares_count: 45,
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    published_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    meta_title: 'Workshop de Empreendedorismo Digital | Achegue-se',
    meta_description: 'Aprenda a criar e gerenciar seu negócio online. Workshop gratuito com certificado!',
    meta_keywords: ['workshop', 'empreendedorismo', 'digital', 'negócios', 'gratuito']
  }
];

export function getMockEventById(id: string): Event | undefined {
  return MOCK_EVENTS.find(event => event.id === id);
}

export function getMockEventBySlug(slug: string): Event | undefined {
  return MOCK_EVENTS.find(event => event.slug === slug);
}
