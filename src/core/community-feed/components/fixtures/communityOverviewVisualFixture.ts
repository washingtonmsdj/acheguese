import catPizzarias from "@/assets/gastronomy/cat-pizzarias.jpg";
import catRestaurantes from "@/assets/gastronomy/cat-restaurantes.jpg";
import bairroPituba from "@/assets/bairro-pituba.jpg";
import communityStreetGathering from "@/assets/community-concept-encontro-rua.jpg";
import communityGroupGathering from "@/assets/community-concept-grupo-encontros.jpg";
import personaComerciante from "@/assets/persona-comerciante.jpg";
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
  territory_label?: string | null;
  images?: string[] | null;
  response_preview?: {
    author_name: string;
    avatar_url?: string | null;
    content: string;
  } | null;
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
      name: "Cultura e encontros",
      description: "Troca de ideias, arte e atividades no nosso território.",
      category: "Comunidade",
      members_count: 3200,
      created_at: "2026-01-10T12:00:00.000Z",
      created_by: "visual-fixture",
      avatar_url: communityGroupGathering,
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
      id: "visual-post-reforco-escolar",
      type: "pergunta",
      content: "Quem indica aulas de reforço aqui no bairro? Procuro indicação para o ensino fundamental.",
      created_at: hoursAgo(2),
      likes_count: 8,
      comments_count: 4,
      author_name: "Ana Santos",
      author_role: "Moradora",
      territory_label: "Santa Cruz",
      avatar_url: personaComerciante,
      title: "Quem indica aulas de reforço aqui no bairro?",
      summary: "Procuro indicação para o ensino fundamental.",
      response_preview: {
        author_name: "Mariana",
        avatar_url: personaComerciante,
        content: "Tem um projeto na associação, à tarde.",
      },
    },
    {
      id: "visual-post-encontro-domingo",
      type: "recomendacao",
      content: "O encontro de domingo foi especial para todo mundo que participou.",
      created_at: hoursAgo(24),
      likes_count: 26,
      comments_count: 12,
      author_name: "Marcos Lima",
      author_role: "Morador",
      territory_label: "Vale das Pedrinhas",
      avatar_url: personaPrestador,
      title: "O encontro de domingo foi especial",
      summary: "",
      images: [communityStreetGathering],
    },
    {
      id: "visual-post-padaria",
      type: "recomendacao",
      content: "Padaria Pão Nosso: meu pão francês preferido da região. Tudo sempre fresquinho e o atendimento é excelente. Recomendo o croissant de queijo.",
      created_at: hoursAgo(72),
      likes_count: 26,
      comments_count: 12,
      author_name: "Carla Menezes",
      author_role: "Moradora",
      territory_label: "Pituba",
      avatar_url: personaComerciante,
      title: "Padaria Pão Nosso: meu pão francês preferido da região!",
      summary: "Tudo sempre fresquinho e o atendimento é excelente. Recomendo o croissant de queijo.",
    },
  ] satisfies CommunityConceptPost[],
  alerts: [
    {
      id: "visual-alert-iluminacao",
      kind: "relato" as const,
      author_name: "João",
      territory_label: "Santa Cruz",
      title: "Iluminação na Rua do Campo",
      detail: "Ainda sem confirmação.",
    },
    {
      id: "visual-alert-mutirao",
      kind: "comunicado" as const,
      author_name: "Associação comunitária",
      territory_label: "Santa Cruz",
      title: "Mutirão na praça",
      detail: "Sábado, às 9h · Santa Cruz",
    },
  ] satisfies Array<{
    id: string;
    kind: "relato" | "comunicado";
    author_name: string;
    territory_label: string;
    title: string;
    detail: string;
  }>,
  events: [
    {
      id: "visual-event-mutirao-orla",
      title: "Mutirão na praça",
      description: "Encontro da comunidade neste sábado em Santa Cruz.",
      date: "2026-09-26T09:00:00-03:00",
      event_date: "2026-09-26T09:00:00-03:00",
      end_date: "2026-09-26T12:00:00-03:00",
      location: "Santa Cruz",
      organizer_profile_id: "visual-fixture",
      category: "Comunitário",
      image_url: bairroPituba,
      current_participants: 48,
      status: "upcoming",
      created_at: "2026-09-01T12:00:00.000Z",
      updated_at: "2026-09-01T12:00:00.000Z",
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
