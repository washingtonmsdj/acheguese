# PROJECT HEALTH REPORT

Relatorio de FASE 0 para consolidacao do Achegue-se. Esta etapa foi limitada a leitura, inventario, validacoes estaticas e documentacao. Nao foram feitas mudancas de banco, migrations, RLS, Edge Functions, API, identidade visual, dependencias ou arquitetura.

## Visao Geral

O projeto esta estruturado como uma aplicacao Vite + React 18 + TypeScript, com React Router, TanStack Query, Tailwind, Radix/shadcn-like UI e Supabase. A separacao arquitetural oficial esta documentada em `docs/ARCHITECTURE.md` e `docs/CURRENT_RULES.md`: `app` concentra bootstrap/rotas, `shared` concentra primitivas reutilizaveis, `core` concentra contratos e infraestrutura transversal, `modules` concentra dominios de produto e `integrations` concentra adaptadores externos.

Estado dos gates executados nesta auditoria:

| Comando | Resultado | Observacao |
| --- | --- | --- |
| `npm run lint` | Falhou | 2 erros e 2 avisos. |
| `npm run typecheck` | Passou | `tsc -b tsconfig.app.json tsconfig.node.json --force`. |
| `npm run validate:ssot` | Passou | 2948 arquivos analisados, 0 violacoes SSOT. |
| `npm run validate:taxonomy` | Passou | Taxonomia estrutural valida. |
| `npm run validate:architecture:core-platform` | Passou | Ownership Core Platform validado. |
| `npm run validate:docs-structure` | Passou | Estrutura de docs raiz valida. |
| `npm run validate:architecture:governance` | Falhou | 1 violacao `db-boundary`. |

Nao foram encontrados bloqueios criticos que indiquem quebra ampla da arquitetura. O estado atual, porem, ainda nao deve ser considerado "demo ready" porque lint e governance estao falhando.

## Arquitetura

O desenho macro esta coerente e bem documentado. A aplicacao usa providers centralizados em `src/app/components/AppRuntime.tsx`, rotas em `src/app/routes`, contratos transversais em `src/core` e dominios em `src/modules`.

Problemas confirmados:

### Acesso direto ao Supabase em componente

- Arquivo: `src/core/routing/components/CommunityInterestPage.tsx`
- Descricao: o componente importa `supabase` diretamente e chama `supabase.functions.invoke(...)` e `.from("community_interest_registrations").insert(...)`.
- Impacto: viola a regra oficial de boundary descrita em `docs/CURRENT_RULES.md`; tambem faz `npm run validate:architecture:governance` falhar.
- Prioridade: ALTO
- Recomendacao: mover a submissao de interesse para um service/repository oficial, mantendo o componente apenas como UI/orquestracao de formulario. Nao alterar tabela, RLS ou Edge Function nesta fase.

### Rotas de aplicacao muito concentradas

- Arquivo: `src/app/routes/sections/AppLayoutRoutes.tsx`
- Descricao: o arquivo possui 981 linhas e concentra muitas rotas territoriais, guards e modulos em um unico ponto.
- Impacto: aumenta risco de regressao em mudancas de navegacao e dificulta validar fluxos principais.
- Prioridade: MEDIO
- Recomendacao: manter o registry atual, mas planejar decomposicao incremental por dominio apenas depois dos gates voltarem a ficar verdes.

### Duplicidades/facades ainda precisam de auditoria de referencias

- Arquivo: `src/core/**` e `src/modules/**`
- Descricao: ha nomes repetidos ou muito similares entre `core` e `modules`, como componentes/servicos de business, profile, community, mobility, analytics e auth/session.
- Impacto: pode confundir ownership e gerar alteracoes no local errado. Nao e prova de codigo morto, pois parte disso pode ser facade transicional.
- Prioridade: MEDIO
- Recomendacao: nao remover nada sem confirmar referencias com `rg`, imports, rotas e build. Tratar remocao apenas como tarefa separada e confirmada.

## Validacao dos modulos

| Modulo/area | Estado | Observacoes |
| --- | --- | --- |
| Cadastro/Login/Sessao | Parcialmente estavel | Providers e SessionContext existem, mas lint acusa uso direto de `supabase.auth.getUser()` em `src/core/community/services/postDraftSync.ts`. |
| Perfil | Estavel com divida estrutural | Ha separacao entre `core/profiles` e `modules/profile`; exige cuidado antes de consolidar duplicidades. |
| Feed/Comunidade | Funcionalmente estruturado | `core/community` e modulos community-* existem, mas ha split transicional e um ponto de sync com violacao de session boundary. |
| Comentarios/Curtidas | Sem erro estatico especifico nesta rodada | Validacao foi estatica; fluxo manual ainda precisa entrar no roteiro de demo. |
| Empresas/Gastronomia | Grande e maduro, mas heterogeneo | Area com muitos hooks/services/componentes; ha string de erro quebrada por encoding em checkout. |
| Busca | Rotas `/busca` e `/buscar` aparecem como aliases/entradas proximas | Requer validacao de UX para evitar fluxo duplicado ou confuso. |
| Mensagens/Notificacoes | Sem bloqueio confirmado nesta rodada | Necessita validacao manual com usuario autenticado e notificacoes reais/simuladas. |
| Configuracoes/Privacidade/Billing | Sem erro estatico especifico nesta rodada | Manter foco em nao alterar contratos de conta, perfil e billing sem necessidade. |
| Administracao | Funcionalmente ampla, mas com gate vermelho | `src/core/admin/services/AdminCommunityInterestService.ts` tem erro de nomenclatura/session-context. |
| Mobilidade | Area ampla e modularizada | Ha possiveis duplicidades entre core e module; consolidar somente com auditoria de referencias. |
| AI | Pequena e isolada | Adaptador em `src/modules/ai/core/client/aiClient.ts` deve ser observado em futura padronizacao de boundaries. |

