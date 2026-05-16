# Dashboard V2 - Gestão de Agente de Comunicação Territorial

## 📋 Visão Geral

Dashboard premium para gestores de canais de comunicação territorial. Central de comando editorial completa, profissional e escalável.

**Rota**: `/central/comunicacao/v2/:channelSlug`

**Conceito**: Dashboard de mídia profissional + CMS moderno + Analytics integrado

**Sensação**: Plataforma editorial premium, não painel administrativo básico

---

## 🎯 Funcionalidades Implementadas

### 1. **Header & Seleção de Canal**
- Seletor de canal (dropdown) para gestores com múltiplos canais
- Informações do canal selecionado
- Ações rápidas (Nova Publicação, Configurações)
- Auto-seleção quando há apenas um canal

### 2. **Quick Actions Bar**
- Navegação entre views principais
- Indicadores visuais da view ativa
- Responsivo (scroll horizontal em mobile)

### 3. **Overview (Visão Geral)**
- Cards com métricas principais
- Resumo de publicações recentes
- Resumo de territórios
- Resumo de rascunhos
- Analytics resumido

### 4. **Publications (Publicações)**
- Listagem de todas as publicações
- Filtros por tipo (Notícias, Eventos, Alertas, Multimídia)
- Cards com thumbnail, título, conteúdo, métricas
- Ações: Editar, Visualizar, Excluir
- Estado vazio com CTA

### 5. **Drafts (Rascunhos)**
- Listagem de rascunhos
- Informação de última edição
- Ações: Continuar Editando, Publicar, Excluir
- Estado vazio com CTA

### 6. **Analytics**
- Métricas principais (Visualizações, Alcance, Engajamento)
- Placeholder para gráficos
- Top 5 publicações mais populares
- Métricas por território (futuro)

### 7. **Territories (Territórios)**
- Grid de territórios autorizados
- Informações de cada território
- Métricas por território
- Solicitar novo território
- Estado vazio com CTA

### 8. **Schedule (Calendário Editorial)**
- Placeholder para calendário interativo
- Lista de publicações agendadas
- Informações de data/hora
- Agendar nova publicação
- Estado vazio com CTA

### 9. **Team (Equipe)**
- Informações sobre funções (Admin, Editor, Colaborador)
- Listagem de membros da equipe
- Convidar novos membros
- Remover membros
- Estado vazio com CTA

### 10. **Sidebar Widgets**

#### Stats Widget
- Métricas rápidas do canal
- Publicações, Rascunhos, Territórios
- Seguidores, Visualizações

#### Activity Widget
- Atividades recentes
- Ícones por tipo de ação
- Timestamp

#### Quick Links Widget
- Ver Página Pública
- Configurações
- Guia Editorial
- Central de Ajuda

#### Help Widget
- Documentação
- Tutoriais em Vídeo
- Suporte
- Tour Guiado

---

## 🏗️ Arquitetura

### Estrutura de Arquivos

```
v2/
├── pages/
│   └── CommunicationAgentDashboardV2.tsx    # Página principal
├── agent-dashboard/
│   ├── sections/
│   │   ├── DashboardHeader.tsx              # Header com seletor
│   │   ├── DashboardQuickActions.tsx        # Barra de navegação
│   │   ├── DashboardOverview.tsx            # Visão geral
│   │   ├── DashboardPublications.tsx        # Gestão de publicações
│   │   ├── DashboardDrafts.tsx              # Gestão de rascunhos
│   │   ├── DashboardAnalytics.tsx           # Analytics
│   │   ├── DashboardTerritories.tsx         # Gestão de territórios
│   │   ├── DashboardSchedule.tsx            # Calendário editorial
│   │   └── DashboardTeam.tsx                # Gestão de equipe
│   └── sidebar/
│       ├── DashboardSidebarStats.tsx        # Widget de stats
│       ├── DashboardSidebarActivity.tsx     # Widget de atividade
│       ├── DashboardSidebarQuickLinks.tsx   # Widget de links
│       └── DashboardSidebarHelp.tsx         # Widget de ajuda
└── DASHBOARD_V2_DOCUMENTATION.md            # Esta documentação
```

### Componentes Principais

#### CommunicationAgentDashboardV2
- **Responsabilidade**: Orquestração geral, state management, data fetching
- **State**: `selectedChannelId`, `activeView`
- **Queries**: channels, channelData, territories, publications, drafts

#### Sections
- **Responsabilidade**: Renderizar cada view específica
- **Props**: Recebem dados necessários do componente pai
- **Isolamento**: Cada seção é independente

#### Sidebar Widgets
- **Responsabilidade**: Informações contextuais e ações rápidas
- **Sticky**: Sidebar fixa no desktop
- **Mobile**: Widgets aparecem no final em mobile

---

## 🔌 Integração com SSOT

### Services Utilizados

```typescript
// Buscar canais gerenciados
CommunicationTerritorialService.listManagedChannels()

// Buscar dados do canal
CommunicationTerritorialService.getChannelPublicPage(slug)

// Buscar territórios autorizados
CommunicationTerritorialService.listAuthorizedTerritories(channelId)

// Buscar publicações
CommunicationTerritorialService.listPublications({
  channelId,
  status: 'published' | 'draft',
  limit: number
})
```

### Tipos Utilizados

```typescript
import type { 
  CommunicationChannel,
  CommunicationPublication,
  CommunicationChannelTerritory 
} from "@/core/communication-territorial";
```

### React Query

- Cache automático de dados
- Refetch em background
- Loading states
- Error handling

---

## 📱 Responsividade

### Breakpoints

- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

### Adaptações Mobile

