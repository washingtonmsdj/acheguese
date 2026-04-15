/**
 * Tipos para NetworkTab e componentes relacionados
 * 
 * Elimina uso de 'any' em props de componentes internos
 */

import type { BranchSummary } from "@/core/business/services/NetworkService";

/**
 * Props para ConvertToNetworkPanel
 */
export interface ConvertToNetworkPanelProps {
  profileId: string;
  businessId: string;
  locationId: string | null;
  toast: (options: { title: string; description?: string; variant?: 'default' | 'destructive' }) => void;
}

/**
 * Props para BrandHubPanel
 */
export interface BrandHubPanelProps {
  brandHubId: string;
  profileId: string;
  toast: (options: { title: string; description?: string; variant?: 'default' | 'destructive' }) => void;
}

/**
 * Props para BranchPanel
 */
export interface BranchPanelProps {
  branchId: string;
  parentBusinessId: string;
  toast: (options: { title: string; description?: string; variant?: 'default' | 'destructive' }) => void;
}

/**
 * Props para CreateBranchDialog
 */
export interface CreateBranchDialogProps {
  open: boolean;
  onClose: () => void;
  brandHubId: string;
  profileId: string;
  toast: (options: { title: string; description?: string; variant?: 'default' | 'destructive' }) => void;
  onCreated: () => void;
}
