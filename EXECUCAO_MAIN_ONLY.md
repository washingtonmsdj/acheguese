# Achegue-se — Plano de execução `main`-only

**Status:** EM EXECUÇÃO  
**Início:** 2026-08-25  
**Escopo:** GitHub + Supabase + Vercel  
**Repositório:** `washingtonmsdj/acheguese`  
**Linha única de desenvolvimento:** `main`

Este documento é o checkpoint operacional da consolidação final. O plano técnico canônico continua em `AUDITORIA_E_PLANO_IMPLEMENTACAO.md`; este arquivo registra a sequência de execução adotada a partir de 25/08/2026.

## Regras obrigatórias

- Não criar novas branches.
- Não iniciar novos PRs para correções desta execução.
- Toda mudança nova deve ser aplicada diretamente à `main` após validação do delta.
- Não apagar branch histórica antes de comprovar que não contém trabalho exclusivo necessário.
- Não aplicar migration em produção antes de validar contrato, ordem e pós-condições.
- Merge/deploy não equivale a `PROD/DONE`; produção precisa ser verificada.
- Não reduzir gates para obter verde.

## Fase 1 — Consolidar o delta ativo (#82)

- [x] Confirmar que o PR #82 está isolado sobre a `main` atual.
- [x] Confirmar escopo: 3 arquivos, sem frontend/Edge Function.
- [x] Revalidar em produção as 12 RPCs afetadas.
- [x] Confirmar que `anon` não possui EXECUTE nas 12 RPCs.
- [x] Confirmar que `authenticated` possui EXECUTE nas 12 RPCs.
- [x] Confirmar SECURITY INVOKER/DEFINER e `search_path` esperados.
- [x] Confirmar drift atual: `service_role` ainda executa os 6 wrappers `public.*` e não executa os 6 helpers `private.*`.
- [ ] Auditar callers para excluir dependência legítima de `service_role` nos wrappers públicos.
- [ ] Validar a migration e os dois testes do #82 contra a `main` atual.
- [ ] Integrar somente o delta aprovado diretamente na `main`.
- [ ] Fechar o PR #82 como consolidado/superseded pela execução `main`-only.

## Fase 2 — Encerrar fila histórica

- [ ] Auditar PR #74 e extrair somente deltas ainda necessários.
- [ ] Auditar PR #52 e extrair somente deltas ainda necessários.
- [ ] Auditar PR #3 e extrair somente deltas ainda necessários.
- [ ] Fechar PRs históricos sem merge cego.

## Fase 3 — Sincronizar Supabase com a `main`

- [ ] Recalcular a lista exata de migrations versionadas e ainda não aplicadas.
- [ ] Validar dependências e ordem de aplicação.
- [ ] Aplicar cada migration aprovada individualmente em produção.
- [ ] Executar pós-probes após cada migration.
- [ ] Rodar advisors de segurança/performance após o lote.
- [ ] Confirmar que a tabela de migrations remota corresponde à `main`.

## Fase 4 — Certificar Vercel/produção

- [ ] Confirmar deploy da SHA final da `main`.
- [ ] Confirmar build/status do deployment.
- [ ] Verificar runtime errors.
- [ ] Executar smoke tests dos fluxos críticos.
- [ ] Validar autenticação, perfis, empresas, vagas, candidaturas, reports e LGPD.

## Fase 5 — Limpeza definitiva de branches

- [ ] Inventariar todas as branches além de `main`.
- [ ] Classificar cada uma: incorporada / obsoleta / contém commit exclusivo.
- [ ] Recuperar para `main` qualquer delta comprovadamente necessário.
- [ ] Remover branches residuais somente depois da classificação.
- [ ] Confirmar que `main` é a única branch operacional restante.

## Fase 6 — Hardening contínuo na `main`

Prioridade depois da consolidação:

1. CI e gates (#17).
2. LGPD (#68).
3. proteção contra force-push/deleção acidental da `main` (#28).
4. limpeza estrutural (#51).
5. certificação funcional dos módulos (#50).

## Evidência inicial — 25/08/2026

A revalidação live do lote #82 confirmou:

- as 12 funções existem no Supabase de produção;
- `anon=false` para EXECUTE em todas;
- `authenticated=true` para EXECUTE em todas;
- os 6 wrappers `public.*` são `SECURITY INVOKER` com `search_path=private, pg_temp`;
- os 6 helpers `private.*` são `SECURITY DEFINER` com `search_path=public, private, pg_temp`;
- `service_role=true` apenas nos 6 wrappers `public.*`, que é exatamente o drift que o lote pretende remover.

Próximo gate: provar que não há caller legítimo usando `service_role` nesses wrappers e, somente então, integrar o delta aprovado na `main`.
