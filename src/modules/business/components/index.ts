/**
 * 🏆 BUSINESS COMPONENTS - Barrel Export Organizado
 *
 * Exportações organizadas por categoria para facilitar manutenção
 *
 * @author Kiro AI
 * @date 2026-04-10
 */

// ============================================
// NETWORK COMPONENTS - Rede de empresas
// ============================================

export { default as BranchNetworkBlock } from "@/core/business/components/BranchNetworkBlock";

// ============================================
// UI COMPONENTS - Componentes de interface
// ============================================

export { ContactLink } from "./ContactLink";
export { NeighborhoodMap } from "@/core/business/components/NeighborhoodMap";

// ============================================
// SUB-FOLDERS - Componentes em subpastas
// ============================================

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
