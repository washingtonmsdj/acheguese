# Address SSOT — Sistema de Endereços

## Arquitetura

```text
Component → Hook → Address/Residence services → Repository → Supabase
                    ↓
          LocationGeocodingService
                    ↓
       core/geocoding + locations SSOT
```

### Owners atuais

| Owner | Responsabilidade |
|---|---|
| `core/address/types` | Tipos canônicos de endereço postal |
| `core/address/services/AddressService` | Persistência/lifecycle de endereços |
| `core/address/services/ResidentAddressService` | Orquestração do cadastro residencial |
| `core/address/services/AddressPrivacyGuard` | Projeção/mascaramento para exibição pública |
| `core/address/hooks/useResidentAddress` | Estado do formulário e integração com os owners |
| `core/location/services/LocationGeocodingService` | CEP/geocoding reconciliados com `locations` |
| `core/geocoding` | Providers e transformação geográfica de baixo nível |
| `core/residence` | Vínculo usuário ↔ endereço ↔ território |
| `core/verification` | Verificação documental |

`src/core/address/services/CepService.ts` não existe mais e não deve ser
recriado. Lookup postal usado por fluxos territoriais passa por
`LocationGeocodingService`, que combina provider de geocoding com o SSOT de
`locations`.

## Fluxo de cadastro de morador

1. O usuário informa o CEP.
2. `useResidentAddress` consulta `LocationGeocodingService.lookupPostalCode()`.
3. O retorno traz dados do provider e reconciliação territorial canônica.
4. O usuário completa número/complemento quando necessário.
5. `ResidentAddressService.registerResidentAddress()` valida e normaliza o
   payload de domínio.
6. `AddressService` persiste o endereço sob as regras do domínio Address.
7. `ResidenceService` mantém o vínculo residencial/territorial.
8. Quando exigido, o fluxo de Verification registra a comprovação vinculada ao
   endereço.

## Privacidade

**Endereço residencial completo não é dado público.**

- componentes públicos não consomem a linha privada de `addresses`;
- use projeção pública/guard de privacidade do domínio;
- rua, número, complemento e CEP não devem ser expostos por superfícies
  públicas apenas porque a entidade possui localização;
- `location_id`/território público não equivale a autorização para ler o
  endereço privado.

## Autoridade de leitura pública versus privada

A tabela `public.addresses` armazena dados físicos e privados de endereço,
incluindo rua, número, complemento, CEP, proprietário e metadados.
A autorização de leitura/gravação da linha detalhada pertence à política
`Users manage own addresses`, vinculada à identidade autenticada.

**PostgREST / FK de Business e Mapa:** os clientes públicos ainda usam
`addresses!address_id` como relacionamento de leitura. Por isso, a permissão
SQL `SELECT` do papel `anon` na tabela física deve permanecer para que
a consulta relacionada não falhe, mas **não existe política RLS de leitura
para `anon`**: toda consulta anônima à tabela física devolve zero linhas,
inclusive em endereços verificados. Não adicionar política pública para
"consertar" uma resposta nula; a única leitura detalhada autorizada por RLS
é a do proprietário autenticado. O teste de regressão protege essa distinção.

`public.addresses_public` é o **read model canônico existente**, sem copiar
ou persistir endereços: expõe somente `id`, `location_id`, `address_type`,
`latitude`, `longitude`, `precision`, `is_verified`,
`verification_status` e `created_at`, restritos a endereços nos quais
`is_verified = true` **e** `verification_status = verified` concordam.
Um estado contraditório (somente flag ou somente status) não é prova
suficiente para liberar coordenadas; a pendência exige reconciliação pelo
owner Verification, sem exposição automática.
Não inclui rua, número, complemento, CEP ou `owner_user_id`.
A segurança dessa projeção é obrigatória no **PostgreSQL**, independentemente
do DTO `AddressPrivacyGuard.toPublic()` usado na interface.
`ResidentAddressService.toPublicDTO()` delega ao mesmo guard canônico, sem
segunda implementação do filtro.

**Exceção explícita e mínima:** como a view pública deve servir usuários
anônimos e autenticados sem lhes conceder permissão à tabela privada, essa
view específica usa o dono `postgres` e
`security_invoker=false, security_barrier=true`. Essa exceção só é segura
porque a projeção tem lista fixa de colunas permitidas, filtro SQL de
verificação e privilégio de **somente leitura**; não deve ser reproduzida
genericamente em outras views. `public.public_professional_search` preserva
`security_invoker=true` e consulta as coordenadas via
`public.addresses_public`, não diretamente na tabela privada.