## Validacao de SSOT

O gate `npm run validate:ssot` passou sem violacoes. O gate `npm run validate:architecture:core-platform` tambem passou, validando ownership de tabelas, RPCs e callsites incrementais.

Problema confirmado:

### Governance ainda reprova db-boundary

- Arquivo: `src/core/routing/components/CommunityInterestPage.tsx`
- Descricao: `npm run validate:architecture:governance` reprova com `db-boundary`.
- Impacto: impede considerar a arquitetura consolidada, mesmo com SSOT geral passando.
- Prioridade: ALTO
- Recomendacao: corrigir primeiro na FASE 1, sem alterar schema.

## Validacao do Design System

O projeto possui uma base consistente em `src/shared/components/ui`, tokens em `src/index.css` e extensoes em `tailwind.config.ts`. A identidade escura/territorial ja esta consolidada e nao deve ser redesenhada nesta fase.

Problemas observados:

### Paletas locais e valores hardcoded espalhados

- Arquivo: `src/app/pages/PublicCityLandingPage.css`, `src/app/pages/CidadeLandingPage.css`, `src/modules/admin/**`
- Descricao: ha uso recorrente de hex colors, gradientes e tokens locais fora do design system compartilhado.
- Impacto: aumenta custo de manutencao visual e risco de divergencia entre paginas.
- Prioridade: MEDIO
- Recomendacao: documentar excecoes existentes e substituir gradualmente por tokens sem mudar identidade visual.

### Primitivas UI coexistem com componentes especificos de dominio

- Arquivo: `src/shared/components/ui/**`, `src/core/**/components/**`, `src/modules/**/components/**`
- Descricao: a base UI e reutilizavel, mas alguns dominios mantem variacoes proprias de cards, paineis, empty states e dashboards.
- Impacto: experiencia pode parecer menos uniforme entre modulos.
- Prioridade: BAIXO
- Recomendacao: padronizar apenas componentes repetidos de baixo risco, sem introduzir nova biblioteca.

## UX

Esta auditoria nao executou navegacao manual completa porque a FASE 0 foi limitada a leitura e validacoes estaticas. Os fluxos Cadastro, Login, Perfil, Feed, Comentarios, Curtidas, Empresas, Busca, Mensagens, Notificacoes e Configuracoes precisam entrar em `DEMO-FLOW.md` e `DEMO-CHECKLIST.md` depois da estabilizacao.

Problema confirmado:

### Texto de erro com encoding quebrado no checkout de gastronomia

- Arquivo: `src/modules/business/gastronomy/hooks/useGastronomyCheckout.ts`
- Descricao: mensagens como `"NÃ£o foi possÃ­vel..."`, `"EndereÃ§o..."` e `"vÃ¡lido"` aparecem em strings user-facing.
- Impacto: afeta diretamente a qualidade percebida em demo e producao.
- Prioridade: ALTO
- Recomendacao: corrigir apenas as strings, sem alterar fluxo de checkout.

## Codigo

Problemas confirmados:

### Lint reprova por identificador ambiguo

- Arquivo: `src/core/admin/services/AdminCommunityInterestService.ts`
- Descricao: `reviewerId` viola a regra `session-context/no-ambiguous-identifiers`.
- Impacto: gate de lint fica vermelho e a semantica do identificador fica ambigua entre user/profile/session.
- Prioridade: ALTO
- Recomendacao: renomear para o identificador semanticamente correto, preservando o payload enviado ao banco.

### Lint reprova por acesso direto a auth

- Arquivo: `src/core/community/services/postDraftSync.ts`
- Descricao: chamada direta a `supabase.auth.getUser()` fora de `SessionService`.
- Impacto: viola boundary de sessao e mantem lint vermelho.
- Prioridade: ALTO
- Recomendacao: usar o service oficial de sessao ja existente, sem alterar comportamento de sync.

### Aviso de Fast Refresh

- Arquivo: `src/app/components/auth/AuthTurnstileGate.tsx`
- Descricao: o arquivo exporta componente e valor auxiliar no mesmo modulo.
- Impacto: warning de DX; nao bloqueia build, mas reduz limpeza dos gates.
- Prioridade: BAIXO
- Recomendacao: separar constante/helper em arquivo proprio somente se isso nao criar churn.

### Comentario eslint sem uso

- Arquivo: `src/core/routing/components/CommunityInterestPage.tsx`
- Descricao: existe `eslint-disable-next-line @typescript-eslint/no-explicit-any` sem necessidade segundo lint.
- Impacto: warning e ruido em auditorias.
- Prioridade: BAIXO
- Recomendacao: remover junto com a correcao do service de interesse.

## Qualidade

Pontos fortes:

- Typecheck passa.
- SSOT, taxonomia, docs structure e Core Platform ownership passam.
- A arquitetura oficial esta documentada e possui validadores ativos.
- O projeto ja possui testes, scripts de validacao e docs historicos amplos.

Riscos atuais:

- Lint e governance estao vermelhos.
- `tsconfig.app.json` ainda usa configuracoes permissivas como `strict: false`, `noImplicitAny: false`, `noUnusedLocals: false` e `noUnusedParameters: false`.
- A validacao manual dos fluxos principais ainda nao foi executada nesta fase.
- Possiveis duplicidades entre `core` e `modules` nao devem ser removidas sem prova de nao uso.

Conclusao: o projeto tem boa base arquitetural, mas a consolidacao deve comecar corrigindo gates vermelhos e textos quebrados. A FASE 1 deve ser curta, reversivel e focada em estabilizacao, nao em novas features.
