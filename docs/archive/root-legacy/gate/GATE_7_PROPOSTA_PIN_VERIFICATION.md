# GATE 7: VERIFICAÇÃO OPERACIONAL POR PIN

**Data:** 08/04/2026  
**Versão:** 1.0.0  
**Status:** 🚧 NOVO ESCOPO PÓS-FECHAMENTO

---

## CONTEXTO

**Importante:** Este é um NOVO ESCOPO que estende a mobilidade congelada sem reabrí-la.

**Mobilidade Base:** 100% fechada e validada (Gate 6)  
**Gate 7:** Extensão opcional de verificação operacional

---

## OBJETIVO

Adicionar PIN opcional de 4 dígitos como camada oficial de verificação operacional da mobilidade.

---

## ESCOPO DA V1

### Corrida (ride)

**Comportamento:**
- Permitir PIN opcional antes do embarque/início
- Se PIN for exigido, bloquear transição para `passenger_boarded` até validação do PIN
- `in_progress` só pode acontecer depois de `passenger_boarded` validado

**Fluxo:**
```
driver_arriving → [validar PIN se exigido] → passenger_boarded → in_progress
```

### Entrega (motoboy)

**Comportamento:**
- Permitir PIN opcional em `confirmDelivery()`
- Se PIN for exigido, `confirmDelivery()` só conclui com PIN válido

**Fluxo:**
```
in_delivery → [validar PIN se exigido] → delivered → completed
```

---

## PRECEDÊNCIA DA EXIGÊNCIA

### Corrida

**Níveis de exigência:**
1. Admin global (configuração sistema)
2. Preferência do passageiro (perfil)
3. Preferência do motorista (perfil)

**Regra:** Se qualquer nível exigir, ativa PIN.

**Lógica:**
```typescript
const requiresPIN = 
  adminConfig.requirePINForRides || 
  passenger.requiresPIN || 
  driver.requiresPIN;
```

### Entrega

**Níveis de exigência:**
1. Admin global (configuração sistema)
2. Configuração da operação/empresa/remetente

**Regra:** Motoboy NÃO decide se a entrega exige PIN.

**Lógica:**
```typescript
const requiresPIN = 
  adminConfig.requirePINForDeliveries || 
  operation.requiresPIN || 
  sender.requiresPIN;
```

---

## DECISÕES DE PRODUTO DA V1

### PIN

- ✅ 4 dígitos numéricos
- ✅ Gerado automaticamente quando exigido
- ✅ Válido por tempo limitado (ex: 24h)
- ✅ Hash armazenado (nunca texto puro)

### Sem Bypass

- ❌ Sem bypass silencioso na v1
- ❌ Se PIN obrigatório e inválido/ausente:
  - Corrida não avança para embarque
  - Entrega não conclui

### Fora do Escopo v1

- ❌ Assinatura digital
- ❌ Barcode/QR Code
- ❌ Múltiplos métodos de verificação
- ❌ PIN customizado pelo usuário

**Foco:** Apenas PIN de 4 dígitos gerado automaticamente

---

## MODELAGEM

### Contrato SSOT: Verificação Operacional

**Objetivo:** Centralizar lógica de verificação sem espalhar pelo código.

**Estrutura:**

```typescript
interface OperationalVerification {
  // Identificação
  ride_id: string;
  verification_type: 'pin'; // v1 só PIN, futuro: 'signature', 'qrcode'
  
  // Exigência
  is_required: boolean;
  required_by: 'admin' | 'passenger' | 'driver' | 'sender' | 'operation';
  required_at: string; // ISO 8601
  
  // Status
  status: 'not_required' | 'pending' | 'verified' | 'failed';
  
  // PIN (hash)
  pin_hash: string | null; // bcrypt hash, nunca texto puro
  pin_generated_at: string | null;
  pin_expires_at: string | null;
  
  // Verificação
  verified_at: string | null;
  verified_by: string | null; // profile_id do ator
  verification_attempts: number;
  last_attempt_at: string | null;
  
  // Auditoria
  created_at: string;
  updated_at: string;
}
```

