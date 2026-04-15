# Documento de Design Técnico

## Visão Geral

Este documento descreve o design técnico para completar a suíte de testes E2E, configurando autenticação real e garantindo que todos os 193 testes passem. A solução segue a arquitetura SSOT sem gambiarras ou paliativos.

## Arquitetura da Solução

### Componentes Principais

```
┌─────────────────────────────────────────────────────────────┐
│                    Suíte de Testes E2E                      │
│                      (193 testes)                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ├─► Helper de Autenticação (e2e/helpers/auth.ts)
                     │   └─► Lê variáveis de ambiente (.env.test)
                     │
                     ├─► Testes Admin (4 testes)
                     │   └─► Requer Admin_Teste
                     │
                     ├─► Testes Auth (3 testes)
                     │   └─► Requer Usuario_Teste
                     │
                     └─► Testes Business Claims (3 testes)
                         └─► Requer Admin_Teste
                         
┌─────────────────────────────────────────────────────────────┐
│                  Seeder de Banco de Dados                   │
│                  (scripts/seed-e2e-users.ts)                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ├─► Cria Usuario_Teste (auth.users)
                     │   └─► Cria perfil (public.profiles)
                     │
                     └─► Cria Admin_Teste (auth.users)
                         └─► Cria perfil com role='admin' (public.profiles)
```

## Design de Dados

### Estrutura de Usuários de Teste

#### Usuario_Teste (Usuário Regular)
```typescript
{
  // Tabela: auth.users
  email: "e2e-user@test.local",
  password: "E2eTest@2024!",
  email_confirmed_at: new Date(),
  
  // Tabela: public.profiles
  id: "<uuid>",
  full_name: "E2E Test User",
  role: "user",
  neighborhood_id: "<uuid-bairro-teste>",
  city_id: "<uuid-cidade-teste>",
  state_id: "<uuid-estado-teste>"
}
```

#### Admin_Teste (Usuário Admin)
```typescript
{
  // Tabela: auth.users
  email: "e2e-admin@test.local",
  password: "E2eAdmin@2024!",
  email_confirmed_at: new Date(),
  
  // Tabela: public.profiles
  id: "<uuid>",
  full_name: "E2E Test Admin",
  role: "admin",
  neighborhood_id: "<uuid-bairro-teste>",
  city_id: "<uuid-cidade-teste>",
  state_id: "<uuid-estado-teste>"
}
```

### Variáveis de Ambiente

```bash
# .env.test
E2E_USER_EMAIL=e2e-user@test.local
E2E_USER_PASSWORD=[YOUR_TEST_PASSWORD]
E2E_ADMIN_EMAIL=e2e-admin@test.local
E2E_ADMIN_PASSWORD=[YOUR_ADMIN_PASSWORD]

# URLs e configurações
VITE_SUPABASE_URL=<url-do-supabase>
VITE_SUPABASE_ANON_KEY=<chave-anonima>
```

## Design de Componentes

### 1. Seeder de Banco de Dados

**Arquivo**: `scripts/seed-e2e-users.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

interface SeedOptions {
  reset?: boolean; // Deletar e recriar usuários
  verbose?: boolean; // Log detalhado
}

async function seedE2EUsers(options: SeedOptions = {}) {
  // 1. Conectar ao Supabase
  // 2. Verificar se usuários já existem
  // 3. Se reset=true, deletar usuários existentes
  // 4. Criar Usuario_Teste
  // 5. Criar Admin_Teste
  // 6. Criar perfis associados
  // 7. Retornar credenciais criadas
}
```

**Fluxo de Execução**:
1. Conectar ao Supabase usando credenciais de admin
2. Buscar usuários existentes por email
3. Se `reset=true`, deletar usuários e perfis
4. Criar usuário regular via `auth.admin.createUser()`
5. Criar perfil regular em `public.profiles`
6. Criar usuário admin via `auth.admin.createUser()`
7. Criar perfil admin em `public.profiles` com `role='admin'`
8. Exibir credenciais criadas

### 2. Configuração de Ambiente

**Arquivo**: `.env.test` (criado manualmente ou via script)

```bash
# Credenciais de teste E2E
E2E_USER_EMAIL=e2e-user@test.local
E2E_USER_PASSWORD=[YOUR_TEST_PASSWORD]
E2E_ADMIN_EMAIL=e2e-admin@test.local
E2E_ADMIN_PASSWORD=[YOUR_ADMIN_PASSWORD]

# Configuração Supabase (mesma do .env.local)
VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}
```

**Arquivo**: `.env.example` (atualizado)

Adicionar seção:
```bash
# E2E Test Credentials (opcional - apenas para testes)
E2E_USER_EMAIL=e2e-user@test.local
E2E_USER_PASSWORD=[YOUR_TEST_PASSWORD]
E2E_ADMIN_EMAIL=e2e-admin@test.local
E2E_ADMIN_PASSWORD=[YOUR_ADMIN_PASSWORD]
```

