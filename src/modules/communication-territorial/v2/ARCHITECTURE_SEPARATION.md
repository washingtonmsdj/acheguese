# Arquitetura: Separação Página Pública vs Central

## 🎯 Conceito Fundamental

**Separação clara entre experiência editorial/social e gestão administrativa.**

---

## 📱 PÁGINA PÚBLICA DO AGENTE (Social-First)

### Rota
```
/comunicacao/agente/:channelSlug
```

### Conceito
**Portal editorial territorial público** - onde o conteúdo é criado e publicado.

### Inspiração
- Instagram
- Facebook Pages
- LinkedIn Pages
- YouTube Channels
- Medium
- Substack

### Funcionalidades Principais

#### 1. **Composer Inline (Social-First)**
- ✅ Criar postagem rápida
- ✅ Criar notícia/matéria
- ✅ Divulgar evento
- ✅ Criar alerta
- ✅ Upload de mídia (foto/vídeo)
- ✅ Seleção de território
- ✅ Publicar imediatamente
- ⏳ Agendar publicação

#### 2. **Feed Editorial**
- Últimas publicações
- Destaques da semana
- Notícias locais
- Eventos divulgados
- Alertas comunitários
- Multimídia
- Cobertura territorial

#### 3. **Interação Social**
- Comentários
- Reações
- Compartilhamentos
- Seguir canal
- Notificações

#### 4. **Cobertura Territorial**
- Mapa de cobertura
- Comunidades alcançadas
- Trending territorial
- Relevância contextual

#### 5. **Identidade Visual**
- Hero dinâmico
- Stats bar sticky
- Widgets contextuais
- Sidebar informativa

### Experiência
- **Social-first**: Como rede social, não como admin
- **Contextual**: Território sempre presente
- **Territorial**: Identidade local forte
- **Moderna**: UI premium, não CRUD

### Quem Acessa
- **Gestores do canal**: Para publicar conteúdo
- **Público geral**: Para consumir conteúdo
- **Comunidade**: Para interagir

### O que NÃO tem
- ❌ Configurações administrativas
- ❌ Gestão de equipe
- ❌ Analytics detalhado
- ❌ Permissões
- ❌ Branding
- ❌ Monetização
- ❌ Moderação avançada

---

## 🎛️ CENTRAL/DASHBOARD (Gestão)

### Rota
```
/central/comunicacao/v2/:channelSlug
```

### Conceito
**Cockpit editorial e operacional** - onde o canal é gerenciado.

### Inspiração
- YouTube Studio
- Facebook Business Manager
- LinkedIn Analytics
- Medium Stats
- Substack Dashboard
- Ghost Admin

### Funcionalidades Principais

#### 1. **Analytics**
- Métricas detalhadas
- Gráficos interativos
- Comparação de períodos
- Export de relatórios
- Insights territoriais
- Performance de publicações

#### 2. **Gestão de Equipe**
- Convidar membros
- Definir permissões (Admin, Editor, Colaborador)
- Auditoria de ações
- Histórico de atividades

#### 3. **Configurações**
- Branding (logo, cores, bio)
- Informações do canal
- Territórios autorizados
- Notificações
- Integrações

#### 4. **Moderação**
- Aprovar comentários
- Gerenciar denúncias
- Bloquear usuários
- Filtros de conteúdo

#### 5. **Monetização**
- Anúncios patrocinados
- Conteúdo premium
- Assinaturas
- Analytics de receita

#### 6. **Workflow Editorial**
- Rascunhos
- Aprovação multi-nível
- Calendário editorial
- Agendamento avançado
- Versionamento

#### 7. **Gestão de Territórios**
- Solicitar novos territórios
- Ver territórios autorizados
- Métricas por território

### Experiência
- **Cockpit editorial**: Painel de controle profissional
- **CMS moderno**: Não ERP antigo
- **Operacional inteligente**: Insights e ações
- **Analytics-driven**: Dados e métricas

### Quem Acessa
- **Administradores**: Acesso total
- **Editores**: Gestão de conteúdo
- **Colaboradores**: Visualização limitada

### O que NÃO tem
- ❌ Criação de conteúdo inline (vai para página pública)
- ❌ Feed público
- ❌ Interação social
- ❌ Experiência de consumo

---

## 🔄 Fluxo de Trabalho

### Publicar Conteúdo
```
1. Gestor acessa página pública do agente
   /comunicacao/agente/portal-nordeste

2. Clica no composer inline (social-first)

3. Escreve conteúdo, seleciona território

4. Publica imediatamente ou agenda

5. Conteúdo aparece no feed público
```

### Gerenciar Canal
```
1. Gestor acessa central/dashboard
   /central/comunicacao/v2/portal-nordeste

2. Vê analytics, métricas, insights

3. Gerencia equipe, permissões

4. Configura branding, territórios

5. Modera comentários, denúncias

6. Exporta relatórios
```

### Consumir Conteúdo
```
1. Público acessa página pública do agente
   /comunicacao/agente/portal-nordeste

2. Vê feed de publicações

3. Interage (comenta, reage, compartilha)

4. Segue o canal

5. Recebe notificações
```

---

## 📊 Comparação

| Aspecto | Página Pública | Central/Dashboard |
|---------|---------------|-------------------|
| **Foco** | Publicar e consumir | Gerenciar e analisar |
| **UX** | Social-first | Cockpit operacional |
| **Público** | Todos | Apenas gestores |
| **Conteúdo** | Criar e ver | Analisar e moderar |
| **Interação** | Comentar, reagir | Configurar, aprovar |
| **Analytics** | Básico (stats bar) | Avançado (gráficos) |
| **Permissões** | Não | Sim |
| **Branding** | Visualizar | Configurar |
| **Monetização** | Não | Sim |
| **Moderação** | Não | Sim |

