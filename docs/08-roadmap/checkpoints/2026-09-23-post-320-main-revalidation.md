# Checkpoint — main pós-#320

Data: 2026-09-23

## Estado real observado

- `main`: `4e3492bf9732612bfe5d32fd28751431da141273` (merge de #320).
- PRs abertos: nenhum no início desta execução.
- #320 concluiu o ratchet de persistência aposentada de Gastronomia: removeu o lint rule órfão, alinhou o SSOT a `gastronomy_profiles`/`GastronomyProfileService` e impede reintrodução de `gastronomy_establishments` no runtime.
- O merge SHA é um novo candidato e não herda certificação de release do head pré-merge.

## Blockers de release ainda abertos

### #305 — sessão autenticada real

Continua sendo blocker externo à UI. A correção aceitável é recuperar a disponibilidade real do Supabase Auth e executar o smoke autenticado no mesmo SHA candidato. Não adicionar retry artificial, fallback de login, bypass OIDC, redirect ou fixture oportunista.

### #309 — autoridade de deploy Supabase

Continua sendo blocker administrativo. O `SUPABASE_ACCESS_TOKEN` do GitHub Actions precisa pertencer a uma identidade Supabase com privilégio Developer/Admin/Owner suficiente para publicar a Edge Function. `service_role` não é substituto para essa autoridade de deploy.

## Decisão desta execução

Não alterar frontend/runtime para mascarar #305 ou #309. Como o último corte de código acabou de ser integrado e não há PR concorrente aberto, a próxima mudança de implementação deve partir desta `main`, com censo de callers/owners antes de remover qualquer resíduo adicional.

O próximo alvo desbloqueado permanece a limpeza comprovável de resíduos/owners duplicados fora do núcleo ativo, preservando módulos pós-MVP pausados e sem conectá-los ao runtime. Toda remoção deve vir acompanhada de ratchet obrigatório quando houver risco real de reintrodução.

## Regra de promoção

`MVP READY` permanece falso até que Business + Mapa + Perto de mim + Busca + Mensagens Business estejam certificados no mesmo SHA final, incluindo gates determinísticos, deploy real, smoke público e sessão autenticada real. Merge isolado não equivale a release.
