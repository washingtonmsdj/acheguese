# 🧪 VALIDAÇÃO MANUAL UI - MÓDULO MOTOBOY

**Data:** 2026-04-14  
**Projeto:** acheguese (xhdowzacfujckjelqhtd)  
**Servidor:** http://localhost:8082/  
**Status:** EM ANDAMENTO

---

## ✅ PRÉ-REQUISITOS

- [x] Aplicação rodando localmente (`npm run dev`)
  - Servidor: http://localhost:8082/
  - Iniciado em: 2026-04-14 17:35 UTC
  - Status: ✅ RODANDO
  
- [x] Banco Supabase com migration aplicada
  - Projeto: xhdowzacfujckjelqhtd
  - URL: https://xhdowzacfujckjelqhtd.supabase.co
  - Status: ✅ CONFIGURADO
  
- [ ] 2 usuários criados:
  - [ ] Usuário A: Passageiro/Empresa (solicitante)
  - [ ] Usuário B: Motorista/Motoboy (executor)
  - Status: ⏳ PENDENTE

---

## 📋 CHECKLIST DE VALIDAÇÃO

### 🧪 TESTE 1: CADASTRO/PERFIL

#### 1.1 Habilitar Perfil de Motoboy
**Como Usuário B:**
- [ ] Acessar `/create-driver?type=motoboy`
- [ ] Preencher formulário de cadastro
- [ ] Submeter
- [ ] Validar: Formulário aceita dados
- [ ] Validar: Redirect após sucesso
- [ ] Validar: Sem erros no console

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

**Resultado:** ⏳ PENDENTE

---

#### 1.2 Visualizar Badge Motoboy
**Como Usuário B:**
- [ ] Acessar `/perfil/identidades`
- [ ] Localizar card do perfil de motorista
- [ ] Validar: Badge "Motoboy" aparece
- [ ] Validar: Ícone de moto visível
- [ ] Validar: Diferenciação clara de motorista comum

**Resultado:** ⏳ PENDENTE

---

### 🧪 TESTE 2: CRIAÇÃO DE ENTREGA

#### 2.1 Abrir Modal de Criação
**Como Usuário A:**
- [ ] Navegar para área de entregas
- [ ] Clicar em "Solicitar Motoboy"
- [ ] Modal `CreateDeliveryModal` abre
- [ ] Validar: Modal abre sem erros
- [ ] Validar: Campos visíveis (destinatário, telefone, endereço, tamanho, descrição)

**Resultado:** ⏳ PENDENTE

---

#### 2.2 Preencher e Submeter
**Dados de teste:**
```
Destinatário: João Silva
Telefone: 11999999999
Endereço: Av. Paulista, 1000 - São Paulo
Tamanho: small
Descrição: Documentos
Observações: Entregar na portaria
```

- [ ] Validar: Geocoding funciona (endereço resolve)
- [ ] Validar: Estimativa de preço aparece
- [ ] Validar: Botão "Solicitar" habilitado
- [ ] Validar: Submit sem erros

**Verificar no banco:**
```sql
SELECT 
  id,
  ride_mode,
  source_type,
  recipient_name,
  package_size,
  status,
  suggested_price
FROM ride_requests
WHERE ride_mode = 'motoboy'
ORDER BY created_at DESC
LIMIT 1;
```

**Resultado:** ⏳ PENDENTE

---

### 🧪 TESTE 3: LISTA DE PEDIDOS DISPONÍVEIS

#### 3.1 Dashboard do Motoboy
**Como Usuário B:**
- [ ] Acessar dashboard do motorista
- [ ] Verificar lista de pedidos disponíveis
- [ ] Validar: Entrega criada aparece na lista
- [ ] Validar: Apenas entregas (`ride_mode = 'motoboy'`) visíveis
- [ ] Validar: Corridas de passageiro NÃO aparecem
- [ ] Validar: Informações visíveis (origem, destino, tamanho, preço, distância)

**Resultado:** ⏳ PENDENTE

---

#### 3.2 Filtros
- [ ] Validar: Filtro por tipo (ride/motoboy) funciona
- [ ] Validar: Filtro por distância funciona
- [ ] Validar: Filtro por preço funciona

**Resultado:** ⏳ PENDENTE

---

### 🧪 TESTE 4: ACEITE DE ENTREGA

#### 4.1 Aceitar Pedido
**Como Usuário B:**
- [ ] Clicar em "Aceitar" na entrega
- [ ] Confirmar aceite
- [ ] Validar: Aceite sem erros
- [ ] Validar: UI atualiza (pedido sai da lista de disponíveis)
- [ ] Validar: Pedido aparece em "Minhas Entregas"

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

**Resultado:** ⏳ PENDENTE

---

#### 4.2 Idempotência
- [ ] Tentar aceitar novamente
- [ ] Validar: Não permite aceitar duas vezes
- [ ] Validar: Mensagem de erro apropriada

**Resultado:** ⏳ PENDENTE

---

### 🧪 TESTE 5: CICLO OPERACIONAL

#### 5.1 Confirmar Coleta
**Como Usuário B:**
- [ ] Ir para detalhes da entrega
- [ ] Clicar em "Confirmar Coleta"
- [ ] Validar: Transição sem erros
- [ ] Validar: Status atualiza para `pickup_confirmed`
- [ ] Validar: Timestamp `pickup_confirmed_at` salvo

**Resultado:** ⏳ PENDENTE

---

#### 5.2 Iniciar Entrega
**Como Usuário B:**
- [ ] Clicar em "Iniciar Entrega"
- [ ] Validar: Transição sem erros
- [ ] Validar: Status atualiza para `in_delivery`
- [ ] Validar: GPS tracking inicia (se implementado)

