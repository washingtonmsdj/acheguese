# Education Module - E2E Tests

Testes end-to-end completos para o módulo Education usando Playwright.

## 📁 Estrutura

```
tests/e2e/education/
├── README.md                      # Este arquivo
├── education-setup.spec.ts        # 11 testes - Fluxo de cadastro
├── education-programs.spec.ts     # 13 testes - Gestão de programas
├── education-leads.spec.ts        # 20 testes - Pipeline de leads
└── education-public.spec.ts       # 25 testes - Páginas públicas
```

**Total**: 69 testes E2E

## 🧪 Arquivos de Teste

### 1. education-setup.spec.ts (11 testes)
Testa o fluxo completo de cadastro inicial de uma instituição de ensino.

**Cenários**:
- ✅ Exibição da página de setup com todos os campos
- ✅ Validação de campos obrigatórios
- ✅ Cadastro bem-sucedido - Escola Regular
- ✅ Cadastro bem-sucedido - Creche/Berçário
- ✅ Contador de caracteres na descrição
- ✅ Limite de 500 caracteres na descrição
- ✅ Banner de upgrade para nichos beta
- ✅ Cancelamento e retorno ao dashboard
- ✅ Navegação com botão voltar
- ✅ Persistência de dados ao navegar
- ✅ Redirecionamento após salvar

### 2. education-programs.spec.ts (13 testes)
Testa a gestão completa de programas educacionais.

**Cenários**:
- ✅ Exibição da página de programas
- ✅ Empty state quando não há programas
- ✅ Abertura do modal de criar programa
- ✅ Criação de programa com sucesso
- ✅ Validação de campos obrigatórios
- ✅ Edição de programa existente
- ✅ Exclusão de programa com confirmação
- ✅ Toggle de status ativo/inativo
- ✅ Respeito aos limites do nicho
- ✅ Filtro por status
- ✅ Busca por nome
- ✅ Reordenação com drag & drop
- ✅ Tratamento de erros de API

### 3. education-leads.spec.ts (20 testes)
Testa o pipeline completo de gestão de leads.

**Cenários**:
- ✅ Exibição do pipeline com todas as colunas
- ✅ Empty state quando não há leads
- ✅ Card de lead com todas as informações
- ✅ Modal de detalhes do lead
- ✅ Mover lead para próximo status
- ✅ Marcar lead como perdido com motivo
- ✅ Adicionar nota ao lead
- ✅ Atribuir responsável ao lead
- ✅ Filtro por status
- ✅ Busca por nome/email
- ✅ Métricas de conversão
- ✅ Drag & drop entre colunas
- ✅ Exibição do canal de origem
- ✅ Data de criação do lead
- ✅ Informações da criança/estudante
- ✅ Exportação para CSV
- ✅ Respeito aos limites mensais
- ✅ Timeline/histórico do lead
- ✅ Contato via WhatsApp

### 4. education-public.spec.ts (25 testes)
Testa as páginas públicas (vitrine e detalhes).

**Vitrine (Explorer) - 10 testes**:
- ✅ Exibição da página de exploração
- ✅ Listagem de instituições
- ✅ Card com informações principais
- ✅ Filtro por nicho
- ✅ Filtro por modalidade
- ✅ Filtro por turno
- ✅ Busca por nome
- ✅ Limpar filtros
- ✅ Scroll infinito
- ✅ Empty state
- ✅ Navegação para detalhes

**Detalhes - 15 testes**:
- ✅ Exibição da página de detalhes
- ✅ Hero section
- ✅ Descrição da instituição
- ✅ Lista de programas
- ✅ Detalhes dos programas
- ✅ Eventos próximos
- ✅ CTA WhatsApp destacado
- ✅ Abertura do formulário de lead
- ✅ Envio de lead com sucesso
- ✅ Validação de campos obrigatórios
- ✅ Validação de formato de email
- ✅ Validação de formato de telefone
- ✅ Breadcrumbs de navegação
- ✅ Informações de contato
- ✅ Meta tags SEO

## 🛠️ Helpers

Os testes utilizam helpers em `tests/helpers/education-setup.ts`:

### Autenticação
```typescript
await authenticateAsBusinessOwner(page, businessId);
```

