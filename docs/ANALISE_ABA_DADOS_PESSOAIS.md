# Análise Minuciosa: Aba Dados Pessoais

## 🔍 Análise do Estado Atual

### **Estrutura Atual**
```typescript
if (activeSection === "dados-pessoais") {
  return (
    <div className="space-y-6">
      {/* 1. Ações principais */}
      <SectionFrame title="Dados pessoais">
        <HubLinkCard title="Editar perfil pessoal" />
        <HubLinkCard title="Privacidade do perfil" />
        <HubLinkCard title="Perfil publico" />
      </SectionFrame>

      {/* 2. Widget de completude */}
      {personalProfile ? <ProfileCompletenessWidget /> : null}

      {/* 3. Verificação de residência */}
      {profile ? <ResidentVerificationCard /> : null}

      {/* 4. Conteúdo (posts, favoritos, etc.) */}
      {user && personalProfileId ? <ContentTabsSection /> : null}

      {/* 5. Atividade recente */}
      {user && personalProfileId ? <ActivityTimeline /> : null}
    </div>
  );
}
```

---

## ⚠️ Problemas Identificados

### **1. Falta de Informações Visuais do Perfil**
- ❌ Não mostra dados básicos do perfil (nome, bio, avatar)
- ❌ Não mostra estatísticas do perfil personal
- ❌ Não mostra reputação/gamificação

### **2. Ações Limitadas**
- ❌ Apenas 3 ações principais
- ❌ Falta acesso a configurações importantes
- ❌ Falta atalhos para áreas relacionadas

### **3. Falta de Contexto Visual**
- ❌ Não mostra username/handle de forma destacada
- ❌ Não mostra status de verificação
- ❌ Não mostra nível de completude visualmente

### **4. Organização Confusa**
- ❌ ContentTabsSection mistura posts pessoais com empresas
- ❌ Não há separação clara entre "dados" e "conteúdo"
- ❌ Falta hierarquia visual

### **5. Componentes Subutilizados**
- ❌ Não usa `ReputationLevelCard`
- ❌ Não usa `GamificationCard`
- ❌ Não usa `ProfileStats`
- ❌ Não usa `CivicEngagementCard`

---

## 💡 Proposta de Melhoria

### **Estrutura Proposta**
```
┌─────────────────────────────────────────────────────────┐
│ ABA DADOS PESSOAIS                                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 1. RESUMO DO PERFIL PERSONAL                            │
│    ┌──────────────────────────────────────────────┐    │
│    │ Avatar | Nome | @username                    │    │
│    │ Bio                                          │    │
│    │ Badges: Verificado, Nível, Reputação        │    │
│    └──────────────────────────────────────────────┘    │
│                                                         │
│ 2. ESTATÍSTICAS PESSOAIS                                │
│    ┌────────┬────────┬────────┬────────┐              │
│    │ Posts  │ Segui- │ Segui- │ Favori-│              │
│    │   12   │ dores  │  ndo   │  tos   │              │
│    └────────┴────────┴────────┴────────┘              │
│                                                         │
│ 3. COMPLETUDE E VERIFICAÇÃO                             │
│    ┌──────────────────────────────────────────────┐    │
│    │ Completude: 85% ████████░░                   │    │
│    │ Verificação: Residência aprovada ✓           │    │
│    └──────────────────────────────────────────────┘    │
│                                                         │
│ 4. REPUTAÇÃO E GAMIFICAÇÃO                              │
│    ┌──────────────────────────────────────────────┐    │
│    │ Nível 5 | 1.250 pontos | Rank: Top 10%       │    │
│    │ Próximo nível: 250 pontos                    │    │
│    └──────────────────────────────────────────────┘    │
│                                                         │
│ 5. AÇÕES PRINCIPAIS                                     │
│    ┌────────┬────────┬────────┬────────┐              │
│    │ Editar │ Privac.│ Perfil │ Config.│              │
│    │ Perfil │        │ Públic.│        │              │
│    └────────┴────────┴────────┴────────┘              │
│                                                         │
│ 6. CONTEÚDO PESSOAL                                     │
│    [Tabs: Meus Posts | Salvos | Menções]               │
│                                                         │
│ 7. ATIVIDADE RECENTE                                    │
│    [Timeline de atividades pessoais]                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Componentes a Adicionar

### **1. Resumo do Perfil Personal**
```typescript
<SectionFrame
  title="Seu perfil pessoal"
  description="Identidade principal com username @handle"