---

## 🎨 Design System

### Página Pública
- **Cores**: Vibrantes, identidade do canal
- **Layout**: Feed vertical, sidebar contextual
- **Componentes**: Cards editoriais, composer inline
- **Ícones**: Sociais, territoriais
- **Tipografia**: Editorial, legível
- **Imagens**: Destaque, hero dinâmico

### Central/Dashboard
- **Cores**: Neutras, profissionais
- **Layout**: Grid, sidebar fixa
- **Componentes**: Cards de métricas, gráficos
- **Ícones**: Operacionais, analytics
- **Tipografia**: Dados, números
- **Imagens**: Thumbnails, previews

---

## 🔐 Permissões

### Página Pública

#### Público Geral
- ✅ Ver publicações
- ✅ Comentar
- ✅ Reagir
- ✅ Compartilhar
- ✅ Seguir canal

#### Gestores (Admin/Editor)
- ✅ Tudo do público geral
- ✅ Criar publicações (composer)
- ✅ Editar próprias publicações
- ✅ Excluir próprias publicações
- ✅ Ver stats básicas

#### Colaboradores
- ✅ Tudo do público geral
- ✅ Criar rascunhos (não publicar)

### Central/Dashboard

#### Administrador
- ✅ Acesso total
- ✅ Configurações
- ✅ Gestão de equipe
- ✅ Gestão de territórios
- ✅ Monetização
- ✅ Analytics completo

#### Editor
- ✅ Analytics
- ✅ Moderação
- ✅ Workflow editorial
- ❌ Configurações
- ❌ Gestão de equipe

#### Colaborador
- ✅ Analytics básico
- ❌ Moderação
- ❌ Configurações
- ❌ Gestão de equipe

---

## 🚀 Implementação

### Fase 1: Página Pública (Atual)
- [x] Estrutura base
- [x] Hero section
- [x] Stats bar
- [x] Feed de publicações
- [x] Sidebar widgets
- [x] Responsividade
- [x] Composer inline ✨ NOVO

### Fase 2: Central/Dashboard (Atual)
- [x] Estrutura base
- [x] Overview
- [x] Analytics básico
- [x] Gestão de publicações
- [x] Gestão de rascunhos
- [x] Gestão de territórios
- [x] Gestão de equipe (estrutura)
- [x] Calendário editorial (estrutura)

### Fase 3: Funcionalidades Avançadas (Próximo)
- [ ] Editor rico (WYSIWYG)
- [ ] Biblioteca de mídia
- [ ] Calendário interativo
- [ ] Workflow de aprovação
- [ ] Analytics avançado (gráficos)
- [ ] Gestão de equipe funcional
- [ ] Moderação avançada
- [ ] Integração social
- [ ] Monetização

---

## 📱 Notificações

### Página Pública
**Notificações editoriais e territoriais**

- 🔔 Nova publicação no território
- 🔔 Alerta comunitário
- 🔔 Evento próximo
- 🔔 Trending territorial
- 🔔 Conteúdo em alta
- 🔔 Comunidade alcançada
- 🔔 Tendência regional
- 🔔 Cobertura ao vivo

### Central/Dashboard
**Notificações operacionais**

- 🔔 Comentário para moderar
- 🔔 Denúncia recebida
- 🔔 Novo membro da equipe
- 🔔 Território aprovado
- 🔔 Meta de alcance atingida
- 🔔 Publicação agendada
- 🔔 Insight disponível
- 🔔 Relatório pronto

---

## 🎯 Objetivos

### Página Pública
1. **Engajamento**: Maximizar interação social
2. **Alcance**: Distribuir conteúdo territorial
3. **Identidade**: Fortalecer marca local
4. **Comunidade**: Conectar moradores

### Central/Dashboard
1. **Eficiência**: Otimizar gestão editorial
2. **Insights**: Fornecer dados acionáveis
3. **Controle**: Gerenciar permissões e equipe
4. **Crescimento**: Monetizar e escalar

---

## ✅ Checklist de Separação

### Página Pública
- [x] Composer inline para criar conteúdo
- [x] Feed editorial público
- [ ] Interação social (comentários, reações)
- [ ] Seguir canal
- [ ] Notificações territoriais
- [x] Stats bar com métricas básicas
- [x] Sidebar contextual
- [x] Hero dinâmico

### Central/Dashboard
- [x] Analytics detalhado
- [x] Gestão de equipe (estrutura)
- [x] Configurações (estrutura)
- [x] Moderação (estrutura)
- [x] Calendário editorial (estrutura)
- [ ] Monetização (futuro)
- [ ] Workflow de aprovação (futuro)
- [ ] Integração social (futuro)

---

## 🔗 Navegação

### Da Página Pública para Central
```tsx
<Button onClick={() => navigate(`/central/comunicacao/v2/${channel.slug}`)}>
  <Settings className="h-4 w-4 mr-2" />
  Gerenciar Canal
</Button>
```

### Da Central para Página Pública
```tsx
<Button onClick={() => navigate(`/comunicacao/agente/${channel.slug}`)}>
  <Eye className="h-4 w-4 mr-2" />
  Ver Página Pública
</Button>
```

---

## 📚 Referências

### Página Pública (Social-First)
- Instagram
- Facebook Pages
- LinkedIn Pages
- YouTube Channels
- Medium
- Substack

### Central/Dashboard (Gestão)
- YouTube Studio
- Facebook Business Manager
- LinkedIn Analytics
- Medium Stats
- Substack Dashboard
- Ghost Admin

---

**Versão**: 2.0.0  
**Última atualização**: 2024-01-XX  
**Status**: ✅ Arquitetura definida e implementada
