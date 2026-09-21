# Migrações pendentes e gates de promoção

Esta pasta contém somente mudanças ainda não promovidas ao ledger remoto do
Supabase. Cada item precisa de preflight, revisão de risco e smoke do runtime
correspondente antes de ser promovido. Não copie a pasta inteira para
`supabase/migrations/` e não aplique SQL por ordem apenas pelo timestamp.

## Estado atual

As migrations G42/G43 phase 1 territoriais não ficam mais nesta pasta: as
versões antigas eram cópias byte a byte das migrations canônicas já presentes
no ledger remoto:

- `supabase/migrations/20260919003851_transactional_location_visibility_cascade_g42.sql`;
- `supabase/migrations/20260919003900_create_territorial_group_admin_commands_g43.sql`.

Os arquivos pending antigos foram removidos deste inventário; o histórico
continua no Git e a phase 2 permanece separada até a certificação hosted.

## Inventário pending

| Arquivo | Estado | Gate principal |
| --- | --- | --- |
| `20260810152013_finalize_community_poll_cutover.sql` | PENDING | preflight de Poll, janela de observação e prova de dados |
| `20260810152014_finalize_community_interest_cutover.sql` | PENDING | Edge, Turnstile, origins, frontend broker e smoke |
| `20260910133000_finalize_professional_lead_intake_g39.sql` | PENDING | frontend LIVE no broker e smoke anônimo/autenticado |
| `20260910203000_harden_mfa_authority_g42.sql` | PENDING | preflight remoto de Auth/RLS/grants e smoke AAL2 |
| `20260910211500_lock_user_role_writes_to_admin_broker_g42.sql` | PENDING | broker admin LIVE, grants remotos e smoke super-admin AAL2 |
| `20260910221500_lock_territorial_group_writes_to_broker_g43.sql` | PENDING | frontend hosted same-SHA e smoke admin AAL2 de `saveGroup`/`setStatus` |
| `20260910233000_atomic_group_visibility_g43.sql` | PENDING | migration G43 correspondente, Edge e smoke de visibilidade |
| `20260911235000_retire_driver_data_presence_writes_g83.sql` | PENDING | preflight da função, grants/policies e callers atuais |
| `g104-admin-mobility-analytics-snapshot.md` | OPERACIONAL | decisão/review do snapshot administrativo |
| `g122-public-ride-share-preaccept-privacy.md` | OPERACIONAL | preflight e validação do corte de privacidade |

## Antes de promover qualquer SQL

1. Confirmar o project ref e executar o preflight read-only no ambiente alvo.
2. Classificar risco e revisar grants, RLS, policies, `SECURITY DEFINER` e
   postconditions.
3. Confirmar que o Edge e o frontend hospedado usam o mesmo contrato e SHA.
4. Executar smoke positivo e negativo, registrar evidência e só então criar
   uma migration canônica com timestamp novo quando o arquivo exigir isso.
5. Rodar `npm run validate:migrations` e os gates de security authority depois
   da promoção.

## Regra de encerramento

Quando uma pendência for promovida, registrar o nome/timestamp canônico, o
resultado do smoke e a evidência remota neste documento e no checkpoint do
roadmap. Remover o item do inventário somente depois dessa confirmação; nunca
remover um pending para esconder um blocker.
