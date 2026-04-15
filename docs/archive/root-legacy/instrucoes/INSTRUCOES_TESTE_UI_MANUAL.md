# INSTRUÇÕES: TESTE UI MANUAL OBRIGATÓRIO

**Status Atual**: ✅ BACKEND HOMOLOGADO EM STAGING  
**Próximo Status**: PRONTO PARA PRODUÇÃO  
**Bloqueante**: UI real não testada

---

## POR QUE VOCÊ PRECISA FAZER ISSO

Os testes automatizados validaram que:
- ✅ RPCs funcionam
- ✅ Banco de dados funciona
- ✅ RLS funciona
- ✅ Views funcionam

Mas NÃO validaram que:
- ❌ Formulários renderizam
- ❌ Botões funcionam
- ❌ Navegação funciona
- ❌ Componentes React não quebram
- ❌ Usuário consegue usar a interface

---

## COMO EXECUTAR

### 1. Iniciar aplicação

```bash
npm run dev
```

Abrir navegador em: http://localhost:5173

---

## TESTE 1: CRIAR PERFIL BUSINESS

### Passos

1. [ ] Fazer login na aplicação
2. [ ] Navegar para criação de perfil (anotar caminho exato)
3. [ ] Selecionar tipo "Business"
4. [ ] Preencher campos:
   - Handle: `manual-test-biz-[timestamp]`
   - Display Name: `Manual Test Business`
   - Legal Name: `Empresa Manual LTDA`
   - CNPJ: `12345678000190`
   - Company Type: `ltda`
5. [ ] Clicar em botão "Criar" (ou equivalente)
6. [ ] Verificar mensagem de sucesso
7. [ ] Verificar que perfil aparece na lista

### Documentar

**Caminho UI**: _______________________

**Campos preenchidos**: _______________________

**Ação feita**: _______________________

**Resultado visual esperado**: Perfil criado, mensagem de sucesso, perfil na lista

**Resultado visual obtido**: _______________________

**Status**: [ ] ✅ PASSOU  [ ] ❌ FALHOU

**Print/Evidência**: (tirar screenshot ou descrever tela)

---

## TESTE 2: CRIAR PERFIL PROFESSIONAL

### Passos

1. [ ] Navegar para criação de perfil
2. [ ] Selecionar tipo "Professional"
3. [ ] Preencher campos:
   - Handle: `manual-test-prof-[timestamp]`
   - Display Name: `Manual Test Professional`
   - Profession: `Desenvolvedor`
   - Specialties: `React, TypeScript`
   - Years Experience: `5`
4. [ ] Clicar em "Criar"
5. [ ] Verificar sucesso

### Documentar

**Caminho UI**: _______________________

**Resultado**: [ ] ✅ PASSOU  [ ] ❌ FALHOU

**Print/Evidência**: _______________________

---

## TESTE 3: CRIAR PERFIL DRIVER

### Passos

1. [ ] Navegar para criação de perfil
2. [ ] Selecionar tipo "Driver"
3. [ ] Preencher campos:
   - Handle: `manual-test-driver-[timestamp]`
   - Display Name: `Manual Test Driver`
   - License Number: `ABC123456`
   - License Category: `B`
   - Vehicle Type: `car`
   - Vehicle Model: `Honda Civic 2020`
4. [ ] Clicar em "Criar"
5. [ ] Verificar sucesso

### Documentar

**Caminho UI**: _______________________

**Resultado**: [ ] ✅ PASSOU  [ ] ❌ FALHOU

**Print/Evidência**: _______________________

---

## TESTE 4: ABRIR /p/:handle NO NAVEGADOR

### Passos

1. [ ] Copiar handle de um perfil business criado
2. [ ] Abrir nova aba anônima (Ctrl+Shift+N)
3. [ ] Acessar: http://localhost:5173/p/[handle]
4. [ ] Verificar que página carrega
5. [ ] Verificar que exibe:
   - Display Name
   - Handle
   - Informações da empresa
   - Sem botões de edição

### Documentar

**Handle usado**: _______________________

**URL acessada**: _______________________

**Resultado visual esperado**: Página pública renderizada com dados do perfil

**Resultado visual obtido**: _______________________

**Status**: [ ] ✅ PASSOU  [ ] ❌ FALHOU

**Print/Evidência**: (screenshot da página)

---

## TESTE 5: ALTERAR PRIVACIDADE

### Passos

