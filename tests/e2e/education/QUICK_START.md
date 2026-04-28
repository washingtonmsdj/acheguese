# 🚀 Education E2E Tests - Quick Start

Guia rápido para executar os testes E2E do módulo Education.

---

## ⚡ Execução Rápida

```bash
# 1. Iniciar servidor dev
npm run dev -- --host localhost --port 8080

# 2. Em outro terminal, executar testes
npx playwright test tests/e2e/education
```

---

## 📋 Pré-requisitos

### 1. Variáveis de Ambiente

Criar/verificar `.env.test`:

```env
VITE_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
PLAYWRIGHT_BASE_URL=http://localhost:8080
```

### 2. Business de Teste

Criar business com ID específico:

```sql
-- Opção 1: Via SQL direto
INSERT INTO business_data (id, business_name, legal_name, category, description)
VALUES (
  'test-business-education-001',
  'Test Education Business',
  'Test Education Business LTDA',
  'education',
  'Business para testes E2E do módulo Education'
);

-- Opção 2: Via UI
-- Criar empresa normalmente e anotar o ID gerado
-- Atualizar os testes com o ID real
```

### 3. Usuário Owner

Garantir que o business tem um usuário owner/admin associado em `profile_members`.

---

## 🧪 Comandos Úteis

### Executar Todos os Testes
```bash
npx playwright test tests/e2e/education
```

### Executar Teste Específico
```bash
# Setup
npx playwright test tests/e2e/education/education-setup.spec.ts

# Programs
npx playwright test tests/e2e/education/education-programs.spec.ts

# Leads
npx playwright test tests/e2e/education/education-leads.spec.ts

# Public Pages
npx playwright test tests/e2e/education/education-public.spec.ts
```

### Executar Um Teste Específico
```bash
npx playwright test tests/e2e/education/education-setup.spec.ts -g "should successfully create"
```

### Modo UI (Interativo)
```bash
npx playwright test tests/e2e/education --ui
```

### Modo Debug
```bash
npx playwright test tests/e2e/education --debug
```

### Ver Relatório
```bash
npx playwright show-report
```

---

## 🐛 Troubleshooting Rápido

### Erro: "Business not found"
**Solução**: Criar business de teste com ID `test-business-education-001`

### Erro: "SUPABASE_SERVICE_ROLE_KEY not configured"
**Solução**: Adicionar `SUPABASE_SERVICE_ROLE_KEY` no `.env.test`

### Erro: "Timeout waiting for page"
**Solução**: 
1. Verificar se servidor dev está rodando
2. Aumentar timeout: `npx playwright test --timeout=60000`

### Erro: "Element not found"
**Solução**: Usar Playwright Inspector para ajustar seletores:
```bash
npx playwright test tests/e2e/education --debug
```

---

## 📊 Estrutura dos Testes

```
tests/e2e/education/
├── education-setup.spec.ts        # 11 testes - Cadastro
├── education-programs.spec.ts     # 13 testes - Programas
├── education-leads.spec.ts        # 20 testes - Leads
└── education-public.spec.ts       # 25 testes - Páginas públicas

Total: 69 testes
```

---

## 🎯 Fluxos Testados

- ✅ Cadastro inicial de instituição
- ✅ CRUD de programas educacionais
- ✅ Pipeline de gestão de leads
- ✅ Vitrine pública de instituições
- ✅ Página de detalhes e formulário de lead
- ✅ Filtros, buscas e validações

---

## 📚 Documentação Completa

- **README Completo**: `tests/e2e/education/README.md`
- **Helpers**: `tests/helpers/education-setup.ts`
- **Relatório**: `docs/EDUCATION_MODULE_E2E_TESTS_COMPLETE.md`

---

## ✅ Checklist de Primeira Execução

- [ ] Servidor dev rodando na porta 8080
- [ ] `.env.test` configurado com variáveis corretas
- [ ] Business de teste criado (`test-business-education-001`)
- [ ] Usuário owner associado ao business
- [ ] Executar: `npx playwright test tests/e2e/education`
- [ ] Verificar relatório: `npx playwright show-report`
- [ ] Ajustar seletores se necessário

---

**Dúvidas?** Ver documentação completa em `README.md`
