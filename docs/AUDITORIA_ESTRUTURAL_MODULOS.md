# 🏛️ Auditoria Estrutural Modular — Acheguese

> **Data**: 2026-04-20
> **Tipo**: Auditoria arquitetural ponta a ponta (camadas, SSOT, boundaries, exports, órfãos, legado)
> **Método**: Varredura real do código (`grep`, `find`, análise de imports, contagem de barrels, comparação core×modules)
> **Escopo**: `src/app`, `src/core`, `src/modules`, `src/shared`, `src/integrations` + pastas legadas (`src/pages`, `src/components`, `src/features`)

---

## 1. Inventário Real

### 1.1 Volumetria por camada

| Camada | Arquivos `.ts/.tsx` | Status | Observação |
|---|---:|---|---|
| `src/app` | 46 | ✅ correta | Shell, rotas, providers |
| `src/core` | **746** | ✅ correta | 70 subdomínios transversais |
| `src/modules` | **1.347** | 🟡 mistura | 25 módulos (alguns verticais, outros transversais mal posicionados) |
| `src/shared` | 261 | ✅ correta | UI/utils compartilhados |
| `src/integrations` | 14 | ✅ correta | Supabase + maps |
| `src/components` | 7 | 🔴 **legado** | Deve ir para `core/*` ou `modules/*` |
| `src/pages` | 11 | 🔴 **legado** | Deve ir para `app/pages` ou módulos |
| `src/features` | 1 dir | 🔴 **legado** | `features/nearby` → mover |
| `src/config` | 4 | 🟡 ok temporário | Avaliar mover para `app/config` |

### 1.2 Módulos em `src/modules/`

```
admin               admin-identidade    admin-motoristas    analytics
business            classifieds         community           community-alerts
community-issues    dashboard           delivery            empresa
empresas-landing    gastronomy          guide               landing
mobility            notifications       onboarding          professionals
profile             promotions          services            vagas
verification
```

### 1.3 Subdomínios em `src/core/` (70)

Todos respeitam o padrão `core/<dominio>/{services,hooks,types,...}`. Núcleo está saudável.

---

## 2. Classificação dos módulos

| Módulo | Camada atual | Tipo | Veredito | Severidade |
|---|---|---|---|:---:|
| `modules/admin` | modules | transversal | 🟡 parcial — deveria ser apenas UI; muita lógica deveria estar em `core/admin` | M |
| `modules/admin-identidade` | modules | transversal | 🔴 **incorreto** — sub-shell de admin, sem barrel, importa `modules/admin` | A |
| `modules/admin-motoristas` | modules | transversal | 🔴 **incorreto** — idem `admin-identidade` | A |
| `modules/analytics` | modules | transversal | 🟡 — duplica `core/analytics`. Avaliar fusão | M |
| `modules/business` | modules | vertical | ✅ correto | — |
| `modules/classifieds` | modules | vertical | ✅ correto | — |
| `modules/community` | modules | vertical | ✅ correto | — |
| `modules/community-alerts` | modules | vertical | ✅ correto (CHECKLIST presente) | — |
| `modules/community-issues` | modules | vertical | ✅ correto (barrel exemplar) | — |
| `modules/dashboard` | modules | transversal | 🟡 — verificar duplicação com `app` | B |
| `modules/delivery` | modules | vertical | 🟡 — fronteira com `gastronomy`/`mobility` precisa documentação | M |
| `modules/empresa` | modules | vertical | 🔴 **sem barrel**, importa `gastronomy` e `business` | A |
| `modules/empresas-landing` | modules | vertical | 🔴 **sem barrel** | M |
| `modules/gastronomy` | modules | vertical | ✅ correto | — |
| `modules/guide` | modules | vertical | ✅ ok | — |
| `modules/landing` | modules | transversal | 🟡 — landing pages podem ir para `app/pages` | B |
| `modules/mobility` | modules | vertical | ✅ correto, mas alvo de cross-imports | — |
| `modules/notifications` | modules | transversal | 🟡 — mover para `core/notifications` (já existe) | M |
| `modules/onboarding` | modules | transversal | 🔴 **sem barrel** | M |
| `modules/professionals` | modules | vertical | 🔴 **sem barrel** | A |
| `modules/profile` | modules | vertical | ✅ correto (barrel ok) | — |
| `modules/promotions` | modules | transversal | ✅ correto (delega a `core`) | — |
| `modules/services` | modules | vertical | ✅ correto (wrapper sobre `core/professional`) | — |
| `modules/vagas` | modules | vertical | ✅ correto | — |
| `modules/verification` | modules | transversal | 🟡 — duplica `core/verification` | M |

