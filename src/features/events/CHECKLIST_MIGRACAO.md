# âœ… Checklist de MigraÃ§Ã£o - Events V2 Territorial

## ðŸ“‹ VerificaÃ§Ã£o de ImplementaÃ§Ã£o

### âœ… CÃ³digo Implementado

- [x] **EventsListPage.tsx**
  - [x] Interface `EventsListPageProps` criada
  - [x] Prop `resolved?: ResolvedTerritory` adicionada
  - [x] Import de `ResolvedTerritory` type
  - [x] LÃ³gica de filtragem territorial implementada
  - [x] Filtro para `location` (cidade/bairro)
  - [x] Filtro para `group` (grupo de bairros)
  - [x] SEO dinÃ¢mico baseado em contexto
  - [x] Breadcrumbs contextuais
  - [x] Hero section personalizado
  - [x] Dependency array atualizada no useMemo

- [x] **TerritorialModulePages.tsx**
  - [x] `TerritorialEventosPage` atualizada
  - [x] Import de `EventsListPage` adicionado
  - [x] Import antigo de `EventosPage` removido
  - [x] Prop `resolved` passada para `EventsListPage`
  - [x] `CityStatusGate` mantido
  - [x] `Suspense` com `ModulePageLoader` mantido

### âœ… TypeScript

- [x] Sem erros de compilaÃ§Ã£o
- [x] Tipos corretamente importados
- [x] Props tipadas corretamente
- [x] InferÃªncia de tipos funcionando

### âœ… Rotas Configuradas

- [x] `/comunidade/:state/:city/:territorySlug/eventos` â†’ `TerritorialEventosPage`
- [x] `/eventos/:state/:city/:district` â†’ `TerritorialEventosPage`
- [x] `/eventos/:state/:city` â†’ `TerritorialEventosPage`
- [x] `/eventos` â†’ `EventsListPage` (sem contexto)

---

## ðŸ§ª Testes Manuais

### Teste 1: Rota Territorial - Grupo de Bairros
```
URL: http://localhost:8080/comunidade/ba/salvador/complexo-do-nordeste-de-amaralina/eventos
```

**Verificar:**
- [ ] PÃ¡gina carrega sem erros
- [ ] TÃ­tulo: "Eventos - Complexo do Nordeste de Amaralina | Achegue-se"
- [ ] Meta description menciona o territÃ³rio
- [ ] Breadcrumbs: `InÃ­cio / Complexo do Nordeste de Amaralina / Eventos`
- [ ] Hero subtitle: "...acontecendo no Complexo do Nordeste de Amaralina"
- [ ] Apenas eventos dos bairros do grupo aparecem
- [ ] Filtros funcionam (categoria, data, tipo, preÃ§o)
- [ ] Busca funciona
- [ ] OrdenaÃ§Ã£o funciona
- [ ] PaginaÃ§Ã£o funciona
- [ ] Cards de eventos clicÃ¡veis
- [ ] BotÃ£o de favoritos funciona

### Teste 2: Rota Territorial - Bairro EspecÃ­fico
```
URL: http://localhost:8080/comunidade/ba/salvador/nordeste-de-amaralina/eventos
```

**Verificar:**
- [ ] PÃ¡gina carrega sem erros
- [ ] TÃ­tulo: "Eventos em Nordeste de Amaralina | Achegue-se"
- [ ] Breadcrumbs: `InÃ­cio / Nordeste de Amaralina / Eventos`
- [ ] Hero subtitle: "...acontecendo em Nordeste de Amaralina"
- [ ] Apenas eventos do bairro aparecem
- [ ] Filtros funcionam

### Teste 3: Rota Global (Sem Contexto)
```
URL: http://localhost:8080/eventos
```

**Verificar:**
- [ ] PÃ¡gina carrega sem erros
- [ ] TÃ­tulo: "Eventos Locais | Achegue-se"
- [ ] Breadcrumbs: `InÃ­cio / Eventos`
- [ ] Hero subtitle: "...acontecendo na sua regiÃ£o"
- [ ] TODOS os eventos aparecem (sem filtro territorial)
- [ ] Filtros funcionam

### Teste 4: NavegaÃ§Ã£o Entre Rotas
```
1. Abrir /eventos
2. Clicar em um evento
3. Voltar
4. Navegar para /comunidade/ba/salvador/complexo-do-nordeste-de-amaralina/eventos
5. Clicar em um evento
6. Voltar
```

**Verificar:**
- [ ] NavegaÃ§Ã£o funciona sem erros
- [ ] Estado dos filtros Ã© mantido ao voltar
- [ ] Scroll position Ã© restaurado
- [ ] Sem memory leaks

### Teste 5: Responsividade
```
Testar em diferentes tamanhos de tela:
- Mobile (360px)
- Tablet (768px)
- Desktop (1920px)
```

