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
