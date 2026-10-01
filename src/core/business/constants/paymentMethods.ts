/**
 * SSOT: Formas de pagamento
 * 
 * Este é o ÚNICO lugar onde formas de pagamento são definidas.
 * Usado em:
 * - PaymentMethodsSelector (componente de edição)
 * - EmpresaDetailLandingPage (exibição pública)
 * - Qualquer outro lugar que precise exibir formas de pagamento
 * 
 * REGRA: Nunca duplicar estas definições em outro arquivo!
 */

import { CreditCard, Banknote, Smartphone, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface PaymentMethod {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
}

export const PAYMENT_METHODS: readonly PaymentMethod[] = [
  { 
    id: "pix", 
    label: "PIX", 
    icon: Smartphone, 
    color: "text-territory-brand",
    bgColor: "bg-territory-brand/10",
    borderColor: "border-territory-brand/20",
  },
  { 
    id: "credito", 
    label: "Cartão de Crédito", 
    icon: CreditCard, 
    color: "text-territory-brand",
    bgColor: "bg-territory-brand/10",
    borderColor: "border-territory-brand/20",
  },
  { 
    id: "debito", 
    label: "Cartão de Débito", 
    icon: CreditCard, 
    color: "text-territory-brand",
    bgColor: "bg-territory-brand/10",
    borderColor: "border-territory-brand/20",
  },
  { 
    id: "dinheiro", 
    label: "Dinheiro", 
    icon: Banknote, 
    color: "text-territory-brand",
    bgColor: "bg-territory-brand/10",
    borderColor: "border-territory-brand/20",
  },
  { 
    id: "vale-refeicao", 
    label: "Vale Refeição", 
    icon: Wallet, 
    color: "text-territory-brand",
    bgColor: "bg-territory-brand/10",
    borderColor: "border-territory-brand/20",
  },
  { 
    id: "vale-alimentacao", 
    label: "Vale Alimentação", 
    icon: Wallet, 
    color: "text-territory-brand",
    bgColor: "bg-territory-brand/10",
    borderColor: "border-territory-brand/20",
  },
] as const;

// Helper functions
const getPaymentMethodById = (id: string): PaymentMethod | undefined => {
  return PAYMENT_METHODS.find(m => m.id === id);
};

export const getPaymentMethodLabel = (id: string): string => {
  return getPaymentMethodById(id)?.label || id;
};
