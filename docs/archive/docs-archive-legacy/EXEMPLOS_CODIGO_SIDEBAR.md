# 💻 Exemplos de Código - Sidebar Melhorada

## 📝 Índice
1. [UserProfileWidget](#userprofilewidget)
2. [RankingWidget](#rankingwidget)
3. [GroupsWidget](#groupswidget)
4. [ActivityWidget](#activitywidget)
5. [SuggestionsWidget](#suggestionswidget)
6. [CommunityLeftSidebar](#communityleftsidebar)

---

## UserProfileWidget

### Estrutura Visual
```tsx
┌─────────────────────────────────┐
│ [Avatar 48px]  João Silva       │ ← Nome do usuário
│     [Nível 12] 🔥 1,234 pontos  │ ← Badge + pontos
│                                 │
│ Nível 12        34/100          │ ← Labels
│ ████████░░░░░░░░░░░░░░░░░░░░    │ ← Barra de progresso
└─────────────────────────────────┘
```

### Código Simplificado
```tsx
export const UserProfileWidget = memo(() => {
  const { profile, isLoading } = useProfile();

  if (isLoading) return <WidgetSkeleton variant="profile" />;
  if (!profile) return null;

  const points = profile.points || 0;
  const level = Math.floor(points / 100) + 1;
  const progressPercent = points % 100;

  return (
    <Link to="/perfil" className="block bg-card rounded-lg p-4 border">
      {/* Avatar com Badge */}
      <div className="flex items-start gap-3">
        <div className="relative">
          <Avatar className="h-12 w-12">
            <AvatarImage src={profile.avatar_url} />
            <AvatarFallback>{getInitials(profile.name)}</AvatarFallback>
          </Avatar>
          <Badge className="absolute -bottom-1 -right-1">
            {level}
          </Badge>
        </div>
        
        {/* Info */}
        <div className="flex-1">
          <h3 className="text-sm font-semibold">{profile.name}</h3>
          <span className="text-xs">{points} pontos</span>
        </div>
      </div>

      {/* Progresso */}
      <div className="mt-3">
        <div className="flex justify-between text-xs">
          <span>Nível {level}</span>
          <span>{progressPercent}/100</span>
        </div>
        <Progress value={progressPercent} />
      </div>
    </Link>
  );
});
```

### Características
- ✅ Avatar grande (48px) com badge de nível
- ✅ Barra de progresso animada
- ✅ Hover effect com border-primary
- ✅ Loading state com skeleton
- ✅ Link para perfil completo

---

## RankingWidget

### Estrutura Visual
```tsx
┌─────────────────────────────────┐
│ 🏆 Top Vizinhos      Ver todos  │ ← Header com link
├─────────────────────────────────┤
│ 🥇 [Avatar] Maria Silva         │ ← Medalha ouro
│    🔥 2,456 pts (você)          │ ← Destaque usuário
│                                 │
│ 🥈 [Avatar] Pedro Costa         │ ← Medalha prata
│    🔥 2,123 pts                 │
│                                 │
│ 🥉 [Avatar] Ana Santos          │ ← Medalha bronze
│    🔥 1,987 pts                 │
├─────────────────────────────────┤
│ [Ver Ranking Completo]          │ ← CTA button
└─────────────────────────────────┘
```

### Código Simplificado
```tsx
export const RankingWidget = memo(() => {
  const { data: users, isLoading } = useRankingUsers(5);
  const { profile } = useProfile();

  if (isLoading) return <WidgetSkeleton />;
  if (!users?.length) return null;

  const getMedal = (position: number) => {
    switch (position) {
      case 1: return "🥇";
      case 2: return "🥈";
      case 3: return "🥉";
      default: return null;
    }
  };

  return (
    <div className="bg-card rounded-lg p-4 border">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" />
          <h3 className="text-base font-semibold">Top Vizinhos</h3>
        </div>
        <Link to="/ranking" className="text-xs">Ver todos</Link>
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {users.map((user) => {
          const isCurrentUser = profile?.id === user.id;
          const medal = getMedal(user.position);
          
          return (
            <Link
              key={user.id}
              to={`/profile/${user.id}`}
              className={`flex items-center gap-3 p-3 rounded-lg ${
                isCurrentUser ? "bg-primary/10 border-primary" : "bg-secondary"
              }`}
            >
              {/* Posição/Medalha */}
              <div className="w-8 h-8 rounded-md bg-background">
                {medal || user.position}
              </div>

              {/* Avatar */}
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar_url} />
                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
              </Avatar>

              {/* Info */}
              <div className="flex-1">
                <p className="text-sm font-semibold">
                  {user.name}
                  {isCurrentUser && " (você)"}
                </p>
                <span className="text-xs">{user.points} pts</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* CTA */}
      <Button variant="outline" size="sm" className="w-full mt-3" asChild>
        <Link to="/ranking">Ver Ranking Completo</Link>
      </Button>
    </div>
  );
});
```

### Características
- ✅ Medalhas visuais para top 3
- ✅ Destaque para usuário atual
- ✅ Avatares de 32px
- ✅ Animação de hover com scale
- ✅ Link "Ver todos" no header
- ✅ Botão CTA no footer

---

## GroupsWidget

### Estrutura Visual
```tsx
┌─────────────────────────────────┐
│ 👥 Meus Grupos       Ver todos  │ ← Header
├─────────────────────────────────┤
│ [Avatar 40px] Segurança         │
│ 👥 234 membros      [NOVO]      │ ← Badge novo
│                                 │
│ [Avatar 40px] Jardinagem        │
│ 👥 156 membros                  │
├─────────────────────────────────┤
│ [+ Criar Novo Grupo]            │ ← CTA
└─────────────────────────────────┘
```

### Empty State
```tsx
┌─────────────────────────────────┐
│ 👥 Meus Grupos                  │
├─────────────────────────────────┤
│         [Ícone 48px]            │
│                                 │
│  Você ainda não tem             │
│  grupos favoritos               │
│                                 │
│  [+ Explorar Grupos]            │
└─────────────────────────────────┘
```

### Código Simplificado
```tsx
export const GroupsWidget = memo(() => {
  const { data: groups, isLoading } = useFavoriteGroups();

  if (isLoading) return <WidgetSkeleton />;

  return (
    <div className="bg-card rounded-lg p-4 border">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <h3 className="text-base font-semibold">Meus Grupos</h3>
        </div>
        {groups?.length > 0 && (
          <Link to="/grupos" className="text-xs">Ver todos</Link>
        )}
      </div>

      {/* Lista ou Empty State */}
      {groups?.length > 0 ? (
        <div className="space-y-2">
          {groups.map((group, index) => (
            <Link
              key={group.id}
              to={`/comunidade/grupo/${group.id}`}
              className="flex items-center gap-3 p-3 rounded-lg bg-secondary hover:bg-secondary/80"
            >
              {/* Avatar */}
              <Avatar className="h-10 w-10">
                <AvatarImage src={group.icon} />
                <AvatarFallback>{group.icon}</AvatarFallback>
              </Avatar>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{group.name}</p>
                  {index === 0 && (
                    <Badge variant="secondary" className="text-[10px]">
                      Novo
                    </Badge>
                  )}
                </div>
                <span className="text-xs">{group.members} membros</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-6">
          <div className="w-12 h-12 rounded-full bg-secondary mx-auto mb-3">
            <Users className="h-6 w-6" />
          </div>
          <p className="text-sm mb-4">Você ainda não tem grupos favoritos</p>
          <Button variant="outline" size="sm" asChild>
            <Link to="/grupos">
              <Plus className="h-4 w-4 mr-2" />
              Explorar Grupos
            </Link>
          </Button>
        </div>
      )}

      {/* CTA */}
      {groups?.length > 0 && (
        <Button variant="outline" size="sm" className="w-full mt-3" asChild>
          <Link to="/grupos/criar">
            <Plus className="h-4 w-4 mr-2" />
            Criar Novo Grupo
          </Link>
        </Button>
      )}
    </div>
  );
});
```

### Características
- ✅ Avatares de 40px (2x maior)
- ✅ Badge "Novo" para grupos recentes
- ✅ Empty state rico e informativo
- ✅ Contador de membros com ícone
- ✅ Botão "Criar Novo Grupo"
- ✅ Animação de hover

---

## ActivityWidget

### Estrutura Visual
```tsx
┌─────────────────────────────────┐
│ 🔔 Atividades        Ver todas  │ ← Header
├─────────────────────────────────┤
│ [Avatar] 💬 Maria comentou      │
│          no seu post • 5 min    │
│                                 │
│ [Avatar] ❤️ João curtiu         │
│          seu comentário • 1 h   │
│                                 │
│ [Avatar] 🔔 Ana mencionou       │
│          você em um post • 2 h  │
├─────────────────────────────────┤
│ [Ver Todas as Notificações]     │ ← CTA
└─────────────────────────────────┘
```

### Código Simplificado
```tsx
export const ActivityWidget = memo(() => {
  // Mock data - substituir por hook real
  const activities = [
    {
      id: "1",
      type: "comment",
      user: { name: "Maria Silva" },
      content: "comentou no seu post",
      time: "5 min"
    },
    // ...
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case "comment": return <MessageCircle className="h-3.5 w-3.5" />;
      case "like": return <Heart className="h-3.5 w-3.5" />;
      case "mention": return <Bell className="h-3.5 w-3.5" />;
      default: return null;
    }
  };

  return (
    <div className="bg-card rounded-lg p-4 border">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          <h3 className="text-base font-semibold">Atividades</h3>
        </div>
        <Link to="/notificacoes" className="text-xs">Ver todas</Link>
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {activities.map((activity) => (
          <Link
            key={activity.id}
            to={`/comunidade/post/${activity.postId}`}
            className="flex items-start gap-3 p-2 rounded-lg hover:bg-secondary"
          >
            {/* Avatar */}
            <Avatar className="h-8 w-8">
              <AvatarFallback>{getInitials(activity.user.name)}</AvatarFallback>
            </Avatar>

            {/* Conteúdo */}
            <div className="flex-1">
              <div className="flex items-start gap-1.5">
                {getIcon(activity.type)}
                <div>
                  <p className="text-xs">
                    <span className="font-semibold">{activity.user.name}</span>
                    {" "}
                    <span className="text-muted-foreground">{activity.content}</span>
                  </p>
                  <span className="text-[10px] text-muted-foreground">
                    {activity.time}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* CTA */}
      <Button variant="ghost" size="sm" className="w-full mt-3" asChild>
        <Link to="/notificacoes">Ver Todas as Notificações</Link>
      </Button>
    </div>
  );
});
```

### Características
- ✅ Timeline de atividades
- ✅ Ícones contextuais por tipo
- ✅ Timestamps relativos
- ✅ Links para posts relacionados
- ✅ Avatares dos usuários
- ✅ Hover effect suave

---

## SuggestionsWidget

### Estrutura Visual
```tsx
┌─────────────────────────────────┐
│ 💡 Sugestões                    │ ← Header
├─────────────────────────────────┤
│ 🛡️ Segurança do Bairro          │
│ 👥 234 membros  [EM ALTA]  [Ver]│ ← Badge + CTA
│                                 │
│ 🎨 Feira de Artesanato          │
│ 📅 Sábado, 15h             [Ver]│
│                                 │
│ [Avatar] Carlos Mendes          │
│ 👥 Vizinho ativo        [Seguir]│
├─────────────────────────────────┤
│ [Explorar Mais]                 │ ← CTA
└─────────────────────────────────┘
```

### Código Simplificado
```tsx
export const SuggestionsWidget = memo(() => {
  // Mock data - substituir por hook real
  const suggestions = [
    {
      id: "1",
      type: "group",
      name: "Segurança do Bairro",
      description: "234 membros",
      icon: "🛡️",
      trending: true
    },
    // ...
  ];

  const getLink = (suggestion: Suggestion) => {
    switch (suggestion.type) {
      case "group": return `/comunidade/grupo/${suggestion.id}`;
      case "event": return `/eventos/${suggestion.id}`;
      case "person": return `/profile/${suggestion.id}`;
    }
  };

  return (
    <div className="bg-card rounded-lg p-4 border">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="h-4 w-4 text-primary" />
        <h3 className="text-base font-semibold">Sugestões</h3>
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className="flex items-center gap-3 p-3 rounded-lg bg-secondary"
          >
            {/* Avatar/Icon */}
            <Avatar className="h-10 w-10">
              <AvatarFallback>{suggestion.icon}</AvatarFallback>
            </Avatar>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold">{suggestion.name}</p>
                {suggestion.trending && (
                  <Badge variant="secondary" className="text-[10px]">
                    Em alta
                  </Badge>
                )}
              </div>
              <span className="text-xs">{suggestion.description}</span>
            </div>

            {/* Action */}
            <Button variant="ghost" size="sm" asChild>
              <Link to={getLink(suggestion)}>
                {suggestion.type === "person" ? "Seguir" : "Ver"}
              </Link>
            </Button>
          </div>
        ))}
      </div>

      {/* CTA */}
      <Button variant="outline" size="sm" className="w-full mt-3" asChild>
        <Link to="/explorar">Explorar Mais</Link>
      </Button>
    </div>
  );
});
```

### Características
- ✅ Sugestões de grupos, eventos e pessoas
- ✅ Badge "Em Alta" para trending
- ✅ Botões de ação contextuais
- ✅ Avatares/ícones grandes
- ✅ Botão "Explorar Mais"

---

## CommunityLeftSidebar

### Estrutura Visual
```tsx
┌─────────────────────────────────┐
│ UserProfileWidget               │ ← Card de perfil
├─────────────────────────────────┤
│ RankingWidget                   │ ← Top vizinhos
├─────────────────────────────────┤
│ GroupsWidget                    │ ← Meus grupos
├─────────────────────────────────┤
│ ActivityWidget                  │ ← Atividades
├─────────────────────────────────┤
│ SuggestionsWidget               │ ← Sugestões
└─────────────────────────────────┘
```

### Código Completo
```tsx
export const CommunityLeftSidebar = memo(() => {
  return (
    <div className="space-y-4 w-full">
      {/* Widget de Perfil */}
      <WidgetErrorBoundary widgetName="UserProfileWidget">
        <UserProfileWidget />
      </WidgetErrorBoundary>

      {/* Widget de Ranking */}
      <WidgetErrorBoundary widgetName="RankingWidget">
        <RankingWidget />
      </WidgetErrorBoundary>

      {/* Widget de Grupos */}
      <WidgetErrorBoundary widgetName="GroupsWidget">
        <GroupsWidget />
      </WidgetErrorBoundary>

      {/* Widget de Atividades */}
      <WidgetErrorBoundary widgetName="ActivityWidget">
        <ActivityWidget />
      </WidgetErrorBoundary>

      {/* Widget de Sugestões */}
      <WidgetErrorBoundary widgetName="SuggestionsWidget">
        <SuggestionsWidget />
      </WidgetErrorBoundary>
    </div>
  );
});
```

### Integração na Página
```tsx
export default function ComunidadePage() {
  return (
    <div className="container mx-auto max-w-[1600px] px-4 py-6">
      <div className="flex gap-6">
        {/* Sidebar Esquerda - Desktop */}
        <aside className="hidden xl:block w-80 flex-shrink-0">
          <div className="sticky top-6">
            <CommunityLeftSidebar />
          </div>
        </aside>

        {/* Feed Principal */}
        <main className="flex-1 min-w-0">
          <CommunityFeed />
        </main>

        {/* Sidebar Direita - Desktop */}
        <aside className="hidden lg:block w-80 flex-shrink-0">
          <div className="sticky top-6">
            <CommunityRightSidebar />
          </div>
        </aside>
      </div>
    </div>
  );
}
```

### Características
- ✅ 5 widgets organizados verticalmente
- ✅ Error boundaries para resiliência
- ✅ Espaçamento consistente (space-y-4)
- ✅ Sticky positioning
- ✅ Responsivo (hidden xl:block)

---

## 🎨 Padrões de Design

### Cores
```tsx
// Background
bg-card              // Fundo dos cards
bg-secondary         // Fundo dos items
bg-primary/10        // Destaque sutil

// Borders
border-border        // Bordas padrão
border-primary       // Bordas de destaque

// Text
text-foreground      // Texto principal
text-muted-foreground // Texto secundário
text-primary         // Texto de destaque
```

### Tipografia
```tsx
text-base font-semibold  // Títulos (16px)
text-sm font-semibold    // Subtítulos (14px)
text-sm                  // Corpo (14px)
text-xs                  // Metadados (12px)
text-[10px]              // Badges (10px)
```

### Espaçamento
```tsx
p-4        // Padding dos cards (16px)
gap-3      // Gap entre elementos (12px)
space-y-2  // Espaçamento vertical pequeno (8px)
space-y-3  // Espaçamento vertical médio (12px)
space-y-4  // Espaçamento vertical grande (16px)
```

### Animações
```tsx
transition-all duration-200  // Transição suave
hover:scale-[1.02]          // Hover com scale
active:scale-[0.98]         // Active com scale
hover:bg-secondary          // Hover com cor
```

---

## 🔧 Utilitários

### getInitials
```tsx
const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map(word => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

// Exemplo:
getInitials("João Silva") // "JS"
```

### getMedal
```tsx
const getMedal = (position: number) => {
  switch (position) {
    case 1: return "🥇";
    case 2: return "🥈";
    case 3: return "🥉";
    default: return null;
  }
};
```

### getIcon (Activity)
```tsx
const getIcon = (type: string) => {
  switch (type) {
    case "comment": return <MessageCircle />;
    case "like": return <Heart />;
    case "mention": return <Bell />;
    case "follow": return <UserPlus />;
  }
};
```

---

## ✅ Checklist de Implementação

### Componentes
- [x] UserProfileWidget criado
- [x] RankingWidget melhorado
- [x] GroupsWidget melhorado
- [x] ActivityWidget criado
- [x] SuggestionsWidget criado
- [x] WidgetSkeleton melhorado
- [x] CommunityLeftSidebar atualizado

### Funcionalidades
- [x] Loading states
- [x] Empty states
- [x] Error boundaries
- [x] Hover effects
- [x] Click handlers
- [x] Navigation links
- [x] CTAs claros

### Design
- [x] Tipografia legível
- [x] Espaçamento adequado
- [x] Cores consistentes
- [x] Animações suaves
- [x] Responsividade
- [x] Acessibilidade

---

**Todos os exemplos estão prontos para uso e seguem as melhores práticas de React, TypeScript e Tailwind CSS!**