>
  <div className="flex items-start gap-4">
    <Avatar size="xl" />
    <div>
      <h2>{displayName}</h2>
      <p className="text-muted-foreground">@{handle}</p>
      <p className="text-sm">{bio}</p>
      <div className="flex gap-2 mt-2">
        {isVerified && <Badge>Verificado</Badge>}
        <Badge>Nível {level}</Badge>
        <Badge>Reputação {score}</Badge>
      </div>
    </div>
  </div>
</SectionFrame>
```

### **2. Estatísticas Pessoais**
```typescript
<ProfileStats
  stats={[
    { label: 'Posts', value: operations.posts },
    { label: 'Seguidores', value: stats.followers },
    { label: 'Seguindo', value: stats.following },
    { label: 'Favoritos', value: operations.favoritesGiven },
  ]}
/>
```

### **3. Reputação e Gamificação**
```typescript
<ReputationLevelCard
  reputation={identity?.reputation}
  isVerified={isVerified}
/>

<GamificationCard
  profile={personalProfile}
  onViewRanking={() => navigate(moduleUrls.ranking)}
/>
```

### **4. Engajamento Cívico**
```typescript
<CivicEngagementCard
  reportsCount={stats.reportsCount}
  supportsCount={stats.supportsCount}
  onViewReports={() => navigate('/relatos')}
  onViewSupports={() => navigate('/apoios')}
/>
```

### **5. Ações Expandidas**
```typescript
<div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
  <HubLinkCard title="Editar perfil pessoal" />
  <HubLinkCard title="Privacidade" />
  <HubLinkCard title="Perfil público" />
  <HubLinkCard title="Configurações" />
  <HubLinkCard title="Notificações" />
  <HubLinkCard title="Vínculos" />
  <HubLinkCard title="Segurança" />
  <HubLinkCard title="Dados e privacidade" />
