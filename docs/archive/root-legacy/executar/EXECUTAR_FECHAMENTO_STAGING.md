# EXECUTAR FECHAMENTO STAGING - PASSO A PASSO

**IMPORTANTE:** Este documento contém as ações OBRIGATÓRIAS para fechar staging.
Execute NA ORDEM e documente os resultados.

---

## 1. REATIVAR AUTENTICAÇÃO (10 min)

### 1.1 Habilitar Auth

1. Abrir https://supabase.com/dashboard
2. Selecionar projeto
3. Authentication → Providers
4. Email → Enable
5. Confirm email: Disable (para testes)
6. Save

### 1.2 Criar Usuários de Teste

**Admin:**
```
Email: admin@staging.local
Password: Admin123!@#
Role: admin
```

**Passageiro:**
```
Email: passageiro@staging.local
Password: Pass123!@#
Role: passenger
```

**Motorista:**
```
Email: motorista@staging.local
Password: Driver123!@#
Role: driver
```

### 1.3 Validar

- [ ] Login admin funciona
- [ ] Login passageiro funciona
- [ ] Logout funciona
- [ ] Token JWT gerado

**Resultado:** ✅ Auth reativada | ❌ Falhou

---

## 2. VALIDAR RLS COM AUTH REAL (30 min)

### 2.1 Teste: Acesso Próprios Dados

**Como passageiro@staging.local:**

1. Criar alerta de emergência
2. Listar alertas → deve ver apenas o próprio
3. Criar contato de emergência
4. Listar contatos → deve ver apenas os próprios

**Resultado esperado:** Vê apenas próprios dados

- [ ] Vê próprio alerta
- [ ] Vê próprio contato
- [ ] Não vê dados de outros usuários

**Resultado:** ✅ OK | ❌ Falhou

### 2.2 Teste: Bloqueio Dados Alheios

**Como passageiro@staging.local:**

1. Tentar acessar alerta de outro usuário (via API)
2. Tentar acessar contato de outro usuário (via API)

**Resultado esperado:** Acesso negado

- [ ] Erro 403 ou dados vazios
- [ ] Mensagem clara de acesso negado

**Resultado:** ✅ OK | ❌ Falhou

### 2.3 Teste: Pricing Público

**Como passageiro@staging.local:**

1. Listar regras de pricing → deve ver regras ativas
2. Tentar criar regra → deve falhar (apenas admin)

**Resultado esperado:** Leitura OK, escrita negada

- [ ] Vê regras ativas
- [ ] Não pode criar/editar regras

**Resultado:** ✅ OK | ❌ Falhou

### 2.4 Registrar Falhas

**Policies que falharam:**
- [ ] Nenhuma
- [ ] emergency_alerts
- [ ] emergency_contacts
- [ ] pricing_rules
- [ ] ride_shares
- [ ] safety_incidents
- [ ] Outras: ___________

**Resultado geral:** ✅ RLS OK | ⚠️ Falhas encontradas | ❌ RLS quebrado

---

## 3. RE-DEPLOY EDGE FUNCTION (15 min)

### 3.1 Deploy

```bash
cd supabase/functions
supabase functions deploy send-emergency-email
```

**Resultado esperado:**
```
Deploying send-emergency-email...
✓ Deployed send-emergency-email
```

- [ ] Deploy bem-sucedido
- [ ] Sem erros

**Resultado:** ✅ Deployado | ❌ Falhou

### 3.2 Testar Rate Limiting

```bash
node teste_rate_limiting.mjs
```

**Resultado esperado:**
```
✅ Emails enviados: 5
🚫 Emails bloqueados: 1+
✅ RATE LIMITING FUNCIONANDO!
```

- [ ] Máximo 5 emails enviados
- [ ] Pelo menos 1 bloqueado
- [ ] Log de bloqueio persistido

**Resultado:** ✅ Funciona | ❌ Não funciona

---

## 4. VALIDAR NO NAVEGADOR (1-2 horas)

### 4.1 Pricing Admin

**URL:** `/admin/pricing`  
**Login:** admin@staging.local

**Testes:**

1. **Listar regras**
   - [ ] Lista carrega
   - [ ] Regras exibidas corretamente
   - [ ] Console: sem erros

2. **Criar regra**
   - [ ] Modal abre
   - [ ] Campos preenchidos
   - [ ] Save funciona
   - [ ] Regra aparece na lista
   - [ ] Console: sem erros

3. **Editar regra**
   - [ ] Modal abre com dados
   - [ ] Alteração salva
   - [ ] Lista atualiza
   - [ ] Console: sem erros

4. **Ativar regra**
   - [ ] Botão funciona
   - [ ] Status muda para ativa
   - [ ] Console: sem erros

5. **Conflito**
   - [ ] Tentar criar regra conflitante
   - [ ] Erro exibido
   - [ ] Mensagem clara
   - [ ] Console: sem erros

6. **Auditoria**
   - [ ] Logs de criação visíveis
   - [ ] Logs de ativação visíveis
   - [ ] Console: sem erros

**Erros encontrados:**
```
(listar erros do console aqui)
```

**Resultado:** ✅ OK | ⚠️ Erros menores | ❌ Erros críticos

### 4.2 Criação de Corrida

**Login:** passageiro@staging.local

**Testes:**

1. **Criar corrida**
   - [ ] Formulário abre
   - [ ] Origem/destino preenchidos
   - [ ] Mode selecionado
   - [ ] Console: sem erros

