# ✅ Checklist de Migração - Events V2 Territorial

## 📋 Verificação de Implementação

### ✅ Código Implementado

- [x] **EventsListPage.tsx**
  - [x] Interface `EventsListPageProps` criada
  - [x] Prop `resolved?: ResolvedTerritory` adicionada
  - [x] Import de `ResolvedTerritory` type
  - [x] Lógica de filtragem territorial implementada
  - [x] Filtro para `location` (cidade/bairro)
  - [x] Filtro para `group` (grupo de bairros)
  - [x] SEO dinâmico baseado em contexto
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

### ✅ TypeScript

- [x] Sem erros de compilação
- [x] Tipos corretamente importados
- [x] Props tipadas corretamente
- [x] Inferência de tipos funcionando

### ✅ Rotas Configuradas

- [x] `/comunidade/:state/:city/:territorySlug/eventos` → `TerritorialEventosPage`
- [x] `/eventos/:state/:city/:district` → `TerritorialEventosPage`
- [x] `/eventos/:state/:city` → `TerritorialEventosPage`
- [x] `/eventos` → `EventsListPage` (sem contexto)

---

## 🧪 Testes Manuais

### Teste 1: Rota Territorial - Grupo de Bairros
```
URL: http://localhost:8080/comunidade/ba/salvador/complexo-do-nordeste-de-amaralina/eventos
```

**Verificar:**
- [ ] Página carrega sem erros
- [ ] Título: "Eventos - Complexo do Nordeste de Amaralina | Achegue-se"
- [ ] Meta description menciona o território
- [ ] Breadcrumbs: `Início / Complexo do Nordeste de Amaralina / Eventos`
- [ ] Hero subtitle: "...acontecendo no Complexo do Nordeste de Amaralina"
- [ ] Apenas eventos dos bairros do grupo aparecem
- [ ] Filtros funcionam (categoria, data, tipo, preço)
- [ ] Busca funciona
- [ ] Ordenação funciona
- [ ] Paginação funciona
- [ ] Cards de eventos clicáveis
- [ ] Botão de favoritos funciona

### Teste 2: Rota Territorial - Bairro Específico
```
URL: http://localhost:8080/comunidade/ba/salvador/nordeste-de-amaralina/eventos
```

**Verificar:**
- [ ] Página carrega sem erros
- [ ] Título: "Eventos em Nordeste de Amaralina | Achegue-se"
- [ ] Breadcrumbs: `Início / Nordeste de Amaralina / Eventos`
- [ ] Hero subtitle: "...acontecendo em Nordeste de Amaralina"
- [ ] Apenas eventos do bairro aparecem
- [ ] Filtros funcionam

### Teste 3: Rota Global (Sem Contexto)
```
URL: http://localhost:8080/eventos
```

**Verificar:**
- [ ] Página carrega sem erros
- [ ] Título: "Eventos Locais | Achegue-se"
- [ ] Breadcrumbs: `Início / Eventos`
- [ ] Hero subtitle: "...acontecendo na sua região"
- [ ] TODOS os eventos aparecem (sem filtro territorial)
- [ ] Filtros funcionam

### Teste 4: Navegação Entre Rotas
```
1. Abrir /eventos
2. Clicar em um evento
3. Voltar
4. Navegar para /comunidade/ba/salvador/complexo-do-nordeste-de-amaralina/eventos
5. Clicar em um evento
6. Voltar
```

**Verificar:**
- [ ] Navegação funciona sem erros
- [ ] Estado dos filtros é mantido ao voltar
- [ ] Scroll position é restaurado
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
Abrir DevTools → Performance
```

**Verificar:**
- [ ] Tempo de carregamento < 2s
- [ ] First Contentful Paint < 1s
- [ ] Time to Interactive < 3s
- [ ] Sem re-renders desnecessários
- [ ] useMemo funcionando corretamente

---

## 🔍 Verificação de Qualidade

### Código Limpo
- [x] Sem console.logs
- [x] Sem código comentado
- [x] Sem TODOs não resolvidos
- [x] Sem imports não utilizados
- [x] Formatação consistente

### SSOT (Single Source of Truth)
- [x] Uma única fonte de dados (MOCK_EVENTS)
- [x] Filtragem territorial em um único lugar
- [x] Sem duplicação de lógica
- [x] Contexto territorial vem do TerritorialLayout

### Arquitetura
- [x] Componentes desacoplados
- [x] Props bem definidas
- [x] Tipos exportados corretamente
- [x] Hooks reutilizáveis
- [x] Padrões consistentes com o projeto

### Documentação
- [x] Comentários JSDoc onde necessário
- [x] README atualizado
- [x] Documentação de migração criada
- [x] Exemplos de uso documentados

---

## 🚀 Preparação para Produção

### Antes de Deploy
- [ ] Todos os testes manuais passaram
- [ ] TypeScript sem erros
- [ ] ESLint sem warnings críticos
- [ ] Build de produção funciona
- [ ] Bundle size aceitável
- [ ] Lighthouse score > 90

### Monitoramento Pós-Deploy
- [ ] Configurar analytics para rotas territoriais
- [ ] Monitorar erros no Sentry
- [ ] Verificar performance no Real User Monitoring
- [ ] Coletar feedback dos usuários

### Rollback Plan
```
Se houver problemas críticos:

1. Reverter commit da migração
2. Restaurar import do EventosPage antigo
3. Deploy da versão anterior
4. Investigar e corrigir problemas
5. Re-deploy quando estável
```

---

## 📊 Métricas de Sucesso

### Técnicas
- [ ] 0 erros TypeScript
- [ ] 0 erros de runtime
- [ ] Tempo de carregamento < 2s
- [ ] Lighthouse Performance > 90

### Negócio
- [ ] Taxa de cliques em eventos mantida ou melhorada
- [ ] Tempo na página mantido ou melhorado
- [ ] Taxa de rejeição mantida ou melhorada
- [ ] Feedback positivo dos usuários

---

## 🎯 Próximos Passos

### Imediato (Esta Sprint)
- [ ] Completar todos os testes manuais
- [ ] Corrigir bugs encontrados
- [ ] Deploy em staging
- [ ] Validação com stakeholders

### Curto Prazo (Próxima Sprint)
- [ ] Integração com Supabase
- [ ] Substituir MOCK_EVENTS por dados reais
- [ ] Adicionar testes automatizados
- [ ] Otimizar queries

### Médio Prazo (Próximo Mês)
- [ ] Mapa de eventos territoriais
- [ ] Calendário territorial
- [ ] Analytics por território
- [ ] Notificações de novos eventos

---

## ✅ Aprovação Final

### Desenvolvedor
- [ ] Código revisado
- [ ] Testes passando
- [ ] Documentação completa
- [ ] Pronto para review

**Assinatura**: ________________  
**Data**: ________________

### Tech Lead
- [ ] Arquitetura aprovada
- [ ] Código revisado
- [ ] Performance aceitável
- [ ] Pronto para staging

**Assinatura**: ________________  
**Data**: ________________

### Product Owner
- [ ] Funcionalidade validada
- [ ] UX aprovada
- [ ] Pronto para produção

**Assinatura**: ________________  
**Data**: ________________

---

**Documento criado por**: Kiro AI  
**Data**: 2026-05-14  
**Versão**: 1.0.0
