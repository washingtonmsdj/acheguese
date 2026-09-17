# Próximos passos

Este arquivo é um resumo navegacional. O **SSOT operacional** da estabilização e dos critérios de MVP é [`EXECUCAO_MAIN_ONLY.md`](./EXECUCAO_MAIN_ONLY.md).

## Ordem atual

1. restaurar CI/gates executáveis e proteger a `main` (#17, #28);
2. continuar hardening de RLS/RPC/grants sem ampliar superfície pública artificialmente (#85);
3. reconciliar LGPD delete/export antes de qualquer rollout (#68);
4. concluir a certificação dos módulos por fluxo funcional real, segurança e E2E (#50);
5. concluir provenance das fixtures E2E (#83);
6. classificar e remover branches históricas com segurança (#84).

## Concluído nesta rodada

- Issue #51: poda documental, revisão de testes/configurações e outputs de QA, reconciliação de owners e layouts responsivos de Home, Comunidade e Central. Evidências e limitações estão no [checkpoint de 17/09/2026](./checkpoints/2026-09-17-issue-51-documentation-pruning.md).

## Regra de escopo

Durante esta fase, priorizar correção, segurança, organização, performance comprovada e estabilidade. Não aumentar escopo do produto para mascarar pendências de fundação.

## Prontidão

O projeto **não deve ser marcado MVP READY** enquanto CI real, proteção de `main`, LGPD, certificação dos módulos e prova de deploy do SHA aprovado permanecerem pendentes. O checklist completo está no plano operacional canônico.
