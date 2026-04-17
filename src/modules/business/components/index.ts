/**
 * 🏆 BUSINESS COMPONENTS - Barrel Export Organizado
 *
 * Exportações organizadas por categoria para facilitar manutenção
 *
 * @version 2.0.0 - Organização completa
 * @author Kiro AI
 * @date 2026-04-10
 */

// ============================================
// CORE COMPONENTS - Componentes principais
// ============================================

export { BusinessCard } from "./BusinessCard";
export { BusinessGrid } from "./BusinessGrid";
export { BusinessHeader } from "./BusinessHeader";

// ============================================
// DETAIL COMPONENTS - Componentes de detalhes
// ============================================

export { BusinessAbout } from "./BusinessAbout";
export { BusinessGallery } from "./BusinessGallery";
export { BusinessHours } from "./BusinessHours";
export { BusinessReviews } from "./BusinessReviews";
export { BusinessStats } from "./BusinessStats";

// ============================================
// FEATURE COMPONENTS - Funcionalidades específicas
// ============================================

export { BusinessProducts } from "./BusinessProducts";
export { BusinessServices } from "./BusinessServices";
export { DigitalMenu } from "./DigitalMenu";
export { PhotoGallery } from "./PhotoGallery";
export { PromoBanner } from "./PromoBanner";

// ============================================
// MANAGEMENT COMPONENTS - Gestão de negócio
// ============================================

export { AnalyticsDashboard } from "./AnalyticsDashboard";
export { AppointmentsPanel } from "./AppointmentsPanel";
export { AppointmentNotifications } from "./AppointmentNotifications";
export { CouponManager } from "./CouponManager";
export { EmpresaDashboardTab } from "./EmpresaDashboardTab";
export { EmpresaEditSheet } from "./EmpresaEditSheet";
export { SecoesAtivasManager } from "./SecoesAtivasManager";

// ============================================
// NETWORK COMPONENTS - Rede de empresas
// ============================================

export { default as BranchNetworkBlock } from "@/core/business/components/BranchNetworkBlock";
export { NetworkTab } from "./NetworkTab";

// ============================================
// UI COMPONENTS - Componentes de interface
// ============================================

export { BookingButton } from "./BookingButton";
export { BusinessFilters } from "./BusinessFilters";
export { ContactLink } from "./ContactLink";
export { NeighborhoodMap } from "@/core/business/components/NeighborhoodMap";
export { QuickActions } from "./QuickActions";
export { ShareBusinessDialog } from "./ShareBusinessDialog";
export { SubscriptionPlans } from "./SubscriptionPlans";

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
export { DashboardTab } from "./tabs/DashboardTab";
export { EstatisticasTab } from "./tabs/EstatisticasTab";
export { PortfolioTab } from "./tabs/PortfolioTab";
export { ProdutosTab } from "./tabs/ProdutosTab";
export { PromocoesTab } from "./tabs/PromocoesTab";
export { ServicosTab } from "./tabs/ServicosTab";
export { VisaoGeralTab } from "./tabs/VisaoGeralTab";
