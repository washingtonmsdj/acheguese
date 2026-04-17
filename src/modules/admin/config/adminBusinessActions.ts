/**
 * 🏆 ADMIN BUSINESS ACTIONS - SSOT COMPLIANT
 *
 * ✅ Ações baseadas em business_data (SSOT)
 * ✅ Campos corretos (is_verified, is_premium, etc.)
 * ✅ Compatível com BusinessService
 *
 * @version 1.0.0 - SSOT Migration
 */

import { ShieldCheck, Crown, CheckCircle, Star, Briefcase } from "lucide-react";
import type { Business } from "@/core/business/types";

export const ADMIN_BUSINESS_ACTIONS = [
  {
    key: "status",
    label: "Ativar",
    icon: ShieldCheck,
    activeColor: "text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20",
    inactiveColor: "text-amber-600 bg-amber-500/10 hover:bg-amber-500/20",
    getValue: (business: Business) => business.status === "active",
    getNextValue: (business: Business) =>
      business.status === "active" ? "inactive" : "active",
  },
  {
    key: "is_premium",
    label: "Premium",
    icon: Crown,
    activeColor: "text-amber-600 bg-amber-500/10 hover:bg-amber-500/20",
    getValue: (business: Business) => !!business.is_premium,
  },
  {
    key: "is_verified",
    label: "Verificado",
    icon: CheckCircle,
    activeColor: "text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20",
    getValue: (business: Business) => !!business.is_verified,
  },
  {
    key: "can_post_vagas",
    label: "Publicar Vagas",
    icon: Briefcase,
    activeColor: "text-indigo-600 bg-indigo-500/10 hover:bg-indigo-500/20",
    inactiveColor: "text-rose-600 bg-rose-500/10 hover:bg-rose-500/20",
    getValue: (business: Business) => business.can_post_vagas !== false,
  },
  {
    key: "is_featured",
    label: "Destaque",
    icon: Star,
    activeColor: "text-sky-600 bg-sky-500/10 hover:bg-sky-500/20",
    getValue: (business: Business) => !!business.is_featured,
  },
];
