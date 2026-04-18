# 📝 Sistema de Edição de Dados da Empresa

## 🎯 Visão Geral

Sistema completo de edição de dados de empresas, implementado seguindo princípios SSOT (Single Source of Truth), sem duplicação de código.

**Status:** ✅ 100% Completo e Funcional

---

## 📁 Estrutura de Arquivos

```
src/core/business/components/settings/
├── BusinessImageUploader.tsx      # Upload de imagens (logo, banner, galeria)
├── OpeningHoursEditor.tsx         # Editor de horários (7 dias)
├── PaymentMethodsSelector.tsx     # Seletor de formas de pagamento
├── FacilitiesSelector.tsx         # Seletor de facilidades
├── ServiceModesSelector.tsx       # Seletor de modos de atendimento
├── SpecialtiesEditor.tsx          # Editor de especialidades (tags)
├── SocialMediaEditor.tsx          # Editor de redes sociais
├── AddressEditor.tsx              # Editor de endereço completo
└── sections/
    ├── BasicInfoSection.tsx       # Seção: Informações básicas
    ├── VisualIdentitySection.tsx  # Seção: Identidade visual
    ├── ContactSection.tsx         # Seção: Contato
    ├── ServiceSection.tsx         # Seção: Atendimento
    ├── LocationSection.tsx        # Seção: Localização
    ├── OpeningHoursSection.tsx    # Seção: Horários
    ├── AdvancedSection.tsx        # Seção: Configurações avançadas
    └── index.ts                   # Exports centralizados
```

---

## 🧩 Componentes Base

### 1. BusinessImageUploader
Upload de imagens com drag & drop, preview e validação.

```tsx
import { BusinessImageUploader } from '@/core/business/components/settings/BusinessImageUploader';

<BusinessImageUploader
  type="logo" // ou "banner" ou "gallery"
  currentImage={business.logo_url}
  onUpload={handleUpload}
  aspectRatio="1:1"
  maxSizeMB={2}
/>
```

### 2. OpeningHoursEditor
Editor de horários de funcionamento para 7 dias da semana.

```tsx
import { OpeningHoursEditor } from '@/core/business/components/settings/OpeningHoursEditor';

<OpeningHoursEditor
  hours={business.horario_funcionamento}
  onChange={handleHoursChange}
/>
```

### 3. PaymentMethodsSelector
Seletor de formas de pagamento (6 predefinidas + customizadas).

```tsx
import { PaymentMethodsSelector } from '@/core/business/components/settings/PaymentMethodsSelector';

<PaymentMethodsSelector
  selected={business.formas_pagamento}
  onChange={handlePaymentChange}
  allowCustom={true}
/>
```

### 4. FacilitiesSelector
Seletor de facilidades (8 opções predefinidas).

```tsx
import { FacilitiesSelector } from '@/core/business/components/settings/FacilitiesSelector';

<FacilitiesSelector
  selected={business.facilidades}
  onChange={handleFacilitiesChange}
/>
```

### 5. ServiceModesSelector
Seletor de modos de atendimento + áreas de entrega.

```tsx
import { ServiceModesSelector } from '@/core/business/components/settings/ServiceModesSelector';

<ServiceModesSelector
  selected={business.modos_atendimento}
  onChange={handleModesChange}
  deliveryAreas={business.areas_entrega}
  onDeliveryAreasChange={handleAreasChange}
/>
```

### 6. SpecialtiesEditor
Editor de especialidades com sistema de tags e sugestões.

```tsx
import { SpecialtiesEditor } from '@/core/business/components/settings/SpecialtiesEditor';

<SpecialtiesEditor
  specialties={business.especialidades}
  onChange={handleSpecialtiesChange}
  maxTags={10}
  category={business.category}
/>
```

### 7. SocialMediaEditor
Editor de redes sociais (6 plataformas com validação).

```tsx
import { SocialMediaEditor } from '@/core/business/components/settings/SocialMediaEditor';

<SocialMediaEditor
  social={{
    instagram: business.instagram,
    facebook: business.facebook,
    // ...
  }}
  onChange={handleSocialChange}
/>
```

### 8. AddressEditor
Editor de endereço completo com busca por CEP.

```tsx
import { AddressEditor } from '@/core/business/components/settings/AddressEditor';

<AddressEditor
  address={business.address}
  onChange={handleAddressChange}
  features={{
    cepLookup: true,
    mapPicker: false,
    coordinates: true
  }}
/>
```

---

## 📋 Seções do Formulário

### Importar Todas as Seções
```tsx
import {
  BasicInfoSection,
  VisualIdentitySection,
  ContactSection,
  ServiceSection,
  LocationSection,
  OpeningHoursSection,
  AdvancedSection,
} from '@/core/business/components/settings/sections';
```

### 1. BasicInfoSection
Nome, slug, categoria, subcategoria, descrição.

### 2. VisualIdentitySection
Logo, banner, galeria de fotos.

### 3. ContactSection
Telefone, WhatsApp, email, website, redes sociais.

### 4. ServiceSection
Modos de atendimento, áreas, pagamentos, facilidades, especialidades.

### 5. LocationSection
Endereço completo com busca por CEP e coordenadas.

### 6. OpeningHoursSection
Horários de funcionamento (7 dias da semana).

### 7. AdvancedSection
Status, visibilidade, permissões, SEO.

---

## 🎯 Constantes SSOT

Todas as constantes estão centralizadas em `src/core/business/constants/`:

```tsx
import {
  FACILITIES,
  SERVICE_MODES,
  PAYMENT_METHODS,
  SOCIAL_PLATFORMS,
  SPECIALTY_SUGGESTIONS,
  getFacilityById,
  getServiceModeLabel,
  validateSocialUsername,
  // ... outros helpers
} from '@/core/business/constants';
```

**Benefícios:**
- ✅ Zero duplicação de código
- ✅ Fácil manutenção
- ✅ Type safety
- ✅ Helpers para operações comuns

---

## 🚀 Uso Completo (SettingsTab)

O componente `SettingsTab` integra todas as seções:

```tsx
import { SettingsTab } from '@/shared/components/dashboard/SettingsTab';

function DashboardPage() {
  return (
    <SettingsTab
      businessId="uuid-da-empresa"
      onEditBusiness={() => {
        // Callback opcional
      }}
    />
  );
}
```

**Funcionalidades incluídas:**
- ✅ Navegação por seções (sidebar)
- ✅ Carregamento automático do Supabase
- ✅ Salvamento no Supabase
- ✅ Upload de imagens
- ✅ Validações
- ✅ Feedback visual
- ✅ Indicador de alterações não salvas

---

## 📊 Estatísticas

- **Componentes Base:** 8
- **Seções:** 7
- **Constantes SSOT:** 6
- **Total de Código:** ~5.750 linhas
- **Arquivos:** 23

---

## 📚 Documentação Completa

Para documentação detalhada, consulte:
- `docs/SISTEMA_EDICAO_EMPRESA_COMPLETO.md` - Documentação completa
- `docs/PROGRESSO_IMPLEMENTACAO_EDICAO_EMPRESA.md` - Progresso detalhado

---

## ✅ Qualidade

- ✅ TypeScript em todos os arquivos
- ✅ SSOT (zero duplicação)
- ✅ Componentes reutilizáveis
- ✅ Validações implementadas
- ✅ Feedback visual
- ✅ Código limpo, sem gambiarras

---

**🎉 Sistema 100% Funcional!**
