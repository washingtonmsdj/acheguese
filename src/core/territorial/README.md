# Core Territorial

**Status:** G43 — SOURCE DE AUTORIDADE PREPARADO; CUTOVER REMOTO PENDENTE  
**Owner:** `src/core/territorial`  
**Escopo:** grupos territoriais, memberships, disponibilidade/rollout de grupo e gestão territorial composta.

## Fronteira canônica

- `core/location` → geografia oficial e estrutura de `locations`;
- `core/territorial` → `territorial_groups`, `territorial_group_members`, resolução de grupos, memberships e visibilidade territorial;
- `core/coverage` → cobertura de entidades;
- `core/rollout` → rollout individual por localização;
- `core/geospatial` → boundary/espacialidade especializada da geografia.

Grupos territoriais **não são locations fake**. Eles agregam locations reais sem alterar a árvore geográfica.

## Contracts e persistência

Contracts canônicos vivem em:

- `src/core/territorial/contracts/index.ts`;
- `src/core/territorial/repositories/ITerritorialGroupRepository.ts`;
- `src/core/territorial/repositories/TerritorialGroupRepositorySupabase.ts`;
- `src/core/territorial/repositories/createTerritorialGroupRepository.ts`.

A facade pública é `@/core/territorial`.

`TerritorialGroupService` permanece como owner de domínio e caminho de compatibilidade enquanto o cutover G43 não é certificado. Consumers novos não devem importar persistência interna nem paths históricos de `core/location`.

A leitura foi separada por intenção:

- `listAll()` → inventário de produto/público, somente grupos `active`;
- `listAllForAdmin()` / `listAdminTerritorialGroups()` → inventário administrativo, incluindo grupos inativos sob RLS administrativo.

O repository busca memberships desse inventário em lote, evitando o antigo padrão `1 + N` de consultas por grupo. Isso impede que um grupo desapareça da própria tela de gestão depois de ser desativado sem ampliar o inventário público.

## Backend gateways

As Edge Functions territoriais são gateways backend explícitos, não segundos SSOTs:

- `territorial-get-tree` → read model administrativo;
- `territorial-update-group-visibility` → atualização protegida de flags de visibilidade em metadata;
- `territorial-update-location-visibility` → gateway autenticado de visibilidade de locations; o source G42 chama a RPC transacional `territorial_update_location_visibility`;
- `territorial-group-admin-rpc` → gateway G43 de lifecycle administrativo de grupos (`saveGroup`, `setStatus`), com `verify_jwt=true` e `requireAdmin`, portanto sujeito à política MFA/AAL2 canônica.

O catálogo remoto observado em 2026-09-10 **não continha** os quatro gateways territoriais acima. Eles existem no source/configuração, mas não podem ser tratados como runtime ativo até deploy e smoke no ambiente alvo.

### Cascata de Location — G42

A semântica canônica é deliberadamente assimétrica:

- qualquer flag canônica atualiza o nó solicitado;
- `is_selector_active=false` também desativa **todos os descendentes**, em uma única transação;
- `is_selector_active=true` reativa somente o nó solicitado e não força descendentes a `true`;
- `is_landing_enabled` e `is_navigable` não fazem cascata.

O SQL preparado está em
`docs/09-reference/migrations-pending/20260910214500_transactional_location_visibility_cascade_g42.sql`.

Ele cria uma RPC `SECURITY INVOKER` executável somente por `service_role` e reutiliza o contrato de escala comprovado no G5: descendentes são alcançados pelo prefixo indexado de `geographic_path` (`raiz/%`), apoiado por `idx_locations_geographic_path_pattern`, em uma única operação SQL. A RPC serializa writes estruturais durante a mutação e devolve ACK correlacionado (`location`, `affectedCount`, `cascaded`). Não existe loop Edge nem uma segunda estratégia recursiva concorrente.

O SQL não usa `auth.role()` como boundary: `PUBLIC`, `anon` e `authenticated` não podem executar a função; a Edge autenticada é responsável pela autorização de usuário e injeta o ator verificado onde o ator é persistido pela própria operação G42.

**Não implantar a versão G42 de `territorial-update-location-visibility` antes de promover e provar essa migration no mesmo ambiente.** O Postgres remoto continuou encerrando o preflight por `connection timeout` em 2026-09-10.

### Administração de grupos — G43

O G43 corrige três problemas estruturais do caminho histórico:

1. edição de grupo e substituição de memberships eram duas operações browser separadas (`UPDATE` seguido de `DELETE/INSERT`);
2. ativação/desativação dependia do writer browser/RLS e não do gate administrativo MFA/AAL2;
3. o formulário de edição lia `parent_id` onde o contrato real usa `anchor_city_id`, podendo abrir a cidade âncora vazia e permitindo tentativa de mudança de uma relação que o domínio considera imutável.

A fase 1 está preparada em:

`docs/09-reference/migrations-pending/20260910220500_create_territorial_group_admin_commands_g43.sql`

Ela cria:

- `territorial_admin_save_group(...)` → cria/edita o grupo e substitui o conjunto completo de memberships na **mesma transação**;
- `territorial_admin_set_group_status(...)` → altera status sob lock e rejeita ativação de grupo vazio.

Os commands são `SECURITY INVOKER`, revogam `EXECUTE` de `PUBLIC/anon/authenticated` e concedem somente a `service_role`. Eles não aceitam `actor_user_id` decorativo: o ator confiável pertence ao gateway autenticado, que registra `auth.userId` no audit após `requireAdmin`/AAL2. Um processo que já possui `service_role` não ganha legitimidade adicional enviando um UUID de ator ao SQL.

