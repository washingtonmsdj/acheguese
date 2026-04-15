# CHECKLIST TESTE MANUAL UI - 7 FLUXOS

**Antes de Começar**: Aplicar migration do RPC via SQL Editor (ver instruções abaixo)

---

## APLICAR MIGRATION (OBRIGATÓRIO)

1. Abrir: https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd/sql
2. Clicar "New Query"
3. Copiar e colar conteúdo de `scripts/aplicar-rpc-invite-member.sql`
4. Clicar "Run"
5. Verificar: "Success" no output

**Validar Segurança**:
```sql
SELECT invite_profile_member_by_email('profile-id-qualquer', 'teste@exemplo.com', 'member');
```

**Esperado**: `{ "success": false, "error": "Sem permissão" }` (isso é BOM, significa que valida permissões)

---

## TESTES MANUAIS

### ✅ Teste 1: Trocar Perfil Ativo

**Passos**:
1. Fazer login na aplicação
2. Olhar no topo da tela (header)
3. Verificar se aparece dropdown de perfis
4. Clicar no dropdown
5. Selecionar outro perfil
6. Verificar se nome do perfil mudou no dropdown

**Resultado Esperado**: ✅ Perfil ativo muda, dropdown atualiza

**Status**: [ ] PASSOU  [ ] FALHOU

**Observações**: _______________________________________________

---

### ✅ Teste 2: Criar Perfil Business

**Passos**:
1. Ir em `/perfil`
2. Clicar "Nova Empresa"
3. Preencher formulário (3 etapas):
   - Nome, descrição, categoria
   - Telefone, endereço, modos de atendimento
   - Redes sociais, formas de pagamento
4. Clicar "Criar Empresa"
5. Verificar navegação para `/p/:handle`
6. Verificar se perfil foi criado

**Resultado Esperado**: ✅ Empresa criada, perfil público renderizado

**Status**: [ ] PASSOU  [ ] FALHOU

**Observações**: _______________________________________________

---

### ✅ Teste 3: Criar Perfil Professional

**Passos**:
1. Ir em `/perfil`
2. Clicar "Novo Serviço"
3. Preencher formulário (4 etapas):
   - Nome, categoria, título do serviço
   - Bairros de atendimento, experiência
   - Telefone, WhatsApp
   - Revisão
4. Clicar "Cadastrar Serviço"
5. Verificar navegação para `/p/:handle`
6. Verificar se perfil foi criado

**Resultado Esperado**: ✅ Serviço criado, perfil público renderizado

**Status**: [ ] PASSOU  [ ] FALHOU

**Observações**: _______________________________________________

---

### ✅ Teste 4: Criar Perfil Driver

**Passos**:
1. Ir em `/perfil`
2. Clicar "Cadastrar como Motorista"
3. Verificar navegação para `/create-driver`
4. Preencher formulário:
   - Nome completo
   - Número da CNH, categoria
   - Placa, modelo, ano, cor
5. Clicar "Enviar Cadastro"
6. Verificar navegação para `/p/:handle`
7. Verificar se perfil foi criado

**Resultado Esperado**: ✅ Motorista criado, perfil público renderizado

**Status**: [ ] PASSOU  [ ] FALHOU

**Observações**: _______________________________________________

---

### ✅ Teste 5: Abrir /p/:handle

**Passos**:
1. Copiar handle de um perfil criado
2. Abrir `/p/:handle` no navegador
3. Verificar renderização:
   - Avatar, nome, handle, bio
   - Extensão (business/professional/driver)
   - Vínculos públicos (se houver)
4. Testar perfil privado (deve retornar 404)

**Resultado Esperado**: ✅ Perfil público renderiza, privado retorna 404

**Status**: [ ] PASSOU  [ ] FALHOU

**Observações**: _______________________________________________

---

### ✅ Teste 6: Alterar Privacidade

**Passos**:
1. Ir em `/perfil/configuracoes`
2. Clicar tab "Privacidade"
3. Alterar toggle "Perfil Público" (ligar/desligar)
4. Alterar toggles granulares (email, telefone, vínculos)
5. Clicar "Salvar Alterações"
6. Verificar toast de sucesso
7. Abrir `/p/:handle` em aba anônima
8. Verificar se mudanças refletiram

**Resultado Esperado**: ✅ Configurações salvas, perfil público reflete mudanças

**Status**: [ ] PASSOU  [ ] FALHOU

**Observações**: _______________________________________________

---

### ✅ Teste 7: Criar Vínculo

**Passos**:
1. Criar 2 perfis (ex: business + professional)
2. Ir em `/perfil/configuracoes`
3. Clicar tab "Vínculos"
4. Clicar "Adicionar Vínculo"
5. Selecionar perfil de destino
6. Selecionar tipo (ex: "Proprietário")
7. Toggle "Vínculo público" (ligar)
8. Clicar "Criar Vínculo"
9. Verificar toast de sucesso
10. Abrir `/p/:handle` do perfil origem
11. Verificar se vínculo aparece

**Resultado Esperado**: ✅ Vínculo criado, aparece no perfil público

**Status**: [ ] PASSOU  [ ] FALHOU

**Observações**: _______________________________________________

---

### ✅ Teste 8: Adicionar Membro (SEGURO)

**Passos**:
1. Criar perfil business ou professional
2. Ir em `/perfil/configuracoes`
3. Clicar tab "Membros"
4. Clicar "Adicionar Membro"
5. Digitar email de usuário existente
6. Selecionar role (ex: "Membro")
7. Clicar "Adicionar"
8. Verificar toast de sucesso
9. Verificar membro na lista

**Resultado Esperado**: ✅ Membro adicionado, SEM exposição de user_id

**Validação de Segurança**: Front-end nunca vê user_id, operação é atômica no backend

**Status**: [ ] PASSOU  [ ] FALHOU

**Observações**: _______________________________________________

---

## RESULTADO FINAL

**Total de Testes**: 8  
**Passaram**: ___  
**Falharam**: ___

**Classificação**:
- 8/8: 🟢 PRONTO PARA PRODUÇÃO
- 7/8: 🟡 QUASE PRONTO (corrigir 1 bug)
- 6/8 ou menos: 🔴 PRECISA CORREÇÕES

---

## BUGS ENCONTRADOS

Se algum teste falhou, descreva:

**Teste #**: ___  
**Problema**: _______________________________________________  
**Erro**: _______________________________________________  
**Screenshot/Log**: _______________________________________________

---

**Próxima Ação**: Preencher checklist após testes manuais e reportar resultado.
