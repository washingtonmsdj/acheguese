# Checkpoint R4 — Empresas públicas no MVP — 2026-09-21

## Escopo

Certificação parcial do fluxo público de Empresas no território de lançamento, sem ampliar o launch scope.

## Finding corrigido

O read model real do Complexo do Nordeste de Amaralina contém registros de categoria `educacao`, enquanto `PUBLIC_LAUNCH_SURFACES.education=false`.

A navegação de categorias já ocultava Educação, mas `EmpresasLandingPage` usava a coleção real completa no modo “Tudo”. Isso permitia que empresas/escolas de uma vertical pausada aparecessem em cards, hero, contadores, favoritos e destaques de uma superfície ativa.

A landing agora aplica `isLaunchBusinessCategoryEnabled(normalizeBusinessCategoryId(...))` imediatamente após normalizar os dados reais. Todo downstream visual parte dessa coleção filtrada.

## Evidência remota

Projeto canônico Supabase: `acheguese`.

No snapshot auditado do grupo `complexo-do-nordeste-de-amaralina`:

- 15 registros ativos de `public_business_search` estavam em `category=educacao`;
- 1 registro ativo estava em `category=servicos`;
- o registro liberado usado na prova foi `Tone Cos Loja` (`tone-cos-loja`);
- localização: `/br/ba/salvador/nordeste-de-amaralina`;
- a RPC `get_public_business_snapshot_by_slug` retornou snapshot real;
- canonical retornada: `/empresas/ba/salvador/nordeste-de-amaralina/tone-cos-loja`;
- `identity.businessId` do snapshot corresponde ao row de `public_business_search`.

O probe versionado `tests/security/business-mvp-public-flow-remote-probe.sql` foi executado contra o projeto canônico e concluiu sem exceção, encerrando em `ROLLBACK`.

## Ratchets

- `tests/architecture/business-mvp-public-flow.test.ts` exige filtro de categoria pausada antes das derivações visuais.
- O mesmo teste exige o probe rollback-only e a validação de identidade/canonical do detalhe.
- `src/app/config/__tests__/launchScope.spec.ts` já prova `education=false` e `isLaunchBusinessCategoryEnabled("educacao") === false`.

## Estado R4

**Parcialmente certificado.**

Provado neste checkpoint:

- território real;
- read model real;
- exclusão de categoria pausada da vitrine ativa;
- empresa permitida real;
- RPC de detalhe real;
- URL canônica real;
- probe remoto repetível e sem persistência.

Ainda não provado:

- browser E2E no mesmo SHA;
- build/deploy do mesmo SHA;
- smoke no domínio público do mesmo SHA.

Esses três itens permanecem dependentes da restauração dos runners e da liberação da cota de deploy; não devem ser confundidos com falha funcional de Empresas.