</div>
```

---

## 📋 Seções Propostas

### **Seção 1: Identidade Visual**
- ✅ Avatar grande
- ✅ Nome completo
- ✅ Username @handle
- ✅ Bio
- ✅ Badges (verificado, nível, reputação)
- ✅ Botão "Editar perfil"

### **Seção 2: Estatísticas Rápidas**
- ✅ Posts publicados
- ✅ Seguidores
- ✅ Seguindo
- ✅ Favoritos dados
- ✅ Visualizações do perfil

### **Seção 3: Completude e Verificação**
- ✅ Barra de completude do perfil
- ✅ Itens faltantes
- ✅ Status de verificação de residência
- ✅ Ações para completar

### **Seção 4: Reputação e Gamificação**
- ✅ Nível atual
- ✅ Pontos de reputação
- ✅ Rank no território
- ✅ Progresso para próximo nível
- ✅ Conquistas/badges

### **Seção 5: Engajamento Cívico**
- ✅ Relatos feitos
- ✅ Apoios dados
- ✅ Contribuições para comunidade
- ✅ Impacto territorial

### **Seção 6: Ações Principais**
- ✅ Editar perfil pessoal
- ✅ Privacidade
- ✅ Perfil público
- ✅ Configurações
- ✅ Notificações
- ✅ Vínculos
- ✅ Segurança
- ✅ Dados e privacidade

### **Seção 7: Conteúdo Pessoal**
- ✅ Meus posts
- ✅ Posts salvos
- ✅ Menções
- ✅ Favoritos

### **Seção 8: Atividade Recente**
- ✅ Timeline de atividades
- ✅ Últimas interações
- ✅ Histórico de ações

---

## 🔧 Implementação SSOT

### **Princípios**
1. ✅ **Sempre usar `personalProfile`** (não `activeProfile`)
2. ✅ **Sempre usar `personalProfileId`** (não `activeProfileId`)
3. ✅ **URLs via `appUrls` e `moduleUrls`** (SSOT)
4. ✅ **Componentes reutilizáveis** (sem duplicação)
5. ✅ **Dados do contexto** (identity, context, stats)

### **Dados Disponíveis**
```typescript
// Do hook useProfileHub
const {
  personalProfile,      // ← Perfil personal
  personalProfileId,    // ← ID do perfil personal
  profile,              // ← Fallback
  user,                 // ← Usuário autenticado
  identity,             // ← Identidade pública
  context,              // ← Contexto operacional
  stats,                // ← Estatísticas
  operations,           // ← Operações (posts, empresas, etc.)
  notifications,        // ← Notificações
  isVerified,           // ← Status de verificação
  handle,               // ← Username @handle
  canOpenPublicProfile, // ← Pode abrir perfil público
  territoryLabel,       // ← Território
  verificationStatus,   // ← Status de verificação de residência
  favorites,            // ← Favoritos
  appUrls,              // ← URLs SSOT
  moduleUrls,           // ← URLs de módulos SSOT
} = useProfileHub();
```

---

## 📝 Estrutura Final Proposta

```typescript
if (activeSection === "dados-pessoais") {
  return (
    <div className="space-y-6">
      {/* 1. Identidade Visual do Perfil Personal */}
      <PersonalProfileIdentityCard
        profile={personalProfile}
        handle={handle}
        isVerified={isVerified}
        territoryLabel={territoryLabel}
        onEdit={() => navigate(appUrls.profile.edit(personalProfileId))}
      />

      {/* 2. Estatísticas Pessoais */}
      <ProfileStats
        stats={[
          { icon: User, label: 'Posts', value: operations.posts },
          { icon: Users, label: 'Seguidores', value: stats.followers || 0 },
          { icon: Users, label: 'Seguindo', value: stats.following || 0 },
          { icon: Bookmark, label: 'Favoritos', value: operations.favoritesGiven },
        ]}
      />

      {/* 3. Completude e Verificação */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ProfileCompletenessWidget profile={personalProfile} />
        <ResidentVerificationCard
          profileId={personalProfile?.id || profile?.id}
          currentStatus={verificationStatus}
          rejectionReason={verificationRejectionReason}
        />
      </div>

      {/* 4. Reputação e Gamificação */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ReputationLevelCard
          reputation={identity?.reputation || context?.reputation}
          isVerified={isVerified}
        />
        <GamificationCard
          profile={personalProfile}
          onViewRanking={() => navigate(moduleUrls.ranking)}
        />
      </div>

      {/* 5. Engajamento Cívico */}
      <CivicEngagementCard
        reportsCount={stats.reportsCount || 0}
        supportsCount={stats.supportsCount || 0}
        onViewReports={() => navigate('/relatos')}
        onViewSupports={() => navigate('/apoios')}
      />

      {/* 6. Ações Principais */}
      <SectionFrame
        title="Ações do perfil pessoal"
        description="Gerencie sua identidade, privacidade e configurações."
      >
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <HubLinkCard
            icon={UserRound}
            title="Editar perfil"
            description="Avatar, bio, dados públicos"
            onClick={() => navigate(appUrls.profile.edit(personalProfileId))}
          />
          <HubLinkCard
            icon={Shield}
            title="Privacidade"
            description="Visibilidade e exposição"
            onClick={() => navigate(appUrls.profile.settings("privacy"))}
          />
          <HubLinkCard
            icon={Globe}
            title="Perfil público"
            description="Ver versão pública"
            badge={canOpenPublicProfile ? "Ativo" : "Indisponível"}
            onClick={() => {
              if (!canOpenPublicProfile) return;
              navigate(appUrls.profile.public(handle));
            }}
          />
          <HubLinkCard
            icon={Settings2}
            title="Configurações"
            description="Preferências gerais"
            onClick={() => navigate(appUrls.settings)}
          />
          <HubLinkCard
            icon={Bell}
            title="Notificações"
            description="Alertas e inbox"
            badge={notifications.unread > 0 ? `${notifications.unread}` : undefined}
            onClick={() => navigate(appUrls.notifications)}
          />
          <HubLinkCard
            icon={Users}
            title="Vínculos"
            description="Conexões e relações"
            onClick={() => navigate(appUrls.profile.settings("links"))}
          />
          <HubLinkCard
            icon={Lock}
            title="Segurança"
            description="Senha e conta"
            onClick={() => navigate(appUrls.profile.account)}
          />
          <HubLinkCard
            icon={Database}
            title="Dados"
            description="Exportar e gerenciar"
            onClick={() => setActiveSection("seguranca")}
          />
        </div>
      </SectionFrame>

      {/* 7. Conteúdo Pessoal */}
      {user && personalProfileId ? (
        <ContentTabsSection
          userId={user.id}
          profileId={personalProfileId}
          favorites={favorites}
          onPostClick={(id) => navigate(`${moduleUrls.community}/post/${id}`)}
          onBusinessClick={handleBusinessClick}
          onExplore={() => navigate(appUrls.business.list)}
          onCreateService={() => navigate(appUrls.services.register)}
          onEditService={(id) => navigate(appUrls.services.edit(id))}
          onCreateClassified={() => navigate(appUrls.classifieds.new)}
          onEditClassified={(id) => navigate(appUrls.classifieds.edit(id))}
        />
      ) : null}

      {/* 8. Atividade Recente */}
      {user && personalProfileId ? (
        <SectionFrame
          title="Atividade recente"
          description="Linha do tempo das suas ações pessoais."
        >
          <ActivityTimeline
            userId={user.id}
            profileId={personalProfileId}
            onPostClick={(id) => navigate(`${moduleUrls.community}/post/${id}`)}
          />
        </SectionFrame>
      ) : null}
    </div>
  );
}
```

---

## ✅ Checklist de Melhorias

### **Componentes Novos**
- [ ] `PersonalProfileIdentityCard` - Card visual do perfil
- [ ] Integrar `ProfileStats` - Estatísticas
- [ ] Integrar `ReputationLevelCard` - Reputação
- [ ] Integrar `GamificationCard` - Gamificação
- [ ] Integrar `CivicEngagementCard` - Engajamento cívico

### **Melhorias de Layout**
- [ ] Grid responsivo para cards
- [ ] Hierarquia visual clara
- [ ] Espaçamento consistente
- [ ] Animações suaves

### **Ações Expandidas**
- [ ] 8 ações principais (vs 3 atuais)
- [ ] Badges de status
- [ ] Atalhos contextuais

### **Dados Completos**
- [ ] Estatísticas pessoais
- [ ] Reputação e nível
- [ ] Engajamento cívico
- [ ] Completude do perfil

### **SSOT**
- [ ] Sempre `personalProfile`
- [ ] Sempre `personalProfileId`
- [ ] URLs via `appUrls`/`moduleUrls`
- [ ] Sem hardcoded

---

## 🎯 Resultado Esperado

### **Antes (Atual)**
```
Aba Dados Pessoais:
- 3 ações básicas
- Widget de completude
- Verificação de residência
- Conteúdo misturado
- Atividade recente
```

### **Depois (Melhorado)**
```
Aba Dados Pessoais:
✅ Identidade visual completa
✅ Estatísticas pessoais
✅ Completude + Verificação (lado a lado)
✅ Reputação + Gamificação
✅ Engajamento cívico
✅ 8 ações principais
✅ Conteúdo pessoal organizado
✅ Atividade recente
```

---

## 📊 Comparação

| Aspecto | Antes | Depois |
|---------|-------|--------|
| **Ações** | 3 | 8 |
| **Widgets** | 2 | 6 |
| **Estatísticas** | ❌ | ✅ |
| **Reputação** | ❌ | ✅ |
| **Gamificação** | ❌ | ✅ |
| **Engajamento** | ❌ | ✅ |
| **Identidade visual** | ❌ | ✅ |
| **SSOT** | ⚠️ | ✅ |

---

**Análise completa! Próximo passo: Implementar melhorias.** 🎯
