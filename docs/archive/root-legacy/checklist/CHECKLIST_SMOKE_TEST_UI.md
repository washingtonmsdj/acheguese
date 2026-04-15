# CHECKLIST: SMOKE TEST MANUAL DA UI

**Data**: 2026-03-28  
**Ambiente**: Supabase Remote (xhdowzacfujckjelqhtd)  
**Objetivo**: Validar fluxos principais da UI manualmente NO NAVEGADOR

---

## ⚠️ IMPORTANTE

Este é um teste MANUAL de INTERFACE.

Você precisa:
- ✅ Abrir o navegador
- ✅ Clicar em botões
- ✅ Preencher formulários
- ✅ Ver a renderização visual
- ✅ Tirar screenshots

Você NÃO pode:
- ❌ Chamar RPCs diretamente
- ❌ Fazer INSERT no banco
- ❌ Validar "por suposição"
- ❌ Testar apenas o backend

---

## ANTES DE COMEÇAR

1. Iniciar aplicação:
```bash
npm run dev
```

2. Abrir navegador em: http://localhost:5173

3. Fazer login na aplicação

---

## INSTRUÇÕES

Execute cada teste abaixo e marque com ✅ ou ❌.

Para cada teste, anote:
- Caminho exato clicado na UI
- Campos preenchidos
- Ação feita (botão clicado)
- Resultado visual esperado
- Resultado visual obtido
- Print ou descrição da tela

---

## 1. CRIAR PERFIL BUSINESS

**Rota**: `/profiles/create` ou `/dashboard`

**Passos**:
1. [ ] Fazer login na aplicação
2. [ ] Navegar para criação de perfil
3. [ ] Selecionar tipo "Business"
4. [ ] Preencher campos obrigatórios:
   - Handle: `smoke-test-biz-[timestamp]`
   - Display Name: `Smoke Test Business`
   - Legal Name: `Empresa Teste LTDA`
   - CNPJ: `12345678000190`
   - Company Type: `ltda`
5. [ ] Clicar em "Criar Perfil"
6. [ ] Verificar que perfil foi criado com sucesso
7. [ ] Verificar que `business_data` foi criada (verificar no banco ou via API)

**Resultado Esperado**: Perfil business criado com extensão

**Resultado Obtido**: _______________________

**Status**: [ ] ✅ PASSOU  [ ] ❌ FALHOU

**Notas**: _______________________

---

## 2. CRIAR PERFIL PROFESSIONAL

**Rota**: `/profiles/create` ou `/dashboard`

**Passos**:
1. [ ] Navegar para criação de perfil
2. [ ] Selecionar tipo "Professional"
3. [ ] Preencher campos obrigatórios:
   - Handle: `smoke-test-prof-[timestamp]`
   - Display Name: `Smoke Test Professional`
   - Profession: `Desenvolvedor`
   - Specialties: `React, TypeScript`
   - Years Experience: `5`
4. [ ] Clicar em "Criar Perfil"
5. [ ] Verificar que perfil foi criado com sucesso
6. [ ] Verificar que `professional_data` foi criada

**Resultado Esperado**: Perfil professional criado com extensão

**Resultado Obtido**: _______________________

**Status**: [ ] ✅ PASSOU  [ ] ❌ FALHOU

**Notas**: _______________________

---

## 3. CRIAR PERFIL DRIVER

**Rota**: `/profiles/create` ou `/dashboard`

**Passos**:
1. [ ] Navegar para criação de perfil
2. [ ] Selecionar tipo "Driver"
3. [ ] Preencher campos obrigatórios:
   - Handle: `smoke-test-driver-[timestamp]`
   - Display Name: `Smoke Test Driver`
   - License Number: `ABC123456`
   - License Category: `B`
   - Vehicle Type: `car`
   - Vehicle Model: `Toyota Corolla 2021`
4. [ ] Clicar em "Criar Perfil"
5. [ ] Verificar que perfil foi criado com sucesso
6. [ ] Verificar que `driver_data` foi criada

**Resultado Esperado**: Perfil driver criado com extensão

**Resultado Obtido**: _______________________

