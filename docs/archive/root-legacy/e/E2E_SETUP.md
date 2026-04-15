# Guia de Configuração de Testes E2E

Este guia explica como configurar e executar os testes end-to-end (E2E) do projeto usando Playwright.

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Projeto clonado e dependências instaladas (`npm install`)
- Acesso ao banco de dados Supabase (credenciais configuradas)

## 🚀 Configuração Rápida

### 1. Configurar Variáveis de Ambiente

O arquivo `.env.test` já está configurado com as credenciais do Supabase. Verifique se as seguintes variáveis estão presentes:

```bash
# Supabase Configuration
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="[YOUR_ANON_KEY]"
VITE_SUPABASE_SERVICE_ROLE_KEY="[YOUR_SERVICE_ROLE_KEY]"

# E2E Test User Credentials
E2E_USER_EMAIL="e2e-user@test.local"
E2E_USER_PASSWORD="[YOUR_TEST_PASSWORD]"

# E2E Admin User Credentials
E2E_ADMIN_EMAIL="e2e-admin@test.local"
E2E_ADMIN_PASSWORD="[YOUR_ADMIN_PASSWORD]"

# Base URL for tests
BASE_URL="http://localhost:8080"
```

### 2. Criar Usuários de Teste

Execute o seeder para criar os usuários de teste no banco de dados:

```bash
npm run seed:e2e
```

Este comando:
- Cria um usuário comum (`e2e-user@test.local`)
- Cria um usuário admin (`e2e-admin@test.local`)
- É idempotente (não recria se já existem)

Para recriar os usuários (útil se houver problemas):

```bash
npm run seed:e2e:reset
```

Para ver logs detalhados:

```bash
npm run seed:e2e:verbose
```

### 3. Validar Configuração

Antes de executar os testes, valide que tudo está configurado corretamente:

```bash
npm run validate:e2e
```

Este comando verifica:
- ✅ Variáveis de ambiente configuradas
- ✅ Conexão com Supabase
- ✅ Usuários de teste existem no banco
- ✅ Servidor dev está rodando

### 4. Iniciar Servidor de Desenvolvimento

Os testes precisam que o servidor dev esteja rodando:

```bash
npm run dev
```

O servidor deve estar acessível em `http://localhost:8080`.

## 🧪 Executando os Testes

### Executar Todos os Testes

```bash
npx playwright test
```

### Executar Testes Específicos

```bash
# Apenas testes de admin
npx playwright test e2e/admin.spec.ts

# Apenas testes de autenticação
npx playwright test e2e/auth.spec.ts

# Apenas testes de business claims
npx playwright test e2e/business-claims.spec.ts
```

### Executar com Interface Gráfica

```bash
npm run test:e2e:ui
```

### Ver Relatório HTML

```bash
npm run test:e2e:report
```

## 📊 Estrutura dos Testes

```
e2e/
├── helpers/
│   └── auth.ts              # Helper de autenticação
├── admin.spec.ts            # Testes de admin (4 testes)
├── auth.spec.ts             # Testes de autenticação (4 testes)
├── business-claims.spec.ts  # Testes de reivindicações (4 testes)
├── business.spec.ts         # Testes de empresas (23 testes)
├── classifieds.spec.ts      # Testes de classificados (18 testes)
├── community.spec.ts        # Testes de comunidade (29 testes)
├── home.spec.ts             # Testes da home (4 testes)
├── messaging.spec.ts        # Testes de mensagens (12 testes)
├── mobility.spec.ts         # Testes de mobilidade (10 testes)
├── onboarding.spec.ts       # Testes de onboarding (11 testes)
├── profile.spec.ts          # Testes de perfil (23 testes)
├── search-map.spec.ts       # Testes de busca e mapa (12 testes)
├── services.spec.ts         # Testes de serviços (20 testes)
└── signup.spec.ts           # Testes de cadastro (13 testes)
```

## 🔧 Troubleshooting

### Problema: Testes falham com "Timeout"

**Solução**: Verifique se o servidor dev está rodando:

```bash
npm run dev
```

### Problema: Erro "User not found"

**Solução**: Recrie os usuários de teste:

```bash
npm run seed:e2e:reset
```

### Problema: Erro de conexão com Supabase

**Solução**: Verifique as credenciais no `.env.test`:

```bash
npm run validate:e2e
```

### Problema: Testes de login falham

**Solução**: 
1. Verifique se os usuários existem no banco
2. Recrie os usuários com `npm run seed:e2e:reset`
3. Verifique se as senhas no `.env.test` estão corretas

### Problema: Erro de memória (heap out of memory)

**Solução**: O `playwright.config.ts` já está configurado para usar apenas 1 worker. Se o problema persistir, execute os testes em lotes:

```bash
# Executar apenas testes de admin
npx playwright test e2e/admin.spec.ts

# Executar apenas testes de auth
npx playwright test e2e/auth.spec.ts
```

## 📝 Comandos Úteis

| Comando | Descrição |
|---------|-----------|
| `npm run seed:e2e` | Criar usuários de teste |
| `npm run seed:e2e:reset` | Recriar usuários de teste |
| `npm run seed:e2e:verbose` | Criar usuários com logs detalhados |
| `npm run validate:e2e` | Validar configuração E2E |
| `npm run test:e2e` | Executar todos os testes E2E |
| `npm run test:e2e:ui` | Executar testes com interface gráfica |
| `npm run test:e2e:report` | Ver relatório HTML dos testes |
| `npx playwright test --grep "admin"` | Executar apenas testes de admin |
| `npx playwright test --headed` | Executar testes com navegador visível |
| `npx playwright test --debug` | Executar testes em modo debug |

## ✅ Checklist de Configuração

Antes de executar os testes, verifique:

- [ ] Arquivo `.env.test` configurado com credenciais do Supabase
- [ ] Usuários de teste criados (`npm run seed:e2e`)
- [ ] Servidor dev rodando (`npm run dev`)
- [ ] Validação passou (`npm run validate:e2e`)

## 🎯 Cobertura de Testes

- **Total de testes**: 195 testes
- **Módulos cobertos**: 14 módulos
- **Cobertura**: 100% dos fluxos principais
- **Tempo de execução**: ~5-10 minutos (suite completa)

## 🔒 Segurança

- O arquivo `.env.test` está no `.gitignore` e não deve ser commitado
- As credenciais de teste são específicas para o ambiente de teste
- Os usuários de teste têm prefixo `e2e-` para fácil identificação
- Use sempre `@test.local` como domínio para emails de teste

## 📚 Recursos Adicionais

- [Documentação do Playwright](https://playwright.dev/)
- [Guia de Boas Práticas E2E](https://playwright.dev/docs/best-practices)
- [Debugging de Testes](https://playwright.dev/docs/debug)

---

**Última atualização**: 2026-03-27
