# Guia de Integração dos Mocks

Este guia mostra como integrar os mocks do Portal Nordeste em cada seção da página de comunicação territorial.

## ✅ Seções Já Integradas

### HeroSection ✓
- Usa `stats` para mostrar números reais
- Usa `verifiedChannels` para canais em destaque
- Totalmente integrado

### CommunicationAgentDashboardV2 ✓
- Usa `nordesteAgents` como canais gerenciados
- Usa `allPublications` filtradas por autor
- Usa `coverageAreas` como territórios
- Fallback automático: tenta API real primeiro, depois usa mocks
- Totalmente integrado

## 📋 Seções Pendentes de Integração

### 1. FeaturedMediaSection

**Mock a usar**: `featuredPublications`

```typescript
import { featuredPublications } from '../mocks';

export function FeaturedMediaSection() {
  return (
    <section>
      <h2>Mídia em Destaque</h2>
      {featuredPublications.map(pub => (
        <article key={pub.id}>
          <img src={pub.image} alt={pub.title} />
          <h3>{pub.title}</h3>
          <p>{pub.excerpt}</p>
          <div>
            <span>{pub.author.name}</span>
            <span>{pub.views} visualizações</span>
            <span>{pub.likes} curtidas</span>
          </div>
        </article>
      ))}
    </section>
  );
}
```

### 2. ActiveCoverageSection

**Mock a usar**: `coverageAreas`

```typescript
import { coverageAreas } from '../mocks';

export function ActiveCoverageSection() {
  return (
    <section>
      <h2>Cobertura Ativa</h2>
      {coverageAreas.map(area => (
        <div key={area.id}>
          <h3>{area.name}</h3>
          <p>{area.description}</p>
          <div>
            <span>{area.activeAgents} agentes ativos</span>
            <span>{area.recentPublications} publicações recentes</span>
          </div>
        </div>
      ))}
    </section>
  );
}
```

### 3. VerifiedChannelsSection

**Mock a usar**: `verifiedChannels`

```typescript
import { verifiedChannels } from '../mocks';

export function VerifiedChannelsSection() {
  return (
    <section>
      <h2>Canais Verificados</h2>
      {verifiedChannels.map(channel => (
        <div key={channel.id}>
          <img src={channel.avatar} alt={channel.name} />
          <h3>{channel.name}</h3>
          <p>{channel.description}</p>
          <span>{channel.type}</span>
          <span>{channel.followers} seguidores</span>
          {channel.verified && <VerifiedBadge />}
        </div>
      ))}
    </section>
  );
}
```

### 4. TrendingTerritorialSection

**Mock a usar**: `trendingTopics` e `getTrendingPublications()`

```typescript
import { trendingTopics, getTrendingPublications } from '../mocks';

export function TrendingTerritorialSection() {
  const trendingPubs = getTrendingPublications();
  
  return (
    <section>
      <h2>Trending no Território</h2>
      
      {/* Topics */}
      <div>
        <h3>Tópicos em Alta</h3>
        {trendingTopics.map(topic => (
          <div key={topic.id}>
            <span>{topic.topic}</span>
            <span>{topic.mentions} menções</span>
            <span>{topic.growth}</span>
          </div>
        ))}
      </div>
      
      {/* Publications */}
      <div>
        <h3>Publicações Trending</h3>
        {trendingPubs.map(pub => (
          <article key={pub.id}>
            <h4>{pub.title}</h4>
            <p>{pub.excerpt}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
```

### 5. LatestPublicationsSection

**Mock a usar**: `latestPublications`

```typescript
import { latestPublications } from '../mocks';

export function LatestPublicationsSection() {
  return (
    <section>
      <h2>Últimas Publicações</h2>
      {latestPublications.map(pub => (
        <article key={pub.id}>
          <img src={pub.image} alt={pub.title} />
          <div>
            <span>{pub.category}</span>
            <span>{pub.territory}</span>
          </div>
          <h3>{pub.title}</h3>
          <p>{pub.excerpt}</p>
          <div>
            <img src={pub.author.avatar} alt={pub.author.name} />
            <span>{pub.author.name}</span>
            <time>{new Date(pub.publishedAt).toLocaleDateString()}</time>
          </div>
          <div>
            <span>{pub.views} views</span>
            <span>{pub.likes} likes</span>
            <span>{pub.comments} comments</span>
          </div>
        </article>
      ))}
    </section>
  );
}
```

### 6. CommunitiesInMotionSection

**Mock a usar**: `communitiesInMotion`

```typescript
import { communitiesInMotion } from '../mocks';

export function CommunitiesInMotionSection() {
  return (
    <section>
      <h2>Comunidades em Movimento</h2>
      {communitiesInMotion.map(community => (
        <div key={community.id}>
          <img src={community.image} alt={community.name} />
          <h3>{community.name}</h3>
          <p>{community.description}</p>
          <div>
            <span>{community.members} membros</span>
            <span>{community.territory}</span>
          </div>
          <p className="recent-activity">{community.recentActivity}</p>
        </div>
      ))}
    </section>
  );
}
```

### 7. EventsCultureSection

**Mock a usar**: `culturalEvents`

