# 🚀 GUIA RÁPIDO - VALIDAÇÃO MANUAL MOTOBOY

**Servidor:** http://localhost:8082/  
**Status:** ✅ RODANDO

---

## 📋 CHECKLIST RÁPIDO

### 1️⃣ PREPARAÇÃO (5 min)
- [x] Servidor rodando: http://localhost:8082/
- [ ] Abrir navegador em: http://localhost:8082/
- [ ] Abrir console do navegador (F12)
- [ ] Ter 2 perfis/abas prontos:
  - Aba 1: Usuário Solicitante (passageiro/empresa)
  - Aba 2: Usuário Motoboy (motorista com can_do_delivery)

### 2️⃣ TESTE BÁSICO (10 min)
**Objetivo:** Validar fluxo completo mínimo

1. **Como Solicitante (Aba 1):**
   - [ ] Login/Cadastro
   - [ ] Criar entrega de teste
   - [ ] Verificar se entrega foi criada

2. **Como Motoboy (Aba 2):**
   - [ ] Login como motorista
   - [ ] Verificar se entrega aparece na lista
   - [ ] Aceitar entrega
   - [ ] Confirmar coleta
   - [ ] Iniciar entrega
   - [ ] Confirmar entrega

3. **Validar Resultado:**
   - [ ] Entrega aparece como concluída
   - [ ] Comprovante de entrega salvo
   - [ ] Sem erros no console

### 3️⃣ TESTE COMPLETO (1-2h)
Seguir: `VALIDACAO_MANUAL_EXECUTADA.md`

---

## 🔑 ACESSO RÁPIDO

### URLs Importantes
- **Home:** http://localhost:8082/
- **Login:** http://localhost:8082/login
- **Cadastro Motoboy:** http://localhost:8082/create-driver?type=motoboy
- **Dashboard Motorista:** http://localhost:8082/driver/dashboard
- **Perfil:** http://localhost:8082/perfil/identidades

### Credenciais de Teste
**IMPORTANTE:** Use credenciais reais do banco Supabase

**Opção 1: Usar fixtures dos testes**
- Verificar: `tests/fixtures/gate6-fixtures.json`
- Usuários: passengerB, passengerC, driverB, driverC

**Opção 2: Criar novos usuários**
1. Acessar http://localhost:8082/
2. Criar conta nova
3. Habilitar perfil de motorista/motoboy

---

## 🧪 FLUXO MÍNIMO DE VALIDAÇÃO

### Passo 1: Preparar Motoboy
```
1. Abrir http://localhost:8082/create-driver?type=motoboy
2. Preencher formulário
3. Submeter
4. Verificar se perfil foi criado
```

### Passo 2: Criar Entrega
```
1. Login como solicitante
2. Navegar para área de entregas
3. Clicar "Solicitar Motoboy"
4. Preencher:
   - Destinatário: João Silva
   - Endereço: Av. Paulista, 1000
   - Tamanho: small
   - Descrição: Documentos
5. Submeter
```

### Passo 3: Aceitar e Executar
```
1. Login como motoboy
2. Ir para dashboard
3. Ver entrega na lista
4. Aceitar entrega
5. Confirmar coleta
6. Iniciar entrega
7. Confirmar entrega com comprovante
```

### Passo 4: Validar
```
1. Verificar status final: "completed" ou "delivered"
2. Verificar comprovante salvo
3. Verificar histórico
4. Verificar console sem erros
```

---

## 🐛 PROBLEMAS COMUNS

### Servidor não inicia
```powershell
# Parar processo
Get-Process -Name node | Stop-Process -Force

# Reiniciar
. ./scripts/security/Import-LocalSupabaseSecrets.ps1
npm run dev
```

### Credenciais não carregadas
```powershell
# Verificar se arquivo existe
Test-Path "$env:APPDATA\Ordax\Secrets\xhdowzacfujckjelqhtd\supabase-secrets.json.dpapi"

# Recarregar
. ./scripts/security/Import-LocalSupabaseSecrets.ps1
```

### Porta em uso
```
Vite automaticamente tenta outra porta
Verificar output do servidor para ver porta atual
```

---

## 📊 CRITÉRIOS DE SUCESSO

### Mínimo Aceitável (MVP)
- ✅ Motoboy consegue se cadastrar
- ✅ Solicitante consegue criar entrega
- ✅ Motoboy vê entrega na lista
- ✅ Motoboy consegue aceitar entrega
- ✅ Fluxo completo funciona (coleta → entrega → conclusão)
- ✅ Comprovante de entrega é salvo
- ✅ Sem erros críticos no console

### Ideal (Produção)
- ✅ Todos os itens do MVP
- ✅ Filtros funcionam
- ✅ Realtime funciona
- ✅ Histórico funciona
- ✅ Segurança/RLS funciona
- ✅ Falha na entrega funciona
- ✅ UI responsiva e sem bugs visuais

---

## 📝 DOCUMENTAR RESULTADOS

### Durante os Testes
1. Anotar cada problema encontrado
2. Capturar screenshots de erros
3. Copiar mensagens de erro do console
4. Anotar comportamentos inesperados

### Após os Testes
1. Atualizar `VALIDACAO_MANUAL_EXECUTADA.md`
2. Marcar checkboxes como concluídos
3. Adicionar seção "Problemas Encontrados"
4. Atualizar `STATUS_OPERACIONAL.md`

---

## 🎯 PRÓXIMA AÇÃO

**AGORA:**
1. Abrir navegador em http://localhost:8082/
2. Verificar se aplicação carrega
3. Começar validação pelo Teste 1 (Cadastro/Perfil)

**Documentação:**
- Checklist completo: `VALIDACAO_MANUAL_EXECUTADA.md`
- Guia detalhado: `docs/mobility/motoboy/GUIA_VALIDACAO_MANUAL.md`

---

**Boa validação! 🚀**
