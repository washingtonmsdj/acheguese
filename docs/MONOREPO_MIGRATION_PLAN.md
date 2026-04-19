# 📦 Plano de Migração: Monorepo + Mobile (iOS/Android)

> **Data:** Abril 2026  
> **Versão:** 1.0  
> **Status:** Proposta para execução  
> **Owner:** Core Team  
> **Pré-requisito:** Concluir `PRE_LAUNCH_AUDIT.md` (segurança) antes da Fase 3.

---

## 🎯 TL;DR — Recomendação Executiva

**SIM, faz sentido migrar para monorepo**, mas **não imediatamente**. A recomendação é:

| Fase | Quando | O quê |
|------|--------|-------|
| **AGORA** | Antes do lançamento web | Capacitor no projeto atual (single-repo) → publica iOS/Android reusando 100% do código |
| **6-12 meses pós-lançamento** | Quando houver app nativo divergindo do web | Migrar para monorepo PNPM Workspaces + Turborepo |
| **NUNCA** | Se app continuar ~95% igual ao web | Manter single-repo + Capacitor para sempre é válido |

**Por quê?** Você já tem:
- ✅ 2.411 arquivos TS, 65+ módulos `core/*`, 25+ módulos `modules/*`
- ✅ SSOT bem definido (`docs/CURRENT_RULES.md`)
- ✅ Vite + React + TypeScript (compatível 100% com Capacitor)
- ❌ Sem Capacitor, sem app mobile, sem código duplicado

**Migrar para monorepo agora = trabalho de 3-6 semanas sem ganho imediato.**  
**Adicionar Capacitor agora = 2-3 dias e você publica nas stores.**

---

## 📊 1. Análise da Situação Atual

### 1.1 Estrutura atual (single-repo Vite)

```
projeto-ordax2/
├── src/
│   ├── app/              # Shell (73 linhas)
│   ├── core/             # 65+ domínios canônicos (721 itens)
│   ├── modules/          # 25+ módulos de produto (1.169 itens)
│   ├── shared/           # UI primitivos (244 itens)
│   ├── integrations/     # Supabase, mapas (16 itens)
│   └── pages/            # Rotas
├── supabase/
│   ├── functions/        # 14 edge functions Deno
│   └── migrations/       # 224 migrations SQL
├── tests/ + e2e/
└── scripts/              # 50+ scripts de validação SSOT
```

### 1.2 Pontos fortes

- ✅ SSOT por domínio bem aplicado (`core/business`, `core/gastronomy`, etc.)
- ✅ Fronteiras arquiteturais documentadas (`docs/CURRENT_RULES.md`)
- ✅ Validações automatizadas (`validate:ssot`, `validate:architecture:governance`)
- ✅ Stack moderna (React 18, Vite 5, TS 5, Tailwind 3)

### 1.3 Pontos fracos relevantes para a decisão

- ⚠️ **Build único** de 19MB de `src/` → o app mobile carregaria TUDO
- ⚠️ Dependências pesadas (`maplibre-gl`, `recharts`) sempre no bundle
- ⚠️ Edge functions e frontend no mesmo repo, mas sem isolamento de tipos
- ⚠️ `scripts/` mistura validação, seed, deploy → poderia virar `tools/`

---

## 🤔 2. Análise: Single-repo vs Monorepo

### 2.1 Comparativo

| Critério | Single-repo + Capacitor | Monorepo (PNPM + Turbo) |
|----------|------------------------|-------------------------|
| **Tempo de setup** | 2-3 dias | 3-6 semanas |
| **Code sharing web↔mobile** | 100% (mesmo código) | 100% via packages |
| **App store iOS/Android** | ✅ via Capacitor | ✅ via Capacitor ou RN |
| **Build cache incremental** | ❌ rebuild tudo | ✅ Turborepo cache |
| **Bundle size mobile** | ⚠️ mesmo bundle do web | ✅ pode ter bundle separado |
| **Equipes paralelas** | Conflitos no mesmo repo | ✅ ownership por package |
| **Risco de regressão** | Baixo | **ALTO** (refator massivo) |
| **CI/CD complexity** | Simples | Complexa (matrix builds) |
| **Compatível com Lovable** | ✅ Total | ⚠️ Lovable não suporta workspaces nativamente |

### 2.2 ⚠️ ALERTA CRÍTICO sobre Lovable + Monorepo

**O Lovable não suporta nativamente PNPM Workspaces ou Turborepo no editor.**  
Migrar para monorepo agora = **perder o editor visual do Lovable**.

Se você pretende continuar usando Lovable para iterações rápidas, **NÃO migre para monorepo**. Use Capacitor + single-repo.

