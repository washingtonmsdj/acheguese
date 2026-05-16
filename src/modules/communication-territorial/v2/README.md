# 🚀 Communication Territorial V2

## Portal Editorial Territorial Premium

Versão 2.0 da experiência de agentes de comunicação territorial.

---

## 🎯 Conceito

**Não é um perfil de empresa. É um portal editorial territorial completo.**

### Sensação
- 📰 Portal de notícia moderno
- 🌍 Mídia hiperlocal ativa
- 👥 Comunidade engajada
- ✨ Feed editorial premium

### Representa
- Portais locais
- Rádios comunitárias
- Jornais regionais
- Coletivos culturais
- Mídias comunitárias

---

## 📁 Estrutura

```
v2/
├── pages/
│   └── CommunicationAgentPageV2.tsx    # Página principal
├── agent-page/
│   ├── sections/                        # Seções do conteúdo
│   │   ├── AgentHeroSection.tsx
│   │   ├── AgentStatsBar.tsx
│   │   ├── AgentWeekHighlights.tsx
│   │   ├── AgentLatestPublications.tsx
│   │   └── ...
│   └── sidebar/                         # Widgets laterais
│       ├── AgentSidebarAbout.tsx
│       ├── AgentSidebarContact.tsx
│       └── ...
├── AGENT_PAGE_V1_VS_V2.md              # Comparação V1 vs V2
└── README.md                            # Este arquivo
```

---

## 🛣️ Rota

```
/comunicacao/agente/:channelSlug
```

**Exemplo:**
```
/comunicacao/agente/portal-nordeste
/comunicacao/agente/radio-comunitaria-salvador
```

---

## 🎨 Componentes Principais

### 1. Hero Section
- Background gradiente dinâmico
- Avatar grande com verificação
- CTAs principais
- Preview de estatísticas

### 2. Stats Bar
- Indicadores de atividade
- Sticky ao scroll
- Trends e métricas

### 3. Week Highlights
- Destaques editoriais
- Layout premium
- Cards visuais

### 4. Latest Publications
- Feed editorial
- Imagens destacadas
- Engajamento

### 5. Sidebar Widgets
- Sobre o portal
- Contato e CTAs
- Informações territoriais
- Atividade recente

---

## 🚀 Quick Start

### Acessar a página
```tsx
import { Link } from 'react-router-dom';

<Link to="/comunicacao/agente/meu-portal">
  Ver Portal
</Link>
```

### Adicionar nova seção
```tsx
// 1. Criar em agent-page/sections/MinhaSecao.tsx
export function MinhaSecao({ data }: Props) {
  return <section>...</section>;
}

// 2. Exportar em sections/index.ts
export { MinhaSecao } from './MinhaSecao';

// 3. Usar em CommunicationAgentPageV2.tsx
<MinhaSecao data={data} />
```

---

## 📊 Status das Seções

### ✅ Implementadas
- Hero Section
- Stats Bar
- Week Highlights
- Latest Publications
- Active Coverage
- Sidebar About
- Sidebar Contact
- Sidebar Territorial

### 🚧 Em Desenvolvimento
- Local News
- Events Highlight
- Multimedia Gallery
- Cultural Agenda
- Community Alerts
- Trending Content
- Covered Communities
- Partners/Sponsors
- Editorial Feed

---

## 🎯 Roadmap

### Fase 1 (Atual)
- [x] Estrutura base
- [x] Hero premium
- [x] Stats bar
- [x] Feed editorial
- [ ] Completar seções stub

### Fase 2
- [ ] Dados reais integrados
- [ ] Infinite scroll
- [ ] Filtros e busca
- [ ] Compartilhamento social

### Fase 3
- [ ] Live coverage
- [ ] IA territorial
- [ ] Monetização
- [ ] Multi-admin

---

## 📚 Documentação

- **Completa:** `../../../../docs/communication-territorial/AGENT_PAGE_V2_DOCUMENTATION.md`
- **Comparação V1 vs V2:** `./AGENT_PAGE_V1_VS_V2.md`
- **Quick Start:** Este arquivo

---

## 🤝 Contribuindo

1. Seguir padrões de código
2. Usar TypeScript strict
3. Componentes modulares
4. Documentar mudanças

---

## 📞 Suporte

- 📧 dev@acheguese.com
- 💬 #communication-v2
- 📝 GitHub Issues

---

**V2 - Portal Editorial Territorial Premium** 🚀

*Última atualização: 15/05/2026*
