# GATE 2: VALIDAÇÃO OPERACIONAL REAL - INSTRUÇÕES COMPLETAS

**Data:** 07/04/2026  
**Status:** AGUARDANDO VALIDAÇÃO OPERACIONAL

---

## CONTEXTO

Gate 2 está com:
- ✅ Fundação Técnica: 95% (schema + índices + migration aplicada)
- ✅ Implementado Funcionalmente: 75% (TrackingService + mapeamento correto)
- ❌ Validado Operacionalmente: 10% (BLOQUEADO por RLS)
- ❌ Pronto para Produção: 5%

**Bloqueador:** Testes E2E falharam porque RLS exige autenticação real. Não vamos contornar RLS, vamos validar no cenário real.

---

## PASSO 1: CRIAR USUÁRIO MOTORISTA DE TESTE

### 1.1 Acessar Dashboard de Autenticação

```
https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd/auth/users
```

### 1.2 Criar Novo Usuário

Clique em "Add User" e preencha:

- **Email:** `test-driver@acheguese.local`
- **Password:** `TestDriver123!@#`
- **Auto Confirm Email:** ✅ SIM (marcar checkbox)

Clique em "Create User".

### 1.3 Copiar UUID do Usuário

Após criar, o dashboard mostrará o UUID do usuário. Copie para referência.

---

## PASSO 2: CRIAR PERFIL E DRIVER_DATA

### 2.1 Acessar SQL Editor

```
https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd/sql/new
```

### 2.2 Executar Script

Copie e cole o conteúdo de `scripts/create-test-driver.sql` no SQL Editor.

O script vai:
1. Buscar automaticamente o usuário pelo email `test-driver@acheguese.local`
2. Criar `profiles` com `profile_type = 'driver'`
3. Criar `driver_data` com `is_online = true`, `is_available = true`
4. Mostrar os IDs criados

### 2.3 Validar Criação

O script termina com uma query de validação. Você deve ver:

```
profile_id | user_id | username | profile_type | is_online | is_available
-----------|---------|----------|--------------|-----------|-------------
[UUID]     | [UUID]  | test_driver | driver    | true      | true
```

---

## PASSO 3: CONFIGURAR AMBIENTE DE TESTE

### 3.1 Criar Arquivo .env.test

Crie o arquivo `.env.test` na raiz do projeto:

```bash
# Supabase
VITE_SUPABASE_URL=https://xhdowzacfujckjelqhtd.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=[SUA_ANON_KEY]

# Test Driver
TEST_DRIVER_EMAIL=test-driver@acheguese.local
TEST_DRIVER_PASSWORD=TestDriver123!@#
```

⚠️ **IMPORTANTE:** Não commitar este arquivo. Já está no `.gitignore`.

---

## PASSO 4: EXECUTAR VALIDAÇÃO OPERACIONAL

### 4.1 Via NPM

```bash
npm run test tests/operational/gate2-real-auth-validation.test.ts
```

### 4.2 Via PowerShell (Automatizado)

```powershell
.\validar-gate2-real.ps1
```

O script PowerShell vai:
1. Verificar se `.env.test` existe
2. Executar o teste operacional
3. Gerar relatório de evidências
4. Medir latências

---

## PASSO 5: VALIDAÇÕES OBRIGATÓRIAS

O teste vai validar:

### 5.1 Publicação de Localização
- ✅ Motorista autenticado publica localização
- ✅ `driver_locations` recebe todos os campos (lat, lng, accuracy, heading, speed, altitude)
- ✅ Timestamp atualizado corretamente

### 5.2 Update Subsequente (Upsert)
- ✅ Segunda publicação atualiza a mesma linha
- ✅ Não cria linha duplicada
- ✅ UNIQUE constraint funcionando

### 5.3 Realtime
- ✅ Listener recebe a posição publicada
- ✅ Payload contém todos os campos
- ✅ Latência < 5 segundos

### 5.4 Reconexão
- ✅ Motorista perde conexão e reconecta
- ✅ Volta a publicar corretamente
- ✅ Listener volta a receber corretamente

### 5.5 Latências Medidas
- Publicação → Persistência: < 1s
- Persistência → Realtime: < 2s
- Ponta a ponta: < 5s

---

## PASSO 6: EVIDÊNCIAS ESPERADAS

O teste vai gerar:

```
GATE 2 - VALIDAÇÃO OPERACIONAL REAL
====================================

✅ Auth User: [UUID]
✅ Profile ID: [UUID]
✅ Publicação validada: SIM
✅ Update validado: SIM
✅ Realtime validado: SIM
✅ Latência publicação: 234ms
✅ Latência realtime: 1.2s
✅ Latência total: 1.4s
✅ Reconexão validada: SIM

VEREDITO: GATE 2 FECHADO ✅
```

---

## PASSO 7: FECHAR GATE 2

Após validação bem-sucedida:

1. Atualizar `AUDITORIA_MOBILIDADE_RIGOROSA.md`:
   - Validado Operacionalmente: 20% → 40% (+20%)
   - Pronto para Produção: 10% → 25% (+15%)

2. Criar `GATE_2_FECHAMENTO_FINAL.md` com:
   - Evidências objetivas
   - Latências medidas
   - Cenários de falha testados
   - Veredito final

3. Seguir para Gate 3 (Cancelamento de Corrida)

---

## TROUBLESHOOTING

### Erro: "Usuário não encontrado"
- Verifique se criou o usuário no Dashboard
- Verifique se o email está correto: `test-driver@acheguese.local`
- Verifique se marcou "Auto Confirm Email"

### Erro: "Profile já existe"
- Normal se executar o script múltiplas vezes
- Script é idempotente, pode executar novamente

### Erro: "RLS policy violation"
- Verifique se o usuário está autenticado no teste
- Verifique se o `driver_profile_id` corresponde ao `auth.uid()`
- Verifique se a policy `driver_locations_driver_policy` existe

### Teste falha em "Realtime"
- Verifique se o Realtime está habilitado no Supabase
- Verifique se a tabela `driver_locations` tem Realtime habilitado
- Aumente o timeout se a latência estiver alta

---

## PRÓXIMOS PASSOS

Após fechar Gate 2:
- **Gate 3:** Cancelamento de Corrida (2-3h)
- **Gate 4:** Reconexão Automática (3-4h)
- **Gate 5:** Validação E2E Completa (4-5h)
- **Gate 6:** Observabilidade (2-3h)

**NÃO iniciar motoboy antes de fechar os 6 Gates.**
