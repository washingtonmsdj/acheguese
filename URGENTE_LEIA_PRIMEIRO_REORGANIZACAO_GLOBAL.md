# URGENTE — ponteiro de compatibilidade

> **STATUS: SUBSTITUÍDO COMO AUTORIDADE.**
>
> Este arquivo permanece temporariamente na raiz **somente para não quebrar referências históricas, workflows e agentes antigos**.
>
> Ele **não é mais o SSOT operacional** e não deve receber novos checkpoints extensos.

## Autoridades vivas

Leia nesta ordem:

1. `docs/README.md` — índice documental canônico;
2. `docs/03-architecture/CURRENT_RULES.md` — regras arquiteturais vigentes;
3. `docs/08-roadmap/EXECUCAO_MAIN_ONLY.md` — execução operacional atual;
4. `SECURITY.md` — segurança e gates de release.

## Checkpoint operacional curto — 2026-09-09

> Resumo de handoff; a autoridade detalhada continua em `docs/08-roadmap/EXECUCAO_MAIN_ONLY.md`.

- foco atual: **certificação da Mobilidade / Central motorista-motoboy**;
- `ride_requests` está server-owned para mutação: browser sem `INSERT/UPDATE/DELETE`;
- criação, transições, dispatch, entrega, confirmação do passageiro e redispatch usam broker/RPCs específicas;
- Supabase canônico: `xhdowzacfujckjelqhtd`;
- `mobility-rpc`: **v15 ACTIVE**, `verify_jwt=true`;
- migrations finais deste corte: `20260909140626_add_atomic_mobility_creation_commands_g6.sql` e `20260909141356_revoke_browser_ride_request_insert_g6.sql`;
- baseline técnico antes da atualização documental: `f91bbf0ef1c452be559ab1ad2d836b268144a8ed`;
- Mobilidade continua **launch-paused**: `PUBLIC_LAUNCH_SURFACES.mobility=false`;
- próximo gate: autorização positiva/negativa real → E2E operacional → smoke responsivo → typecheck/test/build no mesmo SHA → deploy same-SHA; **não habilitar Mobilidade antes dessas provas**;
- não restaurar creators/writers diretos de `ride_requests` para contornar testes ou acelerar fluxo.

## Regra para novas IAs/agentes

- **inspecionar o projeto real antes das docs**: código da `main`, rotas, owners, serviços, schema/migrations, testes, deploy/runtime e comportamento observado são a evidência primária;
- documentação pode estar desatualizada ou obsoleta e **nunca autoriza sozinha remover feature implementada**;
- feature coerente com o produto que esteja quebrada, incompleta ou `launch-paused` deve ser investigada e corrigida na causa raiz, não apagada para simplificar;
- `launchScope=false` é gate de lançamento, não marca de legado;
- remover somente legado real, duplicação, compatibility bridge ou owner substituído, depois de preservar/migrar a capacidade funcional válida e comprovar callers/impacto;
- não usar conteúdo histórico deste arquivo para decidir arquitetura;
- não recriar `src/features`, `src/config`, `scripts` ou outros roots já comprovadamente aposentados; se houver dúvida se algo é realmente legado, auditar o projeto antes de remover;
- trabalhar diretamente na `main`, sem force-push;
- revalidar o HEAD antes de cada write;
- preferir owner/SSOT canônico em `src/core`, `src/modules`, `src/app`, `src/integrations` e `src/shared`;
- atualizar `docs/08-roadmap/EXECUCAO_MAIN_ONLY.md` quando um checkpoint operacional mudar;
- usar `teste-acheguese` apenas como laboratório/prova de UX territorial quando aplicável; o produto consolidado continua neste repositório.

## Política de migração deste ponteiro

Este arquivo só poderá ser removido depois que:

- referências ativas forem migradas para os documentos canônicos;
- validators e workflows deixarem de depender do path;
- referências históricas restantes estiverem apenas em `docs/10-archive/`.

Até lá, manter este conteúdo curto e sem segunda autoridade.
