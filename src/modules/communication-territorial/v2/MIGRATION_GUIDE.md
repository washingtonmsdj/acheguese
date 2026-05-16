# Guia de Migração V1 → V2

## 🎯 Visão Geral

Este guia explica as mudanças entre a V1 e V2 do sistema de comunicação territorial e como migrar.

---

## 📊 Principais Mudanças

### 1. **Separação de Responsabilidades**

#### V1 (Antigo)
```
Central (/central/comunicacao)
  ├─ Criar publicações (formulário CRUD)
  ├─ Ver rascunhos
  └─ Gestão básica
```

**Problemas**:
- ❌ Experiência administrativa, não social
- ❌ Separado do contexto público
- ❌ Parece ERP antigo

#### V2 (Novo)
```
Página Pública (/comunicacao/agente/:slug)
  ├─ Composer inline (social-first)
  ├─ Feed editorial
  └─ Interação social

Dashboard (/central/comunicacao/v2/:slug)
  ├─ Analytics detalhado
  ├─ Gestão de equipe
  ├─ Configurações
  └─ Moderação
```

**Benefícios**:
- ✅ Experiência social-first
- ✅ Contexto público imediato
- ✅ Separação clara: criar vs gerenciar

---

### 2. **Criação de Conteúdo**

#### V1 (Antigo)
```tsx
// Central: Formulário CRUD
<form>
  <Select label="Canal" />
  <Select label="Território" />
  <Select label="Tipo" />
  <Input label="Título" />
  <Textarea label="Conteúdo" />
  <Button>Criar e Publicar</Button>
</form>
```

**Localização**: `/central/comunicacao`  
**UX**: Administrativa, formulário longo

#### V2 (Novo)
```tsx
// Página Pública: Composer inline
<AgentPublicationComposer>
  <TypeSelector /> {/* Postagem, Notícia, Evento, Alerta */}
  <Textarea placeholder="O que está acontecendo?" />
  <TerritoryBadges />
  <MediaUpload />
  <Button>Publicar</Button>
</AgentPublicationComposer>
```

**Localização**: `/comunicacao/agente/:slug`  
**UX**: Social-first, inline, contextual

---

### 3. **Gestão e Analytics**

#### V1 (Antigo)
```
Central (/central/comunicacao)
  ├─ Lista de canais
  ├─ Formulário de publicação
  └─ Lista de rascunhos
```

**Limitações**:
- ❌ Sem analytics
- ❌ Sem gestão de equipe
- ❌ Sem configurações avançadas

#### V2 (Novo)
```
Hub (/central/comunicacao)
  └─ Cards de canais com acesso rápido

Dashboard (/central/comunicacao/v2/:slug)
  ├─ Overview com métricas
  ├─ Analytics detalhado
  ├─ Gestão de publicações
  ├─ Gestão de rascunhos
  ├─ Gestão de territórios
  ├─ Calendário editorial
  └─ Gestão de equipe
```

**Benefícios**:
- ✅ Analytics completo
- ✅ Gestão de equipe
- ✅ Configurações avançadas
- ✅ Cockpit operacional

---

### 4. **Navegação**

#### V1 (Antigo)
```
Usuário → Central → Criar publicação → Publicar
                                        ↓
                                  Feed público
```

**Problema**: Desconectado do contexto público

#### V2 (Novo)
```
Usuário → Página Pública → Composer → Publicar
                                        ↓
                                  Feed público (mesmo contexto)

Usuário → Dashboard → Analytics/Config/Moderação
```

**Benefício**: Contexto imediato, separação clara

---

## 🔄 Migração Passo a Passo

### Para Usuários

#### 1. Publicar Conteúdo

**Antes (V1)**:
1. Acessar `/central/comunicacao`
2. Preencher formulário longo
3. Selecionar canal, território, tipo
4. Escrever conteúdo
5. Clicar em "Criar e Publicar"

**Depois (V2)**:
1. Acessar `/comunicacao/agente/seu-canal`
2. Clicar no composer inline
3. Selecionar tipo (Postagem, Notícia, Evento, Alerta)
4. Escrever conteúdo
5. Selecionar território
6. Clicar em "Publicar"

#### 2. Gerenciar Canal

**Antes (V1)**:
- Não havia gestão avançada

**Depois (V2)**:
1. Na página pública, clicar em "Gerenciar Canal"
2. Acessar dashboard completo
3. Ver analytics, gerenciar equipe, configurar canal

---

### Para Desenvolvedores

#### 1. Atualizar Imports

**Antes (V1)**:
```typescript
import { CentralComunicacaoPage } from "@/modules/central/pages/CentralComunicacaoPage";
```

**Depois (V2)**:
```typescript
// Hub de canais
import { CentralComunicacaoPageV2 } from "@/modules/central/pages/CentralComunicacaoPageV2";

// Página pública do agente
import { CommunicationAgentPageV2 } from "@/modules/communication-territorial/v2/pages/CommunicationAgentPageV2";

// Dashboard do canal
import { CommunicationAgentDashboardV2 } from "@/modules/communication-territorial/v2/pages/CommunicationAgentDashboardV2";
```

#### 2. Atualizar Rotas

**Antes (V1)**:
```tsx
<Route path="/central/comunicacao" element={<CentralComunicacaoPage />} />
```

**Depois (V2)**:
```tsx
{/* Hub de canais */}
<Route path="/central/comunicacao" element={<CentralComunicacaoPageV2 />} />

{/* V1 ainda disponível */}
<Route path="/central/comunicacao/v1" element={<CentralComunicacaoPage />} />

{/* Página pública do agente */}
<Route path="/comunicacao/agente/:channelSlug" element={<CommunicationAgentPageV2 />} />

{/* Dashboard do canal */}
<Route path="/central/comunicacao/v2/:channelSlug" element={<CommunicationAgentDashboardV2 />} />
```