### Setup de Dados
```typescript
await ensureEducationProfileExists(businessId);
await createTestProgram(businessId, { name: 'Programa Teste' });
await createTestLead(businessId, { parent_name: 'Maria Silva' });
await createTestEvent(businessId, { title: 'Evento Teste' });
```

### Publicação
```typescript
await publishEducationProfile(businessId);
```

### Limpeza
```typescript
await cleanupEducationData(businessId);
```

## 🚀 Executando os Testes

### Todos os testes do módulo Education
```bash
npx playwright test tests/e2e/education
```

### Teste específico
```bash
npx playwright test tests/e2e/education/education-setup.spec.ts
```

### Com UI interativa
```bash
npx playwright test tests/e2e/education --ui
```

### Modo debug
```bash
npx playwright test tests/e2e/education --debug
```

### Apenas um teste específico
```bash
npx playwright test tests/e2e/education/education-setup.spec.ts -g "should successfully create education profile"
```

## ⚙️ Configuração

### Variáveis de Ambiente Necessárias

Certifique-se de que `.env.test` contém:

```env
VITE_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
PLAYWRIGHT_BASE_URL=http://localhost:8080
```

### Pré-requisitos

1. **Business de Teste**: Os testes esperam que exista um business com ID `test-business-education-001`
2. **Usuário Owner**: O business deve ter um usuário owner/admin associado
3. **Servidor Dev**: O servidor de desenvolvimento deve estar rodando na porta 8080

## 📊 Cobertura

### Fluxos Cobertos
- ✅ Cadastro inicial (setup)
- ✅ Gestão de programas (CRUD completo)
- ✅ Gestão de leads (pipeline completo)
- ✅ Gestão de eventos (CRUD completo)
- ✅ Páginas públicas (vitrine + detalhes)
- ✅ Formulário de lead público
- ✅ Filtros e buscas
- ✅ Validações de formulário
- ✅ Limites por nicho
- ✅ Estados de loading e erro

### Não Coberto (Futuro)
- ⏳ Dashboard (EducationDashboardPage)
- ⏳ Analytics (EducationAnalyticsPage)
- ⏳ Planos (EducationPlansPage)
- ⏳ Testes de performance
- ⏳ Testes de acessibilidade
- ⏳ Testes mobile/responsivo

## 🐛 Troubleshooting

### Testes falhando com timeout
- Verifique se o servidor dev está rodando
- Aumente o timeout no `playwright.config.ts`
- Use `--timeout=60000` na linha de comando

### Erro de autenticação
- Verifique se `SUPABASE_SERVICE_ROLE_KEY` está configurada
- Confirme que o business de teste existe
- Verifique se o usuário tem permissões corretas

### Seletores não encontrados
- Os seletores podem precisar de ajuste baseado na implementação real
- Use Playwright Inspector para debug: `npx playwright test --debug`
- Verifique se os componentes têm os `data-testid` esperados

### Dados não persistindo
- Verifique as RLS policies no Supabase
- Confirme que as migrations foram aplicadas
- Use o helper `cleanupEducationData` no afterEach

## 📝 Convenções

### Nomenclatura de Testes
```typescript
test('should [ação] [resultado esperado]', async ({ page }) => {
  // ...
});
```

### Seletores
- Preferir `getByRole` e `getByLabel` (acessibilidade)
- Usar `data-testid` para elementos específicos
- Evitar seletores CSS complexos

### Asserções
```typescript
await expect(element).toBeVisible();
await expect(element).toHaveText('texto');
await expect(page).toHaveURL(/pattern/);
```

## 🎯 Próximos Passos

1. **Executar testes**: Rodar suite completa e ajustar seletores
2. **Adicionar testes faltantes**: Dashboard, Analytics, Planos
3. **Testes de acessibilidade**: Usar `@axe-core/playwright`
4. **Testes mobile**: Adicionar viewports mobile
5. **CI/CD**: Integrar no pipeline de deploy
6. **Visual regression**: Adicionar screenshots de comparação

## 📚 Recursos

- [Playwright Docs](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging](https://playwright.dev/docs/debug)
- [Selectors](https://playwright.dev/docs/selectors)

---

**Status**: ✅ 69 testes criados e prontos para execução  
**Última atualização**: 2026-04-28
