# G84 — Mobilidade: autoridade Admin com MFA/AAL2

Data: 2026-09-11

## Objetivo

Fechar o bypass administrativo do `mobility-rpc` sem transformar o papel Admin em uma trava para o uso normal de Mobilidade.

A regra consolidada é:

- passageiro/motorista atua primeiro pela autoridade do próprio perfil;
- ser Admin não muda o fluxo self-service;
- MFA/AAL2 é exigido somente quando a requisição realmente usa privilégio administrativo;
- role Admin vem da autoridade canônica `get_user_roles`, não do helper legado `is_admin`;
- Supabase Auth é a autoridade de fator MFA e AAL atual via `evaluateUserMfaPolicy`.

## Problema confirmado

O broker anterior reconhecia `isProjectAdmin`, mas caminhos administrativos sensíveis podiam executar apenas com o papel Admin, sem aplicar a política canônica de MFA/AAL2 já usada em outras superfícies privilegiadas.

Também havia um risco de desenho: impor MFA globalmente a qualquer usuário que possuísse papel Admin bloquearia seu uso comum como passageiro ou motorista. G84 evita isso usando **participant-first + admin fallback**.

Durante o cutover também foi confirmado drift real entre Git e runtime: o `mobility-rpc` remoto v25 estava `ACTIVE`/`verify_jwt=true`, porém ainda não continha as ações já versionadas `getDriverRideHistory` e `getDriverEarningsHistory`.

## Correção integrada na `main`

### Autoridade de role e MFA

`supabase/functions/mobility-rpc/index.ts` agora:

- carrega papel administrativo por `get_user_roles(_user_id)`;
- não usa mais `is_admin` como autoridade do broker;
- preserva o bearer token autenticado no contexto da requisição;
- usa `evaluateUserMfaPolicy(supabaseAdmin, userId, token)`;
- exige `reason=satisfied`, `required=false` e AAL2 efetivo para privilege escalation Admin;
- audita falha de MFA como `mobility_admin_mfa_required`.

### Ações exclusivamente administrativas

Exigem `requireAdminMfa` antes da mutação privilegiada:

- `ensureAdminDriverProfile`;
- `adminRedispatch`;
- `updateFailedDeliveryResolution`;
- `reconcileStaleDriverAvailability`.

### Ações mistas: usuário primeiro, Admin apenas como fallback

- `acceptRide`: o dono do perfil driver segue o fluxo normal; aceitar por perfil alheio exige Admin + MFA/AAL2;
- `findAvailableDriversForRide`: o passageiro solicitante segue normalmente; consulta privilegiada de outra corrida exige Admin + MFA/AAL2;
- `transitionRideState`: passageiro/motorista legítimo é resolvido antes do fallback Admin;
- `transitionDeliveryState`: motorista atribuído é resolvido antes do fallback Admin.

### Fluxos self-service sem MFA administrativo

Continuam owner-bound e não recebem `requireAdminMfa`:

- `updateDriverAvailability`;
- `updateDriverLocation`;
- `listDriverOffers`.

Isso é intencional: um usuário que também seja Admin não deve precisar elevar AAL apenas para operar o próprio perfil de motorista.

## Ratchets

Adicionado:

- `src/modules/mobility/__tests__/MobilityAdminMfaAuthorityG84.test.ts`

O teste trava:

- `get_user_roles` como role authority;
- ausência de retorno ao `is_admin` no broker;
- uso da policy canônica MFA/Auth;
- MFA nas operações puramente administrativas;
- participant-first nas operações mistas;
- ausência de MFA administrativo nos comandos self-service de presença/localização/ofertas.

Também foi corrigido o ratchet antigo:

- `tests/security/mobility-rpc-security.test.ts`

Ele ainda exigia o broker anterior (`is_admin`, `p_user_id`, `accept_ride_atomic`). Agora verifica a autoridade atual (`get_user_roles`, `_user_id`, `mobility_accept_ride_atomic`, `evaluateUserMfaPolicy`) sem reabrir os RPCs já aposentados.

## Commits principais

- `4d0fad6310f119cf216f6ee73364146dd10d086c` — ratchet inicial G84;
- `686317600a9843f9dc634b61b103a595400a7d25` — hardening MFA/AAL2 do broker;
- `3311410495e82a8a3947aff87d3656dd76524705` — alinhamento do ratchet à formatação real do broker;
- `e957fe16a459ce50444454746f683e1224329a1c` — gate de deploy `mobility-rpc` a partir de checkout exato da `main`;
- `3e90cb59fb0a49e1e59c0ebc3d9eab18d670ce14` — tentativa de runner hospedado para deploy API-only;
- `99f2a2957263021ce2bd5a24d14cdfa05922a9ac` — atualização do ratchet antigo de segurança;
- `f78eaaa0284cbf99026ae5870c181d2d3ecce7fd` — restauração do runner privado de produção após falha pré-step do hosted runner.

