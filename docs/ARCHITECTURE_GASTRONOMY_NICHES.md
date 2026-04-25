# 🍽️ Arquitetura de Nichos Gastronômicos

**Data:** 25 de Abril de 2026  
**Versão:** 1.0.0  
**Status:** ✅ Implementado e Validado

---

## 📋 Resumo

Foi implementada a **arquitetura de nichos gastronômicos** dentro do módulo `modules/business/gastronomy/niches/`, preparando o sistema para desenvolvimento incremental de nichos específicos (Pizza, Sushi, Açaí, etc.) **sem bagunçar o módulo atual**.

### Regras Respeitadas

| Regra | Status |
|-------|--------|
| ✅ Nenhum módulo separado criado | Nichos dentro de `gastronomy/niches/` |
| ✅ SSOT preservado | Registry central em `registry.ts` |
| ✅ Carrinho/Pedidos/Checkout reutilizados | Sem duplicação |
| ✅ Compatibilidade 100% | `cuisine_type` continua funcionando |
| ✅ Pizza preparado como próximo nicho | Status `beta_enabled` |

---

## 🏗️ Estrutura Criada

```
src/modules/business/gastronomy/niches/
├── types.ts                          # Tipos canônicos
├── registry.ts                       # Registro SSOT de nichos
├── index.ts                          # Exportações públicas
├── README.md                         # Documentação completa
│
├── presets/                          # Configurações por nicho
│   ├── base.ts                       # Preset base/factory
│   ├── pizza.ts                      # 🍕 Pizza (beta_enabled)
│   ├── sushi.ts                      # 🍣 Sushi (beta_enabled)
│   ├── acai.ts                       # 🫐 Açaí (beta_enabled)
│   ├── pastel.ts                     # 🥟 Pastel (beta_enabled)
│   ├── churrascaria.ts               # 🥩 Churrascaria (beta_enabled)
│   ├── bares.ts                      # 🍺 Bares (beta_enabled)
│   │
│   └── basic-enabled/                # Nichos liberados
│       ├── lanches.ts                # 🥪 Lanches (basic_enabled)
│       ├── hamburguer.ts             # 🍔 Hamburguer (basic_enabled)
│       ├── brasileira.ts             # 🍛 Brasileira (basic_enabled)
│       ├── arabe.ts                  # 🥙 Árabe (basic_enabled)
│       ├── saudavel.ts               # 🥗 Saudável (basic_enabled)
│       ├── salgados.ts               # 🥐 Salgados (basic_enabled)
│       ├── padaria.ts                # 🥖 Padaria (basic_enabled)
│       ├── doces.ts                  # 🧁 Doces (basic_enabled)
│       └── cafes.ts                  # ☕ Cafés (basic_enabled)
│
├── services/
│   └── NicheConfigService.ts         # Serviço de configuração
│
├── hooks/
│   └── useGastronomyNiche.ts         # Hook React
│
└── components/
    ├── NicheSelector.tsx             # Seletor de nicho (admin)
    └── NicheCapabilitiesList.tsx    # Lista de capacidades
```

---

## 🎯 Nichos Implementados

### ✅ Liberados para Uso Público (`basic_enabled`)

| Nicho | Icon | Suporte |
|-------|------|---------|
| **Lanches** | 🥪 | Cardápio completo + variações + adicionais |
| **Hambúrguer** | 🍔 | Cardápio + customizações + reservas |
| **Brasileira** | 🍛 | Cardápio + info nutricional + reservas |
| **Árabe** | 🥙 | Cardápio completo + reservas |
| **Saudável** | 🥗 | Cardápio + filtros dietéticos |
| **Salgados** | 🥐 | Cardápio para eventos |
| **Padaria** | 🥖 | Cardápio + café da manhã |
| **Doces** | 🧁 | Cardápio de sobremesas |
| **Cafés** | ☕ | Cardápio + reservas |

### 🔒 Preparados para Implementação (`beta_enabled`)

| Nicho | Icon | Funcionalidades Futuras |
|-------|------|------------------------|
| **Pizza** | 🍕 | Meio a meio, bordas, massas, regras de preço |
| **Sushi** | 🍣 | Contador de peças, monte seu combinado |
| **Açaí** | 🫐 | Monte seu açaí, caldas, complementos |
| **Pastel** | 🥟 | Meio a meio de sabores |
| **Churrascaria** | 🥩 | Preço por peso (kg) |
| **Bares** | 🍺 | Gestão de chopps |

---

## 📊 Status por Nicho

| Status | Descrição | Visível? | Nichos |
|--------|-----------|----------|--------|
| `full_enabled` | Nicho completo | ✅ Sim | (nenhum ainda) |
| `basic_enabled` | Cardápio básico | ✅ Sim | Lanches, Brasileira, etc |
| `beta_enabled` | Em desenvolvimento | 🔒 Admin only | Pizza, Sushi, Açaí, etc |
| `hidden` | Oculto | ❌ Não | - |
| `coming_soon` | Em breve | ⚠️ Label | - |

