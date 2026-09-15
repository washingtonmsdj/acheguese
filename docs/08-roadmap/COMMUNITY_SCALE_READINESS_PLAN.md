# Community Scale Readiness

Status: em andamento (execucao de carga em staging pendente)
Data: 2026-09-15
Escopo: Comunidade e conectores canonicos

## Objetivo

Preparar os caminhos de maior volume da Comunidade para crescimento previsivel,
sem afirmar capacidade de producao sem evidencias de carga, observabilidade e
limites distribuidos reais.

## Estado Atual Verificado

- Escritas sociais possuem guards, locks transacionais e limites no PostgreSQL.
- O feed territorial e leitura publica de alto volume; sua paginacao precisa
  ser keyset deterministica por `(created_at, id)` e ter indice compatível.
- O middleware compartilhado de Edge Functions usa Deno KV com contador
  compare-and-set atomico, comportamento fail-closed sob contencao repetida e
  fallback local com cardinalidade limitada. Ele continua sendo defesa de
  perimetro; nao substitui a autoridade transacional das mutacoes criticas.
- A chave do limiter compartilhado deriva apenas do IP da cadeia de proxies
  confiavel; `User-Agent` controlado pelo cliente nao cria identidades novas.
- `community-rpc` usa um contador atomico no PostgreSQL, por usuario e acao,
  depois da autenticacao. Indisponibilidade ou resposta invalida desse contador
  bloqueia a mutacao com `503` (fail-closed).
- `function_audit` e o SSOT das metricas do broker. Percentis sao calculados no
  banco e expostos somente para administradores ou `service_role`.

## Decisoes

- Nao introduzir Redis, fila ou outbox sem credenciais, operacao, SLO e dono
  definidos.
- Nao usar o fallback em memoria como prova de protecao distribuida.
- Manter o limiter Deno KV como camada distribuida de perimetro e o banco como
  autoridade de invariantes e limites das mutacoes criticas.
- Priorizar banco para invariantes de escrita e cursor/index para leituras.
- Executar carga somente contra staging isolado, com dados e credenciais de
  teste; nunca contra producao por padrao.

## Checklist

- [x] Inventariar controles de escrita e identificar a limitacao do rate limit
  complementar de Edge Functions.
- [x] Tornar o rate limiter compartilhado de Deno KV atomico e fail-closed sob
  contencao, limitar o fallback em memoria e remover `User-Agent` da chave.
- [x] Corrigir a paginacao keyset do feed territorial e do facade legado ainda
  publicado.
- [x] Criar indice parcial alinhado a leitura publica territorial.
- [x] Adicionar regressao automatica para cursor deterministico e indice.
- [x] Aplicar o indice no Supabase remoto e validar sincronizacao de migrations.
- [x] Definir storage distribuido de rate limit e comportamento fail-closed
  para a Edge Function critica `community-rpc`.
- [x] Adicionar metricas de latencia/erro por acao, p50/p95/p99, sinal de SLO e
  painel operacional administrativo.
- [ ] Configurar entrega externa do alerta de SLO, com canal, responsavel,
  escalonamento e segredo definidos no ambiente de producao.
- [x] Criar harness de carga somente leitura, limitado e bloqueado por
  confirmacao explicita de staging.
- [ ] Executar teste de carga em staging e registrar p50/p95/p99, erro e uso
  de banco antes de prometer meta de requisicoes por segundo.

## Evidencias 2026-07-14

- Migrations remotas aplicadas e sincronizadas:
  `20260714090000_add_community_rpc_scale_controls.sql` e
  `20260714093000_add_community_rpc_audit_retention.sql`.
- Retencao operacional: 90 dias, limpeza horaria em lotes limitados via
  Supabase Cron e funcao no schema `private`.
- Edge Function `community-rpc` implantada com contador atomico, bloqueio
  fail-closed, `request_id`, duracao e resultado operacional auditados.
- RPCs administrativos:
  `get_community_rpc_operational_metrics` e
  `get_community_rpc_slo_status`.
- Painel administrativo:
  `CommunityRpcOperationsPanel`, com janelas de 5, 15 e 60 minutos.
- Harness: `npm run bench:community:staging`; ele aceita apenas HTTPS no host
  Supabase declarado, caminho `/rest/v1/`, metodo GET e confirmacao
  `STAGING_ONLY_CONFIRMED`.
- A execucao contra staging continua pendente porque credenciais e projeto de
  staging nao foram fornecidos. O projeto remoto vinculado nao foi usado como
  alvo de carga.
- Gates executados: build de producao, typecheck do app, lint focado, scanner
  de seguranca, Security Authority, SSOT, hardcodes, arquitetura comunitaria,
  migrations local/remoto, docs e `36` testes focados passaram. O lint SQL
  remoto nao apontou as novas funcoes; manteve erros preexistentes em funcoes
  de outros dominios e extensoes.

## Evidencias 2026-09-15

- `supabase/functions/_shared/security.ts` passou a usar Deno KV com
  `atomic().check(...).set(...).commit()` e cinco tentativas antes de falhar
  fechado.
- O fallback por instancia passou a limitar sua cardinalidade e remover entradas
  expiradas antes de admitir novas chaves.
- O limiter deixou de combinar `User-Agent` com IP, impedindo bypass por simples
  rotacao desse header.
- A regressao `tests/security/shared-edge-rate-limit-security.test.ts` trava o
  contrato atomico, o fallback limitado e a chave sem `User-Agent`.
- `auth-username-login` foi implantada com o novo shared module e ficou ACTIVE
  na versao 12, confirmando compatibilidade do caminho atomico com o runtime
  remoto do Supabase.
- O Security Advisor remoto permaneceu indisponivel por timeout de conexao; isso
  nao foi tratado como aprovacao do scan.

## Criterio de Pronto

Nenhuma pagina de feed pode perder ou duplicar itens por empate de timestamp;
o caminho de leitura deve usar indice compativel; mutacoes criticas devem usar
limite atomico e fail-closed; e capacidade declarada so podera ser publicada
depois de teste de carga reproduzivel em staging. A entrega externa de alertas
deve ter canal e responsavel operacionais antes do lancamento.
