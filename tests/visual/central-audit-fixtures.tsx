import { useSyncExternalStore } from "react";
import type { Business } from "@/core/business/types/Business";

const business: Business = {
  id: "test-business", profile_id: "test-business", name: "Empresa demonstrativa de nome longo",
  description: "", category: "educacao", status: "active", slug: "empresa-demonstrativa",
  location_id: null, business_city: "Cidade de exemplo", business_state: "BA",
  rating: 0, total_reviews: 0, total_products: 0, tem_delivery: false,
  aceita_cartao: false, aceita_pix: false, is_premium: false, is_verified: false,
  can_post_vagas: false, formas_pagamento: [], especialidades: [], facilidades: [],
  modos_atendimento: [], created_at: "", updated_at: "",
};
const profiles = [
  { id: "test-business", display_name: "Empresa demonstrativa", profile_type: "business" as const, avatar_url: null, handle: "empresa-demo" },
  { id: "test-personal", display_name: "Perfil pessoal de teste", profile_type: "personal" as const, avatar_url: null, handle: "perfil-demo" },
];
let current = profiles[0];
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
function useProfile() { return useSyncExternalStore(subscribe, () => current); }
export const useBusiness = () => ({ business, isLoading: false });
export const useResolvedBusinessPublicUrl = () => ({ url: null });
export function useSessionContext() {
  const active = useProfile();
  return { activeProfile: { id: active.id, displayName: active.display_name, avatarUrl: null } };
}
export function useMultiProfileContext() {
  const active = useProfile();
  return {
    activeProfile: active, effectiveProfile: active, contextualProfile: null, allProfiles: profiles, loading: false,
    setModuleContext: () => {},
    switchProfile: async (id: string) => {
      const next = profiles.find((profile) => profile.id === id);
      if (next) { current = next; listeners.forEach((listener) => listener()); }
    },
  };
}
export function ProfileMembersManager({ profileId }: { profileId: string }) {
  return <p>Acesso simulado ao perfil {profileId}. Nenhuma alteração é publicada.</p>;
}
