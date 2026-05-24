# Location & Address Architecture - SSOT

## Tipos de Entidade com Localizacao

| Tipo | Coleta | Exibicao publica | Mapa |
|------|--------|------------------|------|
| `user_gps` | GPS do dispositivo, com permissao | Bairro/Cidade | Nenhum |
| `verified_resident` | Endereco estruturado (CEP, rua, numero) | Bairro/Cidade | Nenhum |
| `physical_business` | Endereco e coordenadas | Endereco completo | Pin exato |
| `mobile_service` | Area de cobertura por territorios | Areas atendidas | Area |
| `territorial` | `location_id` canonico | Nome do territorio | Poligono |

## Regras de Privacidade

- Morador: nunca expor rua ou numero publicamente.
- Empresa fisica: pode mostrar endereco completo quando publicado pelo responsavel.
- Servico movel: mostrar area atendida, sem simular endereco fixo.
- Usuario comum: exibir apenas bairro/cidade.

## GPS e Fallback

O sistema nao depende exclusivamente de GPS:

1. GPS disponivel: usar coordenadas reais.
2. GPS negado: usar o centro do territorio ativo no seletor.
3. Sem territorio: usar o centro padrao configurado por ambiente.

## Componentes Chave

- `UserLocationResolver`: resolve posicao com fallback progressivo.
- `useResolvedUserLocation`: hook que sempre retorna posicao util apos resolucao.
- `GeolocationService`: SSOT para acesso ao GPS.

## Endereco Residencial

Fluxo:

1. CEP via `CepService.lookup()`.
2. Usuario preenche numero e complemento.
3. `ResidentAddressService.registerResidentAddress()` valida, normaliza, resolve `location_id`, calcula precisao, persiste via `AddressService` e cria residencia via `ResidenceService`.

Campos relevantes:

- `address_precision`: `exact`, `interpolated`, `street`, `neighborhood`, `district`, `city`.
- `verification_status`: `pending`, `verified`, `rejected`.

## Exibicao no Mapa e Perto de Mim

Distincoes no mapa:

- Pin exato: apenas `physical_business`.
- Area de cobertura: `mobile_service`.
- Poligono territorial: `territorial`.
- Sem representacao: `user_gps`, `verified_resident`.

Perto de Mim:

- Com GPS: distancia real.
- Sem GPS: contexto territorial.

## Arquitetura

```text
Banco -> Repository -> Service -> Hook -> Component
```

## Proibicoes

- Acesso direto ao Supabase em componentes.
- Geocoding em hooks de UI.
- Bairro como texto livre virando fonte de verdade.
- CEP sozinho como localizacao de empresa.
- Endereco de morador publico.
- Pin de servico movel como se fosse loja fisica.

## Arquivos Chave

| Arquivo | Responsabilidade |
|---------|------------------|
| `core/location/types/entityLocation.ts` | Tipos e regras de exibicao por entidade |
| `core/location/services/UserLocationResolver.ts` | Resolucao GPS com fallback territorial |
| `core/location/hooks/useResolvedUserLocation.ts` | Hook SSOT para posicao do usuario |
| `core/location/utils/entityLocationDisplay.ts` | Utilitario de exibicao publica |
| `core/address/services/ResidentAddressService.ts` | Orquestrador de endereco residencial |
| `core/address/services/AddressPrivacyGuard.ts` | Blindagem de privacidade |
| `core/maps/services/GeolocationService.ts` | SSOT de acesso ao GPS |