**Resultado:** ⏳ PENDENTE

---

#### 5.3 Confirmar Entrega
**Como Usuário B:**
- [ ] Clicar em "Confirmar Entrega"
- [ ] Preencher prova de entrega:
  - Código: 1234
  - Observação: "Entregue ao porteiro"
  - Foto (opcional)
- [ ] Validar: Modal de confirmação abre
- [ ] Validar: Campos de prova de entrega visíveis
- [ ] Validar: Submit sem erros
- [ ] Validar: Status atualiza para `delivered`

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

**Resultado:** ⏳ PENDENTE

---

#### 5.4 Falha na Entrega (Teste Alternativo)
**Criar nova entrega e:**
- [ ] Aceitar
- [ ] Confirmar coleta
- [ ] Iniciar entrega
- [ ] Clicar em "Registrar Falha"
- [ ] Preencher motivo: "Destinatário ausente"
- [ ] Validar: Modal de falha abre
- [ ] Validar: Submit sem erros
- [ ] Validar: Status atualiza para `failed_delivery`

**Resultado:** ⏳ PENDENTE

---

### 🧪 TESTE 6: RASTREAMENTO E REALTIME

#### 6.1 Acompanhamento pelo Solicitante
**Como Usuário A:**
- [ ] Acessar "Minhas Entregas"
- [ ] Abrir detalhes da entrega em andamento
- [ ] Validar: Status atual visível
- [ ] Validar: Localização do motoboy atualiza (se GPS implementado)
- [ ] Validar: Timeline de eventos visível
- [ ] Validar: Atualização sem refresh

**Resultado:** ⏳ PENDENTE

---

#### 6.2 Realtime
**Com duas abas abertas:**
- [ ] Aba 1: Usuário A (solicitante)
- [ ] Aba 2: Usuário B (motoboy)
- [ ] Usuário B confirma coleta
- [ ] Validar: Aba 1 atualiza automaticamente
- [ ] Validar: Status sincronizado
- [ ] Validar: Sem múltiplas subscrições (verificar console)

**Resultado:** ⏳ PENDENTE

---

### 🧪 TESTE 7: HISTÓRICO E AUDITORIA

#### 7.1 Histórico de Entregas
**Como Usuário A:**
- [ ] Acessar "Histórico de Entregas"
- [ ] Validar: Entrega concluída aparece
- [ ] Validar: Dados completos visíveis (destinatário, endereço, status, preço, data, prova)

**Resultado:** ⏳ PENDENTE

---

#### 7.2 Auditoria de Estados
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

**Esperado:** Todas as transições registradas

**Resultado:** ⏳ PENDENTE

---

### 🧪 TESTE 8: SEGURANÇA/RLS

#### 8.1 Isolamento de Dados
**Como Usuário C (não envolvido):**
- [ ] Tentar acessar entrega de Usuário A
- [ ] Validar: Não consegue ver detalhes
- [ ] Validar: Erro 403 ou dados vazios
- [ ] Validar: Sem vazamento de informações

**Resultado:** ⏳ PENDENTE

---

#### 8.2 Permissões de Ação
**Como Usuário A (solicitante):**
- [ ] Tentar confirmar coleta (ação de motoboy)
- [ ] Validar: Ação bloqueada
- [ ] Validar: Mensagem de erro apropriada

**Como Usuário B (motoboy):**
- [ ] Tentar cancelar entrega de outro motoboy
- [ ] Validar: Ação bloqueada
- [ ] Validar: Apenas suas entregas são editáveis

**Resultado:** ⏳ PENDENTE

---

## 📊 RESUMO DE VALIDAÇÃO

### Testes Executados
- **Total:** 0/8
- **Passou:** 0
- **Falhou:** 0
- **Bloqueado:** 0
- **Pendente:** 8

### Status por Categoria
- [ ] Cadastro/Perfil (0/2)
- [ ] Criação de Entrega (0/2)
- [ ] Lista de Pedidos (0/2)
- [ ] Aceite (0/2)
- [ ] Ciclo Operacional (0/4)
- [ ] Rastreamento (0/2)
- [ ] Histórico (0/2)
- [ ] Segurança (0/2)

---

## 🚀 PRÓXIMOS PASSOS

1. ⏳ Criar/identificar usuários de teste (Usuário A e B)
2. ⏳ Executar Teste 1: Cadastro/Perfil
3. ⏳ Executar Teste 2: Criação de Entrega
4. ⏳ Executar Teste 3: Lista de Pedidos
5. ⏳ Executar Teste 4: Aceite
6. ⏳ Executar Teste 5: Ciclo Operacional
7. ⏳ Executar Teste 6: Rastreamento
8. ⏳ Executar Teste 7: Histórico
9. ⏳ Executar Teste 8: Segurança
10. ⏳ Documentar problemas encontrados
11. ⏳ Atualizar STATUS_OPERACIONAL.md

---

## 📝 NOTAS

### Servidor de Desenvolvimento
- **URL:** http://localhost:8082/
- **Status:** ✅ RODANDO
- **Iniciado:** 2026-04-14 17:35 UTC
- **Credenciais:** Carregadas via Import-LocalSupabaseSecrets.ps1

### Observações
- Validação manual requer interação humana com a UI
- Capturas de tela/vídeo devem ser documentadas
- Problemas encontrados devem ser registrados em seção separada

---

**Status:** ⏳ AGUARDANDO EXECUÇÃO MANUAL
