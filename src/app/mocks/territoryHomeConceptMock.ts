import type { PublicEvent } from "@/core/community-events";
import type {
  FeaturedBusiness,
  FeaturedClassified,
  FeaturedService,
} from "@/core/landing/services/LandingFeaturedService";
import type { Post } from "@/core/posts/types";
import type { TerritorialHighlight } from "@/core/territorial/highlights/types";
import type { WorkOpportunityCard } from "@/core/work-opportunities/types";
import foodImage from "@/assets/gastronomy/cat-marmitas.jpg";
import marketImage from "@/assets/complexo-comercio.jpg";
import residentImage from "@/assets/persona-morador.jpg";

export interface TerritoryHomeConceptMockData {
  businesses: FeaturedBusiness[];
  services: FeaturedService[];
  gastronomy: FeaturedBusiness[];
  classifieds: FeaturedClassified[];
  posts: Post[];
  events: PublicEvent[];
  happeningSoon: PublicEvent[];
  opportunities: WorkOpportunityCard[];
  highlights: TerritorialHighlight[];
  loading: {
    territory: boolean;
    worthKnowing: boolean;
    community: boolean;
    usefulPlaces: boolean;
  };
  isLoading: boolean;
  hasError: boolean;
}

function nextWeekdayAt(dayOfWeek: number, hour: number): string {
  const now = new Date();
  const date = new Date(now);
  const distance = (dayOfWeek - now.getDay() + 7) % 7 || 7;
  date.setDate(now.getDate() + distance);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

function createConceptEvent(input: {
  id: string;
  title: string;
  date: string;
  venue: string;
  category: string;
  subtitle: string;
}): PublicEvent {
  const now = new Date().toISOString();
  return {
    id: input.id,
    title: input.title,
    description: "Prévia visual demonstrativa do layout territorial.",
    date: input.date,
    location: input.venue,
    organizer_profile_id: "concept-mock-organizer",
    category: input.category,
    venue_name: input.venue,
    subtitle: input.subtitle,
    neighborhood: input.venue,
    city: "Salvador",
    state: "BA",
    current_participants: 0,
    status: "upcoming",
    created_at: now,
    updated_at: now,
  };
}

const feira = createConceptEvent({
  id: "concept-mock-feira",
  title: "Feira de empreendedores",
  date: nextWeekdayAt(6, 9),
  venue: "Santa Cruz",
  category: "community",
  subtitle: "Santa Cruz · Neste sábado",
});

const rodaDeConversa = createConceptEvent({
  id: "concept-mock-roda-de-conversa",
  title: "Roda de conversa",
  date: nextWeekdayAt(0, 15),
  venue: "Chapada",
  category: "community",
  subtitle: "Domingo · Chapada",
});

const conceptPost: Post = {
  id: "concept-mock-post",
  author_profile_id: "concept-mock-ana-santos",
  type: "pergunta",
  content: "Quem indica um eletricista aqui perto?\nPreciso de uma indicação da vizinhança.",
  likes_count: 0,
  comments_count: 0,
  created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  profile: {
    id: "concept-mock-ana-santos",
    displayName: "Ana Santos",
    avatarUrl: residentImage,
    verified: false,
  },
};

export const CONCEPT_HOME_MOCK: TerritoryHomeConceptMockData = {
  businesses: [
    {
      id: "concept-mock-sabores-do-bairro",
      name: "Sabores do bairro",
      category: "Comida caseira · Santa Cruz",
      logo_url: foodImage,
      rating: 0,
      is_premium: false,
      is_verified: false,
    },
    {
      id: "concept-mock-mercadinho-da-esquina",
      name: "Mercadinho da esquina",
      category: "Mercado · Vale das Pedrinhas",
      logo_url: marketImage,
      rating: 0,
      is_premium: false,
      is_verified: false,
    },
  ],
  services: [],
  gastronomy: [],
  classifieds: [],
  posts: [conceptPost],
  events: [feira, rodaDeConversa],
  happeningSoon: [feira],
  opportunities: [],
  highlights: [],
  loading: {
    territory: false,
    worthKnowing: false,
    community: false,
    usefulPlaces: false,
  },
  isLoading: false,
  hasError: false,
};
