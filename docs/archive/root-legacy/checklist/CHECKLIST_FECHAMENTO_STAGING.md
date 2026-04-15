# CHECKLIST - FECHAMENTO STAGING

**Data:** 06/04/2026  
**Status:** ⚠️ AGUARDA VALIDAÇÕES MANUAIS OBRIGATÓRIAS

---

## VALIDAÇÕES AUTOMATIZADAS ✅

### Concluído
- [x] RLS: 11/11 tabelas acessíveis
- [x] E2E: 7/7 fluxos funcionando
- [x] Tabelas safety criadas
- [x] Policies aplicadas

### Falhou
- [ ] Rate limiting: NÃO funcionando (Edge Function não deployada)

---

## VALIDAÇÕES MANUAIS OBRIGATÓRIAS ⚠️

### 1. REATIVAR AUTENTICAÇÃO

**Ação:**
1. Abrir Supabase Dashboard
2. Authentication → Settings
3. Enable Email Provider
4. Configurar SMTP (ou usar built-in)
5. Save

**Criar usuário de teste:**
1. Authentication → Users
2. Add User
3. Email: `teste@staging.com`
4. Password: `Teste123!`
5. Confirm

**Validar:**
- [ ] Login funciona
- [ ] Logout funciona
- [ ] Token JWT gerado

---

### 2. VALIDAR RLS COM AUTH REAL

**Preparação:**
Criar script de teste com usuário authenticated (não service_role).

**Testes:**

1. **Acesso próprios dados:**
   - [ ] Usuário A cria alerta
   - [ ] Usuário A vê próprio alerta
   - [ ] Usuário A cria contato
   - [ ] Usuário A vê próprio contato

2. **Bloqueio dados alheios:**
   - [ ] Usuário A NÃO vê alertas do Usuário B
   - [ ] Usuário A NÃO vê contatos do Usuário B
   - [ ] Usuário A NÃO pode editar dados do Usuário B

3. **Pricing (público):**
   - [ ] Usuário authenticated vê regras ativas
   - [ ] Usuário authenticated NÃO pode criar regras
   - [ ] Apenas admin pode criar/editar regras

**Resultado esperado:**
- Acesso restrito funcionando
- Sem bypass indevido
- Erros claros quando acesso negado

---

### 3. VALIDAR NO NAVEGADOR

#### 3.1 Pricing Admin (`/admin/pricing`)

**Login como admin:**
- Email: admin@staging.com
- Password: (configurar)

**Testes:**
- [ ] Listar regras existentes
- [ ] Criar nova regra
  - Mode: ride
  - Name: Teste Staging
  - Base fare: 5.00
  - Price per km: 2.50
  - Save
- [ ] Editar regra criada
  - Alterar base fare para 6.00
  - Save
- [ ] Ativar regra
  - Clicar em "Ativar"
  - Confirmar
- [ ] Tentar criar regra conflitante
  - Mode: ride (mesmo da ativa)
  - Verificar erro de conflito
- [ ] Verificar auditoria
  - Ver log de criação
  - Ver log de ativação
- [ ] Console: sem erros críticos

**Resultado esperado:**
- CRUD completo funciona
- Conflito detectado
- Auditoria registrada
- Console limpo

#### 3.2 Criação de Corrida

**Login como passageiro:**
- Email: passageiro@staging.com

**Testes:**
- [ ] Acessar módulo de corridas
- [ ] Criar nova corrida
  - Origem: Av Paulista, 1000
  - Destino: Av Faria Lima, 2000
  - Mode: ride
- [ ] Verificar cálculo de preço
  - Base fare exibido
  - Preço por km calculado
  - Total correto
- [ ] Confirmar corrida
- [ ] Console: sem erros críticos

**Resultado esperado:**
- Pricing aplicado corretamente
- Valores consistentes
- Console limpo

#### 3.3 Alerta de Emergência

**Login como passageiro:**

**Testes:**
- [ ] Acessar módulo de segurança
- [ ] Acionar botão de emergência
  - Clicar em "SOS"
  - Confirmar
- [ ] Verificar alerta criado
  - Ver na lista de alertas
  - Status: active
- [ ] Verificar notificação
  - Notificação exibida
  - Mensagem correta
- [ ] Verificar persistência
  - Alerta no banco
  - Log de auditoria
- [ ] Console: sem erros críticos

**Resultado esperado:**
- Alerta criado
- Notificação enviada
- Persistência OK
- Console limpo

#### 3.4 Compartilhamento de Viagem

**Login como passageiro:**

**Testes:**
- [ ] Criar corrida
- [ ] Gerar link de compartilhamento
  - Clicar em "Compartilhar"
  - Copiar link
- [ ] Abrir link em aba anônima
  - Colar URL
  - Verificar dados da corrida
  - Origem/destino visíveis
  - Status visível
- [ ] Console: sem erros críticos

**Resultado esperado:**
- Link gerado
- Dados visíveis sem login
- Console limpo

#### 3.5 Envio Externo

**Login como passageiro:**

**Testes:**
- [ ] Criar contato de emergência
  - Nome: Teste Staging
  - Email: delivered@resend.dev
  - Relationship: teste
  - Save
- [ ] Acionar alerta
  - Botão SOS
  - Confirmar
- [ ] Verificar email recebido
  - Checar inbox delivered@resend.dev
  - Email chegou
  - Conteúdo correto
- [ ] Verificar log persistido
  - emergency_delivery_log
  - Status: sent
  - Target: delivered@resend.dev
- [ ] Console: sem erros críticos

**Resultado esperado:**
- Email enviado
- Log persistido
- Console limpo

---

### 4. RATE LIMITING

**Ação obrigatória:**
1. Re-deploy Edge Function
   ```bash
   supabase functions deploy send-emergency-email
   ```

2. Executar teste
   ```bash
   node teste_rate_limiting.mjs
   ```

**Resultado esperado:**
- 5 emails enviados
- 1+ emails bloqueados
- Log de bloqueio persistido

---

## CRITÉRIO DE ACEITE

### Staging Fechado ✅

- [ ] Auth reativada
- [ ] RLS validado com auth real
- [ ] Pricing admin funcionando no navegador
- [ ] Criação de corrida funcionando no navegador
- [ ] Alerta de emergência funcionando no navegador
- [ ] Compartilhamento funcionando no navegador
- [ ] Envio externo funcionando no navegador
- [ ] Console sem erros críticos
- [ ] Rate limiting funcionando

### Staging Pronto com Ressalvas ⚠️

- [ ] Auth reativada
- [ ] RLS validado com auth real
- [ ] Fluxos principais funcionando no navegador
- [ ] Console sem erros críticos
- Rate limiting pendente (não bloqueante para staging)

---

## APÓS COMPLETAR

Executar:
```bash
node verificar_rls_completo.mjs
node hardening_teste_e2e_fluxos.mjs
```

Ambos devem passar com 100%.

---

## TEMPO ESTIMADO

- Reativar auth: 10 minutos
- Validar RLS: 30 minutos
- Testar navegador: 1-2 horas
- Rate limiting: 15 minutos

**Total: 2-3 horas**

---

## PRÓXIMA AÇÃO

1. Reativar autenticação no Supabase Dashboard
2. Criar usuários de teste
3. Executar validações manuais acima
4. Documentar resultados
5. Gerar relatório final
