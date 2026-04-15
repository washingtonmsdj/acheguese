# 🧪 GUIA DE VALIDAÇÃO MANUAL: MOTOBOY

**Objetivo:** Validar fluxo ponta a ponta do motoboy em runtime

---

## 📋 PRÉ-REQUISITOS

- [ ] Aplicação rodando localmente (`npm run dev`)
- [ ] Banco Supabase com migration aplicada
- [ ] 2 usuários criados:
  - Usuário A: Passageiro/Empresa (solicitante)
  - Usuário B: Motorista/Motoboy (executor)

---

## 🧪 TESTE 1: CADASTRO/PERFIL

### 1.1 Habilitar Perfil de Motoboy

**Como Usuário B:**

1. Acessar `/create-driver?type=motoboy`
2. Preencher formulário de cadastro
3. Submeter

**Validar:**
- [ ] Formulário aceita dados
- [ ] Redirect após sucesso
- [ ] Sem erros no console

**Verificar no banco:**
```sql
SELECT 
  p.id,
  p.profile_type,
  dd.can_do_delivery,
  dd.vehicle_type
FROM profiles p
LEFT JOIN driver_data dd ON dd.profile_id = p.id
WHERE p.id = 'USER_B_ID';
```

**Esperado:**
- `profile_type = 'driver'`
- `can_do_delivery = true`

### 1.2 Visualizar Badge Motoboy

**Como Usuário B:**

1. Acessar `/perfil/identidades`
2. Localizar card do perfil de motorista

**Validar:**
- [ ] Badge "Motoboy" aparece
- [ ] Ícone de moto visível
- [ ] Diferenciação clara de motorista comum

---

## 🧪 TESTE 2: CRIAÇÃO DE ENTREGA

### 2.1 Abrir Modal de Criação

**Como Usuário A:**

1. Navegar para área de entregas
2. Clicar em "Solicitar Motoboy"
3. Modal `CreateDeliveryModal` abre

**Validar:**
- [ ] Modal abre sem erros
- [ ] Campos visíveis:
  - Nome do destinatário
  - Telefone (opcional)
  - Endereço de entrega
  - Tamanho do pacote
  - Descrição
  - Observações

### 2.2 Preencher e Submeter

**Dados de teste:**
```
Destinatário: João Silva
Telefone: 11999999999
Endereço: Av. Paulista, 1000 - São Paulo
Tamanho: small
Descrição: Documentos
Observações: Entregar na portaria
```

**Validar:**
- [ ] Geocoding funciona (endereço resolve)
- [ ] Estimativa de preço aparece
- [ ] Botão "Solicitar" habilitado
- [ ] Submit sem erros

**Verificar no banco:**
```sql
SELECT 
  id,
  ride_mode,
  source_type,
  source_id,
  recipient_name,
  recipient_phone,
  package_size,
  package_description,
  delivery_notes,
  status,
  suggested_price,
  created_at
FROM ride_requests
WHERE ride_mode = 'motoboy'
ORDER BY created_at DESC
LIMIT 1;
```

**Esperado:**
- `ride_mode = 'motoboy'`
- `source_type = 'passenger'` (ou 'business'/'gastronomy')
- `recipient_name = 'João Silva'`
- `package_size = 'small'`
- `status = 'searching_driver'` ou 'requested'
- `suggested_price > 0`

---

## 🧪 TESTE 3: LISTA DE PEDIDOS DISPONÍVEIS

### 3.1 Dashboard do Motoboy

**Como Usuário B:**

1. Acessar dashboard do motorista
2. Verificar lista de pedidos disponíveis

**Validar:**
- [ ] Entrega criada aparece na lista
- [ ] Apenas entregas (`ride_mode = 'motoboy'`) visíveis
- [ ] Corridas de passageiro NÃO aparecem
- [ ] Informações visíveis:
  - Origem e destino
  - Tamanho do pacote
  - Preço estimado
  - Distância

### 3.2 Filtros

**Validar:**
- [ ] Filtro por tipo (ride/motoboy) funciona
- [ ] Filtro por distância funciona
- [ ] Filtro por preço funciona

---

## 🧪 TESTE 4: ACEITE DE ENTREGA

### 4.1 Aceitar Pedido

**Como Usuário B:**

