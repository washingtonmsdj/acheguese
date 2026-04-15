# VALIDAÇÃO MANUAL NO NAVEGADOR - STAGING

**IMPORTANTE:** Execute cada item e marque com ✅ ou ❌

---

## PREPARAÇÃO

1. Abrir navegador em modo normal
2. Abrir DevTools (F12)
3. Ir para aba Console
4. Limpar console (Ctrl+L)

---

## 1. PRICING ADMIN (/admin/pricing)

### Login
- [ ] Acessar http://localhost:8080/admin/pricing
- [ ] Login: admin@staging.local / Admin123!@#
- [ ] Console: sem erros críticos após login

### Listar Regras
- [ ] Página carrega
- [ ] Lista de regras exibida
- [ ] Colunas visíveis: Nome, Mode, Base Fare, Status
- [ ] Console: sem erros

### Criar Regra
- [ ] Clicar "Nova Regra"
- [ ] Modal abre
- [ ] Preencher:
  - Nome: "Teste Staging"
  - Mode: ride
  - Base Fare: 5.00
  - Price per KM: 2.00
  - Price per Minute: 0.50
  - Minimum Fare: 10.00
- [ ] Clicar "Salvar"
- [ ] Regra aparece na lista
- [ ] Console: sem erros

### Editar Regra
- [ ] Clicar "Editar" na regra criada
- [ ] Modal abre com dados preenchidos
- [ ] Alterar Base Fare para 6.00
- [ ] Salvar
- [ ] Lista atualiza com novo valor
- [ ] Console: sem erros

### Ativar Regra
- [ ] Clicar botão "Ativar" na regra
- [ ] Status muda para "Ativa"
- [ ] Badge verde exibido
- [ ] Console: sem erros

### Conflito
- [ ] Criar nova regra com mesmo mode (ride)
- [ ] Tentar ativar
- [ ] Erro exibido: "Conflito com regra ativa"
- [ ] Mensagem clara
- [ ] Console: sem erros

### Auditoria
- [ ] Scroll até seção "Histórico de Auditoria"
- [ ] Logs de criação visíveis
- [ ] Logs de ativação visíveis
- [ ] Timestamp correto
- [ ] Console: sem erros

**ERROS ENCONTRADOS:**
```
(anotar aqui)
```

---

## 2. CRIAÇÃO DE CORRIDA

### Login Passageiro
- [ ] Logout do admin
- [ ] Login: passageiro@staging.local / Pass123!@#
- [ ] Console: sem erros

### Criar Corrida
- [ ] Ir para /mobility ou página de corridas
- [ ] Clicar "Nova Corrida"
- [ ] Preencher origem e destino
- [ ] Selecionar mode: ride
- [ ] Console: sem erros

### Cálculo de Preço
- [ ] Preço calculado automaticamente
- [ ] Base fare exibido
- [ ] Price per km exibido
- [ ] Total correto (verificar cálculo)
- [ ] Console: sem erros

### Confirmar
- [ ] Clicar "Confirmar"
- [ ] Corrida criada
- [ ] Aparece na lista de corridas
- [ ] Status: pending ou requested
- [ ] Console: sem erros

**ERROS ENCONTRADOS:**
```
(anotar aqui)
```

---

## 3. ALERTA DE EMERGÊNCIA

### Acionar SOS
- [ ] Procurar botão SOS ou Emergency
- [ ] Clicar
- [ ] Modal de confirmação abre
- [ ] Confirmar
- [ ] Console: sem erros

### Notificação
- [ ] Notificação exibida na tela
- [ ] Mensagem: "Alerta de emergência criado"
- [ ] Console: sem erros

### Persistência
- [ ] Ir para lista de alertas (se houver)
- [ ] Alerta aparece na lista
- [ ] Status: active
- [ ] Tipo: sos
- [ ] Console: sem erros

**ERROS ENCONTRADOS:**
```
(anotar aqui)
```

---

## 4. COMPARTILHAMENTO DE VIAGEM

### Gerar Link
- [ ] Abrir corrida criada
- [ ] Procurar botão "Compartilhar"
- [ ] Clicar
- [ ] Link gerado
- [ ] Link copiado para clipboard
- [ ] Console: sem erros

### Abrir Anônimo
- [ ] Copiar link
- [ ] Abrir aba anônima (Ctrl+Shift+N)
- [ ] Colar link
- [ ] Página carrega
- [ ] Dados da corrida visíveis:
  - Origem
  - Destino
  - Status
  - Motorista (se atribuído)
- [ ] Console: sem erros

**ERROS ENCONTRADOS:**
```
(anotar aqui)
```

---

## 5. ENVIO EXTERNO

### Criar Contato
- [ ] Voltar para aba normal (logado)
- [ ] Ir para configurações ou contatos de emergência
- [ ] Clicar "Adicionar Contato"
- [ ] Preencher:
  - Nome: "Teste Staging"
  - Email: delivered@resend.dev
  - Relação: "Amigo"
- [ ] Salvar
- [ ] Contato aparece na lista
- [ ] Console: sem erros

### Acionar Alerta
- [ ] Clicar botão SOS novamente
- [ ] Confirmar
- [ ] Aguardar 5-10 segundos
- [ ] Console: sem erros

### Verificar Email
- [ ] Abrir https://resend.com/emails (se tiver acesso)
- [ ] OU verificar inbox de delivered@resend.dev
- [ ] Email recebido
- [ ] Assunto: "🚨 ALERTA DE EMERGÊNCIA"
- [ ] Conteúdo correto

### Verificar Log
- [ ] Abrir Supabase Dashboard
- [ ] Table Editor → emergency_delivery_log
- [ ] Filtrar por alert_id do alerta criado
- [ ] Log existe
- [ ] Status: sent
- [ ] Target: delivered@resend.dev
- [ ] Metadata com emailId
- [ ] Console: sem erros

**ERROS ENCONTRADOS:**
```
(anotar aqui)
```

---

## RESUMO DE ERROS DO CONSOLE

### Erros Críticos (bloqueantes)
```
(listar aqui)
```

### Erros Menores (não bloqueantes)
```
(listar aqui)
```

### Warnings
```
(listar aqui)
```

---

## VEREDITO

- [ ] ✅ TODOS OS FLUXOS FUNCIONARAM
- [ ] ⚠️ FLUXOS FUNCIONARAM COM ERROS MENORES
- [ ] ❌ ERROS CRÍTICOS ENCONTRADOS

**Staging fechado?** SIM / NÃO

**Justificativa:**
```
(escrever aqui)
```
