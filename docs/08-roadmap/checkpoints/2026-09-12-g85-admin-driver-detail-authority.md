# G85 — Admin driver detail authority

Data: 2026-09-12

## Objetivo

Corrigir o detalhe administrativo de motorista que ainda dependia de aliases e campos legados de `driver_data`, inclusive presença operacional que foi aposentada no G83.

## Problema encontrado

`useAdminUserDetail` chamava `profileService.getDriverData(...)`, mas esse método em `ProfileService` é um stub que retorna `null`. Ao mesmo tempo, o contrato local `DriverDetail` ainda misturava:

- cadastro/CNH/veículo;
- presença online e localização;
- estatísticas de corrida;
- aliases antigos (`cnh_number`, `last_online_at`, `total_requests_received`, etc.).

Isso fazia a tela administrativa representar um modelo que não corresponde mais às autoridades reais do domínio.

## Correção aplicada

### `AdminDriverDetailReadService`

Novo read model administrativo:

- lê de `driver_data` apenas cadastro, verificação e contadores agregados;
- não seleciona de `driver_data` nenhum campo de presença operacional;
- sobrepõe presença exclusivamente por `AdminDriverPresenceReadService` / `driver_availability`;
- mantém RLS existente; não adiciona grants nem broker paralelo.

Commit: `d9047bece95c7354a96539f024312fa11a5f75bb`

### `useAdminUserDetail`

- deixa de chamar o stub `profileService.getDriverData`;
- trabalha explicitamente com `profileId`;
- carrega detalhe de motorista apenas quando `profile_type === "driver"`;
- usa `AdminDriverDetailReadService.get(profileData.id)`;
- consulta timeline de moderação de motorista apenas para perfil driver;
- corrige `SuspensionHistory.user_id` para usar o `user_id` real do perfil.

Commit: `97d1b3b501e7776257eefa3f8999efd5b9f7dd52`

### `DriverDataTab`

A UI agora exibe os campos canônicos:

- `license_number`, `license_category`, `license_state`, `license_expiry`;
- veículo e modalidade;
- verificação documental/background check;
- `total_rides`, `total_rides_completed`, `total_rides_cancelled`, `acceptance_rate`;
- `is_online`, `is_available`, `last_seen_at`, `last_location_update` vindos do read model de presença.

Foram retirados os aliases falsos/obsoletos da tela, sem retirar a funcionalidade equivalente.

Commit: `1302a5294e555cb8e3f1e6d7da15a01d94390a89`

### `AnalyticsTab`

- deixa de usar `total_requests_received`, `total_requests_accepted` e `cancellation_count`;
- usa os contadores canônicos de corrida;
- não transforma ausência de taxa de aceitação em dado inventado;
- recomendação por baixa aceitação só existe quando a métrica está realmente disponível.

Commit: `c6fdbd60eaa2eec6f040fd5b9d5e1af7169fdb85`

### Ratchet

`AdminDriverDetailAuthorityG85.test.ts` protege:

- separação entre cadastro e presença;
- ausência de campos de presença no select de `driver_data`;
- ausência do stub no hook;
- ausência dos aliases administrativos aposentados.

Commits:

- `8648206ab2610f3c6874c7d0ca6b156b4320a174`
- `4daf7e1d2db279a1b37b7d94f4dd4828bfc73ff3` — correção do project-root do ratchet.

## Validação / infraestrutura

Os GitHub Actions disparados no head G85 não forneceram validação executada: jobs como `Phase Core Gate (SSOT)` e `Maps Architecture Enforcement` terminaram como failure com `steps=[]`, ou seja, falharam antes de executar qualquer step. `All Tests Passed` ficou dependente/queued.

Portanto:

- não existe evidência de falha de código proveniente desses jobs;
- também não existe autorização para declarar build/testes verdes.

## Resíduo conhecido

`ProfileService.getDriverData` continua sendo um stub e ainda possui callers em governança administrativa (`AdminProfileGovernanceLoaders` e `AdminProfileGovernanceService`). Esses callers devem ser migrados para a autoridade cadastral apropriada e o stub então removido, em vez de ser reativado com lógica ambígua.

## Relação com G83/G84

G85 preserva as decisões anteriores:

- `driver_availability` continua SSOT de presença/GPS;
- `driver_data` não volta a ser mirror operacional;
- nenhuma authority admin de escrita de presença foi reintroduzida;
- MFA/AAL2 G84 não é alterado.

`PUBLIC_LAUNCH_SURFACES.mobility=false` permanece até os gates de runtime/E2E/security serem certificados.
