# G43 — Autoridade transacional territorial e lifecycle de grupos

Data: 2026-09-10

Implementation head consolidado antes da abertura deste checkpoint documental:
`41157b18f3d5e230fa5242385af0c35fe8a89ce9`.

## Objetivo

Fechar no source os defeitos estruturais de gestão territorial encontrados após
o G42, sem fabricar sucesso de runtime enquanto o Postgres remoto está
indisponível e sem invadir as branches reservadas de Mobilidade e identidade
visual.

O princípio deste checkpoint é:

`autoridade única -> transação única -> ACK correlacionado -> cutover provado -> retirar legado`

Não foi autorizado inverter essa ordem para simplificar o código.

## Atualização operacional — 2026-09-20

O estado de source deste checkpoint avançou desde o staging original:

- [x] `TerritorialGroupAdminService` chama somente o broker
  `territorial-group-admin-rpc` para `saveGroup` e `setStatus`;
- [x] criação/edição de grupo e substituição completa de memberships agora são
  um único comando transacional, e o cliente rejeita ACK inconsistente;
- [x] `TerritorialGroupService` e `TerritorialGroupRepositorySupabase` não
  expõem mais operações DML; permaneceram apenas leituras públicas e de
  inventário administrativo;
- [x] os callers de Admin foram migrados e os testes de autoridade/contrato
  passaram em 15/15;
- [x] o serviço usa `invokeSupabaseBroker`, o helper canônico de transporte,
  log e erro; `security:validate` passou sem finding novo;
- [x] a consulta read-only ao projeto Supabase confirmou
  `territorial-group-admin-rpc` como `ACTIVE`, versão 1 e `verify_jwt=true`, e
  a migration G43 phase 1 no ledger remoto;
- [ ] ainda falta certificar o bundle hospedado, smoke admin AAL2 e a promoção
  da phase 2 que revoga DML autenticado no banco. Nenhuma escrita remota foi
  executada neste ciclo.

As frases abaixo que descrevem o frontend ainda usando o writer histórico são o
registro do estado anterior a este update; não representam mais o source atual.

## G42 — cascata de Location corrigida no source

O defeito G42 era real: o caminho anterior de visibilidade podia atualizar o nó
e descendentes por operações separadas, deixando margem para mutação parcial.

O source preparado agora concentra a operação em
`public.territorial_update_location_visibility(...)`:

- `SECURITY INVOKER`;
- `EXECUTE` revogado de `PUBLIC`, `anon` e `authenticated`;
- `EXECUTE` concedido somente a `service_role`;
- Edge autenticada continua responsável por `requireAdmin` + MFA/AAL2 e injeta
  o ator derivado do JWT porque a própria operação G42 persiste esse ator;
- `is_selector_active=false` atualiza raiz + todos os descendentes;
- reativação da raiz não força descendentes a `true`;
- landing/navigation não fazem cascata;
- o conjunto de descendentes reutiliza o prefixo indexado de `geographic_path`
  já comprovado no G5, sem reintroduzir CTE recursiva concorrente;
- a transação bloqueia escrita estrutural concorrente enquanto o escopo é
  atualizado;
- o ACK contém `location`, `affectedCount` e `cascaded` e é validado pelo Edge.

Também foi removido `auth.role()` do command novo. O boundary SQL é o ACL da
função + `SECURITY INVOKER`; a autoridade de usuário pertence ao Edge. O ratchet
G42 impede retorno desse padrão.

Migration ainda pendente:

`docs/09-reference/migrations-pending/20260910214500_transactional_location_visibility_cascade_g42.sql`

## G43 — defeitos encontrados em grupos territoriais

A inspeção do projeto real encontrou quatro problemas relevantes:

1. `replaceMembers()` do repository histórico executa `DELETE` e depois
   `INSERT` em requests separados;
2. o formulário de edição fazia `updateGroup()` e depois `replaceMembers()`,
   portanto nome/slug poderiam persistir mesmo se a troca de membros falhasse;
3. status de grupo ainda era escrito pelo browser sob policy administrativa,
   fora do gate `requireAdmin`/AAL2 usado pelos brokers novos;
