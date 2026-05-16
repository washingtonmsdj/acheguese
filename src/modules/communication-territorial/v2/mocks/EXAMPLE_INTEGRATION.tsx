/**
 * EXEMPLO DE INTEGRAÇÃO DOS MOCKS
 * 
 * Este arquivo mostra exemplos práticos de como integrar os mocks
 * em diferentes seções da página de comunicação territorial.
 * 
 * Use como referência ao integrar as seções restantes.
 */

import { Link } from "react-router-dom";
import { 
  portalNordesteMock,
  featuredPublications,
  culturalEvents,
  verifiedChannels,
  coverageAreas,
  getTrendingPublications,
  getPublicationsByCategory
} from "./index";

// ============================================================================
// EXEMPLO 1: FeaturedMediaSection
// ============================================================================

export function ExampleFeaturedMediaSection() {
  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-bold">Mídia em Destaque</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {featuredPublications.map(pub => (
          <article key={pub.id} className="border rounded-lg overflow-hidden">
            {pub.image && (
              <img 
                src={pub.image} 
                alt={pub.title}
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-4">
              <div className="flex gap-2 mb-2">
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                  {pub.category}
                </span>
                <span className="text-xs bg-muted px-2 py-1 rounded">
                  {pub.territory}
                </span>
              </div>
              
              <h3 className="font-bold text-lg mb-2">{pub.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{pub.excerpt}</p>
              
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <img 
                    src={pub.author.avatar} 
                    alt={pub.author.name}
                    className="w-5 h-5 rounded-full"
                  />
                  <span>{pub.author.name}</span>
                </div>
                <span>•</span>
                <span>{pub.views.toLocaleString()} views</span>
                <span>•</span>
                <span>{pub.likes.toLocaleString()} likes</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

// ============================================================================
// EXEMPLO 2: EventsCultureSection
// ============================================================================

export function ExampleEventsCultureSection() {
  return (
    <section className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Eventos & Cultura</h2>
        <Link to="/comunicacao/eventos" className="text-sm text-primary hover:underline">
          Ver todos
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {culturalEvents.map(event => (
          <div key={event.id} className="border rounded-lg overflow-hidden hover:shadow-lg transition">
            {event.image && (
              <img 
                src={event.image} 
                alt={event.title}
                className="w-full h-40 object-cover"
              />
            )}
            <div className="p-4">
              <div className="flex gap-2 mb-2">
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                  {event.category}
                </span>
              </div>
              
              <h3 className="font-bold mb-2">{event.title}</h3>
              <p className="text-sm text-muted-foreground mb-3">{event.description}</p>
              
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span>📅</span>
                  <span>{new Date(event.date).toLocaleDateString('pt-BR')}</span>
                  <span>•</span>
                  <span>{event.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>📍</span>
                  <span>{event.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>👥</span>
                  <span>{event.attendees} participantes</span>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t flex items-center gap-2">
                <img 
                  src={event.organizer.avatar} 
                  alt={event.organizer.name}
                  className="w-6 h-6 rounded-full"
                />
                <span className="text-xs">{event.organizer.name}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ============================================================================
// EXEMPLO 3: VerifiedChannelsSection
// ============================================================================

export function ExampleVerifiedChannelsSection() {
  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-bold">Canais Verificados</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {verifiedChannels.map(channel => (
          <Link
            key={channel.id}
            to={`/comunicacao/canal/${channel.id}`}
            className="border rounded-lg p-4 hover:shadow-lg transition"
          >
            <div className="flex items-start gap-3">
              <img 
                src={channel.avatar} 
                alt={channel.name}
                className="w-12 h-12 rounded-full"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <h3 className="font-bold truncate">{channel.name}</h3>
                  {channel.verified && (
                    <svg className="h-4 w-4 text-primary flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-2">{channel.type}</p>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {channel.description}
                </p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>📍 {channel.territory}</span>
                  <span>•</span>
                  <span>👥 {channel.followers.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ============================================================================
// EXEMPLO 4: ActiveCoverageSection
// ============================================================================

export function ExampleActiveCoverageSection() {
  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-bold">Cobertura Ativa</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {coverageAreas.map(area => (
          <div key={area.id} className="border rounded-lg p-5 hover:shadow-md transition">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-lg">{area.name}</h3>
                <p className="text-sm text-muted-foreground">{area.description}</p>
              </div>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                {area.type}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
              <div>
                <div className="text-2xl font-bold text-primary">{area.activeAgents}</div>
                <div className="text-xs text-muted-foreground">Agentes ativos</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{area.recentPublications}</div>
                <div className="text-xs text-muted-foreground">Publicações recentes</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ============================================================================
// EXEMPLO 5: TrendingSection com Filtros
// ============================================================================

export function ExampleTrendingSection() {
  const trendingPubs = getTrendingPublications();
  const culturePubs = getPublicationsByCategory('Cultura');
  
  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-bold">Trending no Território</h2>
      
      {/* Trending Topics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {portalNordesteMock.trending.map(topic => (
          <div key={topic.id} className="border rounded-lg p-4 text-center">
            <div className="text-lg font-bold mb-1">{topic.topic}</div>
            <div className="text-sm text-muted-foreground mb-2">{topic.category}</div>
            <div className="flex justify-center gap-2 text-xs">
              <span className="text-primary font-bold">{topic.growth}</span>
              <span className="text-muted-foreground">{topic.mentions.toLocaleString()} menções</span>
            </div>
          </div>
        ))}
      </div>
      
      {/* Trending Publications */}
      <div>
        <h3 className="text-lg font-bold mb-4">Publicações em Alta</h3>
        <div className="space-y-3">
          {trendingPubs.map(pub => (
            <div key={pub.id} className="border rounded-lg p-4 flex gap-4">
              {pub.image && (
                <img 
                  src={pub.image} 
                  alt={pub.title}
                  className="w-24 h-24 object-cover rounded"
                />
              )}
              <div className="flex-1">
                <h4 className="font-bold mb-1">{pub.title}</h4>
                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{pub.excerpt}</p>
                <div className="flex gap-3 text-xs text-muted-foreground">
                  <span>🔥 {pub.views.toLocaleString()} views</span>
                  <span>❤️ {pub.likes.toLocaleString()} likes</span>
                  <span>💬 {pub.comments} comments</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// EXEMPLO 6: Uso de Estatísticas Gerais
// ============================================================================

export function ExampleStatsSection() {
  const { stats } = portalNordesteMock;
  
  return (
    <section className="bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-lg p-8">
      <h2 className="text-2xl font-bold text-center mb-8">Comunicação Territorial em Números</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <div className="text-center">
          <div className="text-3xl font-bold text-primary mb-1">
            {stats.totalAgents}
          </div>
          <div className="text-sm text-muted-foreground">Agentes</div>
        </div>
        
        <div className="text-center">
          <div className="text-3xl font-bold text-primary mb-1">
            {stats.totalPublications.toLocaleString()}
          </div>
          <div className="text-sm text-muted-foreground">Publicações</div>
        </div>
        
        <div className="text-center">
          <div className="text-3xl font-bold text-primary mb-1">
            {(stats.totalReaders / 1000).toFixed(0)}k
          </div>
          <div className="text-sm text-muted-foreground">Leitores</div>
        </div>
        
        <div className="text-center">
          <div className="text-3xl font-bold text-primary mb-1">
            {stats.territoriesCovered}
          </div>
          <div className="text-sm text-muted-foreground">Territórios</div>
        </div>
        
        <div className="text-center">
          <div className="text-3xl font-bold text-primary mb-1">
            {stats.activeEvents}
          </div>
          <div className="text-sm text-muted-foreground">Eventos</div>
        </div>
        
        <div className="text-center">
          <div className="text-3xl font-bold text-primary mb-1">
            {stats.verifiedChannels}
          </div>
          <div className="text-sm text-muted-foreground">Verificados</div>
        </div>
      </div>
    </section>
  );
}

/**
 * DICAS DE USO:
 * 
 * 1. Sempre use key={item.id} em listas
 * 2. Use optional chaining para dados opcionais: item.image?.url
 * 3. Formate números com toLocaleString()
 * 4. Formate datas com new Date().toLocaleDateString('pt-BR')
 * 5. Use line-clamp-* para truncar texto
 * 6. Adicione hover states para melhor UX
 * 7. Use as funções auxiliares para filtrar dados
 * 8. Sempre adicione alt text em imagens
 * 9. Use semantic HTML (article, section, etc.)
 * 10. Mantenha acessibilidade em mente
 */