- Header: Layout vertical, botões full-width
- Quick Actions: Scroll horizontal
- Grid: 1 coluna
- Sidebar: Vai para o final
- Cards: Full-width
- Typography: Escalável
- Touch-friendly: Botões maiores

---

## 🎨 Design System

### Cores

- **Primary**: Ações principais, destaques
- **Secondary**: Ações secundárias
- **Muted**: Backgrounds sutis
- **Destructive**: Ações de exclusão
- **Border**: Bordas e separadores

### Componentes UI

- Card, CardHeader, CardTitle, CardDescription, CardContent
- Button (variants: default, outline, ghost, destructive)
- Badge (variants: default, secondary, outline)
- Inputs, Selects, Textareas (futuro)

### Ícones (Lucide React)

- FileText, Edit, Trash2, Send, Eye
- Users, UserPlus, Shield
- MapPin, Calendar, Clock
- TrendingUp, MessageSquare, Share2
- Settings, HelpCircle, BookOpen

---

## 🚀 Próximos Passos

### Funcionalidades Prioritárias

1. **Editor Rico de Publicações**
   - WYSIWYG editor (TipTap ou similar)
   - Upload de imagens
   - Formatação avançada
   - Preview em tempo real

2. **Biblioteca de Mídia**
   - Upload de imagens/vídeos
   - Organização em pastas
   - Busca e filtros
   - Reutilização de assets

3. **Agendamento Avançado**
   - Calendário interativo (FullCalendar)
   - Drag & drop de publicações
   - Recorrência
   - Timezone support

4. **Workflow Editorial**
   - Aprovação multi-nível
   - Comentários em rascunhos
   - Histórico de revisões
   - Versionamento

5. **Analytics Avançado**
   - Gráficos interativos (Recharts)
   - Métricas por território
   - Comparação de períodos
   - Export de relatórios

6. **Gestão de Equipe**
   - Convites por email
   - Permissões granulares
   - Auditoria de ações
   - Notificações

7. **Integração Social**
   - Publicar em redes sociais
   - Agendamento cross-platform
   - Métricas unificadas

8. **Monetização**
   - Anúncios patrocinados
   - Conteúdo premium
   - Assinaturas
   - Analytics de receita

### Melhorias Técnicas

1. **Validação de Formulários**
   - Zod schemas
   - React Hook Form
   - Mensagens de erro claras

2. **Otimização de Performance**
   - Lazy loading de seções
   - Virtualization de listas longas
   - Image optimization
   - Code splitting

3. **Testes**
   - Unit tests (Vitest)
   - Integration tests
   - E2E tests (Playwright)

4. **Acessibilidade**
   - ARIA labels
   - Keyboard navigation
   - Screen reader support
   - WCAG 2.1 AA compliance

---

## 🔐 Permissões e Segurança

### Níveis de Acesso

1. **Administrador**
   - Acesso total
   - Configurações do canal
   - Gestão de equipe
   - Gestão de territórios

2. **Editor**
   - Criar publicações
   - Editar publicações
   - Publicar diretamente
   - Ver analytics

3. **Colaborador**
   - Criar rascunhos
   - Editar próprios rascunhos
   - Submeter para aprovação
   - Ver analytics básico

### Validações

- Verificar se usuário tem permissão para acessar canal
- Verificar se canal está ativo
- Verificar se território está autorizado
- Rate limiting em ações críticas

---

## 📊 Métricas e KPIs

### Métricas do Canal

- Total de publicações
- Total de rascunhos
- Total de territórios
- Total de seguidores
- Total de visualizações
- Taxa de engajamento

### Métricas por Publicação

- Visualizações
- Comentários
- Compartilhamentos
- Tempo de leitura
- Taxa de conclusão

### Métricas por Território

- Alcance territorial
- Publicações por território
- Engajamento por território
- Crescimento de seguidores

---

## 🐛 Troubleshooting

### Problemas Comuns

**Dashboard não carrega**
- Verificar se usuário está autenticado
- Verificar se usuário tem canais gerenciados
- Verificar console para erros de API

**Dados não aparecem**
- Verificar se canal está selecionado
- Verificar se queries estão habilitadas
- Verificar network tab para requests

**Erro ao publicar**
- Verificar permissões do usuário
- Verificar se território está autorizado
- Verificar validação de campos

---

## 📝 Changelog

### v2.0.0 (2024-01-XX)
- ✅ Estrutura inicial do dashboard
- ✅ Header com seleção de canal
- ✅ Quick Actions Bar
- ✅ Overview com métricas
- ✅ Gestão de publicações
- ✅ Gestão de rascunhos
- ✅ Analytics básico
- ✅ Gestão de territórios
- ✅ Calendário editorial (placeholder)
- ✅ Gestão de equipe (placeholder)
- ✅ Sidebar widgets
- ✅ Responsividade mobile-first
- ✅ Integração SSOT
- ✅ Documentação completa

---

## 🤝 Contribuindo

Para adicionar novas funcionalidades:

1. Criar componente na pasta apropriada (`sections/` ou `sidebar/`)
2. Importar no `CommunicationAgentDashboardV2.tsx`
3. Adicionar ao switch de views (se aplicável)
4. Atualizar documentação
5. Adicionar testes

---

## 📚 Referências

- [Shadcn UI](https://ui.shadcn.com/)
- [Lucide Icons](https://lucide.dev/)
- [React Query](https://tanstack.com/query/latest)
- [Tailwind CSS](https://tailwindcss.com/)

---

**Última atualização**: 2024-01-XX
**Versão**: 2.0.0
**Status**: ✅ Implementado (estrutura base)
