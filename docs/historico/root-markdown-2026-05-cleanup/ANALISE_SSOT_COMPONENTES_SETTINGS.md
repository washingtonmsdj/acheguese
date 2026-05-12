# 🔍 Análise SSOT: Componentes de Settings

## ❓ Pergunta: Está seguindo SSOT e sem gambiarras?

**Resposta:** ⚠️ PARCIALMENTE - Há alguns pontos que precisam ser corrigidos.

## 🚨 Problemas Identificados

### 1. **Duplicação de Dados de Facilidades**

**Problema:**
```typescript
// Em FacilitiesSelector.tsx
const FACILITIES = [
  { id: "wifi", label: "Wi-Fi Grátis", icon: Wifi, color: "text-sky-600" },
  { id: "estacionamento", label: "Estacionamento", ... },
  // ...
];

// Na página pública (EmpresaDetailLandingPage.tsx)
const FACILITY_ICONS: Record<string, typeof Wifi> = {
  wifi: Wifi, 
  estacionamento: ParkingSquare, 
  // ...
};

const FACILITY_LABELS: Record<string, string> = {
  wifi: "Wi-Fi grátis", 
  estacionamento: "Estacionamento", 
  // ...
};
```

**❌ Violação SSOT:** Mesmos dados definidos em 2 lugares diferentes!

**✅ Solução:** Criar arquivo SSOT centralizado.

### 2. **Duplicação de Configuração de Modos de Atendimento**

**Problema:**
```typescript
// Em ServiceModesSelector.tsx
const SERVICE_MODES = [
  { id: "presencial", label: "Atendimento Presencial", ... },
  // ...
];

// Na página pública (EmpresaDetailLandingPage.tsx)
const MODOS_CONFIG: Record<string, { label: string; icon: typeof Store; color: string }> = {
  presencial: { label: "Atendimento presencial", icon: Store, ... },
  // ...
};
```

**❌ Violação SSOT:** Mesma configuração em 2 lugares!

**✅ Solução:** Centralizar em arquivo de constantes.

### 3. **Duplicação de Sugestões de Especialidades**

**Problema:**
```typescript
// Em SpecialtiesEditor.tsx
const CATEGORY_SUGGESTIONS: Record<string, string[]> = {
  restaurante: ["Moqueca", "Acarajé", ...],
  // ...
};
```

**⚠️ Potencial problema:** Se houver sugestões em outro lugar, haverá duplicação.

**✅ Solução:** Verificar se já existe e centralizar.

### 4. **Validação de Redes Sociais Duplicada**

**Problema:**
```typescript
// Em SocialMediaEditor.tsx
const SOCIAL_PLATFORMS = [
  {
    id: "instagram",
    pattern: /^[a-zA-Z0-9._]{1,30}$/,
    baseUrl: "https://instagram.com/",
    // ...
  },
];
```

**⚠️ Potencial problema:** Se houver validação de redes sociais em outro lugar.

**✅ Solução:** Centralizar validações.

## ✅ Solução: Criar Arquivos SSOT

### Estrutura Proposta:

```
src/core/business/constants/
├── facilities.ts          # SSOT para facilidades
├── serviceModes.ts        # SSOT para modos de atendimento
├── paymentMethods.ts      # SSOT para formas de pagamento
├── socialPlatforms.ts     # SSOT para redes sociais
├── specialties.ts         # SSOT para sugestões de especialidades
└── index.ts               # Exports centralizados
```

## 🔧 Implementação Correta

### 1. facilities.ts (SSOT)

