# 📊 Estrutura de Dados - Portal Nordeste Mock

Visualização clara e organizada de todos os dados disponíveis nos mocks.

---

## 🎭 Tipos Base

### MediaAgent
Representa um agente de comunicação (portal, rádio, coletivo, etc.)

```typescript
{
  id: string                    // Identificador único
  name: string                  // Nome do agente
  type: 'portal' | 'radio' | 'collective' | 'newspaper' | 'influencer' | 'community'
  territory: string             // Localização
  verified: boolean             // Se é verificado
  followers: number             // Número de seguidores
  avatar: string                // URL do avatar
  description: string           // Descrição
  socialLinks?: {               // Links sociais (opcional)
    instagram?: string
    facebook?: string
    twitter?: string
    youtube?: string
    website?: string
  }
}
```

### Publication
Representa uma publicação/notícia

```typescript
{
  id: string                    // Identificador único
  title: string                 // Título
  excerpt: string               // Resumo
  content?: string              // Conteúdo completo (opcional)
  author: MediaAgent            // Autor (objeto MediaAgent)
  publishedAt: string           // Data de publicação (ISO)
  category: string              // Categoria
  tags: string[]                // Tags
  image?: string                // URL da imagem (opcional)
  views: number                 // Visualizações
  likes: number                 // Curtidas
  comments: number              // Comentários
  territory: string             // Território
  featured?: boolean            // Se é destaque (opcional)
  trending?: boolean            // Se está em alta (opcional)
}
```

### Event
Representa um evento cultural

```typescript
{
  id: string                    // Identificador único
  title: string                 // Título
  description: string           // Descrição
  organizer: MediaAgent         // Organizador (objeto MediaAgent)
  date: string                  // Data (YYYY-MM-DD)
  time: string                  // Horário (HH:MM)
  location: string              // Local
  territory: string             // Território
  category: 'culture' | 'music' | 'art' | 'sport' | 'community'
  image?: string                // URL da imagem (opcional)
  attendees: number             // Número de participantes
}
```

### CoverageArea
Representa uma área de cobertura

```typescript
{
  id: string                    // Identificador único
  name: string                  // Nome da área
  type: 'neighborhood' | 'city' | 'region'
  activeAgents: number          // Agentes ativos
  recentPublications: number    // Publicações recentes
  description: string           // Descrição
}
```

---

## 📦 Dados Disponíveis

### 1. Agente Principal

**`portalNordeste`** - MediaAgent

```
Portal Nordeste
├─ ID: portal-nordeste-001
├─ Tipo: portal
├─ Território: Nordeste
├─ Verificado: ✅ Sim
├─ Seguidores: 125.000
└─ Redes: Instagram, Facebook, Twitter, YouTube, Website
```

### 2. Outros Agentes (5)

**`nordesteAgents`** - MediaAgent[]

```
1. Rádio Sol Nascente
   ├─ Tipo: radio
   ├─ Território: Recife, PE
   ├─ Seguidores: 45.000
   └─ Verificado: ✅

2. Coletivo Maracatu Digital
   ├─ Tipo: collective
   ├─ Território: Olinda, PE
   ├─ Seguidores: 32.000
   └─ Verificado: ✅

3. Jornal do Sertão
   ├─ Tipo: newspaper
   ├─ Território: Caruaru, PE
   ├─ Seguidores: 28.000
   └─ Verificado: ✅

4. Maria do Nordeste
   ├─ Tipo: influencer
   ├─ Território: Salvador, BA
   ├─ Seguidores: 89.000
   └─ Verificado: ✅

5. Voz da Comunidade
   ├─ Tipo: community
   ├─ Território: Fortaleza, CE
   ├─ Seguidores: 15.000
   └─ Verificado: ❌
```

### 3. Publicações em Destaque (3)

**`featuredPublications`** - Publication[]

```
1. São João 2024: Caruaru se prepara...
   ├─ Categoria: Cultura
   ├─ Território: Caruaru, PE
   ├─ Views: 45.000
   ├─ Likes: 3.200
   ├─ Featured: ✅
   └─ Trending: ✅

2. Novo corredor de ônibus BRT...
   ├─ Categoria: Mobilidade
   ├─ Território: Recife, PE
   ├─ Views: 32.000
   ├─ Likes: 2.100
   └─ Featured: ✅

3. Artesãos do Alto do Moura...
   ├─ Categoria: Arte
   ├─ Território: Caruaru, PE
   ├─ Views: 28.000
   ├─ Likes: 1.850
   └─ Featured: ✅
```

