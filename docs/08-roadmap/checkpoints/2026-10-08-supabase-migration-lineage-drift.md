# Supabase — reconciliação de migrations antes do próximo DB push

**Data da auditoria:** 08/10/2026 (America/Bahia)  
**Escopo:** repositório canônico `washingtonmsdj/acheguese`, `main` SHA
`13ee3235f3277c84e35c2d9a919d7f185d5e3f9f` e somente leitura do
histórico `supabase_migrations.schema_migrations` do projeto canônico
`xhdowzacfujckjelqhtd`.

## Diagnóstico comprovado

| Categoria | Quantidade |
|---|---:|
| Arquivos SQL em `main/supabase/migrations` | 708 |
| Migrações registradas no histórico remoto | 706 |
| Versões presentes em ambos | 682 |
| Versões somente no repositório | 26 |
| Versões somente no histórico remoto | 24 |

As **24 versões remotas exclusivas** têm nomes de migrations já conhecidos do
source. Entretanto, `remove_redundant_service_role_rls_policies` aparece
**duas vezes no histórico remoto** (`20260926011402` e
`20260926012211`) e apenas uma vez entre as versões locais divergentes
(`20260926011200`). Não fazer deduplicação por nome.

Comparação **do SQL armazenado no próprio histórico de produção**
(`supabase_migrations.schema_migrations.statements`) com os arquivos
de mesmo nome da `main`, em memória, sem trazer registros de usuários:

| Correspondência do corpo SQL (24 entradas) | Quantidade |
|---|---:|
| Exata, bytes iguais, versão diferente | 3 |
| Igual após retirar somente whitespace final, versão diferente | 14 |
| **Corpo SQL textualmente diferente além do whitespace final** | **7** |

Das sete entradas com diferença textual, **duas tornam-se idênticas ao remover
comentários de linha inteira e normalizar o whitespace**
(`harden_authenticated_security_definer_rpc_timeouts` e
`close_direct_profile_delete_authority`). Outras apresentam wrappers
transacionais `BEGIN/COMMIT`, comentários ou formatação distintos; a
equivalência semântica de todas ainda **não foi certificada**.

Entradas com conteúdo divergente que exigem revisão da semântica, sem
assumir equivalência por nome:

| Versão remota aplicada | Nome |
|---|---|
| `20260926011402` | `remove_redundant_service_role_rls_policies` (primeiro dos dois registros) |
| `20260926011531` | `harden_analytics_ingest_abuse_controls` |
| `20260926012414` | `consolidate_browser_rls_policies` |
| `20260926012944` | `harden_public_security_definer_rpc_runtime` |
| `20260926015559` | `harden_authenticated_security_definer_rpc_timeouts` |
| `20260926020539` | `close_direct_profile_delete_authority` |
| `20261006055146` | `pause_community_direct_messaging_rpc_client_grants` |

### Mapa integral de correspondência por nome, sem alterar histórico

Cada linha representa uma **migração distinta registrada na produção**,
não uma migração que tenha sido reparada ou reaplicada. O par local é somente
o arquivo da `main` com nome coincidente; não é certificação de equivalência
temporal. Classes: **exato** = mesmo corpo SQL, **whitespace** = igualdade
após aparar apenas whitespace final, **lexical** = texto diferente com
sequência de tokens equivalentes segundo o teste complementar descrito a
seguir (transações ainda exigem revisão).

| ID registrado no Supabase | ID do arquivo na `main` | Classe |
|---|---|---|
| `20260926005921` | `20260926004700` | whitespace |
| `20260926011402` | `20260926011200` | lexical |
| `20260926011531` | `20260926011000` | lexical |
| `20260926012211` | `20260926011200` | whitespace |
| `20260926012259` | `20260926011800` | whitespace |
| `20260926012414` | `20260926012500` | lexical |
| `20260926012944` | `20260926013000` | lexical |
| `20260926015559` | `20260926014500` | lexical |
| `20260926020539` | `20260926020500` | lexical |
| `20260926021216` | `20260926021500` | whitespace |
| `20260926021526` | `20260926021000` | exato |
| `20260926022700` | `20260926023000` | exato |
| `20260926023649` | `20260926024500` | exato |
| `20260926025016` | `20260926025137` | whitespace |
| `20260926025922` | `20260926030000` | whitespace |
| `20260926031046` | `20260926030330` | whitespace |
| `20260926100452` | `20260926025000` | whitespace |
| `20260926100507` | `20260926033000` | whitespace |
| `20260926100606` | `20260926095000` | whitespace |
| `20260926110547` | `20260926104500` | whitespace |
| `20261005134637` | `20261005132500` | whitespace |
| `20261005221222` | `20261005225000` | whitespace |
| `20261006043357` | `20261006050045` | whitespace |
| `20261006055146` | `20261006054500` | lexical |

