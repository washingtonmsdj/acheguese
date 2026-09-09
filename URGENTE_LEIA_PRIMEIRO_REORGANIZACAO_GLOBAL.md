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

- foco atual: **certificação same-SHA de Mobilidade/Delivery e fechamento dos gates reais de arquitetura**;
- G31 aposentou validadores operator/service_role obsoletos;
- G32 reconciliou `mobility-rpc v24`, `delivery-rpc v8` e corrigiu o drift do `auto-dispatch-ride` para **v25 ACTIVE**, byte-a-byte igual ao Git;
- G33 corrige a falha real do último build executado: `ServiceAreasService` não usa mais `from(table)` dinâmico; resolução de identidade passa pelos owners canônicos de Profile, Business, Professional e Mobility;
- G34A adiciona sincronização bulk canônica de coverage por `Location IDs`; dados remotos confirmam 0 valores nos campos legados `professional_data.service_areas/service_radius_km`, portanto a migração pode eliminar a duplicidade sem perda de dados;
- G34B migra o cadastro profissional: bairros agora são `locations.id` e são gravados somente via Coverage SSOT; novos cadastros não alimentam mais `professional_data.service_areas`;
- G34C migra a edição profissional para o mesmo contrato: cobertura carrega e salva por `public.service_areas`; o formulário não lê nem escreve mais o JSONB legado;
- G34D1 remove `service_areas/service_radius_km` dos tipos, queries, mapper, schema e lifecycle Professional; página pública, Central e E2E preservam a feature usando Coverage canônico;
- G34D2 migra o export LGPD para `public.service_areas`; `user-export-data` continua não implantada e uncertified, portanto não deve ser deployada antes do preflight;
- G35A fecha os writers de Professional no código novo pelo `profile-rpc` existente, com patch allowlisted, stats automáticos e política de slug no servidor; grants browser antigos ficam temporariamente apenas por compatibilidade com o frontend production desatualizado;
- **não** adicionar `ServiceAreasService` ao incremental baseline para esconder a violação;
- Supabase canônico: `xhdowzacfujckjelqhtd`;
- invariantes remotos de mobilidade continuam: 0 offers abertas, 0 dispatch pendente e 0 motorista preso em corrida terminal;
- Vercel atual está bloqueando novos builds por limite do provider e GitHub jobs recentes nem iniciam steps; portanto build/E2E same-SHA continuam pendentes de execução real;
- último deploy Vercel production READY localizado: `86c76fc8d48550fbbed783a359c32f6cdf6a435d`, muito atrás da `main`;
- Mobilidade continua **launch-paused**: `PUBLIC_LAUNCH_SURFACES.mobility=false`;
- próximo gate imediato: aplicar/reconciliar G35A no Supabase → validar `profile-rpc` same-source → depois retomar arquitetura/security → build/E2E/smoke/deploy web same-SHA;
- descoberta estrutural pendente: `ProfileService` principal ainda possui DML direto em `profiles`, enquanto multi-profile já usa broker; tratar em G36, sem criar uma terceira stack;
- não restaurar DML direto, operator scripts obsoletos, wrappers concorrentes, dynamic-table novo ou authorities paralelas.

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