### 4. Últimas Publicações (5)

**`latestPublications`** - Publication[]

```
1. Chuvas intensas causam alagamentos...
   ├─ Categoria: Emergência
   ├─ Território: Fortaleza, CE
   └─ Views: 18.000

2. Festival de Cinema do Recife...
   ├─ Categoria: Cinema
   ├─ Território: Recife, PE
   └─ Views: 15.000

3. Projeto social ensina programação...
   ├─ Categoria: Educação
   ├─ Território: Fortaleza, CE
   ├─ Views: 22.000
   └─ Trending: ✅

4. Maracatu Nação Pernambuco...
   ├─ Categoria: Cultura
   ├─ Território: Olinda, PE
   └─ Views: 19.000

5. Feira de agricultura familiar...
   ├─ Categoria: Economia
   ├─ Território: Caruaru, PE
   └─ Views: 12.000
```

### 5. Eventos Culturais (5)

**`culturalEvents`** - Event[]

```
1. Festival Pernambuco Nação Cultural
   ├─ Categoria: culture
   ├─ Data: 15/06/2024 às 14:00
   ├─ Local: Parque Dona Lindu, Boa Viagem
   ├─ Território: Recife, PE
   └─ Participantes: 5.000

2. Sarau Poético da Periferia
   ├─ Categoria: art
   ├─ Data: 20/05/2024 às 19:00
   ├─ Local: Centro Cultural Bom Jardim
   ├─ Território: Fortaleza, CE
   └─ Participantes: 200

3. Campeonato de Futebol de Várzea
   ├─ Categoria: sport
   ├─ Data: 25/05/2024 às 16:00
   ├─ Local: Campo do Conjunto Ceará
   ├─ Território: Fortaleza, CE
   └─ Participantes: 1.500

4. Oficina de Cerâmica do Alto do Moura
   ├─ Categoria: art
   ├─ Data: 01/06/2024 às 09:00
   ├─ Local: Alto do Moura
   ├─ Território: Caruaru, PE
   └─ Participantes: 30

5. Show de Forró Pé de Serra
   ├─ Categoria: music
   ├─ Data: 10/06/2024 às 20:00
   ├─ Local: Pátio de São Pedro
   ├─ Território: Recife, PE
   └─ Participantes: 3.000
```

### 6. Áreas de Cobertura (5)

**`coverageAreas`** - CoverageArea[]

```
1. Recife e Região Metropolitana
   ├─ Tipo: region
   ├─ Agentes ativos: 45
   └─ Publicações recentes: 234

2. Agreste Pernambucano
   ├─ Tipo: region
   ├─ Agentes ativos: 28
   └─ Publicações recentes: 156

3. Fortaleza
   ├─ Tipo: city
   ├─ Agentes ativos: 38
   └─ Publicações recentes: 198

4. Salvador
   ├─ Tipo: city
   ├─ Agentes ativos: 52
   └─ Publicações recentes: 287

5. Olinda
   ├─ Tipo: city
   ├─ Agentes ativos: 22
   └─ Publicações recentes: 89
```

### 7. Notícias por Categoria

**`localNewsByCategory`** - Object

```
politics (1 notícia)
└─ Câmara de Recife aprova novo plano diretor

health (1 notícia)
└─ Campanha de vacinação contra gripe...

education (1 notícia)
└─ Escolas municipais recebem novos laboratórios...

security (1 notícia)
└─ Operação policial reduz índices de criminalidade...
```

### 8. Conteúdo Multimídia

**`multimediaContent`** - Object

```
videos (2 itens)
├─ Bastidores do São João de Caruaru 2024 (12:34)
└─ Documentário: Artesãos do Alto do Moura (28:15)

podcasts (1 item)
└─ Papo Nordestino #45: Cultura Popular (45:20)

photoGalleries (1 item)
└─ Recife em 20 fotos: belezas da capital (20 fotos)
```

