import catPizzarias from "@/assets/gastronomy/cat-pizzarias.jpg";
import catRestaurantes from "@/assets/gastronomy/cat-restaurantes.jpg";
import bairroPituba from "@/assets/bairro-pituba.jpg";
import personaComerciante from "@/assets/persona-comerciante.jpg";
import personaMorador from "@/assets/persona-morador.jpg";
import personaPrestador from "@/assets/persona-prestador.jpg";
import type { GroupRow } from "@/core/community-groups/services/CommunityGroupsService";
import type {
  FeaturedBusiness,
  FeaturedClassified,
  FeaturedService,
} from "@/core/landing/services/LandingFeaturedService";
import type { PublicEvent } from "@/core/community-events";

export const COMMUNITY_OVERVIEW_VISUAL_MOCK_QUERY_VALUE = "community-concept";

export type CommunityConceptPost = {
  id: string;
  type?: string | null;
  content?: string | null;
  created_at?: string | null;
  likes_count?: number | null;
  comments_count?: number | null;
  author_name?: string | null;
  author_role?: string | null;
  avatar_url?: string | null;
  title?: string | null;
  summary?: string | null;
};

const now = Date.now();
const hoursAgo = (hours: number) => new Date(now - hours * 60 * 60 * 1000).toISOString();