1. Clicar em "Aceitar" na entrega
2. Confirmar aceite

**Validar:**
- [ ] Aceite sem erros
- [ ] UI atualiza (pedido sai da lista de disponíveis)
- [ ] Pedido aparece em "Minhas Entregas"

**Verificar no banco:**
```sql
SELECT 
  rr.id,
  rr.status,
  rr.driver_profile_id,
  da.active_ride_id,
  da.active_ride_mode,
  da.status as driver_status
FROM ride_requests rr
LEFT JOIN driver_availability da ON da.profile_id = rr.driver_profile_id
WHERE rr.id = 'RIDE_ID';
```

**Esperado:**
- `status = 'driver_accepted'` ou 'driver_assigned'
- `driver_profile_id = USER_B_ID`
- `active_ride_id = RIDE_ID`
- `active_ride_mode = 'motoboy'`
- `driver_status = 'busy'`

### 4.2 Idempotência

**Tentar aceitar novamente:**

**Validar:**
- [ ] Não permite aceitar duas vezes
- [ ] Mensagem de erro apropriada

### 4.3 Concorrência

**Com outro motoboy (Usuário C):**

1. Usuário B aceita entrega
2. Usuário C tenta aceitar mesma entrega

**Validar:**
- [ ] Usuário C recebe erro
- [ ] Apenas Usuário B fica atribuído

---

## 🧪 TESTE 5: CICLO OPERACIONAL

### 5.1 Confirmar Coleta

**Como Usuário B:**

1. Ir para detalhes da entrega
2. Clicar em "Confirmar Coleta"

**Validar:**
- [ ] Transição sem erros
- [ ] Status atualiza para `pickup_confirmed`
- [ ] Timestamp `pickup_confirmed_at` salvo

**Verificar no banco:**
```sql
SELECT 
  id,
  status,
  pickup_confirmed_at
FROM ride_requests
WHERE id = 'RIDE_ID';
```

### 5.2 Iniciar Entrega

**Como Usuário B:**

1. Clicar em "Iniciar Entrega"

**Validar:**
- [ ] Transição sem erros
- [ ] Status atualiza para `in_delivery`
- [ ] GPS tracking inicia (se implementado)

### 5.3 Confirmar Entrega

**Como Usuário B:**

1. Clicar em "Confirmar Entrega"
2. Preencher prova de entrega:
   - Código: 1234
   - Observação: "Entregue ao porteiro"
   - Foto (opcional)

**Validar:**
- [ ] Modal de confirmação abre
- [ ] Campos de prova de entrega visíveis
- [ ] Submit sem erros
- [ ] Status atualiza para `delivered`

**Verificar no banco:**
```sql
SELECT 
  id,
  status,
  delivered_at,
  proof_of_delivery
FROM ride_requests
WHERE id = 'RIDE_ID';
```

**Esperado:**
- `status = 'delivered'` ou 'completed'
- `delivered_at` preenchido
- `proof_of_delivery` contém:
  ```json
  {
    "code": "1234",
    "observation": "Entregue ao porteiro",
    "signed_at": "2026-04-14T..."
  }
  ```

### 5.4 Falha na Entrega (Teste Alternativo)

**Criar nova entrega e:**

1. Aceitar
2. Confirmar coleta
3. Iniciar entrega
4. Clicar em "Registrar Falha"
5. Preencher motivo:
   - Motivo: "Destinatário ausente"
   - Observação: "Ninguém atendeu"

**Validar:**
- [ ] Modal de falha abre
- [ ] Campos de motivo visíveis
- [ ] Submit sem erros
- [ ] Status atualiza para `failed_delivery`

**Verificar no banco:**
```sql
SELECT 
  id,
  status,
  failed_delivery_at,
  failed_delivery_reason,
  failed_delivery_metadata
FROM ride_requests
WHERE id = 'RIDE_ID';
```

---

## 🧪 TESTE 6: TRACKING E REALTIME

### 6.1 Acompanhamento pelo Solicitante

**Como Usuário A:**

1. Acessar "Minhas Entregas"
2. Abrir detalhes da entrega em andamento

**Validar:**
- [ ] Status atual visível
- [ ] Localização do motoboy atualiza (se GPS implementado)
- [ ] Timeline de eventos visível
- [ ] Atualização sem refresh

