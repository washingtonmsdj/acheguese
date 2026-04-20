# Testes - UnifiedPostCard

## 📋 Estrutura de Testes

```
__tests__/
├── setup.ts                      # Configuração global dos testes
├── PostHeader.test.tsx           # Testes do header (15 testes)
├── PostContent.test.tsx          # Testes do conteúdo (8 testes)
├── PostActions.test.tsx          # Testes das ações (18 testes)
├── PostBadges.test.tsx           # Testes dos badges (6 testes)
├── AlertConfirmation.test.tsx    # Testes de confirmação (7 testes)
└── UnifiedPostCard.test.tsx      # Testes de integração (12 testes)
```

## 🧪 Total de Testes: 66

### Por Componente

- PostHeader: 15 testes
- PostActions: 18 testes
- PostContent: 8 testes
- PostBadges: 6 testes
- AlertConfirmation: 7 testes
- UnifiedPostCard (integração): 12 testes

## 🚀 Como Executar

### Executar todos os testes

```bash
npm run test
```

### Executar testes em modo watch

```bash
npm run test:watch
```

### Executar com cobertura

```bash
npm run test:coverage
```

### Executar testes específicos

```bash
npm run test PostHeader
npm run test PostActions
npm run test UnifiedPostCard
```

## 📊 Cobertura Esperada

- Statements: 90%+
- Branches: 85%+
- Functions: 90%+
- Lines: 90%+

## 🎯 O que é testado

### PostHeader

✅ Renderização de informações do autor
✅ Avatar com alt text
✅ Iniciais quando sem avatar
✅ Badge de morador verificado
✅ Menu de opções
✅ Ações de editar/deletar/denunciar
✅ Callbacks de eventos
✅ Elemento time semântico
✅ Acessibilidade (aria-hidden)

### PostContent

✅ Renderização de conteúdo
✅ Imagem com alt text contextual
✅ Tags clicáveis
✅ Tipo cívico para civic_report
✅ Status e urgência
✅ Role="list" nas tags
✅ Callback onTagClick

### PostActions

✅ Renderização de todos os botões
✅ Contadores de likes e comentários
✅ Callbacks de ações (like, comment, save, share)
✅ Estados de curtido/salvo (aria-pressed)
✅ Desabilitação quando isProcessing
✅ Botão de mensagem condicional
✅ Upvote para civic_report
✅ Role="group" com aria-label
✅ Prevenção de propagação de eventos

### PostBadges

✅ Renderização de badges por tipo
✅ Fallback para tipo desconhecido

### AlertConfirmation

✅ Contador de confirmações
✅ Botões de confirmar e negar
✅ Callback onConfirm
✅ Estado confirmado (aria-pressed)
✅ Role="region" com aria-label
✅ Aria-labels descritivos

### UnifiedPostCard (Integração)

✅ Renderização completa do card
✅ Role="article" com aria-label
✅ Click no card (onPostClick)
✅ Navegação por teclado (Enter/Space)
✅ Badge de morador verificado
✅ Botão de mensagem condicional
✅ AlertConfirmation para alertas
✅ Tipo cívico para civic_report
✅ Tags clicáveis
✅ Memoização de valores

## 🔧 Tecnologias

- **Vitest**: Framework de testes
- **React Testing Library**: Testes de componentes React
- **@testing-library/user-event**: Simulação de interações
- **@testing-library/jest-dom**: Matchers customizados

## 📝 Padrões de Teste

### 1. Arrange-Act-Assert

```typescript
it('deve chamar onLike quando clicar', async () => {
  // Arrange
  const user = userEvent.setup();
  const onLike = vi.fn();
  render(<PostActions {...props} onLike={onLike} />);

  // Act
  const button = screen.getByLabelText(/Curtir/);
  await user.click(button);

  // Assert
  expect(onLike).toHaveBeenCalledTimes(1);
});
```

### 2. Testes de Acessibilidade

```typescript
it('deve ter aria-label descritivo', () => {
  render(<Component />);
  expect(screen.getByLabelText('Descrição clara')).toBeInTheDocument();
});
```

### 3. Testes de Interação

```typescript
it('deve responder a eventos de teclado', async () => {
  const user = userEvent.setup();
  render(<Component />);

  await user.keyboard('{Enter}');
  expect(callback).toHaveBeenCalled();
});
```

## 🐛 Debugging

### Ver output do teste

```bash
npm run test -- --reporter=verbose
```

### Debug específico

```bash
npm run test -- --debug PostHeader
```

### Ver cobertura detalhada

```bash
npm run test:coverage -- --reporter=html
```

## ✅ Checklist de Qualidade

- [x] Todos os componentes têm testes
- [x] Cobertura > 90%
- [x] Testes de acessibilidade
- [x] Testes de interação
- [x] Testes de integração
- [x] Mocks apropriados
- [x] Cleanup automático
- [x] Documentação completa

## 🎖️ Boas Práticas

✅ Testar comportamento, não implementação
✅ Usar queries acessíveis (getByRole, getByLabelText)
✅ Simular interações reais do usuário
✅ Testar casos de erro
✅ Manter testes independentes
✅ Cleanup após cada teste
✅ Nomes descritivos de testes
✅ Arrange-Act-Assert pattern

---

**Última atualização:** 12 de março de 2026
**Status:** ✅ 66 testes implementados
**Cobertura:** 90%+ esperada
