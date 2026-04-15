# GUIA DE VALIDAÇÃO NO NAVEGADOR - MOTOR OPERACIONAL

**Objetivo:** Validar fluxo completo do motor operacional via interface real.

---

## PREPARAÇÃO

### 1. Iniciar Monitoramento
```bash
node monitorar_motor_tempo_real.mjs
```

Deixe este terminal aberto. Ele mostrará em tempo real:
- Corridas criadas
- Mudanças de estado
- Auditoria gerada
- Disponibilidade do motorista

### 2. Abrir Aplicação
```bash
npm run dev
```

Abra em dois navegadores/abas:
- Aba 1: Passageiro
- Aba 2: Motorista

---

## FLUXO DE VALIDAÇÃO

### PASSO 1: Login como Passageiro

1. Abrir aba 1
2. Login com credenciais de passageiro
3. Ir para página de criar corrida

**Console esperado:** Sem erros críticos

---

### PASSO 2: Criar Corrida

1. Preencher formulário:
   - Origem: "Teste Motor Origem"
   - Destino: "Teste Motor Destino"
   - Horário: agora
   - Preço: 10.00
   - Tipo: viagem

2. Clicar em "Solicitar"

**Console esperado:** 
- Sem erros críticos
- Toast: "Corrida solicitada! Buscando motorista..."

**Monitoramento esperado:**
```
🚗 NOVA CORRIDA DETECTADA!
   ID: <uuid>
   Status: searching_driver
   
📝 NOVA AUDITORIA!
   Transição: none → requested
   Por: system
   
📝 NOVA AUDITORIA!
   Transição: requested → searching_driver
   Por: system
```

**Anotar:** ID da corrida

---

### PASSO 3: Verificar Estado no Banco

Abrir SQL Editor do Supabase e executar:

```sql
-- Verificar corrida
SELECT id, status, passenger_profile_id, driver_profile_id, created_at
FROM ride_requests
ORDER BY created_at DESC
LIMIT 1;
```

**Esperado:**
- `status = 'searching_driver'`
- `passenger_profile_id` preenchido
- `driver_profile_id` preenchido

```sql
-- Verificar auditoria
SELECT from_state, to_state, changed_by, reason, created_at
FROM ride_state_audit
WHERE ride_id = '<ride_id_anotado>'
ORDER BY created_at;
```

**Esperado:**
- Registro 1: `none → requested` (system)
- Registro 2: `requested → searching_driver` (system)

---

### PASSO 4: Login como Motorista

1. Abrir aba 2
2. Login com credenciais de motorista
3. Ir para lista de corridas disponíveis

**Console esperado:** Sem erros críticos

---

### PASSO 5: Aceitar Corrida

1. Localizar corrida criada
2. Clicar em "Aceitar"

**Console esperado:**
- Sem erros críticos
- Toast: "Corrida aceita! Indo buscar passageiro..."

**Monitoramento esperado:**
```
📊 Status atual: driver_accepted

📝 NOVA AUDITORIA!
   Transição: driver_assigned → driver_accepted
   Por: <driver_profile_id>
   
🚦 DISPONIBILIDADE ATUALIZADA!
   Motorista: <driver_id>...
   Status: 🟡 Online/Ocupado
```

---

### PASSO 6: Verificar Estado no Banco

```sql
-- Verificar corrida
SELECT id, status, driver_profile_id
FROM ride_requests
WHERE id = '<ride_id_anotado>';
```

**Esperado:**
- `status = 'driver_accepted'`
- `driver_profile_id` preenchido

```sql
-- Verificar auditoria
SELECT from_state, to_state, changed_by, reason
FROM ride_state_audit
WHERE ride_id = '<ride_id_anotado>'
ORDER BY created_at;
```

**Esperado:**
- Registro 3: `driver_assigned → driver_accepted` (driver_profile_id)

```sql
-- Verificar disponibilidade
SELECT profile_id, is_online, is_available
FROM driver_availability
WHERE profile_id = '<driver_profile_id>';
```

