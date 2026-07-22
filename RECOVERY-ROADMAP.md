# RECOVERY ROADMAP

Roadmap de recuperacao e consolidacao do Achegue-se. Nenhuma fase abaixo pressupoe novas features, novas dependencias, mudanca de identidade visual ou alteracao de banco/RLS/API/Edge Functions sem justificativa separada.

## FASE 1 - Estabilizacao

Objetivo: deixar gates essenciais verdes e remover problemas visiveis de baixo risco sem alterar comportamento.

Escopo permitido:

- Corrigir `src/core/admin/services/AdminCommunityInterestService.ts` para remover o erro `session-context/no-ambiguous-identifiers`.
- Corrigir `src/core/community/services/postDraftSync.ts` para usar o boundary oficial de sessao em vez de `supabase.auth.getUser()` direto.
- Mover o insert/verificacao Supabase de `src/core/routing/components/CommunityInterestPage.tsx` para service/repository oficial.
- Remover o `eslint-disable` inutil desse fluxo.
- Corrigir strings user-facing com encoding quebrado em `src/modules/business/gastronomy/hooks/useGastronomyCheckout.ts`.

Criterios de conclusao:

- `npm run lint` passa.
- `npm run typecheck` passa.
- `npm run build` passa.
- `npm run validate:architecture:governance` passa.
- Nenhuma migration, RLS, Edge Function, API publica ou dependencia nova foi adicionada.

## FASE 2 - Padronizacao

Objetivo: reduzir ruido estrutural sem mudar produto.

Escopo recomendado:

- Padronizar nomes de variaveis relacionadas a usuario/perfil/sessao conforme regras de `docs/DATA_MODELING.md`.
- Revisar labels de rotas e guards para manter acentos e nomes publicos consistentes.
- Padronizar exports/imports apenas onde houver duplicidade clara ou warning recorrente.
- Separar helpers exportados de componentes apenas quando isso eliminar warnings sem churn.

Criterios de conclusao:

- Diffs pequenos, revisaveis e sem mudanca de comportamento.
- Sem remocao de arquivos sem prova de nao uso.

## FASE 3 - Consolidacao dos SSOT

Objetivo: confirmar ownership real antes de qualquer remocao.

Escopo recomendado:

- Mapear duplicidades entre `core` e `modules` com `rg` e grafo de imports.
- Classificar cada duplicidade como facade intencional, legado ainda usado ou candidato a remocao.
- Confirmar services oficiais por tabela/RPC antes de mover chamadas.
- Abrir remocao de codigo morto apenas com confirmacao explicita.

Criterios de conclusao:

- Lista de candidatos a remocao com evidencia de imports zero, rotas zero e build verde.
- Nenhum contrato publico removido sem substituto.

## FASE 4 - Consistencia entre modulos

Objetivo: tornar os dominios mais previsiveis para manutencao.

Escopo recomendado:

- Revisar Business, Profile, Community, Mobility e Admin, que sao as areas mais amplas.
- Reduzir variacoes locais de cards, empty states e paineis quando houver equivalente no design system.
- Planejar decomposicao incremental de `src/app/routes/sections/AppLayoutRoutes.tsx`, preservando o registry atual.

Criterios de conclusao:

- Rotas continuam equivalentes.
- UI mantem identidade atual.
- Validadores seguem verdes.

## FASE 5 - UX

Objetivo: validar que os fluxos centrais funcionam para demo.

Fluxos obrigatorios:

- Cadastro
- Login
- Perfil
- Feed
- Comentarios
- Curtidas
- Empresas
- Busca
- Mensagens
- Notificacoes
- Configuracoes

Entregaveis:

- `DEMO-FLOW.md`
- `DEMO-CHECKLIST.md`

Criterios de conclusao:

- App rodando localmente.
- Fluxos principais descritos com pre-condicoes, passos, resultado esperado e resultado observado.
- Estados de erro, loading e empty state mais visiveis anotados.

## FASE 6 - Performance

Objetivo: validar que a consolidacao nao degradou carregamento e navegacao.

Escopo recomendado:

- Rodar build e revisar warnings.
- Observar rotas lazy-loaded e waterfalls de dados nos fluxos de demo.
- Avaliar CSS local pesado em landing/admin/business somente depois dos gates funcionais.

Criterios de conclusao:

- Build verde.
- Sem regressao visual obvia nos fluxos principais.
- Melhorias propostas separadas de estabilizacao.

## FASE 7 - Demo Ready

Objetivo: preparar uma demonstracao confiavel sem esconder limitacoes.

Criterios finais:

- `npm run lint`, `npm run typecheck`, `npm run build` e validators de arquitetura em verde.
- `DEMO-FLOW.md` e `DEMO-CHECKLIST.md` atualizados.
- Fluxos centrais testados manualmente.
- Pendencias classificadas por impacto e risco.
- Sem mudancas de schema, RLS, Edge Functions ou API feitas durante a consolidacao sem justificativa formal.