```typescript
/**
 * SSOT: Facilidades oferecidas por empresas
 * 
 * Usado em:
 * - FacilitiesSelector (componente de edição)
 * - EmpresaDetailLandingPage (exibição pública)
 * - Qualquer outro lugar que precise exibir facilidades
 */

import { Wifi, ParkingSquare, Accessibility, Baby, Dog, AirVent, Utensils, Music } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface Facility {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
  description?: string;
}

export const FACILITIES: Facility[] = [
  { 
    id: "wifi", 
    label: "Wi-Fi Grátis", 
    icon: Wifi, 
    color: "text-sky-600",
    description: "Internet sem fio gratuita para clientes"
  },
  { 
    id: "estacionamento", 
    label: "Estacionamento", 
    icon: ParkingSquare, 
    color: "text-blue-600",
    description: "Vagas de estacionamento disponíveis"
  },
  { 
    id: "acessibilidade", 
    label: "Acessibilidade", 
    icon: Accessibility, 
    color: "text-purple-600",
    description: "Acessível para pessoas com deficiência"
  },
  { 
    id: "kids", 
    label: "Espaço Kids", 
    icon: Baby, 
    color: "text-pink-600",
    description: "Área dedicada para crianças"
  },
  { 
    id: "pet_friendly", 
    label: "Pet Friendly", 
    icon: Dog, 
    color: "text-amber-600",
    description: "Aceita animais de estimação"
  },
  { 
    id: "ar_condicionado", 
    label: "Ar Condicionado", 
    icon: AirVent, 
    color: "text-cyan-600",
    description: "Ambiente climatizado"
  },
  { 
    id: "area_externa", 
    label: "Área Externa", 
    icon: Utensils, 
    color: "text-emerald-600",
    description: "Espaço ao ar livre"
  },
  { 
    id: "musica_ao_vivo", 
    label: "Música ao Vivo", 
    icon: Music, 
    color: "text-indigo-600",
    description: "Apresentações musicais"
  },
];

// Helper functions
export const getFacilityById = (id: string): Facility | undefined => {
  return FACILITIES.find(f => f.id === id);
};

export const getFacilityIcon = (id: string): LucideIcon | undefined => {
  return getFacilityById(id)?.icon;
};

export const getFacilityLabel = (id: string): string => {
  return getFacilityById(id)?.label || id;
};
```

### 2. serviceModes.ts (SSOT)

```typescript
/**
 * SSOT: Modos de atendimento
 */

import { Store, Truck, Home, Globe } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface ServiceMode {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
  hasAreas?: boolean; // Se permite configurar áreas de atendimento
}

export const SERVICE_MODES: ServiceMode[] = [
  {
    id: "presencial",
    label: "Atendimento Presencial",
    description: "Clientes visitam o estabelecimento",
    icon: Store,
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/20",
  },
  {
    id: "delivery",
    label: "Delivery",
    description: "Entrega no endereço do cliente",
    icon: Truck,
    color: "text-emerald-600",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    hasAreas: true,
  },
  {
    id: "domicilio",
    label: "Atendimento a Domicílio",
    description: "Profissional vai até o cliente",
    icon: Home,
    color: "text-amber-600",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
    hasAreas: true,
  },
  {
    id: "online",
    label: "Atendimento Online",
    description: "Atendimento remoto (videochamada, chat)",
    icon: Globe,
    color: "text-sky-600",
    bgColor: "bg-sky-500/10",
    borderColor: "border-sky-500/20",
  },
];

export const getServiceModeById = (id: string): ServiceMode | undefined => {
  return SERVICE_MODES.find(m => m.id === id);
};
```

### 3. paymentMethods.ts (SSOT)

```typescript
/**
 * SSOT: Formas de pagamento
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

export const PAYMENT_METHODS: PaymentMethod[] = [
  { 
    id: "pix", 
    label: "PIX", 
    icon: Smartphone, 
    color: "text-emerald-600",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
  },
  { 
    id: "credito", 
    label: "Cartão de Crédito", 
    icon: CreditCard, 
    color: "text-sky-600",
    bgColor: "bg-sky-500/10",
    borderColor: "border-sky-500/20",
  },
  { 
    id: "debito", 
    label: "Cartão de Débito", 
    icon: CreditCard, 
    color: "text-blue-600",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
  },
  { 
    id: "dinheiro", 
    label: "Dinheiro", 
    icon: Banknote, 
    color: "text-amber-600",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
  },
  { 
    id: "vale-refeicao", 
    label: "Vale Refeição", 
    icon: Wallet, 
    color: "text-purple-600",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
  },
  { 
    id: "vale-alimentacao", 
    label: "Vale Alimentação", 
    icon: Wallet, 
    color: "text-indigo-600",
    bgColor: "bg-indigo-500/10",
    borderColor: "border-indigo-500/20",
  },
];

export const getPaymentMethodById = (id: string): PaymentMethod | undefined => {
  return PAYMENT_METHODS.find(m => m.id === id);
};
```

### 4. socialPlatforms.ts (SSOT)

