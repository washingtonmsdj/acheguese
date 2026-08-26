# Próximos passos

Este arquivo é um resumo navegacional. O **SSOT operacional** da estabilização e dos critérios de MVP é [`EXECUCAO_MAIN_ONLY.md`](./EXECUCAO_MAIN_ONLY.md).

## Ordem atual

1. restaurar CI/gates executáveis e proteger a `main` (#17, #28);
2. continuar hardening de RLS/RPC/grants sem ampliar superfície pública artificialmente (#85);
3. reconciliar LGPD delete/export antes de qualquer rollout (#68);
4. concluir limpeza de SSOT, documentação e namespaces — começando pelo resíduo `src/features/events` (#51);
5. certificar módulos por fluxo funcional real, segurança e E2E (#50);
6. concluir provenance das fixtures E2E (#83);
7. classificar e remover branches históricas com segurança (#84).

## Regra de escopo

Durante esta fase, priorizar correção, segurança, organização, performance comprovada e estabilidade. Não aumentar escopo do produto para mascarar pendências de fundação.

## Prontidão

O projeto **não deve ser marcado MVP READY** enquanto CI real, proteção de `main`, LGPD, certificação dos módulos e prova de deploy do SHA aprovado permanecerem pendentes. O checklist completo está no plano operacional canônico.