### Tabela: operational_verifications

```sql
CREATE TABLE operational_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES ride_requests(id) ON DELETE CASCADE,
  verification_type TEXT NOT NULL DEFAULT 'pin',
  
  -- Exigência
  is_required BOOLEAN NOT NULL DEFAULT false,
  required_by TEXT CHECK (required_by IN ('admin', 'passenger', 'driver', 'sender', 'operation')),
  required_at TIMESTAMPTZ,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'not_required' 
    CHECK (status IN ('not_required', 'pending', 'verified', 'failed')),
  
  -- PIN (hash)
  pin_hash TEXT,
  pin_generated_at TIMESTAMPTZ,
  pin_expires_at TIMESTAMPTZ,
  
  -- Verificação
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES profiles(id),
  verification_attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(ride_id, verification_type)
);

-- Índices
CREATE INDEX idx_operational_verifications_ride_id ON operational_verifications(ride_id);
CREATE INDEX idx_operational_verifications_status ON operational_verifications(status);
```

---

## INTEGRAÇÃO COM ESTADO

### Corrida

**Quando gerar PIN:**
- Ao criar corrida, verificar se PIN é exigido
- Se sim, gerar PIN e criar registro em `operational_verifications`
- Status inicial: `pending`

**Quando validar PIN:**
- Antes de transição `driver_arriving → passenger_boarded`
- Validar PIN fornecido contra hash
- Se válido: atualizar status para `verified`, permitir transição
- Se inválido: incrementar tentativas, bloquear transição

**Auditoria:**
- Registrar em `ride_state_audit` se PIN bloqueou transição
- Registrar tentativas inválidas

### Entrega

**Quando gerar PIN:**
- Ao criar entrega, verificar se PIN é exigido
- Se sim, gerar PIN e criar registro em `operational_verifications`
- Status inicial: `pending`

**Quando validar PIN:**
- Dentro de `confirmDelivery()`
- Validar PIN fornecido contra hash
- Se válido: atualizar status para `verified`, prosseguir com confirmação
- Se inválido: incrementar tentativas, retornar erro

**Persistência:**
- PIN verificado persiste junto com `proof_of_delivery`

---

## AUDITORIA OBRIGATÓRIA

### Registrar em ride_state_audit

**Eventos:**
1. PIN exigido (quando criado)
2. PIN gerado (quando gerado)
3. PIN validado com sucesso
4. PIN inválido (tentativa falha)
5. PIN expirado
6. Transição bloqueada por PIN pendente

**Estrutura:**

```typescript
{
  ride_id: string;
  from_state: string;
  to_state: string;
  changed_by: string; // profile_id ou 'system'
  reason: string; // ex: "PIN verification required", "PIN verified", "Invalid PIN"
  metadata: {
    verification_id?: string;
    verification_type?: 'pin';
    verification_status?: string;
    attempts?: number;
  };
  created_at: string;
}
```

---

## TESTES OBRIGATÓRIOS

### Corrida

**Arquivo:** `tests/operational/gate7-pin-ride-runtime.test.ts`

**Casos:**

1. **R.1. Corrida sem PIN exigido continua fluxo normal**
   - Criar corrida sem exigir PIN
   - Validar que `operational_verifications` não é criado
   - Validar que transição para `passenger_boarded` funciona normalmente

2. **R.2. Corrida com PIN exigido bloqueia embarque sem PIN**
   - Criar corrida com PIN exigido
   - Tentar transição para `passenger_boarded` sem fornecer PIN
   - Validar que transição é bloqueada
   - Validar auditoria registra bloqueio