#### 3. Atualizar Links

**Antes (V1)**:
```tsx
<Button onClick={() => navigate("/central/comunicacao")}>
  Gerenciar Comunicação
</Button>
```

**Depois (V2)**:
```tsx
{/* Para ver página pública */}
<Button onClick={() => navigate(`/comunicacao/agente/${channel.slug}`)}>
  Ver Página Pública
</Button>

{/* Para gerenciar canal */}
<Button onClick={() => navigate(`/central/comunicacao/v2/${channel.slug}`)}>
  Dashboard & Analytics
</Button>
```

#### 4. Usar Novo Composer

**Antes (V1)**:
```tsx
// Não havia composer inline
```

**Depois (V2)**:
```tsx
import { AgentPublicationComposer } from "@/modules/communication-territorial/v2/agent-page/composer/AgentPublicationComposer";

<AgentPublicationComposer 
  channel={channel}
  territories={territories}
  onPublished={() => {
    // Callback após publicar
    queryClient.invalidateQueries(['publications']);
  }}
/>
```

---

## 📋 Checklist de Migração

### Para Gestores de Canal

- [ ] Acessar nova página pública do canal
- [ ] Testar composer inline
- [ ] Criar publicação de teste
- [ ] Acessar novo dashboard
- [ ] Explorar analytics
- [ ] Configurar preferências
- [ ] Convidar membros da equipe (futuro)

### Para Desenvolvedores

- [ ] Atualizar imports
- [ ] Atualizar rotas
- [ ] Atualizar links de navegação
- [ ] Testar fluxo completo
- [ ] Atualizar documentação
- [ ] Treinar equipe

### Para Administradores

- [ ] Comunicar mudanças aos usuários
- [ ] Criar guia de uso
- [ ] Monitorar adoção
- [ ] Coletar feedback
- [ ] Ajustar conforme necessário

---

## 🔗 Compatibilidade

### V1 ainda disponível

A V1 permanece disponível em `/central/comunicacao/v1` para:
- Usuários que preferem o fluxo antigo
- Casos de uso específicos
- Período de transição

### Migração gradual

Não é necessário migrar tudo de uma vez:
1. Começar usando V2 para novas publicações
2. Continuar usando V1 para gestão (se preferir)
3. Migrar completamente quando confortável

---

## 🆕 Novas Funcionalidades V2

### Página Pública

- ✅ Composer inline social-first
- ✅ Hero dinâmico
- ✅ Stats bar sticky
- ✅ Feed editorial premium
- ✅ Sidebar contextual
- ✅ Botão "Gerenciar Canal" (para gestores)
- ⏳ Interação social (comentários, reações)
- ⏳ Seguir canal
- ⏳ Notificações territoriais

### Dashboard

- ✅ Overview com métricas
- ✅ Analytics básico
- ✅ Gestão de publicações
- ✅ Gestão de rascunhos
- ✅ Gestão de territórios
- ✅ Calendário editorial (estrutura)
- ✅ Gestão de equipe (estrutura)
- ⏳ Analytics avançado (gráficos)
- ⏳ Moderação avançada
- ⏳ Monetização

### Hub de Canais

- ✅ Cards de canais
- ✅ Acesso rápido à página pública
- ✅ Acesso rápido ao dashboard
- ✅ Métricas resumidas
- ✅ Ações rápidas

---

## 🐛 Problemas Conhecidos

### V1

- ❌ Experiência administrativa
- ❌ Sem analytics
- ❌ Sem gestão de equipe
- ❌ Formulário longo e complexo
- ❌ Desconectado do contexto público

### V2

- ⚠️ Upload de mídia (placeholder)
- ⚠️ Agendamento (placeholder)
- ⚠️ Editor rico (futuro)
- ⚠️ Interação social (futuro)
- ⚠️ Analytics avançado (futuro)

---

## 📚 Recursos

### Documentação

- `ARCHITECTURE_SEPARATION.md` - Separação página pública vs dashboard
- `SOCIAL_FIRST_IMPLEMENTATION.md` - Implementação social-first
- `DASHBOARD_V2_DOCUMENTATION.md` - Documentação do dashboard
- `TERRITORIAL_NOTIFICATIONS.md` - Sistema de notificações
- `MIGRATION_GUIDE.md` - Este guia

### Exemplos

- Página pública: `/comunicacao/agente/portal-nordeste`
- Dashboard: `/central/comunicacao/v2/portal-nordeste`
- Hub: `/central/comunicacao`

---

## 🆘 Suporte

### Problemas Comuns

**Não vejo o composer**
- Verificar se está autenticado
- Verificar se é gestor do canal (`user.id === channel.profile_id`)

**Não consigo publicar**
- Verificar se tem território autorizado
- Verificar se preencheu todos os campos obrigatórios

**Dashboard não carrega**
- Verificar se canal existe
- Verificar se tem permissão de acesso

### Contato

- **Documentação**: Ver arquivos `.md` na pasta `v2/`
- **Issues**: Criar issue no repositório
- **Suporte**: Contatar equipe de desenvolvimento

---

## 🎉 Conclusão

A V2 traz uma experiência moderna, social-first e profissional para comunicação territorial.

**Principais benefícios**:
- ✅ UX moderna (Instagram/Facebook-like)
- ✅ Separação clara (criar vs gerenciar)
- ✅ Analytics completo
- ✅ Gestão avançada
- ✅ Escalável e preparado para o futuro

**Migração recomendada**: Sim, para todos os usuários

**Período de transição**: V1 disponível por tempo indeterminado

---

**Versão**: 2.0.0  
**Última atualização**: 2024-01-XX  
**Status**: ✅ Guia completo