### 2.3 Decisão recomendada

```
┌─────────────────────────────────────────────────┐
│  AGORA (pré-lançamento):                        │
│  → Capacitor + single-repo                      │
│  → 100% do código web vira app mobile           │
│  → Mantém Lovable funcionando                   │
│                                                 │
│  PÓS-LANÇAMENTO (se necessário):                │
│  → Avaliar monorepo APENAS se:                  │
│    • App mobile divergir muito do web           │
│    • Equipe crescer >5 devs simultâneos         │
│    • Bundle mobile precisar < 50% do web        │
└─────────────────────────────────────────────────┘
```

---

## 🚀 3. FASE 1 — Capacitor (AGORA, 2-3 dias)

> **Objetivo:** Publicar nas App Stores reusando 100% do código atual.

### Task 1.1 — Pré-requisitos (30 min)
- [ ] Concluir builds sem erros TS (`npm run typecheck`)
- [ ] Concluir `PRE_LAUNCH_AUDIT.md` Fases 1-2 (segurança crítica)
- [ ] Backup do projeto via GitHub (Connectors → GitHub)
- [ ] Decidir `appId`: sugestão `app.achegue.se` ou `com.achegue.app`
- [ ] Decidir `appName`: "Achegue-se"

### Task 1.2 — Instalar Capacitor (1h)
```bash
npm install @capacitor/core @capacitor/cli
npm install @capacitor/ios @capacitor/android
npx cap init "Achegue-se" "app.achegue.se" --web-dir=dist
```
- [ ] Criar `capacitor.config.ts` com `appId`, `appName`, `webDir: "dist"`
- [ ] Adicionar bloco `server.url` para hot-reload em dev (preview Lovable)
- [ ] Adicionar `capacitor.config.ts` ao `.gitignore` se contiver dados sensíveis

### Task 1.3 — Plugins essenciais (2h)
Instalar conforme necessidade do app:
```bash
# Notificações push (você tem edge functions de push)
npm install @capacitor/push-notifications

# Geolocalização (mobility, mapas)
npm install @capacitor/geolocation

# Câmera (upload de avatar, fotos de classificados)
npm install @capacitor/camera

# Storage seguro (tokens auth)
npm install @capacitor/preferences

# Status bar / Splash
npm install @capacitor/status-bar @capacitor/splash-screen

# Compartilhar (deep links, marketing)
npm install @capacitor/share
```

### Task 1.4 — Adaptações no código (1 dia)
- [ ] Detectar plataforma: criar `src/shared/utils/platform.ts`
  ```ts
  import { Capacitor } from '@capacitor/core';
  export const isNative = Capacitor.isNativePlatform();
  export const platform = Capacitor.getPlatform(); // 'web' | 'ios' | 'android'
  ```
- [ ] **Auth**: Supabase OAuth precisa de `redirectTo` customizado no mobile
  - Usar `app.achegue.se://auth/callback` em vez de `https://...`
  - Ajustar `supabase/config.toml` URLs permitidas
- [ ] **Geolocalização**: usar `@capacitor/geolocation` quando `isNative`, `navigator.geolocation` no web
- [ ] **Push notifications**: integrar com edge functions `subscribe-push` / `send-push`
- [ ] **Safe areas**: adicionar `env(safe-area-inset-*)` no CSS para iPhones com notch
- [ ] **Viewport meta**: `<meta name="viewport" content="viewport-fit=cover, ...">`

### Task 1.5 — Configurações iOS/Android (4h)
- [ ] iOS — `Info.plist`: permissões (camera, location, notifications) com descrições em PT-BR
- [ ] Android — `AndroidManifest.xml`: permissões equivalentes
- [ ] Ícones e splash screens (use `@capacitor/assets` para gerar de 1 imagem)
- [ ] Versionamento: `versionName` (1.0.0) e `versionCode` (1)

### Task 1.6 — Testes em dispositivo (1 dia)
- [ ] Exportar para GitHub → clonar local
- [ ] `npx cap add ios && npx cap add android`
- [ ] Testar em Android Emulator (Android Studio)
- [ ] Testar em iOS Simulator (Xcode, requer Mac)
- [ ] Testar em dispositivo físico (Android via cabo, iOS via TestFlight)

### Task 1.7 — Publicação (variável)
- [ ] **Google Play**: criar conta dev ($25 único), gerar `.aab`, subir para Play Console
- [ ] **App Store**: conta dev Apple ($99/ano), gerar `.ipa`, subir via Xcode/Transporter
- [ ] Privacy policy URL (obrigatório nas duas stores)
- [ ] Screenshots em 6.5" (iPhone) e múltiplos tamanhos Android

