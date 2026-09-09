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

- foco atual: **certificação same-SHA de Mobilidade/Delivery**, não nova refatoração estrutural;
- G31 aposentou validadores operator/service_role obsoletos que furavam o contrato server-owned;
- G32 reconciliou runtime real: `mobility-rpc v24` e `delivery-rpc v8` estão byte-a-byte iguais ao Git; drift antigo do `auto-dispatch-ride v24` foi corrigido e o runtime agora está em **v25 ACTIVE**, também byte-a-byte igual ao Git;
- `auto-dispatch-ride` usa apenas commands atômicos para offer/timeout/expire; o ratchet agora proíbe retorno de DML direto nos agregados/audits;
- grants reais confirmados: browser sem DML nos agregados críticos de Mobility/Delivery; RPCs atômicos críticos service-role-only;
- invariantes remotos: 0 offers abertas, 0 dispatch pendente e 0 motorista preso em corrida terminal;
- Supabase canônico: `xhdowzacfujckjelqhtd`;
- Mobilidade continua **launch-paused**: `PUBLIC_LAUNCH_SURFACES.mobility=false`;
- próximo gate: ratchets/validators → build same-SHA → E2E positivo/negativo + smoke responsivo → deploy web same-SHA;
- não restaurar DML direto, operator scripts obsoletos, wrappers concorrentes ou authorities paralelas para acelerar a certificação.

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