1. [ ] Fazer login como owner do perfil business
2. [ ] Navegar para settings do perfil (anotar caminho)
3. [ ] Ir para aba "Privacidade"
4. [ ] Desmarcar toggle "Perfil Público"
5. [ ] Clicar em "Salvar"
6. [ ] Verificar mensagem de sucesso
7. [ ] Abrir aba anônima
8. [ ] Acessar /p/[handle]
9. [ ] Verificar que retorna 404 ou "Perfil não encontrado"

### Documentar

**Caminho UI settings**: _______________________

**Toggle clicado**: _______________________

**Resultado antes**: Perfil visível publicamente

**Resultado depois**: _______________________

**Status**: [ ] ✅ PASSOU  [ ] ❌ FALHOU

**Print/Evidência**: (screenshot do 404)

---

## TESTE 6: CRIAR VÍNCULO

### Passos

1. [ ] Fazer login como owner do perfil business
2. [ ] Navegar para settings → Vínculos
3. [ ] Clicar em "Adicionar Vínculo" (ou equivalente)
4. [ ] Selecionar perfil de destino (usar handle do teste 2 ou 3)
5. [ ] Selecionar tipo: `partner`
6. [ ] Clicar em "Salvar"
7. [ ] Verificar que vínculo aparece na lista
8. [ ] Abrir /p/[handle] em aba anônima
9. [ ] Verificar que vínculo aparece na página pública

### Documentar

**Caminho UI**: _______________________

**Perfil vinculado**: _______________________

**Tipo de vínculo**: _______________________

**Resultado visual esperado**: Vínculo na lista e na página pública

**Resultado visual obtido**: _______________________

**Status**: [ ] ✅ PASSOU  [ ] ❌ FALHOU

**Print/Evidência**: _______________________

---

## TESTE 7: ADICIONAR MEMBRO

### Passos

1. [ ] Fazer login como owner do perfil business
2. [ ] Navegar para settings → Membros
3. [ ] Clicar em "Adicionar Membro" (ou equivalente)
4. [ ] Inserir email de outro usuário
5. [ ] Selecionar role: `member`
6. [ ] Clicar em "Salvar"
7. [ ] Verificar que membro aparece na lista
8. [ ] Fazer login como o novo membro
9. [ ] Verificar que perfil business aparece na lista de perfis

### Documentar

**Caminho UI**: _______________________

**Email do membro**: _______________________

**Resultado visual esperado**: Membro na lista, membro vê o perfil

**Resultado visual obtido**: _______________________

**Status**: [ ] ✅ PASSOU  [ ] ❌ FALHOU

**Print/Evidência**: _______________________

---

## COMO DOCUMENTAR RESULTADOS

### Para cada teste, anote:

1. **Caminho UI**: Onde você clicou (ex: "Dashboard → Criar Perfil → Business")
2. **Campos preenchidos**: Valores inseridos nos inputs
3. **Ação feita**: Botão clicado (ex: "Botão 'Criar Perfil'")
4. **Resultado visual esperado**: O que deveria aparecer na tela
5. **Resultado visual obtido**: O que realmente apareceu
6. **Status**: ✅ PASSOU ou ❌ FALHOU
7. **Print/Evidência**: Screenshot ou descrição detalhada da tela

---

## APÓS EXECUTAR OS 7 TESTES

### Se 7/7 passarem

**Classificação**: ✅ PRONTO PARA PRODUÇÃO

**Justificativa**:
- Backend: 40/40 testes
- Interface: 7/7 testes
- Total: 47/47 testes (100%)

### Se 5-6/7 passarem

**Classificação**: ⚠️ INTERFACE HOMOLOGADA EM STAGING

**Justificativa**:
- Backend: 100%
- Interface: 71-85%
- Bugs menores de UI não bloqueantes

### Se < 5/7 passarem

**Classificação**: ❌ INTERFACE NÃO HOMOLOGADA

**Justificativa**:
- Backend: 100%
- Interface: < 71%
- Bugs críticos de UI bloqueantes

---

## RESUMO

**Status Atual**: ✅ BACKEND HOMOLOGADO EM STAGING

**Testes Backend**: 40/40 (100%)

**Testes UI Real**: 0/7 (0%)

**Bloqueante**: UI real não testada

**Ação Necessária**: Você executar os 7 testes manualmente no navegador

---

**FIM DAS INSTRUÇÕES**