**Resumo**: 13 ✅ corretos · 7 🟡 parciais · 5 🔴 incorretos.

---

## 3. Achados críticos (raiz dos problemas)

### 3.1 🔴 Pastas legadas vivas

| Pasta | Arquivos | Refs externas | Ação |
|---|---:|---:|---|
| `src/pages/` | 11 | 10 (todos `app/routes`) | Migrar para `app/pages/*` ou `modules/<dominio>/pages` |
| `src/components/billing` | 2 | poucos | Mover para `core/billing/components` |
| `src/components/notifications` | 4 | médio | Mover para `modules/notifications/components` |
| `src/components/privacy` | 1 | 1 | Mover para `core/privacy/components` |
| `src/features/nearby` | dir | 1 | Mover para `modules/community` ou `core/geospatial` |

### 3.2 🔴 Módulos sem barrel (`index.ts`)

Quebram contrato de API pública e permitem deep imports descontrolados:

- `modules/admin-identidade`
- `modules/admin-motoristas`
- `modules/empresa`
- `modules/empresas-landing`
- `modules/onboarding`
- `modules/professionals`

### 3.3 🟡 Cross-imports entre módulos verticais (23 ocorrências)

```
admin-identidade  →  admin       (6)
admin-motoristas  →  admin       (5)
admin             →  mobility    (4)
gastronomy        →  mobility    (2)
admin             →  vagas       (1)
admin             →  admin-identidade  (1)
admin             →  admin-motoristas  (1)
admin-motoristas  →  mobility    (1)
empresa           →  gastronomy  (1)
empresa           →  business    (1)
```

**Padrões problemáticos**:
- **`admin-identidade` e `admin-motoristas` importam `admin`** → deveriam ser sub-pastas de `modules/admin/`, não módulos separados.
- **`gastronomy → mobility` (delivery flow)** → fluxo cross-vertical deve passar por `core/delivery` ou `core/mobility` (contrato).
- **`empresa → gastronomy/business`** → indica que `empresa` é uma *landing page composta*, não um módulo de domínio. Mover para `app/pages` ou redefinir como `modules/empresa-shell`.

### 3.4 🟡 Acesso direto ao Supabase em `src/modules/` (55 arquivos)

Os 2 piores ofensores em UI (`.tsx`):
- `src/modules/admin/pages/AdminMotoboyOperations.tsx`
- `src/modules/profile/sections/MobilidadeSection.tsx`

Os outros 53 são em hooks/services internos do módulo — aceitáveis se contidos em `services/` mas devem ser auditados caso a caso (muitos podem delegar a `core`).

### 3.5 🟡 Duplicação core × modules (mesmo nome)

| Domínio | Em `core/` | Em `modules/` | Recomendação |
|---|:---:|:---:|---|
| `admin` | ✓ | ✓ | OK — `modules/admin` é UI; `core/admin` é serviço |
| `analytics` | ✓ | ✓ | Verificar — mover lógica para `core` |
| `business` | ✓ | ✓ | OK |
| `community` | ✓ | ✓ | OK |
| `community-alerts` | ✓ | ✓ | OK |
| `community-issues` | ✓ | ✓ | OK |
| `classifieds` | ✓ | ✓ | OK |
| `gastronomy` | ✓ | ✓ | OK |
| `mobility` | ✓ | ✓ | OK |
| `notifications` | ✓ | ✓ | **Consolidar** em `core/notifications` |
| `promotions` | ✓ | ✓ | OK |
| `verification` | ✓ | ✓ | **Consolidar** em `core/verification` |

