import { PostType } from "@/shared/constants/postTypeConfig";
import { CivicProblemType } from "@/shared/constants/civicProblemTypes";
import { PostStatus, PostUrgency } from "@/shared/constants/statusConfig";

// Tipos unificados para todos os tipos de postagem
export interface UnifiedPost {
  id: string;
  type: PostType;

  // Autor
  author_profile_id: string;
  author_name: string;
  author_avatar?: string;
  is_verified_resident?: boolean;

  // Conteúdo
  content: string;
  description?: string;
  images?: string[];
  image_url?: string;

  // Localização
  location?: string | { name: string; type?: string; parent_id?: string }; // ✅ FASE 5: Suporta objeto do JOIN
  location_id?: string; // ✅ FASE 5: Para cálculo de proximidade
  latitude?: number;
  longitude?: number;

  // Métricas
  likes_count: number;
  comments_count: number;
  upvotes?: number;
  confirmations_count?: number;
  shares_count?: number;

  // Estados
  status?: PostStatus;
  urgency?: PostUrgency;
  is_liked?: boolean;
  is_saved?: boolean;
  is_verified?: boolean;
  has_user_confirmed?: boolean;

  // Metadados
  reach?: 'street' | 'neighborhood' | 'city'; // ✅ FASE 5: metadado de visibilidade (não filtra território)
  created_at: string;
  updated_at?: string;
  tags?: string[];

  // Específicos para civic_reports
  civic_type?: CivicProblemType;
}