---

## 🔧 Uso no Código

### 1. Selecionar Nicho (Admin)

```tsx
import { NicheSelector, NicheConfigService } from '@/modules/business/gastronomy';

function GastronomySetupPage() {
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null);

  return (
    <NicheSelector
      selectedNiche={selectedNiche}
      onSelect={setSelectedNiche}
      showBeta={true} // Mostrar nichos em beta para admin
    />
  );
}
```

### 2. Hook useGastronomyNiche

```tsx
import { useGastronomyNiche } from '@/modules/business/gastronomy';

function MenuEditor({ nicheKey }: { nicheKey: string }) {
  const {
    config,
    hasCapability,
    shouldShowSection,
    validateItem,
  } = useGastronomyNiche({ nicheKey });

  // Verificar se suporta meio a meio
  if (hasCapability('pizza_half_half')) {
    return <HalfHalfSelector />;
  }

  // Verificar se deve mostrar seção
  const showPizzaBuilder = shouldShowSection('pizza_flavors');

  // Validar item
  const validation = validateItem({ name: 'Pizza', price: 50 });
}
```

### 3. Serviço NicheConfigService

```typescript
import { NicheConfigService } from '@/modules/business/gastronomy';

// Listar nichos
const publicNiches = NicheConfigService.getPublic();
const selectableNiches = NicheConfigService.getSelectable();

// Verificar capacidades
const hasHalfHalf = NicheConfigService.hasCapability('pizza', 'pizza_half_half');

// Validar item
const result = NicheConfigService.validateForNiche('pizza', {
  name: 'Pizza Calabresa',
  base_price: 45,
});
```

---

## 🔄 Integração com Dados Existentes

### Campo `niche_key` em GastronomyProfile

```typescript
// src/core/business/types/gastronomy.ts
interface GastronomyProfile {
  id: string;
  business_id: string;
  niche_key?: string;  // ✅ NOVO - Nicho especializado
  cuisine_type: string; // ✅ Mantido para compatibilidade
  cuisine_subtypes: string[];
  // ...
}
```

### Compatibilidade com `cuisine_type`

```typescript
// Mapeamento automático cuisine_type → niche_key
const nicheKey = NicheConfigService.mapLegacyCuisine('pizzaria');
// Retorna: 'pizza'
```

---

## 🚀 Próximos Passos (Fase 2)

Para implementar o nicho **Pizza** completamente:

1. **Criar tabelas específicas**:
   ```sql
   CREATE TABLE pizza_sizes (id, name, slices, diameter, price_adjustment);
   CREATE TABLE pizza_flavors (id, name, category, base_price);
   CREATE TABLE pizza_crusts (id, name, price_adjustment);
   CREATE TABLE pizza_crust_stuffing (id, name, price);
   CREATE TABLE pizza_price_rules (...);
   ```

2. **Criar componentes de UI**:
   - `PizzaSizeSelector`
   - `PizzaFlavorSelector` (suporte a meio a meio)
   - `PizzaCrustSelector`
   - `PizzaBuilder`

3. **Regras de negócio**:
   - Meio a meio: preço = média dos dois sabores
   - 3+ sabores: preço do mais caro
   - Borda recheada: +R$ X (tamanho GG = +R$ Y)

4. **Mudar status**:
   ```typescript
   // pizza.ts
   supportLevel: 'full_enabled',
   isSelectable: true,
   isPublic: true,
   ```

---

## ✅ Critérios de Aceite Verificados

| Critério | Status |
|----------|--------|
| ✅ Base limpa para niches dentro de Gastronomia | `modules/business/gastronomy/niches/` |
| ✅ Sistema diferencia nicho básico/completo/beta/oculto | Status types + filtros |
| ✅ Seleção pública respeita status do nicho | `isSelectable`, `isPublic` |
| ✅ Admin sabe quais seções exibir | `adminSections`, `shouldShowAdminSection()` |
| ✅ Pizza preparado como próximo nicho | `beta_enabled`, configs prontas |
| ✅ Sem gambiarra | Arquitetura SSOT, registry central |
| ✅ Nenhum dado essencial em metadata | `niche_key` é campo tipado |
| ✅ TypeScript, lint, build passam | ✅ Validado |
| ✅ Carrinho/pedidos/checkout preservados | Sem alterações |
| ✅ Compatibilidade 100% | `cuisine_type` mantido |

---

## 📚 Documentação

- **Módulo Nichos**: `@/modules/business/gastronomy/niches/README.md`
- **Módulo Gastronomia**: `@/modules/business/gastronomy/README.md` (atualizado)
- **Tipos Core**: `@/core/business/types/gastronomy.ts` (atualizado)

---

**Implementado por:** Arquitetura de Software  
**Data:** 25/04/2026  
**Próxima Fase:** Implementação do Nicho Pizza (Fase 2)