export const COMMUNITY_OVERVIEW_VISUAL_FIXTURE = {
  stats: {
    members: 12500,
    businesses: 542,
    classifieds: 1200,
    posts: 78,
    events: 12,
    groups: 4,
  },
  groups: [
    {
      id: "visual-group-moradores",
      name: "Moradores da Pituba",
      description: "Avisos, pedidos de ajuda e rotina dos moradores.",
      category: "Comunidade",
      members_count: 3200,
      created_at: "2026-01-10T12:00:00.000Z",
      created_by: "visual-fixture",
    },
    {
      id: "visual-group-gastronomia",
      name: "Gastronomia local",
      description: "Indicações de restaurantes, padarias e delivery.",
      category: "Gastronomia",
      members_count: 2100,
      created_at: "2026-01-12T12:00:00.000Z",
      created_by: "visual-fixture",
    },
    {
      id: "visual-group-compra-venda",
      name: "Compra e venda",
      description: "Classificados de vizinhos e pequenos achados.",
      category: "Classificados",
      members_count: 1700,
      created_at: "2026-01-14T12:00:00.000Z",
      created_by: "visual-fixture",
    },
    {
      id: "visual-group-seguranca",
      name: "Segurança da rua",
      description: "Alertas comunitários moderados e prevenção.",
      category: "Segurança",
      members_count: 1300,
      created_at: "2026-01-16T12:00:00.000Z",
      created_by: "visual-fixture",
    },
  ] satisfies GroupRow[],
  posts: [
    {
      id: "visual-post-restaurante-japones",
      type: "pergunta",
      content: "Alguém conhece um bom restaurante japonês por aqui? Queria levar meu marido para jantar no sábado.",
      created_at: hoursAgo(2),
      likes_count: 18,
      comments_count: 24,
      author_name: "Juliana Santos",
      author_role: "Moradora",
      avatar_url: personaMorador,
      title: "Alguém conhece um bom restaurante japonês por aqui? 🍣",
      summary: "Queria levar meu marido para jantar no sábado.",
    },
    {
      id: "visual-post-mutirao-orla",
      type: "aviso",
      content: "Mutirão de limpeza neste sábado (25) na Orla da Pituba. Vamos nos reunir às 7h30 em frente ao Parque dos Ventos. Leve sua garrafa d'água e luvas.",
      created_at: hoursAgo(4),
      likes_count: 32,
      comments_count: 18,
      author_name: "Marcos Lima",
      author_role: "Morador",
      avatar_url: personaPrestador,
      title: "Mutirão de limpeza neste sábado (25) na Orla da Pituba",
      summary: "Vamos nos reunir às 7h30 em frente ao Parque dos Ventos. Leve sua garrafa d'água e luvas.",
    },
    {
      id: "visual-post-padaria",
      type: "recomendacao",
      content: "Padaria Pão Nosso: meu pão francês preferido da região. Tudo sempre fresquinho e o atendimento é excelente. Recomendo o croissant de queijo.",
      created_at: hoursAgo(6),
      likes_count: 26,
      comments_count: 12,
      author_name: "Carla Menezes",
      author_role: "Moradora",
      avatar_url: personaComerciante,
      title: "Padaria Pão Nosso: meu pão francês preferido da região!",
      summary: "Tudo sempre fresquinho e o atendimento é excelente. Recomendo o croissant de queijo.",
    },
  ] satisfies CommunityConceptPost[],
  events: [
    {
      id: "visual-event-mutirao-orla",
      title: "Mutirão de limpeza da Orla",
      description: "Ação comunitária para limpeza e cuidado da orla da Pituba.",
      date: "2026-07-25T07:30:00-03:00",
      event_date: "2026-07-25T07:30:00-03:00",
      end_date: "2026-07-25T10:30:00-03:00",
      location: "Parque dos Ventos",
      organizer_profile_id: "visual-fixture",
      category: "Comunitário",
      image_url: bairroPituba,
      current_participants: 48,
      status: "upcoming",
      created_at: "2026-07-01T12:00:00.000Z",
      updated_at: "2026-07-01T12:00:00.000Z",
    },
  ] satisfies PublicEvent[],
  businesses: [
    {
      id: "visual-business-padaria",
      name: "Padaria Pão Nosso",
      category: "Padaria",
      logo_url: catPizzarias,
      rating: 4.6,
      is_premium: true,
      is_verified: true,
      slug: "padaria-pao-nosso",
      geographic_path: "ba/salvador/pituba",
    },
    {
      id: "visual-business-farmacia",
      name: "Farmácia Saúde+",
      category: "Farmácia",
      logo_url: bairroPituba,
      rating: 4.8,
      is_premium: false,
      is_verified: true,
      slug: "farmacia-saude",
      geographic_path: "ba/salvador/pituba",
    },
    {
      id: "visual-business-sushi",
      name: "Sushi House Pituba",
      category: "Restaurante",
      logo_url: catRestaurantes,
      rating: 4.9,
      is_premium: true,
      is_verified: true,
      slug: "sushi-house-pituba",
      geographic_path: "ba/salvador/pituba",
    },
  ] satisfies FeaturedBusiness[],
  services: [
    {
      id: "visual-service-eletricista",
      name: "Carlos Lima",
      category: "Eletricista",
      rating: 4.9,
      is_verified: true,
      price_range: "A partir de R$ 90",
    },
    {
      id: "visual-service-personal",
      name: "Ana Souza",
      category: "Personal trainer",
      rating: 4.8,
      is_verified: true,
      price_range: "Sob consulta",
    },
    {
      id: "visual-service-manutencao",
      name: "Reparo Certo",
      category: "Manutenção residencial",
      rating: 4.7,
      is_verified: false,
      price_range: "A combinar",
    },
  ] satisfies FeaturedService[],
  classifieds: [
    {
      id: "visual-classified-bike",
      titulo: "Bicicleta urbana seminova",
      category: "Esportes",
      price: 850,
      photos: [bairroPituba],
      created_at: hoursAgo(3),
      public_id: "bike850",
    },
    {
      id: "visual-classified-desk",
      titulo: "Mesa de escritório em madeira",
      category: "Casa e móveis",
      price: 420,
      photos: [],
      created_at: hoursAgo(8),
      public_id: "mesa420",
    },
  ] satisfies FeaturedClassified[],
  gastronomy: [
    {
      id: "visual-gastronomy-sushi",
      name: "Sushi House Pituba",
      category: "Restaurante japonês",
      logo_url: catRestaurantes,
      rating: 4.9,
      is_premium: true,
      is_verified: true,
      slug: "sushi-house-pituba",
      geographic_path: "ba/salvador/pituba",
    },
    {
      id: "visual-gastronomy-pizza",
      name: "Pizzaria Bella",
      category: "Pizzaria",
      logo_url: catPizzarias,
      rating: 4.7,
      is_premium: false,
      is_verified: true,
      slug: "pizzaria-bella",
      geographic_path: "ba/salvador/pituba",
    },
  ] satisfies FeaturedBusiness[],
};