3. **R.3. Corrida com PIN correto permite embarque**
   - Criar corrida com PIN exigido
   - Obter PIN gerado
   - Fornecer PIN correto na transição
   - Validar que `passenger_boarded` é alcançado
   - Validar que `in_progress` pode ser alcançado depois
   - Validar auditoria registra verificação

4. **R.4. Corrida com PIN inválido falha e audita**
   - Criar corrida com PIN exigido
   - Fornecer PIN inválido
   - Validar que transição é bloqueada
   - Validar que tentativas são incrementadas
   - Validar auditoria registra falha

### Entrega

**Arquivo:** `tests/operational/gate7-pin-delivery-runtime.test.ts`

**Casos:**

1. **D.1. Entrega sem PIN exigido conclui normalmente**
   - Criar entrega sem exigir PIN
   - Validar que `operational_verifications` não é criado
   - Validar que `confirmDelivery()` funciona normalmente

2. **D.2. Entrega com PIN exigido bloqueia confirmação sem PIN**
   - Criar entrega com PIN exigido
   - Tentar `confirmDelivery()` sem fornecer PIN
   - Validar que confirmação é bloqueada
   - Validar auditoria registra bloqueio

3. **D.3. Entrega com PIN correto conclui e persiste prova**
   - Criar entrega com PIN exigido
   - Obter PIN gerado
   - Fornecer PIN correto em `confirmDelivery()`
   - Validar que entrega é concluída
   - Validar que `proof_of_delivery` persiste
   - Validar que PIN verificado é registrado
   - Validar auditoria registra verificação

4. **D.4. Entrega com PIN inválido falha e audita**
   - Criar entrega com PIN exigido
   - Fornecer PIN inválido em `confirmDelivery()`
   - Validar que confirmação é bloqueada
   - Validar que tentativas são incrementadas
   - Validar auditoria registra falha

---

## REGRAS DE IMPLEMENTAÇÃO

### ✅ Permitido

- Adicionar nova tabela `operational_verifications`
- Adicionar novo service `OperationalVerificationService`
- Adicionar validação em `RideOperationalService`
- Adicionar testes em `tests/operational/gate7-*`
- Atualizar documentação oficial

### ❌ Proibido

- Refactor amplo de código existente
- Quebrar Gate 6 passageiro/motoboy
- Helper paralelo fora do SSOT
- PIN em texto puro (sempre hash)
- Bypass na v1
- Modificar state machine existente

### 🔒 Segurança

- **PIN sempre em hash:** bcrypt com salt
- **Nunca retornar PIN:** Apenas indicar se é válido ou não
- **Limitar tentativas:** Máximo 5 tentativas antes de bloquear
- **Expiração:** PIN expira em 24h
- **Auditoria completa:** Todas as tentativas registradas

---

## ARQUITETURA

### Camadas

```
┌─────────────────────────────────────────┐
│  UI Layer (Hooks + Components)         │
├─────────────────────────────────────────┤
│  Core Services (SSOT)                   │
│  - RideOperationalService (existente)   │
│  - OperationalVerificationService (novo)│
├─────────────────────────────────────────┤
│  State Machine (RideStateMachine)       │
│  (sem modificação)                      │
├─────────────────────────────────────────┤
│  Database                               │
│  - ride_requests (existente)            │
│  - operational_verifications (novo)     │
│  - ride_state_audit (existente)         │
└─────────────────────────────────────────┘
```

### Novo Service: OperationalVerificationService

**Responsabilidades:**
- Gerar PIN quando exigido
- Validar PIN fornecido
- Gerenciar status de verificação
- Registrar tentativas
- Verificar expiração

**Métodos:**