**Esperado:**
- `is_online = true`
- `is_available = false` (ocupado)

---

### PASSO 7: Avançar para In Progress

1. Como motorista, clicar em "Iniciar Corrida" (se disponível)
2. OU avançar pelos estados disponíveis na UI

**Console esperado:** Sem erros críticos

**Monitoramento esperado:**
```
📊 Status atual: in_progress

📝 NOVA AUDITORIA!
   Transição: driver_accepted → in_progress
```

---

### PASSO 8: Completar Corrida

1. Como motorista, clicar em "Completar Corrida"

**Console esperado:**
- Sem erros críticos
- Toast: "Corrida completada!"

**Monitoramento esperado:**
```
📊 Status atual: completed

📝 NOVA AUDITORIA!
   Transição: in_progress → completed
   
🚦 DISPONIBILIDADE ATUALIZADA!
   Motorista: <driver_id>...
   Status: 🟢 Online/Disponível
```

---

### PASSO 9: Verificar Estado Final no Banco

```sql
-- Verificar corrida final
SELECT id, status, completed_at
FROM ride_requests
WHERE id = '<ride_id_anotado>';
```

**Esperado:**
- `status = 'completed'`
- `completed_at` preenchido

```sql
-- Verificar auditoria completa
SELECT from_state, to_state, changed_by, reason, created_at
FROM ride_state_audit
WHERE ride_id = '<ride_id_anotado>'
ORDER BY created_at;
```

**Esperado (mínimo):**
- none → requested (system)
- requested → searching_driver (system)
- searching_driver → driver_assigned (system)
- driver_assigned → driver_accepted (driver)
- driver_accepted → in_progress (driver)
- in_progress → completed (driver)

```sql
-- Verificar disponibilidade final
SELECT profile_id, is_online, is_available
FROM driver_availability
WHERE profile_id = '<driver_profile_id>';
```

**Esperado:**
- `is_online = true`
- `is_available = true` (liberado)

---

## CHECKLIST DE VALIDAÇÃO

### ✅ Criação de Corrida
- [ ] Corrida criada sem erro
- [ ] Status inicial: `searching_driver`
- [ ] Auditoria: none → requested
- [ ] Auditoria: requested → searching_driver
- [ ] Console sem erro crítico

### ✅ Aceite de Corrida
- [ ] Corrida aceita sem erro
- [ ] Status: `driver_accepted`
- [ ] Auditoria: driver_assigned → driver_accepted
- [ ] Disponibilidade: `is_available = false`
- [ ] Console sem erro crítico

### ✅ Conclusão de Corrida
- [ ] Corrida completada sem erro
- [ ] Status: `completed`
- [ ] Auditoria: in_progress → completed
- [ ] Disponibilidade: `is_available = true`
- [ ] Console sem erro crítico

### ✅ Auditoria Completa
- [ ] Todas transições registradas
- [ ] Actor correto em cada transição
- [ ] Timestamps corretos

### ✅ Disponibilidade
- [ ] Motorista disponível inicialmente
- [ ] Motorista ocupado após aceitar
- [ ] Motorista liberado após completar

---

## REGISTRO DE EVIDÊNCIAS

### Corrida Criada
```
ID: _______________________
Status: _______________________
Criada em: _______________________
```

### Auditoria
```
Transição 1: _______________________
Transição 2: _______________________
Transição 3: _______________________
Transição 4: _______________________
Transição 5: _______________________
Transição 6: _______________________
```

### Disponibilidade
```
Inicial: is_available = _______
Após aceitar: is_available = _______
Após completar: is_available = _______
```

### Erros Encontrados
```
1. _______________________
2. _______________________
3. _______________________
```

---

## APÓS VALIDAÇÃO

Parar monitoramento (Ctrl+C) e executar:

```bash
node gerar_relatorio_validacao.mjs
```

Este script irá:
1. Buscar última corrida criada
2. Buscar auditoria completa
3. Buscar disponibilidade
4. Gerar relatório final com evidências

---

**IMPORTANTE:** Anote o ID da corrida criada para consultas no banco!