2. **Cálculo de preço**
   - [ ] Preço calculado automaticamente
   - [ ] Base fare exibido
   - [ ] Preço por km exibido
   - [ ] Total correto
   - [ ] Console: sem erros

3. **Confirmar**
   - [ ] Corrida criada
   - [ ] Aparece na lista
   - [ ] Console: sem erros

**Erros encontrados:**
```
(listar erros do console aqui)
```

**Resultado:** ✅ OK | ⚠️ Erros menores | ❌ Erros críticos

### 4.3 Alerta de Emergência

**Login:** passageiro@staging.local

**Testes:**

1. **Acionar SOS**
   - [ ] Botão visível
   - [ ] Click funciona
   - [ ] Confirmação exibida
   - [ ] Console: sem erros

2. **Notificação**
   - [ ] Notificação exibida
   - [ ] Mensagem correta
   - [ ] Console: sem erros

3. **Persistência**
   - [ ] Alerta na lista
   - [ ] Status: active
   - [ ] Dados corretos
   - [ ] Console: sem erros

**Erros encontrados:**
```
(listar erros do console aqui)
```

**Resultado:** ✅ OK | ⚠️ Erros menores | ❌ Erros críticos

### 4.4 Compartilhamento de Viagem

**Login:** passageiro@staging.local

**Testes:**

1. **Gerar link**
   - [ ] Botão funciona
   - [ ] Link gerado
   - [ ] Link copiado
   - [ ] Console: sem erros

2. **Abrir anônimo**
   - [ ] Abrir em aba anônima
   - [ ] Dados da corrida visíveis
   - [ ] Origem/destino corretos
   - [ ] Status correto
   - [ ] Console: sem erros

**Erros encontrados:**
```
(listar erros do console aqui)
```

**Resultado:** ✅ OK | ⚠️ Erros menores | ❌ Erros críticos

### 4.5 Envio Externo

**Login:** passageiro@staging.local

**Testes:**

1. **Criar contato**
   - [ ] Formulário abre
   - [ ] Campos preenchidos
   - [ ] Email: delivered@resend.dev
   - [ ] Save funciona
   - [ ] Console: sem erros

2. **Acionar alerta**
   - [ ] Botão SOS
   - [ ] Confirmação
   - [ ] Console: sem erros

3. **Verificar email**
   - [ ] Email recebido em delivered@resend.dev
   - [ ] Conteúdo correto
   - [ ] Links funcionam

4. **Verificar log**
   - [ ] Log em emergency_delivery_log
   - [ ] Status: sent
   - [ ] Target: delivered@resend.dev
   - [ ] Console: sem erros

**Erros encontrados:**
```
(listar erros do console aqui)
```

**Resultado:** ✅ OK | ⚠️ Erros menores | ❌ Erros críticos

---

## 5. CONSOLIDAR RESULTADOS

### 5.1 Resumo de Validações

**Auth Real:**
- [ ] ✅ Reativada
- [ ] ✅ Usuários criados
- [ ] ✅ Login/logout funciona

**RLS:**
- [ ] ✅ Acesso próprios dados OK
- [ ] ✅ Bloqueio dados alheios OK
- [ ] ✅ Pricing público OK
- [ ] ⚠️ Falhas encontradas: ___________
- [ ] ❌ RLS quebrado

**Rate Limiting:**
- [ ] ✅ Edge Function deployada
- [ ] ✅ Bloqueio funciona
- [ ] ❌ Não funciona

**Navegador:**
- [ ] ✅ Pricing admin OK
- [ ] ✅ Criação de corrida OK
- [ ] ✅ Alerta de emergência OK
- [ ] ✅ Compartilhamento OK
- [ ] ✅ Envio externo OK
- [ ] ⚠️ Erros menores encontrados
- [ ] ❌ Erros críticos encontrados

### 5.2 Erros Críticos Encontrados

```
(listar todos os erros críticos aqui)
```

### 5.3 Correções Aplicadas

```
(listar correções aplicadas aqui)
```

---

## 6. VEREDITO FINAL

### Staging Fechado ✅

- [ ] Auth reativada e validada
- [ ] RLS funcionando com auth real
- [ ] Rate limiting funcionando
- [ ] Todos os fluxos funcionando no navegador
- [ ] Console sem erros críticos

**Staging está FECHADO e pronto para uso.**

### Staging Pronto com Ressalvas ⚠️

- [ ] Auth reativada e validada
- [ ] RLS funcionando com auth real
- [ ] Fluxos principais funcionando
- [ ] Erros menores encontrados (não bloqueantes)

**Staging está PRONTO mas com ressalvas documentadas.**

### Staging NÃO Fechado ❌

- [ ] Auth não validada
- [ ] RLS com falhas
- [ ] Rate limiting não funciona
- [ ] Erros críticos no navegador

**Staging NÃO está fechado. Bloqueantes identificados.**

---

## PRÓXIMA AÇÃO

Após completar este checklist, gerar:

**`RELATORIO_FINAL_STAGING_FECHADO.md`**

Com:
1. O que foi validado com auth real
2. O que foi validado no navegador
3. Erros encontrados
4. Correções aplicadas
5. Resultado do rate limiting
6. Riscos residuais reais
7. Veredito final

---

**Tempo estimado total:** 2-3 horas

**Início:** ___________  
**Término:** ___________