**Sequência obrigatória de segurança:** a migração
`20261008215900_restrict_address_verification_mutations.sql` (PR #658)
precisa estar aplicada **antes** da projeção pública
`20261008220000_enforce_address_private_read_projection.sql` (PR #657).
O preflight da segunda migração confirma as restrições de escrita e os
triggers necessários e aborta se a primeira ainda não foi aplicada.
Ambas dependem de homologação conjunta; nunca ativar a projeção sem a
autoridade exclusiva de Verification no servidor.

A migração versionada
`20261008220000_enforce_address_private_read_projection.sql` registra
pré-condições contra drift, mudança transacional e pós-condições de RLS/ACL.
A mudança só é válida para produção após aplicação controlada, verificação
real de `anon`/usuário proprietário/terceiro e smoke das superfícies
públicas. Um merge por si só **não** prova que o banco já aplica a regra.

## Homologação conjunta de RLS e prova de endereço (pré-implantação)

O par de migrações versionadas é **indivisível para certificação**:
`20261008215900_restrict_address_verification_mutations.sql` (escrita)
deve ser aplicado antes de
`20261008220000_enforce_address_private_read_projection.sql` (leitura).
Os preflights abortam em caso de drift ou sequência errada.

**Ambiente:** executar primeiro em PostgreSQL/Supabase de desenvolvimento
isolado, sem copiar PII ou usar contas reais. A CI estática não equivale à
execução SQL nem à autorização do fluxo HTTP PostgREST.

**Certificação técnica já automatizada (08/10/2026):**
- PR #658 usa `.github/workflows/address-verification-postgres-integration.yml`
  para aplicar a migração de escrita em PostgreSQL 17 com RLS, usuário
  próprio/terceiro, revogação de prova e tentativa de escalada por RPC.
- PR #657 usa
  `.github/workflows/address-public-projection-postgres-integration.yml`
  e `tools/ci/run-address-public-projection-postgres.sh` para aplicar
  **#658 antes de #657**, verificar assinaturas dos arquivos do pré-requisito
  e testar RLS/visões públicas. O pré-requisito é fixado por commit e hashes
  Git de objetos; mudança posterior em #658 exige uma nova revisão explícita
  do pin, sem consultar uma branch móvel silenciosamente.
- No mesmo PostgreSQL descartável, `tools/ci/run-address-postgrest-http.sh`
  inicializa PostgREST e exercita `tools/ci/assert-address-postgrest-http.mjs`
  com **JWTs válidos assinados por chave aleatória da própria CI**. Prova
  separação anon/proprietário/terceiro, operações REST de leitura e PATCH,
  relação pública de Business, coordenadas verificadas e invalidação
  transacional de Residence.

**Limite da certificação:** o emissor JWT da CI é sintético; esses testes
não conectam ao Supabase Auth real nem provam deploy/segredos, perfis reais,
JWT expirado/revogado, infraestrutura de produção ou o fluxo administrativo
completo. Esses pontos continuam na matriz de homologação em staging antes
da implantação. Nenhuma permissão ou migração foi alterada em produção
pela CI.

**Matriz obrigatória (usar sessões reais do provedor de autenticação no
ambiente de teste, não apenas `SET ROLE` nem claims JWT forjadas):**

| Ator | Operação | Resultado esperado |
|---|---|---|
| `anon` | SELECT `addresses` detalhado | zero linhas por RLS, mantendo o GRANT técnico para FK embedding |
| `anon` | SELECT `addresses_public` | somente nove colunas, somente registros com `is_verified=true AND verification_status='verified'` |
| `anon` | catálogo Business e view profissional pública | consulta íntegra, nenhum campo residencial detalhado |
| Morador A | INSERT Address e Residence próprios | estado de verificação pendente/não verificado |
| Morador A | UPDATE de rua, CEP, coordenadas ou localização do próprio Address | permitido; Address passa a não verificado e todas as residências vinculadas são invalidadas na **mesma transação** |
| Morador A | UPDATE direto de `is_verified`, status ou `verified_by` | rejeitado por privilégio SQL, inclusive numa tentativa com outros campos |
| Morador A | INSERT/UPDATE de `user_residences.is_verified` | rejeitado |
| Morador A | requestVerification | timestamp definido pelo servidor; não equivale à aprovação |
| Morador B | ler/editar endereço ou residência de A | negado por RLS |
| Fluxo Verification autorizado | marcar prova após análise | somente autoridade do servidor, com auditoria e autorização apropriadas |
| Alteração do endereço previamente verificado | prova e solicitação existentes | revogadas sem erro ou deadlock, inclusive com `auth.uid()` presente no encadeamento interno |

**Probes read-only pós-aplicação:** os arquivos
`tests/security/address-verification-authenticated-probe.sql` e
`tests/security/address-private-projection-postapply-probe.sql`
confirmam propriedades de ACL e leitura anônima; são complementares
e **não substituem os testes de escrita com fixtures**.

**Antes de produção:** demonstrar migrator e plano de reversão; revisão de
permissões no banco de teste, impacto no endereço comercial e no mapa,
sinais de PostgREST/edge e execução do smoke autenticado. Não alterar a
produção por dashboard, não usar dual-write nem contornar o bloqueio de
RLS com uma nova policy permissiva. Registrar o resultado nos PRs #657 e #658
e no gate da PR de release #621. Somente após confirmação explícita do
responsável pela produção executar o deploy versionado e verificar o
estado pós-aplicação. Problemas posteriores devem bloquear a promoção.

## Separação de responsabilidades

- **Address**: entidade postal, persistência, privacidade e lifecycle;
- **Geocoding**: provider/normalização de CEP, texto e coordenadas;
- **Location**: reconciliação com território oficial e hierarquia canônica;
- **Geospatial**: bounds, containment e operações espaciais;
- **Residence**: vínculo de residência do usuário.

Não duplicar essas responsabilidades em hooks/componentes.

## Proibições

- não acessar ViaCEP/Nominatim diretamente em UI;
- não recriar `CepService` ou `maps/GeocodingService` como bridges;
- não normalizar território a partir de bairro/cidade digitados como fonte de
  verdade;
- não acessar `addresses` diretamente de componente/hook;
- não expor campos privados de endereço em superfície pública;
- não mover containment/bounds para Address ou Geocoding.