```typescript
import { culturalEvents } from '../mocks';

export function EventsCultureSection() {
  return (
    <section>
      <h2>Eventos & Cultura</h2>
      {culturalEvents.map(event => (
        <div key={event.id}>
          <img src={event.image} alt={event.title} />
          <div>
            <span>{event.category}</span>
            <span>{event.territory}</span>
          </div>
          <h3>{event.title}</h3>
          <p>{event.description}</p>
          <div>
            <time>{new Date(event.date).toLocaleDateString()}</time>
            <span>{event.time}</span>
            <span>{event.location}</span>
          </div>
          <div>
            <span>{event.organizer.name}</span>
            <span>{event.attendees} participantes</span>
          </div>
        </div>
      ))}
    </section>
  );
}
```

### 8. LocalNewsSection

**Mock a usar**: `localNewsByCategory`

```typescript
import { localNewsByCategory } from '../mocks';

export function LocalNewsSection() {
  return (
    <section>
      <h2>Notícias Locais</h2>
      
      {/* Política */}
      <div>
        <h3>Política</h3>
        {localNewsByCategory.politics.map(news => (
          <article key={news.id}>
            <h4>{news.title}</h4>
            <p>{news.excerpt}</p>
          </article>
        ))}
      </div>
      
      {/* Saúde */}
      <div>
        <h3>Saúde</h3>
        {localNewsByCategory.health.map(news => (
          <article key={news.id}>
            <h4>{news.title}</h4>
            <p>{news.excerpt}</p>
          </article>
        ))}
      </div>
      
      {/* Educação */}
      <div>
        <h3>Educação</h3>
        {localNewsByCategory.education.map(news => (
          <article key={news.id}>
            <h4>{news.title}</h4>
            <p>{news.excerpt}</p>
          </article>
        ))}
      </div>
      
      {/* Segurança */}
      <div>
        <h3>Segurança</h3>
        {localNewsByCategory.security.map(news => (
          <article key={news.id}>
            <h4>{news.title}</h4>
            <p>{news.excerpt}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
```

### 9. PublicUtilitySection

**Mock a usar**: `publicUtilityInfo`

```typescript
import { publicUtilityInfo } from '../mocks';

export function PublicUtilitySection() {
  return (
    <section>
      <h2>Utilidade Pública</h2>
      {publicUtilityInfo.map(item => (
        <a key={item.id} href={item.link}>
          <div className="icon">{item.icon}</div>
          <h3>{item.title}</h3>
          <p>{item.description}</p>
          <span>{item.category}</span>
        </a>
      ))}
    </section>
  );
}
```

### 10. MultimediaContentSection

**Mock a usar**: `multimediaContent`

```typescript
import { multimediaContent } from '../mocks';

export function MultimediaContentSection() {
  return (
    <section>
      <h2>Conteúdo Multimídia</h2>
      
      {/* Vídeos */}
      <div>
        <h3>Vídeos</h3>
        {multimediaContent.videos.map(video => (
          <div key={video.id}>
            <img src={video.thumbnail} alt={video.title} />
            <span>{video.duration}</span>
            <h4>{video.title}</h4>
            <div>
              <span>{video.author.name}</span>
              <span>{video.views} visualizações</span>
            </div>
          </div>
        ))}
      </div>
      
      {/* Podcasts */}
      <div>
        <h3>Podcasts</h3>
        {multimediaContent.podcasts.map(podcast => (
          <div key={podcast.id}>
            <img src={podcast.thumbnail} alt={podcast.title} />
            <span>{podcast.duration}</span>
            <h4>{podcast.title}</h4>
            <div>
              <span>{podcast.author.name}</span>
              <span>{podcast.plays} reproduções</span>
            </div>
          </div>
        ))}
      </div>
      
      {/* Galerias */}
      <div>
        <h3>Galerias de Fotos</h3>
        {multimediaContent.photoGalleries.map(gallery => (
          <div key={gallery.id}>
            <img src={gallery.coverImage} alt={gallery.title} />
            <span>{gallery.photoCount} fotos</span>
            <h4>{gallery.title}</h4>
            <div>
              <span>{gallery.author.name}</span>
              <span>{gallery.views} visualizações</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
```

## 🎯 Funções Auxiliares Úteis

### Filtrar por Território
```typescript
import { getPublicationsByTerritory } from '../mocks';

const recifeNews = getPublicationsByTerritory('Recife');
```

### Filtrar por Categoria
```typescript
import { getPublicationsByCategory } from '../mocks';

const cultureNews = getPublicationsByCategory('Cultura');
```

### Filtrar Agentes por Tipo
```typescript
import { getAgentsByType } from '../mocks';

const radios = getAgentsByType('radio');
const portals = getAgentsByType('portal');
```

### Filtrar Eventos por Categoria
```typescript
import { getEventsByCategory } from '../mocks';

const musicEvents = getEventsByCategory('music');
const artEvents = getEventsByCategory('art');
```

## 📝 Checklist de Integração

Para cada seção:

- [ ] Importar o mock apropriado
- [ ] Substituir dados hardcoded pelos dados do mock
- [ ] Usar tipos TypeScript corretos
- [ ] Testar renderização
- [ ] Verificar responsividade
- [ ] Adicionar tratamento de erros (dados vazios)
- [ ] Documentar no código

## 🚀 Próximos Passos

1. Integrar cada seção seguindo os exemplos acima
2. Testar todas as páginas com os mocks
3. Criar variações de mocks para diferentes territórios
4. Preparar migração para dados reais da API
5. Adicionar loading states e error handling

## 💡 Dicas

- Use destructuring para acessar dados: `const { title, excerpt } = publication`
- Sempre use `key={item.id}` em listas
- Formate datas com `new Date(dateString).toLocaleDateString()`
- Use optional chaining para dados opcionais: `item.image?.url`
- Adicione fallbacks: `item.followers || 0`