### 3. Atualização do Helper de Autenticação

**Arquivo**: `e2e/helpers/auth.ts` (já existe, sem alterações necessárias)

O helper já está implementado corretamente e lê as variáveis de ambiente.

### 4. Configuração do Playwright

**Arquivo**: `playwright.config.ts`

Garantir que o arquivo `.env.test` seja carregado:

```typescript
import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente de teste
dotenv.config({ path: '.env.test' });

export default defineConfig({
  // ... configuração existente
});
```

## Fluxo de Implementação

### Fase 1: Preparação do Ambiente

1. Criar arquivo `.env.test` com credenciais
2. Atualizar `.env.example` com documentação
3. Verificar que `.gitignore` exclui `.env.test`
4. Atualizar `playwright.config.ts` para carregar `.env.test`

### Fase 2: Criação do Seeder

1. Criar `scripts/seed-e2e-users.ts`
2. Implementar função `seedE2EUsers()`
3. Implementar verificação de usuários existentes
4. Implementar criação de usuários e perfis
5. Implementar opção de reset
6. Adicionar script no `package.json`:
   ```json
   {
     "scripts": {
       "seed:e2e": "tsx scripts/seed-e2e-users.ts",
       "seed:e2e:reset": "tsx scripts/seed-e2e-users.ts --reset"
     }
   }
   ```

### Fase 3: Execução do Seeder

1. Executar `npm run seed:e2e` para criar usuários
2. Verificar que usuários foram criados no Supabase
3. Verificar que perfis foram criados com roles corretos

### Fase 4: Validação dos Testes

1. Executar testes de admin: `npx playwright test e2e/admin.spec.ts`
2. Executar testes de auth: `npx playwright test e2e/auth.spec.ts`
3. Executar testes de business claims: `npx playwright test e2e/business-claims.spec.ts`
4. Executar suíte completa: `npx playwright test`
5. Verificar que todos os 193 testes passam

### Fase 5: Documentação

1. Criar `E2E_SETUP.md` com instruções de configuração
2. Atualizar README principal com link para setup E2E
3. Documentar comandos de execução de testes

## Tratamento de Erros

### Cenários de Erro

1. **Usuários já existem**
   - Comportamento: Pular criação e exibir credenciais existentes
   - Solução: Usar opção `--reset` para recriar

2. **Falha na conexão com Supabase**
   - Comportamento: Exibir erro e instruções
   - Solução: Verificar variáveis de ambiente e conectividade

3. **Permissões insuficientes**
   - Comportamento: Exibir erro de permissão
   - Solução: Usar service role key para operações de admin

4. **LoginPage não renderiza**
   - Comportamento: Teste falha com timeout
   - Solução: Investigar componente LoginPage e rotas

## Considerações de Segurança

1. **Credenciais de Teste**
   - Usar domínio `.test.local` para evitar conflito com emails reais
   - Senhas fortes mesmo para ambiente de teste
   - Nunca commitar `.env.test` no git

2. **Isolamento de Dados**
   - Usuários de teste devem ter dados isolados
   - Não interferir com dados de produção ou desenvolvimento

3. **Limpeza**
   - Opção de deletar usuários de teste após execução
   - Script de limpeza: `npm run seed:e2e:clean`

## Métricas de Sucesso

1. **Cobertura de Testes**: 193/193 testes passando (100%)
2. **Tempo de Execução**: < 5 minutos para suíte completa
3. **Estabilidade**: 0 testes flaky
4. **Manutenibilidade**: Documentação clara e scripts automatizados

## Dependências

### Dependências de Produção
- Nenhuma nova dependência necessária

### Dependências de Desenvolvimento
- `@supabase/supabase-js` (já instalado)
- `tsx` (já instalado)
- `dotenv` (já instalado)
- `@playwright/test` (já instalado)

## Cronograma Estimado

1. **Fase 1 - Preparação**: 15 minutos
2. **Fase 2 - Seeder**: 30 minutos
3. **Fase 3 - Execução**: 10 minutos
4. **Fase 4 - Validação**: 20 minutos
5. **Fase 5 - Documentação**: 15 minutos

**Total**: ~90 minutos

## Riscos e Mitigações

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| Usuários já existem com emails diferentes | Médio | Baixa | Implementar verificação e opção de reset |
| LoginPage não renderiza corretamente | Alto | Média | Investigar componente e adicionar logs |
| Permissões de admin insuficientes | Alto | Baixa | Usar service role key do Supabase |
| Testes flaky após autenticação | Médio | Média | Adicionar waits adequados e verificações |

## Próximos Passos

Após completar esta spec:
1. Criar tarefas de implementação
2. Executar implementação seguindo as fases
3. Validar que todos os testes passam
4. Documentar processo para outros desenvolvedores