**Status**: [ ] ✅ PASSOU  [ ] ❌ FALHOU

**Notas**: _______________________

---

## 4. ABRIR PERFIL PÚBLICO

**Rota**: `/p/:handle`

**Passos**:
1. [ ] Abrir navegador em modo anônimo (ou fazer logout)
2. [ ] Acessar `/p/smoke-test-biz-[timestamp]` (usar handle do teste 1)
3. [ ] Verificar que página carrega
4. [ ] Verificar que exibe:
   - Display Name
   - Handle
   - Bio (se preenchido)
   - Avatar (se preenchido)
   - Informações da empresa (Legal Name, CNPJ, etc.)
5. [ ] Verificar que NÃO exibe botões de edição

**Resultado Esperado**: Página pública renderiza com dados do perfil

**Resultado Obtido**: _______________________

**Status**: [ ] ✅ PASSOU  [ ] ❌ FALHOU

**Notas**: _______________________

---

## 5. ALTERAR PRIVACIDADE

**Rota**: `/settings/profile` ou `/profiles/:id/settings`

**Passos**:
1. [ ] Fazer login como owner do perfil business
2. [ ] Navegar para configurações do perfil
3. [ ] Ir para aba "Privacidade"
4. [ ] Desmarcar "Perfil Público" (is_public = false)
5. [ ] Salvar alterações
6. [ ] Verificar mensagem de sucesso
7. [ ] Abrir navegador anônimo
8. [ ] Tentar acessar `/p/smoke-test-biz-[timestamp]`
9. [ ] Verificar que retorna 404 ou "Perfil não encontrado"

**Resultado Esperado**: Perfil privado não acessível publicamente

**Resultado Obtido**: _______________________

**Status**: [ ] ✅ PASSOU  [ ] ❌ FALHOU

**Notas**: _______________________

---

## 6. CRIAR VÍNCULO (PROFILE LINK)

**Rota**: `/settings/profile` (aba Vínculos)

**Passos**:
1. [ ] Fazer login como owner do perfil business
2. [ ] Navegar para configurações do perfil
3. [ ] Ir para aba "Vínculos"
4. [ ] Clicar em "Adicionar Vínculo"
5. [ ] Selecionar perfil de destino (usar handle do teste 2 ou 3)
6. [ ] Selecionar tipo de vínculo: `partner`
7. [ ] Salvar vínculo
8. [ ] Verificar que vínculo aparece na lista
9. [ ] Abrir perfil público e verificar que vínculo aparece (se is_public=true)

**Resultado Esperado**: Vínculo criado e visível

**Resultado Obtido**: _______________________

**Status**: [ ] ✅ PASSOU  [ ] ❌ FALHOU

**Notas**: _______________________

---

## 7. ADICIONAR MEMBRO

**Rota**: `/settings/profile` (aba Membros)

**Passos**:
1. [ ] Fazer login como owner do perfil business
2. [ ] Navegar para configurações do perfil
3. [ ] Ir para aba "Membros"
4. [ ] Clicar em "Adicionar Membro"
5. [ ] Inserir email de outro usuário (criar novo se necessário)
6. [ ] Selecionar role: `member`
7. [ ] Salvar membro
8. [ ] Verificar que membro aparece na lista
9. [ ] Fazer login como o novo membro
10. [ ] Verificar que consegue ver o perfil business na lista de perfis

**Resultado Esperado**: Membro adicionado e tem acesso ao perfil

**Resultado Obtido**: _______________________

**Status**: [ ] ✅ PASSOU  [ ] ❌ FALHOU

**Notas**: _______________________

---

## RESUMO

**Total de Testes**: 7

**Passou**: ___ / 7

**Falhou**: ___ / 7

**Classificação Final**:
- [ ] ✅ PRONTO PARA PRODUÇÃO (7/7 passaram)
- [ ] ⚠️ HOMOLOGADO EM STAGING (5-6/7 passaram)
- [ ] ❌ NÃO HOMOLOGADO (< 5/7 passaram)

---

## NOTAS ADICIONAIS

_______________________
_______________________
_______________________

---

**FIM DO CHECKLIST**