## Runtime Supabase observado

Projeto canônico: `xhdowzacfujckjelqhtd` (`acheguese`).

Estado pós-hardening observado:

- `mobility-rpc` remoto: **v28**;
- status: **ACTIVE**;
- `verify_jwt=true`;
- source remoto contém semanticamente os contratos G84;
- source remoto contém também `getDriverRideHistory` e `getDriverEarningsHistory`, corrigindo o drift funcional observado na v25.

As versões v26-v28 foram deploys intermediários/containment pelo conector Supabase para colocar a semântica G84 no runtime enquanto o gate reprodutível era criado.

**Importante:** esses deploys intermediários não constituem prova de source byte-a-byte igual à `main`, pois o empacotamento manual produziu diferenças textuais em entrypoint/helpers. Portanto não usar v28 como prova de proveniência exata.

## Gate permanente de deploy exato

Criado:

- `.github/workflows/supabase-mobility-rpc-deploy.yml`

O workflow:

1. aceita somente `main`;
2. fixa o SHA de 40 caracteres do evento;
3. faz checkout isolado e sparse de `supabase/` naquele SHA exato;
4. exige worktree limpo e prova `git rev-parse HEAD == target SHA`;
5. fixa Supabase CLI `2.115.0`;
6. valida `verify_jwt=true` e os contratos G84 antes do deploy;
7. calcula SHA256 dos quatro arquivos do bundle;
8. executa `supabase functions deploy mobility-rpc --use-api` a partir daquele checkout;
9. verifica inventário remoto/status/`verify_jwt` após o deploy.

### Estado do runner

Uma tentativa com `ubuntu-latest` falhou **antes de executar qualquer step**:

- run `34668641773`;
- job `103485611123`;
- `runner_id=0`;
- `steps=[]`;
- nenhum comando do projeto foi executado.

Logo, essa falha não é evidência de erro no source ou no script do gate. O motivo específico da indisponibilidade do hosted runner não foi exposto pelo conector e não deve ser inferido.

O gate voltou ao runner privado já adotado pelo projeto:

- labels: `self-hosted`, `windows`, `x64`, `acheguese-heavy-windows`, `remote-only`;
- run atual: `34668821153`;
- job: `103486120445`;
- estado no fechamento deste checkpoint: **QUEUED**, aguardando disponibilidade do runner.

Portanto a proveniência **exact-main -> deploy remoto** permanece PENDING até esse job executar e passar.

## Limitações de certificação

G84 não declara certificação total porque:

1. não há token/sessão de usuário real disponível neste contexto para executar smoke positivo/negativo AAL1/AAL2 contra a Edge;
2. o exact-source workflow ainda aguarda runner privado;
3. Vercel continua bloqueada pelo rate-limit externo já registrado, portanto não há build de produção verde no mesmo SHA;
4. o canal SQL remoto continua apresentando `connection timeout` até em `list_migrations`, então não foi aplicado o DDL pendente G83 nem o G42 de MFA.

## Estado

- **G84 SOURCE AUTHORITY: READY**;
- **G84 RUNTIME SEMANTICS: ACTIVE na v28**;
- **G84 EXACT-SOURCE DEPLOY PROVENANCE: PENDING RUNNER**;
- **G84 AAL1/AAL2 END-USER SMOKE: PENDING**;
- **G83 SERVER-SIDE LEGACY DDL: PENDING DB PREFLIGHT**;
- **PUBLIC MOBILITY LAUNCH: CONTINUA PAUSADO**.

## Próximo gate

1. quando o runner privado assumir `34668821153`, exigir PASS do checkout/hash/deploy/inventory antes de promover a proveniência do Edge a verde;
2. quando o SQL remoto estabilizar, fazer preflight do `update_owned_driver_data`, promover a migration pendente G83 e provar que os quatro campos operacionais foram rejeitados server-side;
3. executar smoke autenticado AAL1/AAL2 para os caminhos Admin e provar que o mesmo Admin continua usando seu próprio perfil passageiro/motorista sem MFA administrativo;
4. depois rodar segurança/arquitetura/E2E/smoke responsivo no mesmo SHA;
5. somente depois reconsiderar `PUBLIC_LAUNCH_SURFACES.mobility`.
