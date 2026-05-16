# Mocks - Comunicação Territorial

Este diretório contém dados fictícios (mocks) para todas as páginas do módulo de Comunicação Territorial.

## 🚀 Início Rápido

1. **Ler primeiro**: `SUMMARY.md` - Visão geral completa
2. **Para integrar**: `INTEGRATION_GUIDE.md` - Guia passo a passo
3. **Ver exemplos**: `EXAMPLE_INTEGRATION.tsx` - Código pronto
4. **Acompanhar progresso**: `INTEGRATION_CHECKLIST.md` - Status das integrações

## 📖 Documentação

### Para Desenvolvedores Novos no Projeto
1. Leia `SUMMARY.md` para entender o que está disponível
2. Veja `EXAMPLE_INTEGRATION.tsx` para ver código funcionando
3. Use `INTEGRATION_GUIDE.md` como referência durante o desenvolvimento

### Para Integrar uma Seção
1. Abra `INTEGRATION_CHECKLIST.md` e escolha uma seção
2. Consulte `INTEGRATION_GUIDE.md` para a seção específica
3. Copie o código de `EXAMPLE_INTEGRATION.tsx` se disponível
4. Marque como concluído no checklist

### Para Entender os Dados
1. Abra `portal-nordeste.mock.ts`
2. Veja os tipos TypeScript no início do arquivo
3. Explore os dados mockados
4. Use as funções auxiliares no final do arquivo

## 📁 Estrutura

```
mocks/
├── portal-nordeste.mock.ts      # Mock completo do Portal Nordeste (600+ linhas)
├── index.ts                      # Exports centralizados
├── README.md                     # Esta documentação
├── SUMMARY.md                    # Sumário completo do que foi criado
├── INTEGRATION_GUIDE.md          # Guia detalhado de integração
├── INTEGRATION_CHECKLIST.md      # Checklist de progresso
└── EXAMPLE_INTEGRATION.tsx       # Exemplos de código prontos
```

## 🎯 Portal Nordeste Mock

O `portal-nordeste.mock.ts` contém dados completos simulando um portal de notícias regional do Nordeste brasileiro.

### Dados Disponíveis

#### Agentes de Comunicação
- **Portal Nordeste**: Agente principal (portal de notícias)
- **Rádio Sol Nascente**: Rádio comunitária de Recife
- **Coletivo Maracatu Digital**: Coletivo cultural de Olinda
- **Jornal do Sertão**: Jornal regional de Caruaru
- **Maria do Nordeste**: Influenciadora cultural
- **Voz da Comunidade**: Mídia comunitária de Fortaleza

#### Publicações
- **Featured**: 3 publicações em destaque
- **Latest**: 5 últimas publicações
- **Por Categoria**: Política, Saúde, Educação, Segurança

#### Eventos Culturais
- Festival Pernambuco Nação Cultural
- Sarau Poético da Periferia
- Campeonato de Futebol de Várzea
- Oficina de Cerâmica do Alto do Moura
- Show de Forró Pé de Serra

#### Áreas de Cobertura
- Recife e Região Metropolitana
- Agreste Pernambucano
- Fortaleza
- Salvador
- Olinda

#### Conteúdo Multimídia
- Vídeos
- Podcasts
- Galerias de fotos

#### Utilidade Pública
- Calendário de Coleta Seletiva
- Postos de Vacinação
- Linhas de Ônibus
- Defesa Civil - Alertas

#### Comunidades em Movimento
- Coletivo Periferia Criativa
- Horta Comunitária do Coque
- Biblioteca Popular da Vila

#### Trending Topics
- #SãoJoãoCaruaru
- #NovoMetroRecife
- #ArtesanatoNordestino
- #TecnologiaNaPeiferia

## 🚀 Como Usar

### Importação Básica

```typescript
import { portalNordesteMock } from '@/modules/communication-territorial/v2/mocks';

// Acessar dados
const publications = portalNordesteMock.featuredPublications;
const agents = portalNordesteMock.agents;
const events = portalNordesteMock.culturalEvents;
```

### Importações Específicas

```typescript
import { 
  portalNordeste,
  nordesteAgents,
  featuredPublications,
  culturalEvents,
  coverageAreas
} from '@/modules/communication-territorial/v2/mocks';
```

### Funções Auxiliares

```typescript
import { 
  getPublicationsByTerritory,
  getPublicationsByCategory,
  getAgentsByType,
  getEventsByCategory,
  getTrendingPublications,
  getFeaturedPublications
} from '@/modules/communication-territorial/v2/mocks';

// Filtrar por território
const recifeNews = getPublicationsByTerritory('Recife');

// Filtrar por categoria
const cultureNews = getPublicationsByCategory('Cultura');

// Filtrar agentes por tipo
const radios = getAgentsByType('radio');

// Obter eventos por categoria
const musicEvents = getEventsByCategory('music');

// Obter publicações em trending
const trending = getTrendingPublications();
```

## 📋 Exemplos de Uso nas Páginas

### HeroSection
```typescript
import { portalNordesteMock } from '@/modules/communication-territorial/v2/mocks';

export function HeroSection() {
  const featured = portalNordesteMock.featuredPublications[0];
  
  return (
    <div>
      <h1>{featured.title}</h1>
      <p>{featured.excerpt}</p>
    </div>
  );
}
```

### VerifiedChannelsSection
```typescript
import { verifiedChannels } from '@/modules/communication-territorial/v2/mocks';

export function VerifiedChannelsSection() {
  return (
    <div>
      {verifiedChannels.map(channel => (
        <ChannelCard key={channel.id} channel={channel} />
      ))}
    </div>
  );
}
```

### EventsCultureSection
```typescript
import { culturalEvents } from '@/modules/communication-territorial/v2/mocks';

export function EventsCultureSection() {
  return (
    <div>
      {culturalEvents.map(event => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}
```

### ActiveCoverageSection
```typescript
import { coverageAreas } from '@/modules/communication-territorial/v2/mocks';

export function ActiveCoverageSection() {
  return (
    <div>
      {coverageAreas.map(area => (
        <CoverageCard key={area.id} area={area} />
      ))}
    </div>
  );
}
```

## 🎨 Tipos TypeScript

Todos os tipos estão definidos no arquivo `portal-nordeste.mock.ts`:

- `MediaAgent`: Agente de comunicação
- `Publication`: Publicação/notícia
- `Event`: Evento cultural
- `CoverageArea`: Área de cobertura

## 🔄 Atualizações Futuras

Para adicionar novos mocks:

1. Crie um novo arquivo `[nome].mock.ts`
2. Siga a estrutura do `portal-nordeste.mock.ts`
3. Exporte no `index.ts`
4. Documente aqui no README

## 📝 Notas

- Todos os dados são fictícios
- URLs de imagens usam Unsplash como placeholder
- Datas são relativas a maio de 2024
- Territórios focam no Nordeste brasileiro
- IDs seguem padrão: `[tipo]-[número]`

## 🎯 Uso em Produção

**IMPORTANTE**: Estes mocks são apenas para desenvolvimento. Em produção, substitua por:

1. Chamadas à API real
2. Dados do Supabase
3. Integração com CMS
4. Dados de usuários reais

## 🤝 Contribuindo

Ao adicionar novos mocks:

- Mantenha consistência nos IDs
- Use imagens do Unsplash
- Adicione tipos TypeScript
- Documente no README
- Crie funções auxiliares quando necessário