**Atenção:** `20260926011402` e `20260926012211` são
duas execuções remotas com o mesmo nome, mas com corpos de tamanhos e
conteúdos diferentes, comparadas com um único arquivo local
`20260926011200`. Não criar alias duplo nem marcar automaticamente
ambas como uma única execução. A restauração histórica precisa
preservar as duas sequências executadas e a ordem real.

### Inversões de ordem: timestamp não é apenas metadado

Comparação read-only da ordem das 24 versões remotas sem ID correspondente
com as versões locais de mesmo nome identificou **cinco pares com ordem
relativa invertida** e **uma colisão**: duas execuções remotas distintas
mapeiam para um único arquivo local. Essas observações são independentes
da equivalência lexical do SQL:

| Execuções em ordem remota | Arquivos em ordem local contrária |
|---|---|
| `20260926011402` → `20260926011531` | `20260926011200` → `20260926011000` |
| `20260926021216` → `20260926021526` | `20260926021500` → `20260926021000` |
| `20260926025016` → `20260926100452` | `20260926025137` → `20260926025000` |
| `20260926025922` → `20260926100452` | `20260926030000` → `20260926025000` |
| `20260926031046` → `20260926100452` | `20260926030330` → `20260926025000` |

A sexta ocorrência é a **colisão**, não uma sexta inversão: as
execuções remotas `20260926011402` e `20260926012211` possuem
corpos SQL distintos e o mesmo nome, mas ambos correspondem por nome ao
arquivo local `20260926011200`. Não reduzir duas execuções históricas a
uma versão.

**Consequência:** trocar apenas os prefixes timestamp da fonte para
"igualar" o histórico remoto pode alterar a ordem de execução das DDLs
em instalações novas, afetando dependências, segurança e atomicidade.
A resolução definitiva precisa preservar ambos os fatos: o que foi
executado no banco canônico e uma sequência reprodutível para bancos
limpos. Testar replay integral em PostgreSQL isolado antes de alterar
a autoridade de migrations; não reescrever `schema_migrations` para
ocultar inversões.

### Refinamento lexical dos sete pares com diferença textual

A comparação adicional tokenizou o corpo SQL registrado remotamente e o arquivo
homônimo do source, preservando literais, identificadores e operadores. A
normalização ignora **apenas comentários e espaços externos aos literais**;
em quatro casos, foi testada separadamente a retirada de `BEGIN;` e
`COMMIT;` explícitos do source, mantendo todos os demais tokens e a ordem
de execução. **Resultado: nenhuma diferença de tokens de comandos
restante foi encontrada nesses sete pares.**

| Classificação léxica | Versões remotas |
|---|---|
| Mesma sequência de tokens sem retirar `BEGIN/COMMIT` (3) | `20260926011531` analytics; `20260926015559` timeouts; `20260926020539` profile delete |
| Mesmos tokens após retirar apenas o par explícito `BEGIN/COMMIT` (4) | `20260926011402` service-role policies; `20260926012414` browser RLS; `20260926012944` RPC timeout; `20261006055146` community direct messages |

Em `20260926012414`, o `COMMIT;` explícito do source ocorre
**antes de `NOTIFY pgrst, 'reload schema'`**; os tokens restantes e sua
ordem coincidem com a versão remota. A versão remota adicional
`20260926012211`, com o mesmo nome de `20260926011402`, permanece
**outra execução histórica** e não deve ser descartada ao reconciliar.

Esta é uma **prova lexical do corpo**, não uma certificação de equivalência
de transação, search_path, dependências, ordem histórica ou efeitos em
dados. Os limites `BEGIN/COMMIT` podem mudar atomicidade; a reconciliação
requer validação em PostgreSQL isolado, sem `migration repair` automático.

Três arquivos `main` sem nome correspondente no histórico remoto e que
**não devem ser implicitamente classificados como seguros para aplicação**:

- `20260921224500_project_business_search_coordinates_from_address.sql`
- `20260927170000_territory_first_public_snapshot_urls.sql`
- `20261002175500_harden_professional_trust_reputation_search_path.sql`

