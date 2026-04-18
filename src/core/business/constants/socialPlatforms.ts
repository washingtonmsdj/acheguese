/**
 * SSOT: Plataformas de redes sociais
 * 
 * Este é o ÚNICO lugar onde redes sociais são definidas.
 * Usado em:
 * - SocialMediaEditor (componente de edição)
 * - EmpresaDetailLandingPage (exibição pública)
 * - Qualquer outro lugar que precise exibir redes sociais
 * 
 * REGRA: Nunca duplicar estas definições em outro arquivo!
 */

import { Instagram, Facebook, Twitter, Linkedin, Music, Youtube } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface SocialPlatform {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
  placeholder: string;
  prefix: string;
  baseUrl: string;
  pattern: RegExp;
}

export const SOCIAL_PLATFORMS: readonly SocialPlatform[] = [
  {
    id: "instagram",
    label: "Instagram",
    icon: Instagram,
    color: "text-pink-600",
    placeholder: "seu_usuario",
    prefix: "@",
    baseUrl: "https://instagram.com/",
    pattern: /^[a-zA-Z0-9._]{1,30}$/,
  },
  {
    id: "facebook",
    label: "Facebook",
    icon: Facebook,
    color: "text-blue-600",
    placeholder: "sua.pagina",
    prefix: "",
    baseUrl: "https://facebook.com/",
    pattern: /^[a-zA-Z0-9.]{5,}$/,
  },
  {
    id: "twitter",
    label: "Twitter / X",
    icon: Twitter,
    color: "text-sky-600",
    placeholder: "seu_usuario",
    prefix: "@",
    baseUrl: "https://twitter.com/",
    pattern: /^[a-zA-Z0-9_]{1,15}$/,
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    icon: Linkedin,
    color: "text-blue-700",
    placeholder: "sua-empresa",
    prefix: "",
    baseUrl: "https://linkedin.com/company/",
    pattern: /^[a-zA-Z0-9-]{3,}$/,
  },
  {
    id: "tiktok",
    label: "TikTok",
    icon: Music,
    color: "text-slate-900",
    placeholder: "seu_usuario",
    prefix: "@",
    baseUrl: "https://tiktok.com/@",
    pattern: /^[a-zA-Z0-9._]{2,24}$/,
  },
  {
    id: "youtube",
    label: "YouTube",
    icon: Youtube,
    color: "text-red-600",
    placeholder: "seu-canal",
    prefix: "",
    baseUrl: "https://youtube.com/@",
    pattern: /^[a-zA-Z0-9_-]{3,}$/,
  },
] as const;

// Helper functions
export const getSocialPlatformById = (id: string): SocialPlatform | undefined => {
  return SOCIAL_PLATFORMS.find(p => p.id === id);
};

export const getSocialPlatformLabel = (id: string): string => {
  return getSocialPlatformById(id)?.label || id;
};

export const getSocialPlatformIcon = (id: string): LucideIcon | undefined => {
  return getSocialPlatformById(id)?.icon;
};

export const validateSocialUsername = (platform: string, username: string): boolean => {
  const platformConfig = getSocialPlatformById(platform);
  if (!platformConfig) return false;
  return platformConfig.pattern.test(username);
};

export const getSocialUrl = (platform: string, username: string): string | null => {
  const platformConfig = getSocialPlatformById(platform);
  if (!platformConfig || !username) return null;
  return platformConfig.baseUrl + username;
};

// Type helper para IDs válidos
export type SocialPlatformId = typeof SOCIAL_PLATFORMS[number]['id'];
