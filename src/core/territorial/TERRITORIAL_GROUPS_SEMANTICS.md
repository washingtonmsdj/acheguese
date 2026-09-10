# Semântica formal — Grupos Territoriais

**Data base:** 2026-09-10  
**Versão:** 2.0.0  
**Status:** OFICIAL — source G43 preparado; cutover runtime pendente

## 1. Definição

Um **grupo territorial** é um agrupamento funcional, comunitário ou comercial de
localidades oficiais de uma mesma cidade.

Ele **não é**:

- território oficial;
- bairro artificial em `locations`;
- nível da hierarquia geográfica;
- substituto de `country/state/city/district/neighborhood`.

Ele **é**:

- entidade própria em `territorial_groups`;
- relação N:N com locations reais por `territorial_group_members`;
- agrupamento com slug, status e metadata próprios;
- sempre ancorado em uma cidade oficial por `anchor_city_id`.

## 2. Fronteira canônica

```text
locations                    -> geografia oficial
territorial_groups           -> agrupamentos territoriais
territorial_group_members    -> memberships grupo <-> location
```

É proibido representar grupo usando `locations.parent_id`. `parent_id` pertence
exclusivamente à hierarquia geográfica oficial.

Owner de domínio: `src/core/territorial`.

## 3. Membros permitidos

O contrato atual aceita localidades selecionáveis de tipo:

- `district`;
- `neighborhood`.

`city`, `state` e `country` não podem ser membros.

A função histórica `check_territorial_group_member()` foi reconciliada em
`20260530120000_ensure_complexo_nordeste_membership.sql` para aceitar
`district | neighborhood` e exigir que o `parent_id` do membro corresponda à
cidade âncora do grupo.

O command G43 reforça a mesma regra e também exige membro `active` no momento da
substituição do conjunto.

## 4. Cidade âncora

Todos os membros precisam pertencer diretamente à mesma cidade:

```text
territorial_groups.anchor_city_id = Salvador
member.parent_id                  = Salvador
```

No lifecycle administrativo G43, `anchor_city_id` é **imutável depois da
criação**. Editar um grupo não é uma operação de migração entre cidades.

Se futuramente existir uma necessidade real de mover um grupo entre cidades,
isso deve ganhar um command específico com invariantes próprios; não deve ser
implementado como UPDATE genérico.

## 5. Identidade e slug

O slug é único dentro da cidade âncora:

```sql
UNIQUE (slug, anchor_city_id)
```

Portanto, duas cidades podem ter o mesmo slug de grupo, mas uma cidade não pode
ter dois grupos com o mesmo slug.

## 6. Status e visibilidade

Estados canônicos:

```text
active
inactive
```

- `active` → pode participar das superfícies de produto, sujeito também aos
  flags de visibilidade aplicáveis;
- `inactive` → não deve aparecer como grupo público utilizável.

A leitura é separada por intenção:

- `TerritorialGroupService.listAllGroups()` / repository `listAll()` → somente
  grupos ativos;
- `listAdminTerritorialGroups()` / repository `listAllForAdmin()` → inventário
  administrativo, incluindo inativos quando a RLS administrativa autoriza.

Essa separação é obrigatória: desativar um grupo não pode fazê-lo desaparecer da
própria tela de administração, e inventário administrativo não pode ampliar a
superfície pública.

## 7. Membership

Chave lógica:

```sql
PRIMARY KEY (group_id, location_id)
```

Um mesmo membro não pode aparecer duas vezes no mesmo grupo.

Para lifecycle G43:

- IDs recebidos são deduplicados antes da persistência;
- todos precisam existir;
- todos precisam estar ativos;
- todos precisam ser `district | neighborhood`;
- todos precisam ter `parent_id = anchor_city_id`;
- grupo `active` precisa manter pelo menos um membro.

## 8. Administração — autoridade atual e cutover G43

### Runtime atual

Enquanto o G43 não for promovido no Supabase remoto, o frontend LIVE ainda pode
depender dos métodos de compatibilidade de `TerritorialGroupService` /
`TerritorialGroupRepositorySupabase`.

Esses métodos **não devem ser descritos como transacionais**. Em particular, o
writer histórico de substituição usa requests separados e existe apenas até o
cutover ser comprovado.

Não remover o caminho compatível antes de o broker novo estar LIVE; não criar um
terceiro writer para contornar o gate.

### Autoridade preparada — phase 1

Migration pending:

`docs/09-reference/migrations-pending/20260910220500_create_territorial_group_admin_commands_g43.sql`

Commands:

```text
territorial_admin_save_group
territorial_admin_set_group_status
```

`territorial_admin_save_group` é a futura autoridade de criação/edição:

- criação/edição do grupo e substituição do conjunto completo de memberships
  acontecem na mesma transação;
- grupo novo nasce `inactive`;
- cidade âncora é validada e bloqueada;
- em edição, a cidade âncora não pode mudar;
- locations membros são bloqueadas em ordem determinística antes da validação;
- membership DML é serializada durante a curta janela de compatibilidade;
- qualquer erro aborta toda a transação.

`territorial_admin_set_group_status`:

- bloqueia o grupo antes da transição;
- serializa a leitura do conjunto de memberships;
- rejeita `active` quando não há membros.

Os dois commands são `SECURITY INVOKER`. `EXECUTE` é revogado de `PUBLIC`,
`anon` e `authenticated` e concedido somente a `service_role`.

### Gateway administrativo

`territorial-group-admin-rpc` é o gateway G43 preparado:

- `verify_jwt=true`;
- `requireAdmin()`;
- MFA/AAL2 canônico;
- ator derivado da sessão validada;
- payload limitado e validado;
- ACK de `saveGroup` correlacionado a ID/slug/nome/description/cidade/members/
  contagem/criação;
- ACK de `setStatus` correlacionado ao mesmo grupo e status solicitado;
- 2xx incompatível é erro, não sucesso.

Ele não deve ser implantado antes de os commands existirem no mesmo ambiente.

### Lock final — phase 2

Migration pending:

`docs/09-reference/migrations-pending/20260910221500_lock_territorial_group_writes_to_broker_g43.sql`

Somente depois de phase 1 + Edge ACTIVE + smoke admin AAL2 + frontend migrado e
certificado, a phase 2 remove `INSERT/UPDATE/DELETE` de `authenticated` nas duas
tabelas de grupo.

SELECT público ativo-only e SELECT administrativo explícito são preservados.

## 9. Flags de visibilidade

Flags canônicos em metadata:

```text
is_selector_active
is_landing_enabled
is_navigable
```

Atualizações especializadas passam pelos gateways territoriais. Browser não
deve recriar lógica de metadata com read-modify-write paralelo.

A cascata de `locations` é uma autoridade distinta: G42 prepara
`territorial_update_location_visibility(...)`, que atualiza raiz + todos os
descendentes numa única transação quando `is_selector_active=false`.

## 10. Resolução de grupo

Para um grupo ativo, a resolução territorial expande o grupo para IDs de
locations membros ativos. Consumers aplicam esses IDs ao domínio que estiverem
consultando; não materializam uma location artificial para o grupo.

Exemplo conceitual:

```text
Complexo do Nordeste de Amaralina
  -> Nordeste de Amaralina
  -> Santa Cruz
  -> Chapada do Rio Vermelho
  -> Vale das Pedrinhas
```

O grupo continua sendo uma entidade composta. Cada membro continua sendo uma
location oficial independente.

## 11. Integração com rollout

`GroupAvailabilityService` e `TerritorialRolloutService` resolvem grupos para
locations reais. O rollout continua pertencendo ao owner de rollout, não à
tabela de grupos.

Um grupo não cria um novo nível de herança geográfica.

## 12. UI administrativa

A UI administrativa **existe** e não é pendência futura.

Contrato atual corrigido:

- lista ativos + inativos para administração;
- criação exige cidade e pelo menos um bairro no formulário atual;
- edição usa `anchor_city_id` real;
- cidade âncora de grupo existente fica bloqueada;
- memberships já presentes no inventário são reutilizadas, sem segunda leitura
  redundante;
- inventário de memberships é buscado em lote, evitando uma consulta por grupo.

O frontend ainda não deve apontar os writes para `territorial-group-admin-rpc`
enquanto o runtime remoto não possuir phase 1 + Edge comprovados.

## 13. Invariantes que não podem regredir

1. grupo nunca vira location fake;
2. `parent_id` nunca representa membership de grupo;
3. público recebe somente grupos ativos;
4. Admin continua capaz de ver/reativar grupos inativos;
5. cidade âncora existente é imutável no lifecycle G43;
6. grupo ativo não fica vazio pelo command canônico;
7. criação/edição + memberships devem convergir para uma transação única;
8. commands privilegiados não são executáveis por `anon/authenticated`;
9. autorização de usuário administrativo pertence ao gateway MFA/AAL2;
10. `auth.role()` não substitui ACL explícito dos commands G42/G43;
11. nenhum loop Edge/browser substitui atomicidade do banco;
12. writer histórico só pode ser removido depois do cutover provado.

## 14. Estado operacional em 2026-09-10

Source:

- G42 cascade de Location preparada;
- G43 commands de grupo preparados;
- `territorial-group-admin-rpc` preparado e governado;
- formulário/inventário administrativo corrigidos;
- ratchets G42/G43 presentes.

Runtime Supabase:

- Postgres ainda retorna `connection timeout` nos preflights;
- nenhuma migration pending G42/G43 foi promovida;
- catálogo remoto não apresenta `territorial-get-tree`,
  `territorial-update-group-visibility`, `territorial-update-location-visibility`
  nem `territorial-group-admin-rpc`.

Estado correto: **SOURCE-READY / RUNTIME-PENDING**.

## Referências

- `src/core/territorial/README.md`
- `docs/08-roadmap/checkpoints/2026-09-10-g43-territorial-admin-authority.md`
- `supabase/migrations/20260530120000_ensure_complexo_nordeste_membership.sql`
- `tests/security/territorial-group-admin-authority-g43.test.ts`
- `tests/security/territorial-visibility-client-contract-g42.test.ts`