```typescript
class OperationalVerificationService {
  // Criar verificação
  static async createVerification(params: {
    rideId: string;
    verificationType: 'pin';
    isRequired: boolean;
    requiredBy: 'admin' | 'passenger' | 'driver' | 'sender' | 'operation';
  }): Promise<ServiceResult<{ verificationId: string; pin?: string }>>;
  
  // Validar PIN
  static async verifyPIN(params: {
    rideId: string;
    pin: string;
    verifiedBy: string;
  }): Promise<ServiceResult<{ verified: boolean }>>;
  
  // Obter status
  static async getVerificationStatus(rideId: string): Promise<VerificationStatus | null>;
  
  // Verificar se PIN é exigido
  static async isPINRequired(params: {
    rideMode: 'ride' | 'motoboy';
    passengerId?: string;
    driverId?: string;
    senderId?: string;
  }): Promise<boolean>;
}
```

---

## INTEGRAÇÃO COM RideOperationalService

### Modificações Mínimas

**createRide():**
```typescript
// Após criar corrida
if (await OperationalVerificationService.isPINRequired({ 
  rideMode: 'ride', 
  passengerId, 
  driverId 
})) {
  await OperationalVerificationService.createVerification({
    rideId,
    verificationType: 'pin',
    isRequired: true,
    requiredBy: 'passenger', // ou 'driver' ou 'admin'
  });
}
```

**transitionTo() para passenger_boarded:**
```typescript
// Antes de transição
if (toState === 'passenger_boarded') {
  const verification = await OperationalVerificationService.getVerificationStatus(rideId);
  
  if (verification?.is_required && verification.status !== 'verified') {
    return {
      success: false,
      error: 'PIN verification required before boarding',
    };
  }
}
```

**confirmDelivery():**
```typescript
// Antes de confirmar
const verification = await OperationalVerificationService.getVerificationStatus(rideId);

if (verification?.is_required && verification.status !== 'verified') {
  // Se PIN fornecido, validar
  if (pin) {
    const verifyResult = await OperationalVerificationService.verifyPIN({
      rideId,
      pin,
      verifiedBy: driverId,
    });
    
    if (!verifyResult.success || !verifyResult.data?.verified) {
      return {
        success: false,
        error: 'Invalid PIN',
      };
    }
  } else {
    return {
      success: false,
      error: 'PIN required for delivery confirmation',
    };
  }
}
```

---

## PRÓXIMOS PASSOS

### Fase 1: Fundação Técnica

1. ✅ Criar proposta completa (este documento)
2. ⏳ Criar migration `operational_verifications`
3. ⏳ Criar types `OperationalVerification`
4. ⏳ Criar service `OperationalVerificationService`
5. ⏳ Aplicar migration no banco remoto

### Fase 2: Implementação Funcional

6. ⏳ Integrar com `createRide()`
7. ⏳ Integrar com `transitionTo()` para `passenger_boarded`
8. ⏳ Integrar com `createDelivery()`
9. ⏳ Integrar com `confirmDelivery()`
10. ⏳ Adicionar auditoria completa

### Fase 3: Validação Operacional

11. ⏳ Criar testes `gate7-pin-ride-runtime.test.ts`
12. ⏳ Criar testes `gate7-pin-delivery-runtime.test.ts`
13. ⏳ Executar testes E2E (8/8 passando)
14. ⏳ Validar que Gate 6 não quebrou (9/9 passando)
15. ⏳ Atualizar documentação oficial

---

## CRITÉRIOS DE SUCESSO

### Testes

- ✅ 8/8 testes Gate 7 passando
- ✅ 9/9 testes Gate 6 ainda passando (não quebrou)
- ✅ Total: 17/17 testes passando

### Segurança

- ✅ PIN nunca em texto puro
- ✅ Hash bcrypt com salt
- ✅ Tentativas limitadas
- ✅ Expiração implementada
- ✅ Auditoria completa

### Documentação

- ✅ `MOBILIDADE_SSOT_FINAL.md` atualizado
- ✅ `GATE_7_RELATORIO_FINAL.md` criado
- ✅ Testes documentados

---

## VEREDITO

**Status:** 🚧 PROPOSTA APROVADA - PRONTO PARA IMPLEMENTAÇÃO

**Próximo passo:** Criar migration e types