### 6.2 Realtime

**Com duas abas abertas:**
- Aba 1: Usuário A (solicitante)
- Aba 2: Usuário B (motoboy)

**Ações:**
1. Usuário B confirma coleta
2. Verificar se Aba 1 atualiza automaticamente

**Validar:**
- [ ] Aba 1 atualiza sem refresh
- [ ] Status sincronizado
- [ ] Sem múltiplas subscrições (verificar console)

---

## 🧪 TESTE 7: HISTÓRICO E AUDITORIA

### 7.1 Histórico de Entregas

**Como Usuário A:**

1. Acessar "Histórico de Entregas"

**Validar:**
- [ ] Entrega concluída aparece
- [ ] Dados completos visíveis:
  - Destinatário
  - Endereço
  - Status final
  - Preço
  - Data/hora
  - Prova de entrega

### 7.2 Auditoria de Estados

**Verificar no banco:**
```sql
SELECT 
  ride_id,
  from_state,
  to_state,
  actor_profile_id,
  reason,
  created_at
FROM ride_state_audit
WHERE ride_id = 'RIDE_ID'
ORDER BY created_at;
```

**Esperado:**
- Todas as transições registradas:
  - `null → requested`
  - `requested → searching_driver`
  - `searching_driver → driver_accepted`
  - `driver_accepted → pickup_confirmed`
  - `pickup_confirmed → in_delivery`
  - `in_delivery → delivered`

---

## 🧪 TESTE 8: SEGURANÇA/RLS

### 8.1 Isolamento de Dados

**Como Usuário C (não envolvido):**

1. Tentar acessar entrega de Usuário A

**Validar:**
- [ ] Não consegue ver detalhes
- [ ] Erro 403 ou dados vazios
- [ ] Sem vazamento de informações

### 8.2 Permissões de Ação

**Como Usuário A (solicitante):**

1. Tentar confirmar coleta (ação de motoboy)

**Validar:**
- [ ] Ação bloqueada
- [ ] Mensagem de erro apropriada

**Como Usuário B (motoboy):**

1. Tentar cancelar entrega de outro motoboy

**Validar:**
- [ ] Ação bloqueada
- [ ] Apenas suas entregas são editáveis

---

## 📊 CHECKLIST DE VALIDAÇÃO

### Cadastro/Perfil
- [ ] Habilitar perfil de motoboy
- [ ] `can_do_delivery` salvo
- [ ] Badge visível na UI
- [ ] Diferenciação clara

### Criação de Entrega
- [ ] Modal abre
- [ ] Geocoding funciona
- [ ] Estimativa de preço
- [ ] Insert no banco correto
- [ ] Campos motoboy salvos

### Lista de Pedidos
- [ ] Motoboy vê apenas entregas
- [ ] Motorista vê apenas corridas
- [ ] Filtros funcionam

### Aceite
- [ ] Aceite funciona
- [ ] `driver_profile_id` atribuído
- [ ] `active_ride_mode` atualizado
- [ ] Idempotente
- [ ] Protegido contra concorrência

### Ciclo Operacional
- [ ] Confirmar coleta
- [ ] Iniciar entrega
- [ ] Confirmar entrega
- [ ] Registrar falha
- [ ] Timestamps salvos
- [ ] Prova de entrega persistida

### Tracking
- [ ] Solicitante acompanha
- [ ] Realtime funciona
- [ ] Sem duplicação de canais

### Histórico
- [ ] Entrega aparece no histórico
- [ ] Auditoria registrada
- [ ] Dados não somem

### Segurança
- [ ] Isolamento de dados
- [ ] Permissões respeitadas
- [ ] RLS funcionando

---

## 📝 RELATÓRIO DE VALIDAÇÃO

Após executar todos os testes, preencher:

### Testes Executados
- Total: __/8
- Passou: __
- Falhou: __
- Bloqueado: __

### Problemas Encontrados
1. 
2. 
3. 

### Correções Necessárias
1. 
2. 
3. 

### Status Final
- [ ] ✅ Funcionalmente validado
- [ ] 🟡 Parcialmente funcional
- [ ] 🔴 Não funcional

---

**Próximo passo:** Atualizar `STATUS_OPERACIONAL.md` com resultados