---

## 🏗️ 4. FASE 2 — Otimizações no single-repo (1-2 semanas, opcional)

> **Objetivo:** Preparar terreno para um possível monorepo futuro, sem migrar ainda.

### Task 2.1 — Reorganizar `scripts/` em `tools/`
- [ ] Mover scripts de validação SSOT → `tools/validators/`
- [ ] Mover seeds → `tools/seeds/`
- [ ] Mover scripts de migration → `tools/migrations/`
- [ ] Atualizar `package.json` paths

### Task 2.2 — Isolar tipos compartilhados
- [ ] Criar `src/shared/contracts/` com tipos usados por frontend + edge functions
- [ ] Edge functions importam de `../../../src/shared/contracts/` via path relativo (já funciona)

### Task 2.3 — Bundle splitting agressivo para mobile
- [ ] Identificar rotas pesadas que não rodam em mobile (ex: `/admin/*`)
- [ ] Lazy load com `React.lazy()` em todas as páginas de admin
- [ ] Configurar `manualChunks` no `vite.config.ts` para separar `admin`, `mobile`, `shared`

### Task 2.4 — Feature flags para web vs mobile
- [ ] Criar `src/core/platform/featureFlags.ts`
  ```ts
  export const features = {
    showAdminPanel: !isNative,
    enablePushNotifications: isNative,
    useNativeMaps: isNative && platform === 'ios',
  };
  ```
- [ ] Usar nas rotas: `<Route path="/admin/*" element={features.showAdminPanel ? <Admin /> : <Navigate to="/" />} />`

---

## 🔮 5. FASE 3 — Migração para Monorepo (FUTURO, 3-6 semanas)

> **⚠️ Só executar se justificativa real existir após 6+ meses de produção.**

### 5.1 Critérios de gatilho

Migre para monorepo APENAS se ≥3 destes forem verdade:
- [ ] App mobile tem >30% de código diferente do web
- [ ] Equipe tem >5 devs trabalhando em paralelo
- [ ] Build do projeto demora >3 minutos
- [ ] Há necessidade de SDK público para terceiros
- [ ] Surgiu segundo produto compartilhando código (ex: dashboard B2B)

### 5.2 Estrutura alvo

