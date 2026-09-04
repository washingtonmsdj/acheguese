/**
 * 🏆 BUSINESS COMPONENTS - Barrel Export Organizado
 *
 * Exportações organizadas por categoria para facilitar manutenção
 *
 * @author Kiro AI
 * @date 2026-04-10
 */

// ============================================
// DETAIL COMPONENTS - Componentes de detalhes
// ============================================

export { BusinessAbout } from "./BusinessAbout";
export { BusinessGallery } from "./BusinessGallery";
export { BusinessHours } from "./BusinessHours";
export { BusinessReviews } from "./BusinessReviews";
export { default as BusinessStats } from "./BusinessStats";

// ============================================
// FEATURE COMPONENTS - Funcionalidades específicas
// ============================================

export { BusinessProducts } from "./BusinessProducts";
export { BusinessServices } from "./BusinessServices";
export { default as DigitalMenu } from "./DigitalMenu";
export { default as PhotoGallery } from "./PhotoGallery";
export { default as PromoBanner } from "./PromoBanner";

// ============================================
// MANAGEMENT COMPONENTS - Gestão de negócio
// ============================================

export { default as AppointmentsPanel } from "./AppointmentsPanel";
export { default as AppointmentNotifications } from "./AppointmentNotifications";
export { default as SecoesAtivasManager } from "./SecoesAtivasManager";

// ============================================
// NETWORK COMPONENTS - Rede de empresas
// ============================================

export { default as BranchNetworkBlock } from "@/core/business/components/BranchNetworkBlock";
export { default as NetworkTab } from "./NetworkTab";

// ============================================
// UI COMPONENTS - Componentes de interface
// ============================================

export { default as BookingButton } from "./BookingButton";
export { ContactLink } from "./ContactLink";
export { NeighborhoodMap } from "@/core/business/components/NeighborhoodMap";
export { default as QuickActions } from "./QuickActions";
export { default as ShareBusinessDialog } from "./ShareBusinessDialog";

// ============================================
// SUB-FOLDERS - Componentes em subpastas
// ============================================

// Appointments
export { AppointmentCard } from "./appointments/AppointmentCard";
export { AppointmentDetailsModal } from "./appointments/AppointmentDetailsModal";
export { AppointmentFilters } from "./appointments/AppointmentFilters";
export { EmptyAppointments } from "./appointments/EmptyAppointments";

// Create
export { BasicInfoStep as CreateBasicInfoStep } from "./create/BasicInfoStep";
export { ContactLocationStep } from "./create/ContactLocationStep";
export { ExtrasStep as CreateExtrasStep } from "./create/ExtrasStep";
export { StepIndicator } from "./create/StepIndicator";

// Edit
export { BasicInfoStep as EditBasicInfoStep } from "./edit/BasicInfoStep";
export { ContactStep } from "./edit/ContactStep";
export { ExtrasStep as EditExtrasStep } from "./edit/ExtrasStep";
export { StepProgress } from "./edit/StepProgress";

// Identity
export { BusinessSlugSection } from "./identity/BusinessSlugSection";

// Tabs
export { AgendamentosTab } from "./tabs/AgendamentosTab";
export { CardapioTab } from "./tabs/CardapioTab";
export { EstatisticasTab } from "./tabs/EstatisticasTab";
export { PortfolioTab } from "./tabs/PortfolioTab";
export { ProdutosTab } from "./tabs/ProdutosTab";
export { PromocoesTab } from "./tabs/PromocoesTab";
export { ServicosTab } from "./tabs/ServicosTab";
export { VisaoGeralTab } from "./tabs/VisaoGeralTab";