O broker também exige ACK correlacionado: `saveGroup` precisa devolver o mesmo ID quando aplicável, slug, nome, descrição, cidade, conjunto de membros, contagem e estado de criação; `setStatus` precisa devolver o mesmo grupo e status. Um 2xx incompatível é tratado como falha.

Para evitar TOCTOU na própria transação, o `saveGroup` segue ordem de locks `grupo -> cidade âncora -> locations membros -> membership table`; os membros são bloqueados em ordem determinística de UUID antes da validação de tipo/status/parent. Durante a curta janela de compatibilidade, writes em `territorial_group_members` são serializados para impedir interleaving entre o command e o writer histórico.

A fase 2 está separada em:

`docs/09-reference/migrations-pending/20260910221500_lock_territorial_group_writes_to_broker_g43.sql`

Ela **não pode ser promovida antecipadamente**. Só depois de phase 1 + Edge ACTIVE + smoke admin AAL2 + frontend comprovadamente usando o broker, ela remove `INSERT/UPDATE/DELETE` de `authenticated` em `territorial_groups` e `territorial_group_members`, preservando SELECT público ativo-only e SELECT administrativo explícito.

Enquanto esse gate remoto não fecha, os métodos antigos de escrita do repository/service permanecem apenas como caminho de compatibilidade do frontend atual. Não criar um segundo writer nem remover o caminho ativo antes do cutover.

## Regras principais

- slug de grupo é único por cidade âncora;
- cidade âncora precisa ser `city` e é imutável depois da criação no lifecycle G43;
- membros precisam ser locality selecionável (`district`/`neighborhood` conforme contrato atual), estar ativos e pertencer diretamente à cidade âncora;
- membros inativos não entram em resolução ativa;
- grupo ativo não pode ficar vazio;
- visibilidade territorial é controlada pelos flags canônicos `is_selector_active`, `is_landing_enabled` e `is_navigable`;
- `territorial_groups` e `territorial_group_members` não podem ganhar implementação paralela em `core/location`.

## Compatibilidade histórica

Os antigos artefatos funcionais de grupos em `core/location` foram aposentados. Permanecem apenas bridges mínimos de repository, one-way para este owner, enquanto callers históricos são migrados gradualmente.

O validator `tools/architecture/validate-territory-ssot.ts` e os ratchets de segurança garantem:

- nenhum novo caller do repository legado;
- nenhuma implementação de grupo recriada em `core/location`;
- nenhum acesso direto às tabelas de grupo em `src` fora do owner;
- gateways backend explícitos e limitados por operação;
- stale allowlists falham;
- ownership de escrita de `locations` permanece separado por operação;
- o gateway G42 de Location não pode voltar a executar loop de writes em descendentes;
- G42/G43 não podem reintroduzir `auth.role()` como substituto de ACL/gateway;
- G43 não pode reintroduzir um `actor_user_id` SQL sem efeito como falsa boundary;
- G43 mantém group + memberships na mesma transação e serializa a validação/substituição;
- a cidade âncora real do grupo é `anchor_city_id` e o formulário de edição não pode tratá-la como `parent_id` nem permitir mutação;
- o inventário de memberships não pode regredir para uma leitura por grupo.

## Integração de Landing e routing

Landing, sitemap e selector continuam consumindo somente grupos ativos. A gestão administrativa usa inventário explícito que pode incluir inativos. O adapter `src/core/landing/services/territorialLanding.queries.ts` compõe dados territoriais sem recriar persistência de grupos em Landing.

## Estado do fechamento

A autoridade de **source** G42/G43 está preparada, mas o **runtime** ainda não está certificado.

### Para fechar G42

1. Postgres remoto responder;
2. executar preflight real;
3. promover `20260910214500_transactional_location_visibility_cascade_g42.sql`;
4. implantar `territorial-update-location-visibility` com `verify_jwt=true`;
5. smoke admin AAL2 confirmar raiz + todos descendentes ao desativar e não-cascata ao reativar.

### Para fechar G43

1. Postgres remoto responder e confirmar schema/grants reais;
2. promover a phase 1 `20260910220500_create_territorial_group_admin_commands_g43.sql`;
3. implantar `territorial-group-admin-rpc` com `verify_jwt=true` e source exato;
4. smoke admin AAL2 de criação, edição atômica, conflito de slug, membro inválido, ativação e rejeição de grupo vazio;
5. trocar o frontend ativo de create/update/status para o broker em um único cutover;
6. certificar o frontend no mesmo SHA/descendente;
7. somente então promover a phase 2 que revoga DML browser;
8. provar que `authenticated` mantém apenas os SELECTs previstos e que nenhum caller runtime depende do writer antigo.

## Referências

- `src/core/location/README.md`
- `src/core/territorial/TERRITORIAL_GROUPS_SEMANTICS.md`
- `docs/02-domain/GEOGRAPHIC_FOUNDATION.md`
- `docs/03-architecture/G5_LOCATION_DESCENDANTS_RPC_PERFORMANCE_2026-08-31.md`
- `docs/09-reference/migrations-pending/20260910214500_transactional_location_visibility_cascade_g42.sql`
- `docs/09-reference/migrations-pending/20260910220500_create_territorial_group_admin_commands_g43.sql`
- `docs/09-reference/migrations-pending/20260910221500_lock_territorial_group_writes_to_broker_g43.sql`
- `tools/architecture/validate-territory-ssot.ts`
- `tests/security/territorial-visibility-client-contract-g42.test.ts`
- `tests/security/territorial-group-admin-authority-g43.test.ts`
- `URGENTE_LEIA_PRIMEIRO_REORGANIZACAO_GLOBAL.md`