**Verificar:**
- [ ] Layout responsivo funciona
- [ ] Breadcrumbs adaptam em mobile
- [ ] Hero section responsivo
- [ ] Grid/List view funciona
- [ ] Filtros mobile funcionam
- [ ] Busca mobile funciona

### Teste 6: Performance
```
Abrir DevTools â†’ Performance
```

**Verificar:**
- [ ] Tempo de carregamento < 2s
- [ ] First Contentful Paint < 1s
- [ ] Time to Interactive < 3s
- [ ] Sem re-renders desnecessÃ¡rios
- [ ] useMemo funcionando corretamente

---

## ðŸ” VerificaÃ§Ã£o de Qualidade

### CÃ³digo Limpo
- [x] Sem console.logs
- [x] Sem cÃ³digo comentado
- [x] Sem TODOs nÃ£o resolvidos
- [x] Sem imports nÃ£o utilizados
- [x] FormataÃ§Ã£o consistente

### SSOT (Single Source of Truth)
- [x] Uma Ãºnica fonte de dados (MOCK_EVENTS)
- [x] Filtragem territorial em um Ãºnico lugar
- [x] Sem duplicaÃ§Ã£o de lÃ³gica
- [x] Contexto territorial vem do TerritorialLayout

### Arquitetura
- [x] Componentes desacoplados
- [x] Props bem definidas
- [x] Tipos exportados corretamente
- [x] Hooks reutilizÃ¡veis
- [x] PadrÃµes consistentes com o projeto

### DocumentaÃ§Ã£o
- [x] ComentÃ¡rios JSDoc onde necessÃ¡rio
- [x] README atualizado
- [x] DocumentaÃ§Ã£o de migraÃ§Ã£o criada
- [x] Exemplos de uso documentados

---

## ðŸš€ PreparaÃ§Ã£o para ProduÃ§Ã£o

### Antes de Deploy
- [ ] Todos os testes manuais passaram
- [ ] TypeScript sem erros
- [ ] ESLint sem warnings crÃ­ticos
- [ ] Build de produÃ§Ã£o funciona
- [ ] Bundle size aceitÃ¡vel
- [ ] Lighthouse score > 90

### Monitoramento PÃ³s-Deploy
- [ ] Configurar analytics para rotas territoriais
- [ ] Monitorar erros no Sentry
- [ ] Verificar performance no Real User Monitoring
- [ ] Coletar feedback dos usuÃ¡rios

### Rollback Plan
```
Se houver problemas crÃ­ticos:

1. Reverter commit da migraÃ§Ã£o
2. Restaurar import do EventosPage antigo
3. Deploy da versÃ£o anterior
4. Investigar e corrigir problemas
5. Re-deploy quando estÃ¡vel
```

---

## ðŸ“Š MÃ©tricas de Sucesso

### TÃ©cnicas
- [ ] 0 erros TypeScript
- [ ] 0 erros de runtime
- [ ] Tempo de carregamento < 2s
- [ ] Lighthouse Performance > 90

### NegÃ³cio
- [ ] Taxa de cliques em eventos mantida ou melhorada
- [ ] Tempo na pÃ¡gina mantido ou melhorado
- [ ] Taxa de rejeiÃ§Ã£o mantida ou melhorada
- [ ] Feedback positivo dos usuÃ¡rios

---

## ðŸŽ¯ PrÃ³ximos Passos

### Imediato (Esta Sprint)
- [ ] Completar todos os testes manuais
- [ ] Corrigir bugs encontrados
- [ ] Deploy em staging
- [ ] ValidaÃ§Ã£o com stakeholders

### Curto Prazo (PrÃ³xima Sprint)
- [ ] IntegraÃ§Ã£o com Supabase
- [ ] Substituir MOCK_EVENTS por dados reais
- [ ] Adicionar testes automatizados
- [ ] Otimizar queries

### MÃ©dio Prazo (PrÃ³ximo MÃªs)
- [ ] Mapa de eventos territoriais
- [ ] CalendÃ¡rio territorial
- [ ] Analytics por territÃ³rio
- [ ] NotificaÃ§Ãµes de novos eventos

---

## âœ… AprovaÃ§Ã£o Final

### Desenvolvedor
- [ ] CÃ³digo revisado
- [ ] Testes passando
- [ ] DocumentaÃ§Ã£o completa
- [ ] Pronto para review

**Assinatura**: ________________  
**Data**: ________________

### Tech Lead
- [ ] Arquitetura aprovada
- [ ] CÃ³digo revisado
- [ ] Performance aceitÃ¡vel
- [ ] Pronto para staging

**Assinatura**: ________________  
**Data**: ________________

### Product Owner
- [ ] Funcionalidade validada
- [ ] UX aprovada
- [ ] Pronto para produÃ§Ã£o

**Assinatura**: ________________  
**Data**: ________________

---

**Documento criado por**: Kiro AI  
**Data**: 2026-05-14  
**VersÃ£o**: 1.0.0