```typescript
/**
 * SSOT: Plataformas de redes sociais
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

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
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
];

export const getSocialPlatformById = (id: string): SocialPlatform | undefined => {
  return SOCIAL_PLATFORMS.find(p => p.id === id);
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
```

### 5. specialties.ts (SSOT)

```typescript
/**
 * SSOT: Sugestões de especialidades por categoria
 */

export const SPECIALTY_SUGGESTIONS: Record<string, string[]> = {
  restaurante: [
    "Moqueca", "Acarajé", "Vatapá", "Caruru", "Bobó de Camarão",
    "Feijoada", "Churrasco", "Pizza", "Sushi", "Massas",
    "Comida Caseira", "Frutos do Mar", "Carnes", "Vegetariano", "Vegano"
  ],
  padaria: [
    "Pão Francês", "Pão de Forma", "Bolo", "Torta", "Salgados",
    "Doces", "Café", "Sanduíches", "Croissant", "Pão de Queijo"
  ],
  farmacia: [
    "Manipulação", "Dermocosméticos", "Homeopatia", "Perfumaria",
    "Medicamentos Genéricos", "Suplementos", "Ortopedia", "Vacinas"
  ],
  salao: [
    "Corte Feminino", "Corte Masculino", "Coloração", "Mechas",
    "Escova", "Manicure", "Pedicure", "Depilação", "Maquiagem"
  ],
  academia: [
    "Musculação", "Crossfit", "Pilates", "Yoga", "Spinning",
    "Funcional", "Boxe", "Natação", "Dança", "Personal Trainer"
  ],
  petshop: [
    "Banho e Tosa", "Veterinário", "Ração", "Acessórios",
    "Vacinas", "Hospedagem", "Adestramento", "Grooming"
  ],
};

export const getSpecialtySuggestions = (category: string): string[] => {
  return SPECIALTY_SUGGESTIONS[category] || [];
};
```

## 📝 Checklist de Correções Necessárias

### Prioridade ALTA (Fazer Agora)
- [ ] Criar `src/core/business/constants/facilities.ts`
- [ ] Criar `src/core/business/constants/serviceModes.ts`
- [ ] Criar `src/core/business/constants/paymentMethods.ts`
- [ ] Criar `src/core/business/constants/socialPlatforms.ts`
- [ ] Criar `src/core/business/constants/specialties.ts`
- [ ] Criar `src/core/business/constants/index.ts`

### Prioridade ALTA (Refatorar)
- [ ] Atualizar `FacilitiesSelector.tsx` para usar SSOT
- [ ] Atualizar `ServiceModesSelector.tsx` para usar SSOT
- [ ] Atualizar `PaymentMethodsSelector.tsx` para usar SSOT
- [ ] Atualizar `SocialMediaEditor.tsx` para usar SSOT
- [ ] Atualizar `SpecialtiesEditor.tsx` para usar SSOT

### Prioridade MÉDIA (Refatorar Página Pública)
- [ ] Atualizar `EmpresaDetailLandingPage.tsx` para usar SSOT
- [ ] Remover constantes duplicadas da página pública
- [ ] Importar de `@/core/business/constants`

## ✅ Benefícios da Correção

1. **Single Source of Truth (SSOT)**
   - ✅ Dados definidos em um único lugar
   - ✅ Mudanças refletem em todo o sistema
   - ✅ Sem inconsistências

2. **Manutenibilidade**
   - ✅ Fácil adicionar novas facilidades
   - ✅ Fácil mudar labels ou ícones
   - ✅ Código mais limpo

3. **Reutilização**
   - ✅ Componentes podem importar constantes
   - ✅ Páginas públicas usam mesmos dados
   - ✅ Testes podem usar mesmas constantes

4. **Type Safety**
   - ✅ Interfaces TypeScript bem definidas
   - ✅ Autocomplete no IDE
   - ✅ Menos erros em runtime

## 🎯 Conclusão

**Status Atual:** ⚠️ Componentes funcionais mas com duplicação de dados

**Ação Necessária:** Criar arquivos SSOT e refatorar componentes

**Prioridade:** ALTA - Fazer antes de continuar com novas features

**Tempo Estimado:** 1-2 horas para criar SSOT e refatorar

---

**Recomendação:** Vamos criar os arquivos SSOT agora antes de continuar?