### 9. Utilidade Pública (4)

**`publicUtilityInfo`** - Array

```
1. Calendário de Coleta Seletiva
   └─ Categoria: Meio Ambiente

2. Postos de Vacinação
   └─ Categoria: Saúde

3. Linhas de Ônibus
   └─ Categoria: Transporte

4. Defesa Civil - Alertas
   └─ Categoria: Emergência
```

### 10. Comunidades em Movimento (3)

**`communitiesInMotion`** - Array

```
1. Coletivo Periferia Criativa
   ├─ Membros: 450
   ├─ Território: Fortaleza, CE
   └─ Atividade: Organizou festival de grafite

2. Horta Comunitária do Coque
   ├─ Membros: 120
   ├─ Território: Recife, PE
   └─ Atividade: Colheita de 200kg de hortaliças

3. Biblioteca Popular da Vila
   ├─ Membros: 280
   ├─ Território: Olinda, PE
   └─ Atividade: Inaugurou espaço infantil
```

### 11. Trending Topics (4)

**`trendingTopics`** - Array

```
1. #SãoJoãoCaruaru
   ├─ Menções: 45.000
   ├─ Crescimento: +320%
   └─ Categoria: Cultura

2. #NovoMetroRecife
   ├─ Menções: 32.000
   ├─ Crescimento: +180%
   └─ Categoria: Mobilidade

3. #ArtesanatoNordestino
   ├─ Menções: 28.000
   ├─ Crescimento: +95%
   └─ Categoria: Arte

4. #TecnologiaNaPeiferia
   ├─ Menções: 22.000
   ├─ Crescimento: +150%
   └─ Categoria: Educação
```

### 12. Estatísticas Gerais

**`portalStats`** - Object

```
Portal Nordeste - Estatísticas
├─ Total de agentes: 156
├─ Total de publicações: 2.340
├─ Total de leitores: 450.000
├─ Territórios cobertos: 45
├─ Eventos ativos: 89
└─ Canais verificados: 67
```

---

## 🔧 Funções Auxiliares

### Filtros Disponíveis

```typescript
// Por território
getPublicationsByTerritory('Recife')
// Retorna: Publication[]

// Por categoria
getPublicationsByCategory('Cultura')
// Retorna: Publication[]

// Agentes por tipo
getAgentsByType('radio')
// Retorna: MediaAgent[]

// Eventos por categoria
getEventsByCategory('music')
// Retorna: Event[]

// Publicações trending
getTrendingPublications()
// Retorna: Publication[]

// Publicações em destaque
getFeaturedPublications()
// Retorna: Publication[]
```

---

## 📊 Resumo Quantitativo

| Tipo de Dado | Quantidade | Variações |
|--------------|------------|-----------|
| Agentes | 6 | 6 tipos diferentes |
| Publicações | 11 | 8 categorias |
| Eventos | 5 | 5 categorias |
| Áreas de Cobertura | 5 | 3 tipos |
| Notícias por Categoria | 4 | 4 categorias |
| Vídeos | 2 | - |
| Podcasts | 1 | - |
| Galerias | 1 | - |
| Utilidade Pública | 4 | 4 categorias |
| Comunidades | 3 | - |
| Trending Topics | 4 | 4 categorias |

**Total de itens mockados**: 46 itens

---

## 🎯 Uso Recomendado por Seção

| Seção | Dados Recomendados |
|-------|-------------------|
| HeroSection | `stats`, `verifiedChannels` |
| FeaturedMediaSection | `featuredPublications` |
| ActiveCoverageSection | `coverageAreas` |
| VerifiedChannelsSection | `verifiedChannels` |
| TrendingTerritorialSection | `trendingTopics`, `getTrendingPublications()` |
| LatestPublicationsSection | `latestPublications` |
| CommunitiesInMotionSection | `communitiesInMotion` |
| EventsCultureSection | `culturalEvents` |
| LocalNewsSection | `localNewsByCategory` |
| PublicUtilitySection | `publicUtilityInfo` |
| MultimediaContentSection | `multimediaContent` |

---

**Última atualização**: 15/05/2024  
**Versão**: 1.0.0
