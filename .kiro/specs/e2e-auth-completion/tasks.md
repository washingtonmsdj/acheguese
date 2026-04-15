# Tarefas de Implementação

## Status: Pronto para Implementação

---

## Tarefa 1: Preparar Ambiente de Teste

**Status**: `pending`  
**Prioridade**: Alta  
**Estimativa**: 15 minutos

### Descrição
Configurar arquivos de ambiente e garantir que o Playwright carregue as credenciais de teste corretamente.

### Subtarefas
- [ ] Criar arquivo `.env.test` com credenciais de teste
- [ ] Atualizar `.env.example` com documentação das variáveis E2E
- [ ] Verificar que `.gitignore` exclui `.env.test`
- [ ] Atualizar `playwright.config.ts` para carregar `.env.test`

### Critérios de Aceitação
- Arquivo `.env.test` existe com todas as variáveis necessárias
- `.env.example` documenta variáveis E2E
- `.gitignore` contém `.env.test`
- Playwright carrega variáveis de ambiente corretamente

### Arquivos Afetados
- `.env.test` (novo)
- `.env.example` (atualizar)
- `.gitignore` (verificar)
- `playwright.config.ts` (atualizar)

---

## Tarefa 2: Criar Seeder de Usuários E2E

**Status**: `pending`  
**Prioridade**: Alta  
**Estimativa**: 30 minutos

### Descrição
Implementar script para criar usuários de teste no banco de dados Supabase com suporte a idempotência e reset.

### Subtarefas
- [ ] Criar arquivo `scripts/seed-e2e-users.ts`
- [ ] Implementar conexão com Supabase usando service role
- [ ] Implementar verificação de usuários existentes
- [ ] Implementar criação de Usuario_Teste
- [ ] Implementar criação de Admin_Teste
- [ ] Implementar criação de perfis associados
- [ ] Implementar opção `--reset` para recriar usuários
- [ ] Implementar opção `--verbose` para logs detalhados
- [ ] Adicionar scripts no `package.json`

### Critérios de Aceitação
- Script cria Usuario_Teste com email e senha configurados
- Script cria Admin_Teste com role='admin'
- Script é idempotente (não recria se já existem)
- Opção `--reset` deleta e recria usuários
- Script exibe credenciais criadas ao final
- Comandos `npm run seed:e2e` e `npm run seed:e2e:reset` funcionam

### Arquivos Afetados
- `scripts/seed-e2e-users.ts` (novo)
- `package.json` (atualizar scripts)

### Dependências
- Tarefa 1 (variáveis de ambiente configuradas)

---

## Tarefa 3: Executar Seeder e Criar Usuários

**Status**: `pending`  
**Prioridade**: Alta  
**Estimativa**: 10 minutos

### Descrição
Executar o seeder para criar os usuários de teste no banco de dados e verificar que foram criados corretamente.

### Subtarefas
- [ ] Executar `npm run seed:e2e`
- [ ] Verificar no Supabase que Usuario_Teste foi criado
- [ ] Verificar no Supabase que Admin_Teste foi criado
- [ ] Verificar que perfis foram criados com roles corretos
- [ ] Verificar que perfis têm neighborhood_id, city_id, state_id

### Critérios de Aceitação
- Usuario_Teste existe em auth.users
- Admin_Teste existe em auth.users
- Perfil de Usuario_Teste existe com role='user'
- Perfil de Admin_Teste existe com role='admin'
- Ambos os perfis têm dados territoriais preenchidos

### Arquivos Afetados
- Nenhum (apenas execução)

### Dependências
- Tarefa 2 (seeder implementado)

---

## Tarefa 4: Validar Testes de Admin

**Status**: `pending`  
**Prioridade**: Alta  
**Estimativa**: 10 minutos

### Descrição
Executar os 4 testes de admin e garantir que todos passam com as credenciais configuradas.

### Subtarefas
- [ ] Executar `npx playwright test e2e/admin.spec.ts`
- [ ] Verificar que teste "usuário comum não acessa /admin" passa
- [ ] Verificar que teste "admin acessa dashboard" passa
- [ ] Verificar que teste "admin acessa página de empresas" passa
- [ ] Verificar que teste "admin acessa página de usuários" passa
- [ ] Corrigir qualquer falha encontrada

### Critérios de Aceitação
- Todos os 4 testes em `e2e/admin.spec.ts` passam
- Nenhum timeout ou erro de autenticação
- Logs de execução não mostram erros

### Arquivos Afetados
- `e2e/admin.spec.ts` (possíveis ajustes)

### Dependências
- Tarefa 3 (usuários criados)

---

## Tarefa 5: Validar Testes de Autenticação

**Status**: `pending`  
**Prioridade**: Alta  
**Estimativa**: 15 minutos

### Descrição
Executar os 3 testes de autenticação e corrigir qualquer problema de renderização da LoginPage.

### Subtarefas
- [ ] Executar `npx playwright test e2e/auth.spec.ts`
- [ ] Verificar que teste "página de login renderiza corretamente" passa
- [ ] Verificar que teste "exibe erro com credenciais inválidas" passa
- [ ] Verificar que teste "redireciona para /login ao acessar rota protegida sem auth" passa
- [ ] Se LoginPage não renderizar, investigar componente
- [ ] Corrigir qualquer problema de renderização encontrado

### Critérios de Aceitação
- Todos os 3 testes em `e2e/auth.spec.ts` passam
- LoginPage renderiza corretamente
- Validação de credenciais inválidas funciona
- Redirecionamento para login funciona

