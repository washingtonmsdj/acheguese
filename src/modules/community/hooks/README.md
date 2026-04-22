# Community Hooks

Hooks customizados para gerenciar dados da comunidade.

## 📋 Hooks Disponíveis

### useRankingUsers(limit)

Busca o ranking dos vizinhos mais ativos.

```tsx
import { useRankingUsers } from "@/hooks/community";

function MyComponent() {
  const { data, isLoading, error } = useRankingUsers(3);

  if (isLoading) return <Skeleton />;
  if (error) return <Error />;

  return (
    <div>
      {data.map((user) => (
        <div key={user.id}>
          {user.name} - {user.points} pts
        </div>
      ))}
    </div>
  );
}
```

**Parâmetros:**

- `limit` (number): Quantidade de usuários a retornar (padrão: 3)

**Retorno:**

```typescript
{
  id: string;
  name: string;
  points: number;
  position: number;
}
[];
```

**Cache:**

- Stale time: 5 minutos
- GC time: 10 minutos

---

### useFavoriteGroups()

Busca os grupos favoritos do usuário logado.

```tsx
import { useFavoriteGroups } from "@/hooks/community";

function MyComponent() {
  const { data, isLoading } = useFavoriteGroups();

  return (
    <div>
      {data?.map((group) => (
        <div key={group.id}>{group.name}</div>
      ))}
    </div>
  );
}
```

**Retorno:**

```typescript
{
  id: string;
  name: string;
  members: string;
  icon: string;
}
[];
```

**Cache:**

- Stale time: 5 minutos
- GC time: 10 minutos
- Enabled: Apenas se usuário estiver logado

---

### useTrendingTopics(limit)

Busca as tendências mais populares do bairro.

```tsx
import { useTrendingTopics } from "@/hooks/community";

function MyComponent() {
  const { data, isLoading } = useTrendingTopics(5);

  return (
    <div>
      {data?.map((topic) => (
        <div key={topic.id}>
          {topic.title} - {topic.mentions} menções
        </div>
      ))}
    </div>
  );
}
```

**Parâmetros:**

- `limit` (number): Quantidade de tópicos a retornar (padrão: 3)

**Retorno:**

```typescript
{
  id: string;
  title: string;
  mentions: number;
  position: number;
}
[];
```

**Cache:**

- Stale time: 10 minutos
- GC time: 15 minutos
- Enabled: Apenas se usuário tiver bairro definido

---

### useSponsoredAds()

Busca anúncio patrocinado com targeting por localização.

```tsx
import { useSponsoredAds } from "@/hooks/community";

function MyComponent() {
  const { data, isLoading } = useSponsoredAds();

  if (!data) return null;

  return (
    <a href={data.link}>
      <img src={data.imageUrl} alt={data.title} />
      <h3>{data.title}</h3>
      <p>{data.description}</p>
    </a>
  );
}
```

**Retorno:**

```typescript
{
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  link: string;
}
```

**Cache:**

- Stale time: 30 minutos
- GC time: 60 minutos

---

## 🔧 Configuração

Todos os hooks usam React Query para cache e gerenciamento de estado.

### Query Keys

```typescript
["ranking-users", limit][("favorite-groups", userId)][
  ("trending-topics", bairro, limit)
][("sponsored-ads", bairro, cidade)];
```

### Estratégia de Cache

| Hook              | Stale Time | GC Time | Refetch on Focus |
| ----------------- | ---------- | ------- | ---------------- |
| useRankingUsers   | 5min       | 10min   | ❌               |
| useFavoriteGroups | 5min       | 10min   | ❌               |
| useTrendingTopics | 10min      | 15min   | ❌               |
| useSponsoredAds   | 30min      | 60min   | ❌               |

## 📝 Pendencias de Backend

Cada hook possui comentários de pendência indicando a estrutura esperada do backend:

### useRankingUsers

```sql
-- Tabela esperada: profiles com campo reputation
SELECT id, nome, reputation
FROM profiles
ORDER BY reputation DESC
LIMIT ?;
```

### useFavoriteGroups

```sql
-- Tabelas esperadas: groups, user_favorite_groups
SELECT g.id, g.name, g.member_count, g.icon
FROM user_favorite_groups ufg
JOIN groups g ON g.id = ufg.group_id
WHERE ufg.user_id = ?;
```

### useTrendingTopics

```sql
-- RPC function esperada: get_trending_topics
CREATE FUNCTION get_trending_topics(
  p_bairro TEXT,
  p_limit INT,
  p_days INT
) RETURNS TABLE(...);
```

### useSponsoredAds

```sql
-- Tabela esperada: sponsored_ads
SELECT *
FROM sponsored_ads
WHERE active = true
  AND (bairro = ? OR cidade = ?)
ORDER BY priority DESC
LIMIT 1;
```

## 🧪 Testes

```bash
# Rodar testes dos hooks
npm test src/hooks/community

# Com coverage
npm test -- --coverage src/hooks/community
```

## 🔄 Invalidação de Cache

```tsx
import { useQueryClient } from "@tanstack/react-query";

function MyComponent() {
  const queryClient = useQueryClient();

  const handleUpdate = () => {
    // Invalidar ranking
    queryClient.invalidateQueries({ queryKey: ["ranking-users"] });

    // Invalidar grupos
    queryClient.invalidateQueries({ queryKey: ["favorite-groups"] });
  };
}
```

## 📊 Monitoramento

Use React Query Devtools para debug:

```tsx
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

<QueryClientProvider client={queryClient}>
  <App />
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>;
```
