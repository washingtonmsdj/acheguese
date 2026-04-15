# Address SSOT - Sistema de Endereços

## Arquitetura

```
Component → Hook → Service → Repository → Supabase
```

### Módulos

| Módulo | Responsabilidade |
|--------|-----------------|
| `core/address/types` | Tipos canônicos (Address, AddressPublicDTO, etc.) |
| `core/address/services/CepService` | Consulta ViaCEP, formatação, validação |
| `core/address/services/AddressService` | CRUD de endereços (repositório) |
| `core/address/services/ResidentAddressService` | **Orquestrador** — fluxo completo de cadastro |
| `core/address/services/AddressPrivacyGuard` | Mascaramento para exibição pública |
| `core/address/hooks/useResidentAddress` | Hook para formulários de endereço residencial |
| `core/residence/` | Vínculo usuário ↔ endereço ↔ território |
| `core/verification/` | Verificação documental |

## Fluxo de Cadastro de Morador

1. Usuário digita **CEP** → `CepService.lookup()` consulta ViaCEP
2. Autopreenchimento de logradouro, bairro, cidade, UF
3. Usuário preenche **número** e **complemento** (opcional)
4. `ResidentAddressService.registerResidentAddress()`:
   - Valida input
   - Normaliza endereço (CEP + dados do ViaCEP)
   - Resolve `location_id` canônico via território
   - Calcula `address_precision`
   - Persiste via `AddressService`
   - Cria `user_residence` via `ResidenceService`
5. Usuário envia documentos (comprovante + foto)
6. `VerificationService` cria solicitação vinculada ao `address_id`

## Privacidade

**REGRA ABSOLUTA**: Endereço completo (rua, número, CEP) **nunca** é público.

### Exibição por contexto:

| Contexto | Dados visíveis |
|----------|---------------|
| Público | Bairro, cidade (via `location`) |
| Próprio usuário | Endereço completo |
| Admin | Endereço completo |
| Mapa/perto de mim | Coordenadas (só se verificado) |

### Como garantir:

- **Nunca** usar `Address` diretamente em componentes públicos
- Usar `AddressPrivacyGuard.toPublic()` ou `AddressPublicDTO`
- View `addresses_public` no banco já mascara dados

## Campos

### `address_precision` (qualidade do geocoding)
- `exact` — GPS ou geocoding de alta confiança
- `interpolated` — Estimado entre pontos conhecidos
- `street` — Nível de rua
- `neighborhood` — Nível de bairro
- `district` — Nível de distrito
- `city` — Nível de cidade (mais baixa)

### `verification_status`
- `pending` — Aguardando verificação
- `verified` — Confirmado
- `rejected` — Rejeitado

## Proibições

❌ Acessar ViaCEP diretamente em componentes  
❌ Fazer geocoding em hooks de UI  
❌ Normalizar endereço fora do service  
❌ Exibir `street`, `number`, `postal_code` publicamente  
❌ Usar `bairro` digitado manualmente como fonte de verdade  
❌ Acessar tabela `addresses` diretamente (usar `AddressService`)  