4. o formulário lia `group.parent_id`, embora o contrato real seja
   `group.anchor_city_id`, o que podia abrir uma edição sem cidade âncora válida.

Além disso, o inventário administrativo usava historicamente uma leitura
active-only. Um grupo desativado podia desaparecer da própria gestão e ficar
sem caminho normal de reativação.

## Correções de source aplicadas

### Inventário administrativo separado e em lote

A leitura agora distingue explicitamente:

- `listAll()` → grupos ativos para produto/público;
- `listAllForAdmin()` / `listAdminTerritorialGroups()` → ativos + inativos sob
  a autoridade administrativa existente.

A correção preserva o contrato público e devolve ao Admin a capacidade de
reativar um grupo inativo.

O repository também deixou de executar `1 + N` consultas para montar o
inventário. Grupos são buscados uma vez e todas as memberships correspondentes
são carregadas em lote por `group_id`, depois agrupadas em memória.

### Formulário de edição

`TerritorialGroupForm` agora:

- consome `anchor_city_id` real;
- reutiliza memberships já trazidas pelo inventário em vez de uma segunda
  consulta redundante;
- bloqueia mudança de cidade âncora em grupo existente;
- mantém a seleção de bairros editável;
- informa corretamente que grupo novo nasce `inactive`;
- no estado original deste checkpoint, não havia migração de escrita para o
  broker G43; o source atual já foi migrado, mas o runtime hospedado ainda não
  foi certificado.

`DistrictSelector` ganhou `anchorCityLocked`, sem desabilitar a edição dos
membros, e seu efeito de reconciliação deixou de depender de supressão global de
`exhaustive-deps`.

### Commands transacionais G43

Phase 1 preparada em:

`docs/09-reference/migrations-pending/20260910220500_create_territorial_group_admin_commands_g43.sql`

Ela cria:

- `territorial_admin_save_group(...)`;
- `territorial_admin_set_group_status(...)`.

`saveGroup` concentra criação/edição e substituição completa de memberships na
mesma transação. O command valida slug, nome, cidade âncora, tipo/status/escopo
dos membros e preserva cidade âncora imutável em edição.

A proteção de concorrência segue ordem estável:

`group row -> anchor city -> member locations ordenadas por UUID -> membership table`

Os membros são bloqueados com `FOR SHARE` antes da validação e o número de rows
bloqueados é comparado ao conjunto solicitado. `territorial_group_members` é
serializada com `SHARE ROW EXCLUSIVE` durante a substituição e também durante a
validação de ativação. Isso impede interleaving dentro do command enquanto a
fase de compatibilidade ainda coexiste com o writer histórico.

Os dois commands são `SECURITY INVOKER`, executáveis apenas por `service_role`.
Nenhum deles usa `auth.role()` como autoridade.

O primeiro staging carregava um `p_actor_user_id` sem efeito material dentro dos
commands. Isso foi removido no follow-up: um processo que já possui
`service_role` poderia forjar esse UUID e ele não adicionava autorização nem
auditoria real. A identidade confiável permanece exclusivamente no gateway
`requireAdmin`, onde `auth.userId` alimenta o audit.

### Broker AAL2

Foi preparado:

`supabase/functions/territorial-group-admin-rpc/index.ts`

O broker:

- possui `verify_jwt=true` em `supabase/config.toml`;
- usa `requireAdmin`, portanto herda MFA/AAL2 canônico;
- aceita somente `saveGroup` e `setStatus`;
- valida UUIDs, slug, limites e payload;
- registra o ator confiável pelo `auth.userId` resolvido pelo gateway;
- não envia `actor_user_id` cosmético aos commands SQL;
- mapeia erros conhecidos sem expor stack/infra;
- exige ACK correlacionado antes de retornar sucesso;
- está classificado como `Critical` na policy de Edge Functions.

O ACK de `saveGroup` precisa corresponder a ID, slug, nome, descrição, cidade,
conjunto de membros, contagem e estado de criação. O ACK de `setStatus` precisa
corresponder ao mesmo ID e status solicitados. HTTP 2xx incompatível é falha.

