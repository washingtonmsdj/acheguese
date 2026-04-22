# Inventario Modular Final (Auditoria Estrutural)

Data: 2026-04-22

## Resumo
- Modulos avaliados: 23
- Corretos: 23
- Parcialmente corretos: 0
- Incorretos: 0
- Gates: `typecheck`, `validate:architecture:governance`, `validate:deps` em verde.
- Boundaries criticos: `modules->integrations=0`, `shared->domain=0`, `core->app=0`, `ui->supabase runtime=0`.

## Classificacao por modulo

| Modulo | Status | TODO/FIXME | Legacy | Cross-module | Integrations runtime | UI->Supabase runtime |
|---|---:|---:|---:|---:|---:|---:|
| admin | correto | 0 | 0 | 0 | 0 | 0 |
| admin-identidade | correto | 0 | 0 | 0 | 0 | 0 |
| admin-motoristas | correto | 0 | 0 | 0 | 0 | 0 |
| analytics | correto | 0 | 0 | 0 | 0 | 0 |
| business | correto | 0 | 0 | 0 | 0 | 0 |
| classifieds | correto | 0 | 0 | 0 | 0 | 0 |
| community | correto | 0 | 0 | 0 | 0 | 0 |
| community-alerts | correto | 0 | 0 | 0 | 0 | 0 |
| community-issues | correto | 0 | 0 | 0 | 0 | 0 |
| dashboard | correto | 0 | 0 | 0 | 0 | 0 |
| delivery | correto | 0 | 0 | 0 | 0 | 0 |
| empresa | correto | 0 | 0 | 0 | 0 | 0 |
| empresas-landing | correto | 0 | 0 | 0 | 0 | 0 |
| gastronomy | correto | 0 | 0 | 0 | 0 | 0 |
| guide | correto | 0 | 0 | 0 | 0 | 0 |
| landing | correto | 0 | 0 | 0 | 0 | 0 |
| mobility | correto | 0 | 0 | 0 | 0 | 0 |
| onboarding | correto | 0 | 0 | 0 | 0 | 0 |
| professionals | correto | 0 | 0 | 0 | 0 | 0 |
| profile | correto | 0 | 0 | 0 | 0 | 0 |
| promotions | correto | 0 | 0 | 0 | 0 | 0 |
| services | correto | 0 | 0 | 0 | 0 | 0 |
| vagas | correto | 0 | 0 | 0 | 0 | 0 |

## Problemas objetivos por modulo (estado atual)
- admin: TODO/FIXME=0.
- business: TODO/FIXME=0.
- classifieds: TODO/FIXME=0.
- community: TODO/FIXME=0, legacy=0.
- gastronomy: TODO/FIXME=0, legacy=0.
- mobility: TODO/FIXME=0, legacy=0.
- profile: TODO/FIXME=0.

## Correcoes executadas nesta rodada
- `MobilityOfferService`: prioridade de ofertas agora calculada por recencia/preco/distancia; tentativa da oferta resolvida dinamicamente; extracao de bairro reforcada.
- `OperationalVerificationService`: regra de PIN por operacao implementada com fallback seguro quando tabela/coluna operacional nao existir.
- `ActivityQueryService` (gastronomy): implementadas consultas de atividades por usuario e por estabelecimento com base no feed canonico de atividades.
- Removido acesso direto ao banco em `src/modules/mobility/hooks/useMobilidade.ts` (rating e confirmacao de corrida passaram para services canonicos em `core/mobility/services`).
- Criado `src/core/mobility/services/RidePassengerService.ts` e exportado no barrel canonico.
- Removidos arquivos mortos/legados sem referencias: `src/modules/profile/pages/PerfilHubPage.refactored.tsx`, `src/modules/classifieds/pages/ClassificadosPageLegado.tsx`, `src/modules/classifieds/pages/NovoClassificadoPageLegado.tsx`, `src/modules/classifieds/pages/TestUploadPage.tsx`.
- `src/modules/community/pages/ExamplePostPage.tsx` convertido para wrapper de `core` para eliminar duplicidade de implementacao.
- Consolidacao de ownership em `community`: hooks/componentes de `modules/community` com backlog de TODO migrados para wrappers do dominio canonico em `core/community`.
- `src/modules/admin/pages/AdminVerificacoes.tsx` convertido para wrapper de `src/core/verification/pages/AdminVerificationsPage`.
- `src/modules/admin/pages/AdminRoles.tsx` passou a usar `useSessionContext` para `revokedBy`/`renewedBy` (remocao de placeholder `current-admin-id`).
- `src/modules/business/components/AppointmentNotifications.tsx` migrado para notificacoes canonicas via `core/notifications` (`useUnifiedNotifications`) com leitura/ack reais.
- `src/modules/classifieds/components/profile/VendedorContactBar.tsx` integrado ao `core/messaging` para criar/obter conversa real e enviar mensagem real.
- `src/modules/classifieds/hooks/useVendedorPerfil.ts` removeu metricas/reviews fake no caminho real e expôs `phone`/`whatsapp` para contato.
- `src/modules/classifieds/pages/VendedorPerfilPage.tsx` passou a injetar contexto real de classificado no contato (`initialClassifiedId`).

## Prioridades
1. P1: Manter gates de governanca (`typecheck`, `validate:architecture:governance`, `validate:deps`) no CI para evitar regressao.
2. P2: Evoluir cobertura de testes funcionais por modulo mantendo contratos publicos consolidados.