### Arquivos Afetados
- `e2e/auth.spec.ts` (possíveis ajustes)
- Componente LoginPage (se necessário)

### Dependências
- Tarefa 3 (usuários criados)

---

## Tarefa 6: Validar Testes de Business Claims

**Status**: `pending`  
**Prioridade**: Alta  
**Estimativa**: 10 minutos

### Descrição
Executar os 3 testes de reivindicações de empresas e garantir que todos passam com credenciais de admin.

### Subtarefas
- [ ] Executar `npx playwright test e2e/business-claims.spec.ts`
- [ ] Verificar que teste "página carrega sem erro 404 na API" passa
- [ ] Verificar que teste "exibe lista ou estado vazio" passa
- [ ] Verificar que teste "filtros de status estão presentes" passa
- [ ] Verificar que teste "troca de filtro não causa crash" passa
- [ ] Corrigir qualquer falha encontrada

### Critérios de Aceitação
- Todos os 3 testes em `e2e/business-claims.spec.ts` passam
- Admin consegue acessar página de reivindicações
- Filtros funcionam corretamente

### Arquivos Afetados
- `e2e/business-claims.spec.ts` (possíveis ajustes)

### Dependências
- Tarefa 3 (usuários criados)

---

## Tarefa 7: Executar Suíte Completa de Testes

**Status**: `pending`  
**Prioridade**: Alta  
**Estimativa**: 10 minutos

### Descrição
Executar todos os 193 testes E2E e verificar que 100% passam.

### Subtarefas
- [ ] Executar `npx playwright test`
- [ ] Verificar que todos os 193 testes passam
- [ ] Verificar tempo de execução (deve ser < 5 minutos)
- [ ] Verificar que não há testes flaky
- [ ] Gerar relatório de cobertura

### Critérios de Aceitação
- 193/193 testes passando (100%)
- Tempo de execução < 5 minutos
- 0 testes flaky
- Relatório HTML gerado com sucesso

### Arquivos Afetados
- Nenhum (apenas execução)

### Dependências
- Tarefas 4, 5, 6 (todos os testes individuais passando)

---

## Tarefa 8: Criar Documentação de Setup E2E

**Status**: `pending`  
**Prioridade**: Média  
**Estimativa**: 15 minutos

### Descrição
Criar documentação clara para que outros desenvolvedores possam configurar e executar os testes E2E.

### Subtarefas
- [ ] Criar arquivo `E2E_SETUP.md`
- [ ] Documentar pré-requisitos
- [ ] Documentar passo a passo de configuração
- [ ] Documentar comandos de execução
- [ ] Documentar troubleshooting comum
- [ ] Atualizar README principal com link para E2E_SETUP.md

### Critérios de Aceitação
- `E2E_SETUP.md` existe com instruções completas
- Documentação inclui todos os comandos necessários
- Documentação explica como criar usuários de teste
- Documentação explica como executar testes
- README principal referencia documentação E2E

### Arquivos Afetados
- `E2E_SETUP.md` (novo)
- `README.md` (atualizar)

### Dependências
- Tarefa 7 (suíte completa validada)

---

## Tarefa 9: Atualizar Resumo de Cobertura E2E

**Status**: `pending`  
**Prioridade**: Baixa  
**Estimativa**: 5 minutos

### Descrição
Atualizar o documento `E2E_TEST_SUMMARY.md` com os resultados finais da implementação.

### Subtarefas
- [ ] Atualizar status de testes passando para 193/193 (100%)
- [ ] Remover seção de testes bloqueados
- [ ] Adicionar seção sobre configuração de credenciais
- [ ] Atualizar métricas de qualidade
- [ ] Adicionar conquistas finais

### Critérios de Aceitação
- `E2E_TEST_SUMMARY.md` reflete 100% de testes passando
- Documento está atualizado com informações corretas
- Seção de próximos passos removida ou atualizada

### Arquivos Afetados
- `E2E_TEST_SUMMARY.md` (atualizar)

### Dependências
- Tarefa 7 (suíte completa validada)

---

## Resumo de Tarefas

| # | Tarefa | Status | Prioridade | Estimativa | Dependências |
|---|--------|--------|------------|------------|--------------|
| 1 | Preparar Ambiente de Teste | `pending` | Alta | 15 min | - |
| 2 | Criar Seeder de Usuários E2E | `pending` | Alta | 30 min | 1 |
| 3 | Executar Seeder e Criar Usuários | `pending` | Alta | 10 min | 2 |
| 4 | Validar Testes de Admin | `pending` | Alta | 10 min | 3 |
| 5 | Validar Testes de Autenticação | `pending` | Alta | 15 min | 3 |
| 6 | Validar Testes de Business Claims | `pending` | Alta | 10 min | 3 |
| 7 | Executar Suíte Completa de Testes | `pending` | Alta | 10 min | 4,5,6 |
| 8 | Criar Documentação de Setup E2E | `pending` | Média | 15 min | 7 |
| 9 | Atualizar Resumo de Cobertura E2E | `pending` | Baixa | 5 min | 7 |

**Tempo Total Estimado**: ~2 horas

---

## Ordem de Execução Recomendada

1. Tarefa 1 → Tarefa 2 → Tarefa 3 (Setup inicial)
2. Tarefas 4, 5, 6 em paralelo (Validação de testes)
3. Tarefa 7 (Validação final)
4. Tarefas 8, 9 em paralelo (Documentação)

---

## Notas de Implementação

- Seguir princípio SSOT em todas as implementações
- Não usar gambiarras ou paliativos
- Usar autenticação real, não mocks
- Garantir idempotência do seeder
- Documentar todos os passos claramente