No snapshot original deste checkpoint, o broker ainda não estava implantado. A
promoção/runtime atual deve ser confirmada por inventário e smoke no mesmo
ambiente antes de considerar o cutover certificado.

### Phase 2 — browser DML lock

Migration separada:

`docs/09-reference/migrations-pending/20260910221500_lock_territorial_group_writes_to_broker_g43.sql`

Ela só pode ser promovida depois de:

1. phase 1 aplicada e pós-condições aprovadas;
2. `territorial-group-admin-rpc` ACTIVE com `verify_jwt=true` e source exato;
3. smoke de admin AAL2 para `saveGroup` e `setStatus`;
4. frontend ativo migrado para o broker e certificado.

Só então o cutover remove `INSERT/UPDATE/DELETE` de `authenticated` em
`territorial_groups` e `territorial_group_members`. SELECT público ativo-only e
SELECT administrativo explícito permanecem.

Até lá, os writers históricos permanecem como compatibilidade do frontend LIVE.
Removê-los antes do gate quebraria a capacidade existente e violaria a regra de
não apagar feature para facilitar migração.

## Ratchets

Atualizados/criados:

- `tests/security/territorial-visibility-client-contract-g42.test.ts`;
- `tests/security/territorial-group-admin-authority-g43.test.ts`.

Os testes fixam no source:

- cascade indexada transacional;
- ACL `service_role`-only dos commands novos;
- ausência de `auth.role()` nos novos boundaries;
- ausência de `p_actor_user_id` decorativo nos commands G43;
- locks de concorrência G43;
- ACK correlacionado no broker;
- separação entre inventário público e administrativo;
- leitura de memberships em lote, sem N+1;
- `anchor_city_id` real e imutabilidade da cidade âncora na UI;
- phase 2 obrigatoriamente separada/gated.

## Estado remoto observado

Projeto Supabase: `xhdowzacfujckjelqhtd`.

Em 2026-09-10:

- `execute_sql` continuou falhando com
  `Connection terminated due to connection timeout`;
- por isso nenhuma migration G42/G43 foi aplicada;
- `list_edge_functions` respondeu normalmente, mas o catálogo não continha:
  - `territorial-get-tree`;
  - `territorial-update-group-visibility`;
  - `territorial-update-location-visibility`;
  - `territorial-group-admin-rpc`.

Essa diferença deve ser tratada como drift/runtime ausente, não como autorização
para criar fallback browser ou marcar o source como LIVE.

## O que NÃO foi feito no snapshot de 2026-09-10

- nenhuma migration pending foi movida para `supabase/migrations`;
- nenhuma DDL foi aplicada sem preflight;
- nenhuma Edge territorial nova foi implantada;
- o frontend de escrita ainda não era apontado ao broker inexistente no remoto;
- a phase 2 não foi aplicada;
- `module/mobilidade` e `codex/identidade-visual-achegue-se` não foram tocadas;
- nenhum workflow pesado foi disparado para contornar a indisponibilidade de
  execução já conhecida.

## Próximo gate

Quando o Postgres remoto voltar:

1. preflight read-only de G42/G43 e confirmação de grants/policies/schema reais;
2. promover G42 e provar a cascata de Location;
3. promover G43 phase 1;
4. implantar os gateways territoriais necessários com `verify_jwt=true` e source
   exato;
5. executar smokes admin AAL2 positivos e negativos;
6. certificar no hosted o source que já aponta o frontend de group lifecycle para
   `territorial-group-admin-rpc`, sem manter writer paralelo;
7. executar smoke positivo e negativo com admin AAL2 no mesmo SHA/descendente;
8. aplicar G43 phase 2 e remover DML browser no banco;
9. confirmar no runtime que o repository/service não possui mais caminho de
   compatibilidade, mantendo apenas os owners de leitura.

G43 está **SOURCE-CUTOVER-READY / RUNTIME-CERTIFICATION-PENDING**. Não
confundir os dois estados.
