# ??? Módulo de Gastronomia

Módulo completo para gestão de estabelecimentos gastronômicos (restaurantes, bares, lanchonetes, etc).

## ?? Componentes Principais

### GastronomyCard (Nível AAA) ?
Card otimizado para conversão com hierarquia visual clara e metadados úteis.

**Variantes:**
- `grid`: Card vertical completo (padrão)
- `list`: Card horizontal compacto
- `compact`: Card mini para carrosséis

**Features:**
- Status operacional inteligente ("Fecha às 22h" / "Abre às 18h")
- Metadados úteis (rating, preço, distância, tempo de entrega)
- Badges secundárias (promoção, premium, entrega grátis)
- CTA forte e animado
- Estados visuais ricos (hover, focus, loading, sem imagem)
- Responsividade completa
- Acessibilidade WCAG AAA

**Uso:**
```tsx
<GastronomyCard
  business={restaurant}
  variant="grid"
  distanceMeters={1500}
  isFavorite={false}
  onToggleFavorite={handleFavorite}
  showPromotion={true}
/>
```

### GastronomyHero
Hero section para página de detalhes do estabelecimento.

### GastronomyFilters
Filtros avançados para busca de estabelecimentos.

### GastronomyCategoryCards
Cards de categorias de culinária.

### GastronomyCTA
Call-to-action para ações principais (delivery, reserva, etc).

## ??? Estrutura

```
src/modules/business/gastronomy/
+-- components/          # Componentes UI
¦   +-- GastronomyCard.tsx          # Card principal (AAA)
¦   +-- GastronomyHero.tsx
¦   +-- GastronomyFilters.tsx
¦   +-- ...
+-- pages/              # Páginas do módulo
¦   +-- landing/        # Landing page de gastronomia
¦   +-- ...
+-- services/           # Serviços e queries
+-- hooks/              # Hooks customizados
+-- types/              # Tipos TypeScript
+-- constants/          # Constantes (cuisine types, etc)
+-- utils/              # Utilitários
+-- README.md           # Esta documentação
```

## ?? Design System

### Cores
- **Primary**: Laranja/Vermelho (apetite, urgência)
- **Success**: Verde (aberto, entrega grátis)
- **Warning**: Amarelo (destaque, premium)
- **Danger**: Vermelho (fechado, promoção)

### Tipografia
- **Título**: Bold, 16-18px
- **Subtítulo**: Regular, 12-14px
- **Metadados**: Regular, 10-12px
- **Badges**: Semibold, 10px

### Espaçamento
- **Card padding**: 16px (p-4)
- **Gap entre elementos**: 12px (gap-3)
- **Margem entre cards**: 16px (gap-4)

## ?? Tipos Principais

### GastronomyBusiness
```typescript
interface GastronomyBusiness extends Business {
  business_data_id: string;
  gastronomy_profile: GastronomyProfile;
}
```

### GastronomyProfile
```typescript
interface GastronomyProfile {
  cuisine_type: string;
  price_range: PriceRange;
  delivery_enabled: boolean;
  delivery_fee?: number;
  delivery_time_min?: number;
  delivery_time_max?: number;
  // ... outros campos
}
```

## ?? Utilitários

### getCuisineLabel(type)
Converte tipo de culinária em label humanizado.

### formatBrl(value)
Formata valor em Real brasileiro.

### resolveGastronomyProximity(meters)
Calcula distância e tempo estimado.

## ?? Changelog

### v1.0.0 (2026-04-15)
- ? Redesign completo do GastronomyCard (Nível AAA)
- ? Status operacional inteligente
- ? Hierarquia visual otimizada
- ? Badges secundárias coerentes
- ? CTA forte e animado
- ? Estados visuais ricos
- ?? Movido componente antigo para `.archive/`
- ?? Documentação completa

## 🎯 Nichos Gastronômicos

O módulo de Gastronomia suporta **nichos especializados** internos, permitindo que diferentes tipos de estabelecimentos (pizza, sushi, açaí, etc) tenham funcionalidades específicas sem duplicar código.

### Arquitetura

```
src/modules/business/gastronomy/
+-- niches/              # Nichos especializados (novo!)
|   +-- types.ts         # Tipos canônicos
|   +-- registry.ts      # Registro SSOT
|   +-- services/        # Serviços
|   +-- hooks/           # Hooks
|   +-- components/      # UI components
|   +-- presets/         # Configs por nicho
|       +-- pizza.ts     # 🍕 (beta)
|       +-- sushi.ts     # 🍣 (beta)
|       +-- lanches.ts  # 🥪 (ativo)
|       +-- ...
```

### Conceitos

- **Nicho**: Especialização operacional (pizza tem meio a meio, sushi tem contador de peças)
- **Cuisine Type**: Classificação ampla ("Italiana", "Japonesa")
- **Status**: `full_enabled` | `basic_enabled` | `beta_enabled` | `hidden` | `coming_soon`

### Nichos Disponíveis

| Nicho | Status | Suporte |
|-------|--------|---------|
| **Lanches** | ✅ `basic_enabled` | Cardápio completo |
| **Brasileira** | ✅ `basic_enabled` | Cardápio completo |
| **Árabe** | ✅ `basic_enabled` | Cardápio completo |
| **Saudável** | ✅ `basic_enabled` | Cardápio completo |
| **Hambúrguer** | ✅ `basic_enabled` | Cardápio completo |
| **Pizza** | ✅ `full_enabled` | Pizzaria completa |
| **Sushi** | 🔒 `beta_enabled` | Preparado (Fase 3) |
| **Açaí** | 🔒 `beta_enabled` | Preparado (Fase 3) |

### Uso

```typescript
import { NicheConfigService, useGastronomyNiche } from '@/modules/business/gastronomy';

// Verificar capacidades
if (NicheConfigService.hasCapability('pizza', 'pizza_half_half')) {
  // Mostrar seletor de meio a meio
}

// Hook em componentes
const { config, hasCapability } = useGastronomyNiche({ nicheKey: 'pizza' });
```

Ver documentação completa: [niches/README.md](./niches/README.md)

---

## ?? Roadmap

### Fase 1 (Atual) ✅
- ✅ Estrutura de nichos
- ✅ Nichos básicos liberados
- ✅ UI de seleção

### Fase 2 ✅
- ✅ Nicho Pizza completo (meio a meio, 3/4 sabores, bordas, massas)
- ✅ Tabelas específicas de pizza
- ✅ Regras de preço complexas

### Fase 3 (Futuro)
- [ ] Nicho Sushi (monte seu combinado)
- [ ] Nicho Açaí (monte seu açaí)
- [ ] Nicho Churrascaria (preço por kg)

---

**Mantido por**: Equipe de Desenvolvimento
**Última atualização**: 2026-04-25
