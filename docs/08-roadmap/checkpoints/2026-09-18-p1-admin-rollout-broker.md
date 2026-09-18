# Checkpoint 2026-09-18 — P1: autoridade de mutação de rollout

## Achado

`module_rollouts` é a autoridade pública de disponibilidade operacional por
território. A leitura de browser é intencional e limitada às colunas públicas,
mas o banco atual concede INSERT/UPDATE/DELETE somente a `service_role` e tem
apenas uma policy de SELECT.

Ao mesmo tempo, `RolloutRepositorySupabase.upsert/delete` tentava escrever
diretamente pelo client browser. Portanto toggles administrativos que chamam
`RolloutService.setModuleRollout()` não possuíam uma autoridade de persistência
compatível com o banco.

## Evidência remota

Snapshot 2026-09-18:

- `anon` / `authenticated`: SELECT somente nas colunas
  `id,module_key,location_id,status,config,created_at,updated_at`;
- nenhuma permissão INSERT/UPDATE/DELETE para browser;
- única policy: `public_read_module_rollouts` (SELECT);
- `service_role`: autoridade completa de tabela.

## Correção

Foi criado `admin-rollout-rpc`:

- Edge Function com `verify_jwt=true`;
- `requireAdmin` como autoridade canônica de admin e política de MFA;
- escrita via client `service_role`;
- allowlist dos `ModuleKey` canônicos;
- status limitado a `active|inactive`;
- UUID de localização validado e localização deve existir/estar ativa;
- config limitada a objeto, 50 chaves e 8 KiB;
- `created_by` / `updated_by` derivados do usuário autenticado no servidor;
- rate limit e audit log compartilhados;
- leitura pública permanece direta e não é alargada.

O `RolloutRepositorySupabase` mantém os quatro caminhos de leitura no Data API,
mas `upsert/delete` agora usam o broker.

## Callers

A busca de runtime confirmou mutações em superfícies administrativas:

- Community rollout: `useAdminTerritoryManagement`;
- Mobility rollout/motoboy: `AdminOperacoes` e painéis admin;
- `TerritorialRolloutService` documenta suas operações como administrativas.

Nenhum caller de usuário comum foi encontrado para as mutações.

## Deploy

`admin-rollout-rpc` foi implantada no Supabase como ACTIVE v1, com
`verify_jwt=true`, empacotando os helpers atuais de `security`, `adminAuth`
e `mfaPolicy`.

## Limite

Este checkpoint não certifica o release. GitHub Actions continua falhando antes
de executar steps e Heavy Certification permanece dependente do runner remoto.
O PR deve ser validado no mesmo SHA antes de integração.