### 3.6 🔴 Documentação dispersa

- **138 arquivos `.md` na raiz do projeto** (deveriam estar em `docs/`)
- **1.381 arquivos em `docs/`** — sem índice consolidado, muito histórico misturado com vigente
- **86 docs em `docs/pre-launch/`** — excesso de "FASE_X_Y_APLICADA.md" (histórico, não vigente)

---

## 4. Plano de correção (priorizado)

### 🔴 P0 — Blindagem estrutural imediata (4–6 h)

1. **Criar barrels** em `admin-identidade`, `admin-motoristas`, `empresa`, `empresas-landing`, `onboarding`, `professionals`.
2. **Fundir `admin-identidade` e `admin-motoristas`** dentro de `modules/admin/` como sub-features (`modules/admin/identidade`, `modules/admin/motoristas`).
3. **Mover `src/pages/*`** para `src/app/pages/` (ou módulos correspondentes) e atualizar 10 imports.
4. **Mover `src/components/{billing,notifications,privacy}`** e `src/features/nearby` para suas camadas corretas.

### 🟠 P1 — SSOT e boundaries (1 dia)

5. **Eliminar acesso direto a Supabase em `.tsx`** (2 arquivos: `AdminMotoboyOperations`, `MobilidadeSection`) → criar service em `core/`.
6. **Quebrar cross-imports `gastronomy → mobility`** introduzindo contrato em `core/delivery`.
7. **Auditar 53 arquivos `.ts` em `modules/`** com `supabase.from()` e mover para services do módulo ou `core`.

### 🟡 P2 — Consolidação core×modules (1 dia)

8. **Fundir `modules/notifications` e `modules/verification`** com seus equivalentes em `core/`.
9. **Avaliar `modules/analytics`, `modules/landing`, `modules/dashboard`**: candidatos a serem absorvidos.
10. **Definir tipo (vertical/transversal)** explicitamente em cada `index.ts` (header doc).

### 🟢 P3 — Higiene de docs (½ dia)

11. **Mover 138 `.md` da raiz** para `docs/historico/` ou `docs/archive/`.
12. **Criar `docs/INDEX_CANONICO.md`** listando apenas docs vigentes.
13. **Atualizar `STATUS.md` e `README.md`** refletindo a auditoria.

### 🔵 P4 — Validação automática contínua (1 dia)

14. **Adicionar script `scripts/audit-architecture.ts`** rodando em CI:
    - Falhar se `src/modules/X` importar `src/modules/Y` sem passar por `core`.
    - Falhar se `.tsx` importar `@/integrations/supabase` direto.
    - Falhar se módulo novo for criado sem `index.ts`.
15. **Atualizar `validate-delivery-architecture-boundaries.ts`** para cobrir todos os módulos.

---

## 5. Status real vs documentado

| Documento | Afirma | Realidade auditada |
|---|---|---|
| `STATUS.md` | "95%+ SSOT Compliance" | 🟡 ~90% — 55 arquivos com supabase direto em modules |
| `STATUS.md` | "Comunidade ✅ 100%" | ✅ confirmado |
| `STATUS.md` | "ESLint Warnings: 0" | 🟡 não verificado (build TS tem ~30 erros pendentes do v4 audit) |
| `PRE_LAUNCH_AUDIT.md v4.0` | "PRONTO PARA LANÇAMENTO" | 🟡 verdadeiro **funcionalmente**, mas estruturalmente há débito não capturado |

---

## 6. Anexos

- Matriz completa de cross-imports: ver seção 3.3
- Lista de 55 arquivos com `supabase.from()` em modules: gerar com
  `grep -rl "from ['\"]@/integrations/supabase" src/modules/`
- Lista de 138 docs na raiz: `ls *.md`

---

*Auditoria gerada por varredura real do código em 2026-04-20.*
