# Entity Private Data Boundary Audit

Data: 2026-07-18
Status: aprovado no ambiente remoto linkado
Escopo: Business, Professional, Profile, snapshots e Work Opportunities

## Resultado

A migration `20260718170000_consolidate_entity_contact_channels.sql` foi
aplicada no Supabase remoto. Contatos institucionais e credenciais profissionais
deixaram as tabelas publicas e passaram a ter persistencia privada, brokers
autenticados, ownership derivado no servidor e auditoria sem valores sensiveis.

## Fronteiras Validadas

- `business_data.email` nao existe mais na API publica;
- `professional_data.email`, `whatsapp`, `license_number` e `license_state` nao
  existem mais na API publica;
- IDs de owner de Professional nao sao selecionaveis pelo browser;
- `public_professional_search` nao projeta contato, credencial ou owner;
- `metadata` de Business e Professional nao contem canais de contato;
- snapshots anonimos nao retornam contato;
- brokers de contato e credenciais rejeitam chamadas anonimas;
- leitura e escrita autenticadas passam pelos brokers actor-bound;
- listagens permanecem contact-free e detalhes hidratam em chamada limitada;
- Work Opportunities deriva ownership de Profile/ProfileMember.
- criacoes de Business e Professional derivam o ator da sessao autenticada;
  nenhum `userId` fornecido pela UI decide ownership.

## Evidencias Executadas

| Comando | Resultado |
|---|---|
| `npm run test:entities:private-data` | 2 arquivos, 11 testes aprovados |
| `npm run security:entities:private-data-probe` | 11 verificacoes remotas aprovadas |
| `npm run security:profiles:pii-probe` | 11 verificacoes remotas aprovadas |
| `npm run validate:migrations:remote` | historico local/remoto sincronizado |
| `npm run security:privileged-rpc:browser-callers` | 171 RPCs restritas, zero chamada direta no browser |
| `npm run validate:architecture:core-platform` | ownership valido |
| `npm run security:validate` | aprovado |
| `npm run typecheck:app` | aprovado contra tipos remotos regenerados |
| `npm run lint -- --max-warnings=0` | aprovado |

A suite diretamente afetada aprovou 22 arquivos e 67 testes. A execucao global
`npm test` nao produziu relatorio antes do timeout operacional de 10 minutos;
por isso ela nao foi registrada como aprovada e deve ser particionada no
checkpoint de suites remanescente do plano.

Atualizacao de 2026-07-18: a causa foi corrigida no checkpoint seguinte. O
runner deterministico passou a excluir testes remotos e voltou a usar
paralelismo por arquivo; a evidencia da nova execucao pertence ao plano
principal, sem reescrever retroativamente o resultado deste checkpoint.

As Edge Functions `contact-rpc` e `professional-credentials-rpc` foram
publicadas com `verify_jwt = true`. Nenhuma evidencia registra valor de contato,
credencial ou token.

## Advisor

O Advisor passou a detectar boundaries `SECURITY DEFINER` criadas nos
checkpoints anteriores. Cada assinatura foi revisada. As funcoes permanecem
necessarias para consultar ou alterar tabelas sem conceder acesso direto ao
browser, derivam identidade/ownership internamente e usam grants e
`search_path` limitados. As chaves exatas foram registradas em
`SUPABASE_ADVISOR_RESIDUALS.json` sob a excecao governada
`EXC-2026-07-15-POSTGREST-SECURITY-DEFINER-COMMANDS`; nao ha wildcard.

## Rollback

O rollback de schema exige migration forward-only: restaurar colunas publicas
reabriria a exposicao e nao e permitido. Em incidente, revogar primeiro o
`EXECUTE` dos brokers afetados, preservar as tabelas privadas e publicar uma
migration corretiva. Os valores migrados continuam no SSOT privado.

## Pendencias Fora Do Escopo

- carga autorizada em staging para p50/p95/p99;
- exercicio operacional de backup/restore e rollback;
- decisao final de retencao e anonimizacao por classe de dado.

Esses itens permanecem no plano principal e nao reduzem a aprovacao da
fronteira de acesso deste checkpoint.