O workflow histórico `.github/workflows/supabase-main-db-push.yml`
admitia exatamente cinco versões `20260821001800`, `20260821002600`,
`20260821011000`, `20260821022500`, `20260821024000`,
**que não aparecem nem nos arquivos atuais da `main`, nem no histórico
remoto**. Isso prova que o gate antigo já estava desatualizado antes das
PRs Address.

## Verificação suplementar do SQL com versão já correspondente

A auditoria por versão também cruzou os **682 identificadores coincidentes**
com o hash Git dos arquivos na `main` e o corpo disponível na coluna
`schema_migrations.statements` (somente leitura).

**Esta comparação NÃO demonstra divergência em 476 scripts.** O Supabase
frequentemente registra `statements` como um vetor de comandos, e o texto
reconstituído por `array_to_string` não é uma cópia fiel do arquivo-fonte:
foram **316 migrações de múltiplos elementos**, sem comparação byte-a-byte
conclusiva por concatenação. Nas **366 migrations com um único elemento**,
229 foram reconhecidas diretamente por SHA de arquivo ou variações apenas
de quebra de linha nas extremidades; **137 exigem análise adicional**.
A amostragem confirmou variações de linha inicial e comentários/espaçamento
mesmo com IDs coincidentes. Isso **não prova 137 diferenças de comandos SQL**.

Não classificar diferenças de hash causadas por reconstrução de
`statements` como incompatibilidade sem reconstituir a representação
original ou comparar comandos com parser SQL validado. A verificação
operacional de deployment continua baseada primeiro na diferença de versões
e no conjunto de arquivos autorizados; a integridade de conteúdo histórico
requer auditoria independente antes de qualquer reparo.

## Estado efetivo das três migrations sem versão remota

Inspeção **somente leitura** do catálogo PostgreSQL, sem expor endereços
individuais nem assumir que igualdade de objeto comprova execução histórica:

| Migração local sem registro | Evidência no banco canônico | Tratamento seguro |
|---|---|---|
| `20260921224500_project_business_search_coordinates_from_address` | `private.sync_public_business_search_row()` existe, mas `private.sync_public_business_search_address_coordinates()` e os dois gatilhos específicos em `addresses` não existem. Entre **15 Business públicos ativos com Address**, são **7 com coordenadas**, com **zero divergências atuais** entre `public_business_search` e `addresses` | A igualdade atual **não garante sincronismo após futuras edições**; avaliar owner/trigger existente e dependências com #649. Não executar o backfill histórico sem homologação |
| `20260927170000_territory_first_public_snapshot_urls` | `get_public_business_snapshot_by_slug(text,text,text,text)` e `get_public_gastronomy_snapshot_by_slug(text,text,text,text)` já existem, com `SECURITY INVOKER`, callable por `anon`, URL canônica territorial e campos de endereço físico no corpo SQL | Auditar a superfície de retorno com RLS vigente e após #657; distinguir dados de empresas publicados de informação residencial privada. Não inferir versão aplicada só por assinatura existente |
| `20261002175500_harden_professional_trust_reputation_search_path` | `get_professional_trust_reputation(uuid)` permanece `SECURITY DEFINER`, com `search_path=public, private, pg_temp`, e concessão `EXECUTE` a `anon`, diferente de `SET search_path = ''` exigido pelo arquivo local | Endurecimento **ainda não demonstrado em produção**. Inspecionar corpo e referências antes de nova migration versionada; jamais fazer ALTER isolado no banco |

**Interdependência de privacidade:** #657 retira a política RLS de acesso
anônimo a `addresses`. Qualquer RPC pública `SECURITY INVOKER`
que consulta diretamente essa tabela pode passar a produzir coordenadas ou
campos físicos nulos. Isso pode ser correto por privacidade, mas deve ser
testado como contrato da página pública, especialmente Business e
Gastronomia, sem relaxar RLS para preservar um formato legado.

## Impacto de Address #657 nas RPCs públicas ativas

