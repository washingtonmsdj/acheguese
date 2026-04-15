# Location & Address Architecture — SSOT

## Tipos de Entidade com Localização

| Tipo | Coleta | Exibição Pública | Mapa |
|------|--------|-------------------|------|
| **user_gps** | GPS do celular (com permissão) | Bairro/Cidade | Nenhum |
| **verified_resident** | Endereço estruturado (CEP + rua + nº) | Bairro/Cidade | Nenhum |
| **physical_business** | Endereço + coordenadas | Endereço completo | Pin exato |
| **mobile_service** | Área de cobertura (territórios) | "Atende em: X, Y, Z" | Área |
| **territorial** | location_id canônico | Nome do território | Polígono |

## Regras de Privacidade

- **Morador**: NUNCA expor rua/número publicamente
- **Empresa física**: Pode mostrar endereço completo
- **Serviço móvel**: Mostrar área atendida, não fingir endereço fixo
- **Usuário comum**: Apenas bairro/cidade

## GPS e Fallback

O sistema NUNCA depende exclusivamente de GPS:

1. **GPS disponível** → usar coordenadas reais
2. **GPS negado** → fallback para território ativo no seletor
3. **Sem território** → cidade padrão (Salvador)

### Componentes chave:
- `UserLocationResolver` — resolve posição com fallback progressivo
- `useResolvedUserLocation` — hook que SEMPRE retorna posição útil
- `GeolocationService` — SSOT para acesso ao GPS

## Endereço Residencial (Verificação de Morador)

### Fluxo:
1. CEP → `CepService.lookup()` → autopreenchimento
2. Usuário preenche número + complemento
3. `ResidentAddressService.registerResidentAddress()`:
   - Valida, normaliza, resolve location_id, calcula precisão
   - Persiste via `AddressService`
   - Cria residência via `ResidenceService`

### Campos:
- `address_precision`: exact | interpolated | street | neighborhood | district | city
- `verification_status`: pending | verified | rejected

## Exibição no Mapa e Perto de Mim

### Distinções no mapa:
- **Pin exato**: apenas `physical_business`
- **Área de cobertura**: `mobile_service`
- **Polígono territorial**: `territorial`
- **Sem representação**: `user_gps`, `verified_resident`

### Perto de Mim:
- Com GPS: distância real (ex: "350m de você")
- Sem GPS: contexto territorial (ex: "em Nordeste de Amaralina")

## Arquitetura

```
Banco → Repository → Service → Hook → Component
```

### Proibições:
- ❌ Acesso direto ao Supabase em componentes
- ❌ Geocoding em hooks de UI
- ❌ Bairro como texto livre virando fonte de verdade
- ❌ CEP sozinho como localização de empresa
- ❌ Endereço de morador público
- ❌ Pin de serviço móvel como se fosse loja física

## Arquivos Chave

| Arquivo | Responsabilidade |
|---------|------------------|
| `core/location/types/entityLocation.ts` | Tipos e regras de exibição por entidade |
| `core/location/services/UserLocationResolver.ts` | Resolução GPS com fallback territorial |
| `core/location/hooks/useResolvedUserLocation.ts` | Hook SSOT para posição do usuário |
| `core/location/utils/entityLocationDisplay.ts` | Utilitário de exibição pública |
| `core/address/services/ResidentAddressService.ts` | Orquestrador de endereço residencial |
| `core/address/services/AddressPrivacyGuard.ts` | Blindagem de privacidade |
| `core/maps/services/GeolocationService.ts` | SSOT de acesso ao GPS |
