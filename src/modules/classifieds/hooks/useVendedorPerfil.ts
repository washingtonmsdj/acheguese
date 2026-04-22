/**
 * Hook para buscar dados completos do perfil de um vendedor
 * ✅ SSOT compliant: usa classifiedService e profileService
 */
import { logger } from '@/shared/utils/logger';
import { useQuery } from "@tanstack/react-query";
import { ClassifiedsFacade } from "@/modules/classifieds/services";
import { profileService } from "@/core/profiles/services";
import type { VendedorWithAds } from "./useVendedores";
// Mock de avaliações de vendedores
export interface VendedorReview {
  id: string;
  reviewer_name: string;
  reviewer_avatar: string | null;
  rating: number;
  comment: string;
  created_at: string;
}

export interface VendedorPerfil extends VendedorWithAds {
  bio: string;
  member_since: string;
  response_rate: number;
  avg_rating: number;
  total_reviews: number;
  phone?: string | null;
  whatsapp?: string | null;
  all_ads: Array<{
    id: string;
    title: string;
    price: number;
    photos: string[];
    category: string;
    condition: string;
    created_at: string;
  }>;
  reviews: VendedorReview[];
}

const MOCK_PROFILES: Record<string, VendedorPerfil> = {
  "mock-seller-1": {
    id: "mock-seller-1",
    name: "Carlos Eduardo",
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    neighborhood: "Pituba",
    active_ads_count: 5,
    bio: "Vendedor de eletrônicos e gadgets. Sempre com os melhores preços da região!",
    member_since: "2024-03-15",
    response_rate: 95,
    avg_rating: 4.8,
    total_reviews: 23,
    featured_ads: [],
    all_ads: [
      { id: "ad-1a", title: "iPhone 14 Pro Max 256GB", price: 4500, photos: ["https://images.unsplash.com/photo-1678652197950-91e3f0a0f0a8?w=400&h=300&fit=crop"], category: "Eletrônicos", condition: "Seminovo", created_at: "2025-03-01" },
      { id: "ad-1b", title: "MacBook Air M2 2023", price: 6200, photos: ["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop"], category: "Eletrônicos", condition: "Usado", created_at: "2025-02-20" },
      { id: "ad-1c", title: "AirPods Pro 2ª Geração", price: 1200, photos: ["https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400&h=300&fit=crop"], category: "Eletrônicos", condition: "Novo", created_at: "2025-03-10" },
      { id: "ad-1d", title: "Apple Watch Series 9", price: 2800, photos: ["https://images.unsplash.com/photo-1551816230-ef5deaed4a26?w=400&h=300&fit=crop"], category: "Eletrônicos", condition: "Seminovo", created_at: "2025-01-15" },
      { id: "ad-1e", title: "iPad Air 5ª Geração", price: 3400, photos: ["https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=300&fit=crop"], category: "Eletrônicos", condition: "Usado", created_at: "2025-02-05" },
    ],
    reviews: [
      { id: "r1-1", reviewer_name: "Maria Silva", reviewer_avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face", rating: 5, comment: "Produto em excelente estado! Vendedor super atencioso e entrega rápida.", created_at: "2025-03-12" },
      { id: "r1-2", reviewer_name: "Pedro Alves", reviewer_avatar: null, rating: 5, comment: "Comprei o MacBook, chegou perfeito. Recomendo demais!", created_at: "2025-02-28" },
      { id: "r1-3", reviewer_name: "Juliana Costa", reviewer_avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face", rating: 4, comment: "Bom vendedor, só demorou um pouco pra responder.", created_at: "2025-02-15" },
    ],
  },
  "mock-seller-2": {
    id: "mock-seller-2",
    name: "Ana Paula Santos",
    avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
    neighborhood: "Barra",
    active_ads_count: 3,
    bio: "Desapegando de móveis e decoração! Tudo em ótimo estado, preços justos.",
    member_since: "2024-06-20",
    response_rate: 88,
    avg_rating: 4.6,
    total_reviews: 12,
    featured_ads: [],
    all_ads: [
      { id: "ad-2a", title: "Sofá 3 Lugares Retrátil", price: 1200, photos: ["https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop"], category: "Móveis", condition: "Usado", created_at: "2025-03-05" },
      { id: "ad-2b", title: "Mesa de Jantar 6 Lugares", price: 800, photos: ["https://images.unsplash.com/photo-1617806118233-18e1de247200?w=400&h=300&fit=crop"], category: "Móveis", condition: "Usado", created_at: "2025-02-18" },
      { id: "ad-2c", title: "Estante Industrial", price: 450, photos: ["https://images.unsplash.com/photo-1594620302200-9a762244a156?w=400&h=300&fit=crop"], category: "Móveis", condition: "Seminovo", created_at: "2025-01-30" },
    ],
    reviews: [
      { id: "r2-1", reviewer_name: "Lucas Mendes", reviewer_avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face", rating: 5, comment: "Sofá lindo, exatamente como na foto!", created_at: "2025-03-08" },
      { id: "r2-2", reviewer_name: "Camila Rocha", reviewer_avatar: null, rating: 4, comment: "Boa negociação. Recomendo.", created_at: "2025-02-20" },
    ],
  },
  "mock-seller-3": {
    id: "mock-seller-3",
    name: "Roberto Lima",
    avatar_url: null,
    neighborhood: "Ondina",
    active_ads_count: 8,
    bio: "Loja de informática e acessórios. Garantia em todos os produtos!",
    member_since: "2023-11-10",
    response_rate: 98,
    avg_rating: 4.9,
    total_reviews: 47,
    featured_ads: [],
    all_ads: [
      { id: "ad-3a", title: "Notebook Dell Inspiron i7", price: 3200, photos: ["https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400&h=300&fit=crop"], category: "Eletrônicos", condition: "Usado", created_at: "2025-03-01" },
      { id: "ad-3b", title: "Monitor LG 27'' 4K", price: 1800, photos: ["https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&h=300&fit=crop"], category: "Eletrônicos", condition: "Novo", created_at: "2025-02-25" },
      { id: "ad-3c", title: "Teclado Mecânico RGB", price: 350, photos: ["https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=400&h=300&fit=crop"], category: "Acessórios", condition: "Novo", created_at: "2025-03-10" },
      { id: "ad-3d", title: "Mouse Gamer Logitech G502", price: 280, photos: ["https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&h=300&fit=crop"], category: "Acessórios", condition: "Novo", created_at: "2025-02-15" },
      { id: "ad-3e", title: "SSD Samsung 1TB NVMe", price: 450, photos: ["https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=400&h=300&fit=crop"], category: "Eletrônicos", condition: "Novo", created_at: "2025-01-20" },
      { id: "ad-3f", title: "Webcam Full HD Logitech", price: 220, photos: ["https://images.unsplash.com/photo-1587826080692-f439cd0b70e0?w=400&h=300&fit=crop"], category: "Acessórios", condition: "Seminovo", created_at: "2025-03-05" },
      { id: "ad-3g", title: "Hub USB-C 7 em 1", price: 150, photos: ["https://images.unsplash.com/photo-1625723044792-44de16ccb4e8?w=400&h=300&fit=crop"], category: "Acessórios", condition: "Novo", created_at: "2025-02-28" },
      { id: "ad-3h", title: "Cadeira Gamer ThunderX3", price: 1200, photos: ["https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=400&h=300&fit=crop"], category: "Móveis", condition: "Seminovo", created_at: "2025-01-10" },
    ],
    reviews: [
      { id: "r3-1", reviewer_name: "André Santos", reviewer_avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face", rating: 5, comment: "Melhor vendedor de informática da região! Produtos com garantia.", created_at: "2025-03-11" },
      { id: "r3-2", reviewer_name: "Priscila Ferreira", reviewer_avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face", rating: 5, comment: "Comprei o monitor, veio perfeito. Entrega no mesmo dia!", created_at: "2025-03-02" },
      { id: "r3-3", reviewer_name: "Diego Moreira", reviewer_avatar: null, rating: 5, comment: "Excelente atendimento e preço justo. Já comprei 3x.", created_at: "2025-02-22" },
      { id: "r3-4", reviewer_name: "Tatiana Lima", reviewer_avatar: null, rating: 4, comment: "Tudo certo com a compra. Único detalhe: embalagem simples.", created_at: "2025-02-10" },
    ],
  },
  "mock-seller-4": {
    id: "mock-seller-4",
    name: "Fernanda Oliveira",
    avatar_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    neighborhood: "Graça",
    active_ads_count: 2,
    bio: "Ciclista apaixonada. Vendendo equipamentos que não uso mais.",
    member_since: "2025-01-05",
    response_rate: 75,
    avg_rating: 4.5,
    total_reviews: 4,
    featured_ads: [],
    all_ads: [
      { id: "ad-4a", title: "Bicicleta Speed Caloi", price: 2100, photos: ["https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=400&h=300&fit=crop"], category: "Esportes", condition: "Usado", created_at: "2025-03-08" },
      { id: "ad-4b", title: "Capacete Ciclismo Pro", price: 180, photos: ["https://images.unsplash.com/photo-1557803175-2b8e3c842436?w=400&h=300&fit=crop"], category: "Esportes", condition: "Seminovo", created_at: "2025-03-01" },
    ],
    reviews: [
      { id: "r4-1", reviewer_name: "Marcos Souza", reviewer_avatar: null, rating: 5, comment: "Bike top! Muito bem cuidada.", created_at: "2025-03-10" },
      { id: "r4-2", reviewer_name: "Laura Almeida", reviewer_avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face", rating: 4, comment: "Capacete em bom estado.", created_at: "2025-03-05" },
    ],
  },
  "mock-seller-5": {
    id: "mock-seller-5",
    name: "João Marcos Silva",
    avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    neighborhood: "Rio Vermelho",
    active_ads_count: 6,
    bio: "Gamer e colecionador. Desapegando de alguns itens para renovar o setup.",
    member_since: "2024-08-12",
    response_rate: 92,
    avg_rating: 4.7,
    total_reviews: 18,
    featured_ads: [],
    all_ads: [
      { id: "ad-5a", title: "PlayStation 5 + 3 Jogos", price: 3500, photos: ["https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&h=300&fit=crop"], category: "Games", condition: "Seminovo", created_at: "2025-03-12" },
      { id: "ad-5b", title: "Controle DualSense Extra", price: 350, photos: ["https://images.unsplash.com/photo-1592840496694-26d035b52b48?w=400&h=300&fit=crop"], category: "Games", condition: "Novo", created_at: "2025-03-08" },
      { id: "ad-5c", title: "Headset Gamer HyperX", price: 280, photos: ["https://images.unsplash.com/photo-1599669454699-248893623440?w=400&h=300&fit=crop"], category: "Games", condition: "Usado", created_at: "2025-02-28" },
      { id: "ad-5d", title: "Nintendo Switch OLED", price: 2200, photos: ["https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=400&h=300&fit=crop"], category: "Games", condition: "Seminovo", created_at: "2025-02-15" },
      { id: "ad-5e", title: "Cadeira Gamer Corsair", price: 1500, photos: ["https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=400&h=300&fit=crop"], category: "Móveis", condition: "Usado", created_at: "2025-01-20" },
      { id: "ad-5f", title: "Monitor Gamer 144Hz 27''", price: 1600, photos: ["https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&h=300&fit=crop"], category: "Eletrônicos", condition: "Seminovo", created_at: "2025-03-01" },
    ],
    reviews: [
      { id: "r5-1", reviewer_name: "Felipe Castro", reviewer_avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face", rating: 5, comment: "PS5 impecável! Vendedor gente boa.", created_at: "2025-03-14" },
      { id: "r5-2", reviewer_name: "Isabela Martins", reviewer_avatar: null, rating: 5, comment: "Tudo perfeito, produto como descrito.", created_at: "2025-03-06" },
      { id: "r5-3", reviewer_name: "Rafael Nunes", reviewer_avatar: null, rating: 4, comment: "Muito bom! Entrega rápida.", created_at: "2025-02-20" },
    ],
  },
};

export function useVendedorPerfil(sellerId: string | undefined) {
  const query = useQuery({
    queryKey: ["vendedor-perfil", sellerId],
    queryFn: async () => {
      if (!sellerId) return null;

      // Try mock data first
      if (MOCK_PROFILES[sellerId]) {
        return MOCK_PROFILES[sellerId];
      }

      // Fetch real data from database
      try {
        // Buscar perfil do vendedor
        const profile = await profileService.getProfileById(sellerId);
        if (!profile) return null;

        // Buscar anúncios do vendedor
        const classifieds = await ClassifiedsFacade.queries.getClassifiedsBySeller(sellerId);
        
        // Contar anúncios ativos
        const activeAds = classifieds.filter(ad => ad.is_active);
        
        // Mapear anúncios para o formato esperado
        const all_ads = classifieds.map(ad => ({
          id: ad.id,
          title: ad.title,
          price: ad.price,
          photos: ad.photos || [],
          category: ad.category,
          condition: ad.condition,
          created_at: ad.created_at,
        }));

        // Construir perfil completo
        const vendedorPerfil: VendedorPerfil = {
          id: profile.id,
          name: profile.name || profile.username || "Vendedor",
          avatar_url: profile.avatar_url || null,
          neighborhood: profile.neighborhood || "Não informado",
          active_ads_count: activeAds.length,
          bio: profile.bio || "Vendedor na plataforma",
          member_since: profile.created_at || new Date().toISOString(),
          response_rate: 0,
          avg_rating: 0,
          total_reviews: 0,
          phone: profile.phone || null,
          whatsapp: profile.whatsapp || null,
          featured_ads: activeAds.slice(0, 3).map(ad => ({
            id: ad.id,
            title: ad.title,
            price: ad.price,
            photos: ad.photos || [],
          })),
          all_ads,
          reviews: [],
        };

        return vendedorPerfil;
      } catch (error) {
        logger.error("[useVendedorPerfil] Error fetching seller profile:", error);
        return null;
      }
    },
    enabled: !!sellerId,
  });

  return {
    vendedor: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}
