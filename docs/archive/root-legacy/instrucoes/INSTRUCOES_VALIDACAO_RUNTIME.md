# INSTRUÇÕES PARA VALIDAÇÃO EM RUNTIME

## PRÉ-REQUISITOS

1. ✅ Servidor de desenvolvimento rodando
2. ✅ Banco de dados com migrations aplicadas
3. ✅ RLS desabilitado temporariamente (para testes)
4. ✅ Usuário admin autenticado

---

## FLUXO 1: ACESSAR PÁGINA

### Ação
1. Abrir navegador
2. Acessar `http://localhost:8080/admin/pricing`

### Resultado Esperado
- ✅ Página carrega sem erros
- ✅ Header exibe "Gerenciamento de Pricing"
- ✅ Botões visíveis: "Ver Auditoria", "Refresh", "Nova Regra"
- ✅ Lista de regras agrupadas por modalidade

### Validação
- [ ] Página carregou
- [ ] Sem erros no console
- [ ] Regras exibidas corretamente

---

## FLUXO 2: LISTAR REGRAS

### Ação
1. Observar lista de regras na página

### Resultado Esperado
- ✅ Regras agrupadas por modalidade (Corrida, Entrega, Mototáxi, Motoboy)
- ✅ Cada regra exibe:
  - Nome
  - Badge de status (Ativa/Inativa)
  - Valores (Base, Por km, Por min, Mínimo, Máximo)
  - Contadores de multiplicadores e taxas
  - Botões de ação (Editar, Ativar/Desativar)

### Validação
- [ ] Regras agrupadas corretamente
- [ ] Valores exibidos corretamente
- [ ] Badges de status corretos
- [ ] Botões de ação visíveis

---

## FLUXO 3: CRIAR REGRA

### Ação
1. Clicar "Nova Regra"
2. Preencher form:
   - Modalidade: Corrida
   - Nome: "Teste Corrida"
   - Tarifa Base: 5.00
   - Preço por Km: 2.50
   - Preço por Minuto: 0.50
   - Valor Mínimo: 8.00
   - Valor Máximo: (deixar vazio)
   - Regra Ativa: Desativada
3. Clicar "Criar"

### Resultado Esperado
- ✅ Toast de sucesso: "Regra criada com sucesso"
- ✅ Dialog fecha
- ✅ Lista atualiza automaticamente
- ✅ Nova regra aparece na lista

### Validação
- [ ] Regra criada
- [ ] Toast exibido
- [ ] Lista atualizada
- [ ] Sem erros no console

---

## FLUXO 4: EDITAR REGRA

### Ação
1. Clicar ícone de editar na regra "Teste Corrida"
2. Alterar:
   - Nome: "Teste Corrida Editada"
   - Tarifa Base: 6.00
3. Clicar "Atualizar"

### Resultado Esperado
- ✅ Toast de sucesso: "Regra atualizada com sucesso"
- ✅ Dialog fecha
- ✅ Lista atualiza automaticamente
- ✅ Regra exibe novos valores

### Validação
- [ ] Regra atualizada
- [ ] Toast exibido
- [ ] Lista atualizada
- [ ] Valores corretos

---

## FLUXO 5: ATIVAR REGRA

### Ação
1. Clicar ícone de power (verde) na regra "Teste Corrida Editada"

### Resultado Esperado
- ✅ Toast de sucesso: "Regra ativada"
- ✅ Badge muda para "Ativa"
- ✅ Ícone muda para power off (vermelho)

### Validação
- [ ] Regra ativada
- [ ] Toast exibido
- [ ] Badge atualizado
- [ ] Ícone atualizado

---

## FLUXO 6: CONFLITO DE REGRA ATIVA

### Ação
1. Tentar ativar outra regra de "Corrida" (se houver)
2. OU criar nova regra de "Corrida" com status "Ativa"

### Resultado Esperado
- ✅ Toast de erro: "Conflito: já existe regra ativa para este modo"
- ✅ Operação não é realizada
- ✅ Regra anterior permanece ativa

### Validação
- [ ] Erro de conflito detectado
- [ ] Toast exibido
- [ ] Operação bloqueada
- [ ] Estado consistente

---

## FLUXO 7: VER AUDITORIA

### Ação
1. Clicar "Ver Auditoria"

### Resultado Esperado
- ✅ Seção de auditoria expande
- ✅ Lista de alterações exibida
- ✅ Cada entrada mostra:
  - Badge de ação (Criada, Atualizada, Ativada, Desativada)
  - Nome da regra
  - Modo
  - Timestamp relativo (ex: "há 2 minutos")

### Validação
- [ ] Auditoria exibida
- [ ] Alterações listadas
- [ ] Dados corretos
- [ ] Timestamps corretos

---

## FLUXO 8: DESATIVAR REGRA

### Ação
1. Clicar ícone de power off (vermelho) na regra ativa

### Resultado Esperado
- ✅ Toast de sucesso: "Regra desativada"
- ✅ Badge muda para "Inativa"
- ✅ Ícone muda para power (verde)

### Validação
- [ ] Regra desativada
- [ ] Toast exibido
- [ ] Badge atualizado
- [ ] Ícone atualizado

---

## FLUXO 9: REFRESH

### Ação
1. Clicar botão "Refresh"

### Resultado Esperado
- ✅ Ícone gira (animação de loading)
- ✅ Lista recarrega
- ✅ Dados atualizados

### Validação
- [ ] Animação exibida
- [ ] Lista recarregada
- [ ] Dados atualizados

---

## CHECKLIST FINAL

### Funcionalidades
- [ ] Listar regras
- [ ] Criar regra
- [ ] Editar regra
- [ ] Ativar regra
- [ ] Desativar regra
- [ ] Detectar conflito
- [ ] Ver auditoria
- [ ] Refresh

### Qualidade
- [ ] Sem erros no console
- [ ] Sem warnings críticos
- [ ] UI responsiva
- [ ] Toasts exibidos corretamente
- [ ] Animações funcionando
- [ ] Dados persistidos corretamente

### Padrão
- [ ] Sem acesso direto ao Supabase no componente
- [ ] Erro tipado funcionando
- [ ] Auditoria via service/hook

---

## PROBLEMAS CONHECIDOS

### 1. Multiplicadores e Taxas Não Editáveis
**STATUS**: Funcionalidade mínima cumprida
**IMPACTO**: Baixo - funcionalidade avançada
**WORKAROUND**: Editar diretamente no banco se necessário

### 2. Sem Paginação
**STATUS**: Lista carrega todas as regras
**IMPACTO**: Baixo - poucas regras esperadas
**WORKAROUND**: Adicionar paginação se necessário

---

## PRÓXIMOS PASSOS APÓS VALIDAÇÃO

1. ✅ Confirmar todos os fluxos funcionando
2. ✅ Aplicar RLS policies (`ENABLE_RLS_WITH_POLICIES.sql`)
3. ✅ Testar novamente com RLS habilitado
4. ✅ Considerar adicionar edição de multiplicadores/taxas
5. ✅ Considerar adicionar paginação

---

## CONTATO

Se encontrar problemas durante a validação:
1. Verificar console do navegador
2. Verificar logs do servidor
3. Verificar estado do banco de dados
4. Documentar erro e contexto
