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
- G35A está reconciliado no runtime: `profile-rpc v14 ACTIVE` é byte-a-byte igual ao Git; novos RPCs Professional são service-role-only; probe create/update/deactivate PASS com rollback;
- G35A2 reparou uma duplicata real de `professional_data` e agora vale `UNIQUE(profile_id)`; estado remoto: 4 Professionals / 4 Profiles / 4 stats / 0 duplicatas;
- G36A está reconciliado: `profile-rpc v15 ACTIVE` é byte-a-byte igual ao Git; Profile self-service update/delete/switch estão broker-owned, username tem enforcement/auditoria server-side e o probe transacional completo PASS com rollback;
- grants browser antigos de `professional_data/professional_stats` e `profiles` ficam temporariamente apenas por compatibilidade com o frontend production desatualizado e devem ser revogados somente após deploy novo comprovado;
- G36A2: os novos RPCs Profile são service-role-only e não aparecem no Advisor como SECURITY DEFINER executável por anon/authenticated;
- G36B auditou o Business real: 97 `business_data`, 0 duplicatas e **0 `business_stats`**; create/update/delete gerais ainda tentavam DML browser numa tabela já fail-closed;
- G36B2: backfill+trigger de stats, UNIQUE(profile_id), metadata allowlisted, Address ownership e separação NetworkService foram provados; probe runtime completo PASS com rollback;
- G36B está reconciliado no runtime: `profile-rpc v16 ACTIVE` é byte-a-byte igual ao Git; Business está 97/97 em `business_data/business_stats`, sem stats faltantes/duplicatas, e create/update/delete gerais são broker-owned;
- **não** adicionar `ServiceAreasService` ao incremental baseline para esconder a violação;
- Supabase canônico: `xhdowzacfujckjelqhtd`;
- invariantes remotos de mobilidade continuam: 0 offers abertas, 0 dispatch pendente e 0 motorista preso em corrida terminal;
- Vercel atual está bloqueando novos builds por limite do provider e GitHub jobs recentes nem iniciam steps; portanto build/E2E same-SHA continuam pendentes de execução real;
- último deploy Vercel production READY localizado: `86c76fc8d48550fbbed783a359c32f6cdf6a435d`, muito atrás da `main`;
- Mobilidade continua **launch-paused**: `PUBLIC_LAUNCH_SURFACES.mobility=false`;
- G36C1 remove os writers mortos de `profiles.active_ride_id`; estado de corrida permanece exclusivamente em `driver_availability.active_ride_id`; campo físico de Profile só poderá ser dropado após cutover do frontend antigo;
- G36C2 está reconciliado: `admin-suspend-profile v1 ACTIVE` é byte-a-byte igual ao Git; suspend/unsuspend de Profile e usuário inteiro passam por RPC service-role-only com revalidação Admin e audit; `suspend_profile` legado está pronto para remoção;
- próximo gate imediato: aplicar o contract que remove `suspend_profile`; depois G36C3 eliminar os inserts diretos restantes de Profile/Driver e só então fechar grants compatíveis quando o frontend same-SHA estiver LIVE;
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