Leitura **somente de metadados** no Supabase canônico confirmou que
`get_public_business_snapshot_by_slug(text,text,text,text)` e
`get_public_gastronomy_snapshot_by_slug(text,text,text,text)` são
`SECURITY INVOKER` e executáveis por `anon`. As duas funções
consultam `public.public_business_search` mas ainda fazem
`LEFT JOIN addresses a ON a.id = bd.address_id`, selecionando
`street`, `number`, `complement`, `postal_code`, `latitude` e
`longitude` da **tabela privada**. Confirmado no catálogo:
`anon` tem GRANT técnico SELECT em `addresses` e ainda existe a policy
`Addresses public verified read` (antes da migração #657).

**Efeito esperado da #657:** o GRANT é mantido para compatibilidade de
relacionamentos, mas a policy pública desaparece; portanto, o `LEFT JOIN`
privado deixa de produzir valores de endereço físico para `anon`. A
função permanece executável e a busca via `public_business_search` ainda
pode trazer a identidade comercial, mas objetos `address` no JSON legado
podem passar a conter valores `null`. Isso é uma consequência
de segurança, não autorização para reabrir a tabela física.

Os `latitude`/`longitude` comerciais de
`public.public_business_search` são o SSOT já publicado para Business
ativo e estão presentes como colunas distintas. Uma eventual correção
dos snapshots deve ocorrer **no owner dos RPCs públicos** e preservar o
schema JSON sem incorporar endereço residencial: contrato explícito para
geolocalização comercial e campos físicos somente quando houver regra de
publicação aprovada. `metadata->>'business_address'` é outra superfície
de saída existente que exige auditoria de dados publicados, não confiança
implícita na verificação residencial.

**Gates pré-implantação:** além dos testes PostgreSQL/PostgREST de #657,
homologar no ambiente Supabase/Auth do release a busca por slug
Business/Gastronomia com `anon`, owner e terceiro, validando JSON
institucional, mapa e SEO. Verificar que nenhum endereço de terceiro
é exposto e que estabelecimentos públicos ainda resolvem. Não editar
RPCs aplicadas historicamente nem mover rotas de módulos pausados nesta
PR de lineage. Vincular a #657/#621/#660, sem criar outro deploy.

## Efeito no MVP

- **PR #658** — migração `20261008215900`, escrita trusted, 7/7 CI
  aprovados no último HEAD auditado.
- **PR #657** — migração `20261008220000`, leitura privada/projeção pública,
  7/7 CI aprovados no último HEAD auditado.
- Essas duas migrações **não foram aplicadas à produção**. Ainda existem
  grants permissivos de verificação; o histórico divergente bloqueia um
  `db push` profissional mesmo após merges.
- **PR #621** (release candidate), issues #305 (Data API), #445 (Vercel)
  e #649 (transação Business/Address) mantêm seus gates independentes.

## Correção segura, sem legado funcional e com SSOT

1. **Preservar o histórico de produção como evidência de execução**, sem
   `migration repair`, inserção manual de linhas, `db reset`, `db pull`
   destrutivo, SQL reexecutado, ou aplicação automática de versões pendentes.
2. Para as 17 versões cujo conteúdo coincide (exato ou whitespace final),
   avaliar reconciliação do **nome/timestamp de fonte** com o identificador
   efetivamente registrado, verificando ordem de dependências e novos
   bancos do zero. Não editar SQL já executado só para adequar a um nome.
3. Para as sete versões com texto SQL divergente, recuperar o conteúdo histórico
   versionado e comparar comandos, efeitos e dependências; decidir caso a
   caso se houve somente formatação, comentários, transação explícita, correção
   posterior já aplicada ou delta que precisa de uma
   **nova migration específica**, com testes PostgreSQL reais. Jamais
   reexecutar a versão local antiga presumindo equivalência.
4. Auditar individualmente as três migrations ainda sem correspondente
   remoto. Verificar se dependências e efeitos foram incorporados por
   outra migração, não assumir que ficaram pendentes apenas porque falta
   a versão.
5. Reexecutar a auditoria de versões **na `main` remota atual** antes da
   implantação. O gate canônico deve falhar fechado para qualquer versão
   remota sem arquivo histórico ou versão local fora da allowlist revisada.
   `tools/ci/verify-supabase-migration-lineage.mjs` agora centraliza
   essa verificação, com fixtures de teste.
6. Só após reconciliação e staging Supabase/Auth, revisar a allowlist
   canônica e autorizar explicitamente a aplicação **na ordem real**
   `20261008215900` → `20261008220000`, mais provas RLS/HTTP e
   rollback/recovery planejados.

**A auditoria é somente leitura. Este checkpoint não declara release,
migração concluída, banco alterado ou desbloqueio dos issues existentes.**
