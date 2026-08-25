# Achegue-se — Plano de execução `main`-only

**Status:** EM EXECUÇÃO  
**Início:** 2026-08-25  
**Último checkpoint:** 2026-08-25 — Fase 1 concluída; Fase 2 em reconstrução do #74  
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

## Fase 1 — Consolidar o delta ativo (#82) — CONCLUÍDA

- [x] Confirmar que o PR #82 estava isolado sobre a `main` então vigente.
- [x] Confirmar escopo: 3 arquivos, sem frontend/Edge Function.
- [x] Revalidar em produção as 12 RPCs afetadas.
- [x] Confirmar que `anon` não possui EXECUTE nas 12 RPCs.
- [x] Confirmar que `authenticated` possui EXECUTE nas 12 RPCs.
- [x] Confirmar SECURITY INVOKER/DEFINER e `search_path` esperados.
- [x] Confirmar drift: `service_role` executava os 6 wrappers `public.*` e não os 6 helpers `private.*`.
- [x] Auditar callers e excluir dependência legítima de `service_role` nos wrappers públicos.
- [x] Validar migration + SQL spec em transação reversível (`ROLLBACK`) contra o Supabase remoto.
- [x] Confirmar pós-rollback que produção permaneceu inalterada.
- [x] Integrar os 3 arquivos aprovados diretamente na `main` em commit atômico `d83938460ab97c341bd67c2ce4a5bce3864bc9cc`.
- [x] Fechar o PR #82 sem merge, substituído pela execução `main`-only.

### Resultado da Fase 1

O lote remove da versão Git o contrato incoerente de `service_role` nos wrappers de report de vaga/review/ride. A migration ainda é `GIT/DONE / PROD/PENDING`: não foi aplicada ao banco remoto nesta fase.

GitHub Actions não disparou workflow para a SHA `d83938460ab97c341bd67c2ce4a5bce3864bc9cc`; esse comportamento entra no backlog de CI (#17) e não será contornado reduzindo gates.

## Fase 2 — Encerrar fila histórica — EM EXECUÇÃO

- [~] Auditar PR #74 e reconstruir somente deltas ainda necessários sobre a `main` atual.
- [ ] Auditar PR #52 e extrair somente deltas ainda necessários.
- [ ] Auditar PR #3 e extrair somente deltas ainda necessários.
- [ ] Fechar PRs históricos sem merge cego.

### #74 — achados que impedem reaplicar o head histórico

O head histórico do #74 não será mergeado nem copiado literalmente.

Já comprovado:

- a `main` ainda usa `user-delete-account` em serviços de browser e ainda lê `user_deletion_schedule` diretamente; esses caminhos precisam migrar para o broker `privacy-rpc`;
- o #78 já classifica `user-delete-account` como `blocked-legacy` e deixa `privacy-rpc`/export disponíveis durante a janela reversível;
- o `privacy-rpc` atual da `main` preserva limpeza de Auth metadata no cancelamento; o patch histórico do #74 removeria esse hardening e, portanto, não pode ser reutilizado literalmente;
- a migration histórica usa `auth.role()` em decisões de autoridade. A reconstrução usará o papel efetivo da request (`current_setting('role', true)`) para distinguir `authenticated` de `service_role`, inclusive dentro de funções `SECURITY DEFINER`;
- probe transacional no Supabase confirmou que `current_setting('role', true)` preserva `service_role` dentro de uma função `SECURITY DEFINER`, enquanto `current_user` muda para o owner/definer;
- o `ProtectedRoute` histórico consulta o deletion status sem bloquear render durante loading/erro, criando comportamento fail-open. A reconstrução deve ser fail-closed para rotas normais e manter `/conta/privacidade` acessível para recuperação;
- o estado `failed` não é dead-end na fundação `20260821011000`: um novo request pode reiniciá-lo em `scheduled`. O frontend/broker reconstruído deve preservar esse caminho de recuperação;
- nomes atuais de colunas/status de `businesses`, `ride_requests`, `orders` e `user_roles` foram conferidos no catálogo remoto antes da reconstrução das precondições operacionais.

Próximo gate do #74: reconstruir source + migrations + testes sobre a `main`, executar validação reversível da cadeia de DB e somente depois fechar o PR histórico.

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

Observação atual: a Vercel já promoveu `b3b64e726a6d452423caffe1f35f9cbf9046b9b2` (commit inicial deste plano) como `READY` em produção. A SHA de segurança posterior deve ser comprovada separadamente antes de ser marcada como deploy final.

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
- `service_role=true` apenas nos 6 wrappers `public.*`, exatamente o drift removido pela migration agora versionada na `main`.