```
achegue-se/
├── apps/
│   ├── web/              # Vite + React (atual src/)
│   ├── mobile/           # Capacitor + React (compartilha 90%)
│   └── admin/            # Painel admin separado (opcional)
├── packages/
│   ├── core/             # SSOT domains (atual src/core/)
│   ├── shared-ui/        # Components compartilhados (atual src/shared/)
│   ├── contracts/        # Types compartilhados frontend+backend
│   ├── supabase-client/  # Cliente tipado
│   └── config/           # ESLint, TS, Tailwind compartilhados
├── services/
│   ├── edge-functions/   # Atual supabase/functions/
│   └── migrations/       # Atual supabase/migrations/
├── tools/
│   ├── validators/       # Scripts SSOT
│   └── seeds/
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

### 5.3 Tasks detalhadas (FASE 3)

#### 5.3.1 — Setup base (3 dias)
- [ ] Instalar `pnpm` (`npm install -g pnpm@9`)
- [ ] Criar `pnpm-workspace.yaml` com `apps/*`, `packages/*`, `services/*`, `tools/*`
- [ ] Instalar `turbo` (`pnpm add -D turbo -w`)
- [ ] Criar `turbo.json` com pipelines `build`, `test`, `lint`, `typecheck`
- [ ] Configurar `.npmrc` (`shamefully-hoist=true` se necessário)

#### 5.3.2 — Extrair `packages/core` (1 semana)
- [ ] Criar `packages/core/package.json` (`name: "@achegue/core"`)
- [ ] Mover `src/core/*` → `packages/core/src/*`
- [ ] Criar `packages/core/tsconfig.json` estendendo base
- [ ] Atualizar imports: `@/core/*` → `@achegue/core/*`
- [ ] Rodar `validate:ssot` para garantir nenhuma regressão

#### 5.3.3 — Extrair `packages/shared-ui` (3 dias)
- [ ] Mover `src/shared/components/ui/*` → `packages/shared-ui/src/*`
- [ ] Mover Tailwind config para `packages/config/tailwind`
- [ ] Cada app importa preset: `presets: [require('@achegue/config/tailwind')]`

#### 5.3.4 — Extrair `packages/contracts` (2 dias)
- [ ] Tipos do Supabase + tipos de domínio compartilhados frontend↔backend
- [ ] Edge functions importam: `import type { Business } from "@achegue/contracts"`

#### 5.3.5 — Criar `apps/web` (2 dias)
- [ ] Mover `src/{app,modules,pages}/*` → `apps/web/src/*`
- [ ] Mover `vite.config.ts`, `index.html` → `apps/web/`
- [ ] Atualizar paths de import

#### 5.3.6 — Criar `apps/mobile` (1 semana)
- [ ] `apps/mobile/` com Vite próprio + Capacitor
- [ ] Compartilha `@achegue/core`, `@achegue/shared-ui`
- [ ] Pode ter rotas e shell diferentes do web
- [ ] Bundle otimizado (sem `/admin`, sem `recharts` se não usar)

#### 5.3.7 — Mover edge functions (1 dia)
- [ ] `supabase/functions/*` → `services/edge-functions/*`
- [ ] Ajustar paths no `supabase/config.toml`

#### 5.3.8 — CI/CD (3 dias)
- [ ] GitHub Actions matrix: `apps/web`, `apps/mobile`
- [ ] Turbo remote cache (Vercel ou self-hosted)
- [ ] Deploy condicional: web → Vercel, mobile → fastlane → stores
- [ ] Validações SSOT por package

#### 5.3.9 — Migração SSOT rules (2 dias)
- [ ] Atualizar `docs/CURRENT_RULES.md` para regras de monorepo
- [ ] `validate:architecture:governance` deve barrar:
  - `apps/*` importando de `apps/*` (cross-app)
  - `packages/*` importando de `apps/*` (inversão)
- [ ] Atualizar ESLint com `eslint-plugin-boundaries`

#### 5.3.10 — Documentação e cutover (3 dias)
- [ ] Atualizar `docs/ARCHITECTURE.md` com nova estrutura
- [ ] README de cada package
- [ ] Treinamento da equipe
- [ ] Cutover: arquivar branch `single-repo`, ativar `monorepo` como `main`

---

## 📈 6. Roadmap consolidado

```
SEMANA 1-2  →  PRE_LAUNCH_AUDIT (segurança crítica)
SEMANA 3    →  Capacitor setup + adaptações (Fase 1)
SEMANA 4    →  Testes em dispositivos + ajustes
SEMANA 5    →  Submissão Play Store + App Store
SEMANA 6+   →  LANÇAMENTO 🚀

MÊS 2-3     →  Otimizações single-repo (Fase 2, opcional)
MÊS 6-12    →  Avaliar critérios de gatilho monorepo
MÊS 12+     →  Se gatilhos atendidos: executar Fase 3
```

---

## ✅ 7. Checklist de decisão final

Responda antes de começar:

- [ ] Você pretende continuar usando o **editor Lovable** para iterações?  
  → **SIM**: NÃO migre para monorepo. Use Capacitor only.  
  → **NÃO**: Pode considerar monorepo após lançamento.

- [ ] App mobile terá UI/UX **muito diferente** do web?  
  → **SIM**: Considere monorepo no médio prazo.  
  → **NÃO**: Capacitor + single-repo é suficiente para sempre.

- [ ] Equipe atual tem quantos devs?  
  → **1-3**: Single-repo. Monorepo vai gerar overhead sem ganho.  
  → **5+**: Monorepo começa a fazer sentido.

- [ ] Bundle size é crítico para mobile?  
  → **SIM**: Otimize com lazy load primeiro (Fase 2). Monorepo só se insuficiente.

---

## 📚 8. Referências

- [Capacitor Docs](https://capacitorjs.com/docs)
- [Lovable + Capacitor Blog](https://lovable.dev/blog) (instrua o usuário a ler)
- [Turborepo](https://turbo.build/repo)
- [PNPM Workspaces](https://pnpm.io/workspaces)
- `docs/ARCHITECTURE.md` — arquitetura atual
- `docs/CURRENT_RULES.md` — regras SSOT vigentes
- `PRE_LAUNCH_AUDIT.md` — segurança pré-lançamento

---

## 🎬 9. Próxima ação recomendada

1. **Concluir** `PRE_LAUNCH_AUDIT.md` (segurança)
2. **Executar Fase 1** deste documento (Capacitor) — 2 a 3 dias
3. **Lançar** web + mobile simultaneamente
4. **Reavaliar** monorepo daqui a 6 meses com dados reais de uso

**NÃO migre para monorepo agora.** É trabalho grande, risco alto, ganho zero no curto prazo, e você perde o editor Lovable.

---

*Documento mantido pela equipe Achegue-se • Última atualização: Abril 2026*
