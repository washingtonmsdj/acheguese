/**
 * Tipos para Componentes do Módulo Business
 * 
 * Centraliza tipagem forte para eliminar uso de 'any'
 * Garante type safety em toda a aplicação
 */

import type { Product, Review } from "@/core/business/types";
import type { BizData } from "@/modules/business/types";

/**
 * Tipo para usuário em componentes
 */
export interface BusinessUser {
  id: string;
  name: string;
  email?: string;
  avatar_url?: string;
}

/**
 * Tipo para galeria de fotos
 */
export interface GalleryPhoto {
  id: string;
  image_url: string;
  caption?: string;
  created_at: string;
}

/**
 * Tipo para serviço de negócio
 */
export interface BusinessService {
  id: string;
  business_id: string;
  name: string;
  description?: string;
  category?: string;
  price?: number;
  duration?: string;
  active: boolean;
  featured?: boolean;
  created_at: string;
}

/**
 * Props para VisaoGeralTab
 */
export interface VisaoGeralTabProps {
  business: BizData;
  gallery: GalleryPhoto[];
  reviews: Review[];
  user: BusinessUser | null;
  onReviewsUpdate: () => void;
}

/**
 * Props para ProdutosTab
 */
export interface ProdutosTabProps {
  business: BizData;
  products: Product[];
  isOwner: boolean;
  onUpdate: () => void;
}

/**
 * Props para ServicosTab
 */
export interface ServicosTabProps {
  business: BizData;
  services: BusinessService[];
  isOwner: boolean;
  onUpdate: () => void;
}

/**
 * Props para CardapioTab
 */
export interface CardapioTabProps {
  products: Product[];
  businessName?: string;
  isOwner: boolean;
}

/**
 * Props para PortfolioTab
 */
export interface PortfolioTabProps {
  business: BizData;
  isOwner: boolean;
}

/**
 * Props para PromocoesTab
 */
export interface PromocoesTabProps {
  business: BizData;
  isOwner: boolean;
}

/**
 * Props para EstatisticasTab
 */
export interface EstatisticasTabProps {
  business: BizData;
  isOwner: boolean;
}

/**
 * Props para BusinessTabs
 */
export interface BusinessTabsProps {
  business: BizData;
  isOwner: boolean;
  canSeeDashboard: boolean;
  user: BusinessUser | null;
}

/**
 * Tipo para ícones de modos de atendimento
 */
export interface ModoAtendimentoIcon {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
}

/**
 * Tipo para configuração de seções ativas
 */
export interface SecoesAtivas {
  services: boolean;
  products: boolean;
  cardapio: boolean;
  portfolio: boolean;
  promocoes: boolean;
}
