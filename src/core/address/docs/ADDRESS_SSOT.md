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
