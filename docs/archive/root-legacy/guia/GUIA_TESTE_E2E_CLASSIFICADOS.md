# 🧪 Guia de Teste E2E: Criação de Anúncios

## 📋 Pré-requisitos

### 1. Instalar Playwright
```bash
npm install -D @playwright/test
npx playwright install
```

### 2. Configurar Credenciais de Teste
Edite o arquivo `e2e/classificados-novo.spec.ts` e ajuste as credenciais:
```typescript
await page.fill('input[type="email"]', 'SEU_EMAIL_DE_TESTE');
await page.fill('input[type="password"]', 'SUA_SENHA_DE_TESTE');
```

### 3. Criar Imagem de Teste (Opcional)
```bash
mkdir -p e2e/fixtures
# Adicione uma imagem de teste em: e2e/fixtures/test-image.jpg
```

## 🚀 Executar Testes

### Executar Todos os Testes
```bash
npx playwright test
```

### Executar com UI (Modo Debug)
```bash
npx playwright test --ui
```

### Executar Teste Específico
```bash
npx playwright test e2e/classificados-novo.spec.ts
```

### Executar com Navegador Visível
```bash
npx playwright test --headed
```

### Ver Relatório
```bash
npx playwright show-report
```

## 🧪 Testes Implementados

### 1. Fluxo Completo (8 Steps)
Testa todo o fluxo de criação de anúncio:
- ✅ Step 1: Informações (título, descrição, categoria, subcategoria, condição)
- ✅ Step 2: Preço (tipo e valor)
- ✅ Step 3: Localização
- ✅ Step 4: Fotos (upload)
- ✅ Step 5: Detalhes (campos dinâmicos)
- ✅ Step 6: Contato (telefone, WhatsApp)
- ✅ Step 7: Visibilidade
- ✅ Step 8: Preview e publicação

### 2. Validação de Campos Obrigatórios
Testa se o formulário impede avançar sem preencher campos obrigatórios.

### 3. Navegação Entre Steps
Testa se é possível voltar e avançar entre os steps usando os indicadores.

### 4. Barra de Progresso
Testa se a barra de progresso atualiza conforme campos são preenchidos.

## 📊 Resultados Esperados

### Teste 1: Fluxo Completo
```
✅ Step 1: Informações preenchidas
✅ Step 2: Preço definido
✅ Step 3: Localização verificada
✅ Step 4: Fotos (ou aviso se não houver)
✅ Step 5: Detalhes preenchidos
✅ Step 6: Contato informado
✅ Step 7: Visibilidade configurada
✅ Step 8: Preview validado
⚠️ Publicação não executada (teste E2E)
```

### Teste 2: Validações
```
✅ Campos obrigatórios validados
✅ Mensagens de erro aparecem
✅ Não avança sem preencher
```

### Teste 3: Navegação
```
✅ Avança para próximo step
✅ Volta para step anterior
✅ Indicadores funcionam
```

### Teste 4: Progresso
```
✅ Barra de progresso visível
✅ Porcentagem atualiza
✅ Progresso aumenta ao preencher
```

## 🐛 Troubleshooting

### Erro: "Timeout waiting for element"
**Causa:** Elemento não encontrado ou página não carregou
**Solução:**
- Verificar se aplicação está rodando em `http://localhost:5173`
- Aumentar timeout: `await page.waitForTimeout(2000)`
- Verificar seletores no código

### Erro: "Login failed"
**Causa:** Credenciais incorretas
**Solução:**
- Criar usuário de teste no sistema
- Atualizar credenciais no arquivo de teste

### Erro: "File not found" (upload de foto)
**Causa:** Arquivo de teste não existe
**Solução:**
- Criar pasta: `mkdir -p e2e/fixtures`
- Adicionar imagem: `e2e/fixtures/test-image.jpg`
- Ou comentar seção de upload no teste

### Testes Falhando Aleatoriamente
**Causa:** Timing issues
**Solução:**
- Adicionar `await page.waitForLoadState('networkidle')`
- Aumentar timeouts
- Usar `await expect().toBeVisible()` ao invés de `isVisible()`

## 📝 Personalizar Testes

### Adicionar Novo Teste
```typescript
test('Meu novo teste', async ({ page }) => {
  await test.step('Descrição do passo', async () => {
    // Seu código aqui
  });
});
```

### Testar Categoria Diferente
Edite o teste e mude a categoria:
```typescript
// Ao invés de Eletrônicos
await page.click('button:has-text("🚗"):has-text("Veículos")');

// Selecionar subcategoria
await page.click('button:has-text("Carros")');
```

### Testar Upload Real
Descomente a linha de publicação:
```typescript
// await publicarButton.click();
await publicarButton.click(); // ← Descomentar
```

## 🎯 Checklist de Validação

Após executar os testes:

### Funcionalidade
- [ ] Todos os 8 steps são acessíveis
- [ ] Campos obrigatórios validam
- [ ] Navegação entre steps funciona
- [ ] Barra de progresso atualiza
- [ ] Preview mostra dados corretos

### UI/UX
- [ ] Botões respondem ao clique
- [ ] Mensagens de erro aparecem
- [ ] Indicadores de step funcionam
- [ ] Animações não quebram fluxo

### Dados
- [ ] Título é salvo
- [ ] Descrição é salva
- [ ] Categoria é salva
- [ ] Subcategoria é salva (se selecionada)
- [ ] Preço é salvo
- [ ] Fotos são enviadas (se houver)

## 📊 Métricas

### Tempo de Execução
- Teste completo: ~30-60 segundos
- Validações: ~5-10 segundos
- Navegação: ~10-15 segundos
- Progresso: ~5-10 segundos

### Taxa de Sucesso Esperada
- Ambiente local: 95-100%
- CI/CD: 90-95%

## 🔄 CI/CD Integration

### GitHub Actions
```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## 📚 Recursos

- [Playwright Docs](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging](https://playwright.dev/docs/debug)

---

**Dica:** Execute com `--headed` para ver o navegador em ação e entender melhor o fluxo!
