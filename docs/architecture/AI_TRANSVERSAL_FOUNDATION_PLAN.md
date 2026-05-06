# IA Transversal - Fase 1 Enxuta

Status: plano tecnico de validacao
Escopo: busca inteligente por intencao
Objetivo: validar valor real antes de construir a fundacao completa

## 1. Objetivo

Implementar uma Fase 1 pequena, funcional e validavel para busca inteligente.

O usuario acessa `/buscar`, digita uma frase natural e recebe resultados reais de empresas e servicos, respeitando `location_id`, geospatial e services canonicos existentes.

Esta fase nao cria plataforma completa de IA. Ela valida se a busca por intencao melhora a experiencia antes de expandir para classificacao, moderacao, recomendacao, custo e telemetria avancada.

## 2. Fora do Escopo

Nao implementar nesta fase:

- `ai_jobs`
- `ai_usage_events`
- classificacao automatica
- moderacao por IA
- multiplos providers
- ranking aprendido
- CRM
- personalizacao
- embeddings
- dashboard de custo
- logs avancados
- fila generica de IA

Esses pontos ficam para a fundacao completa depois da validacao.

## 3. Regras Obrigatorias

1. Criar codigo em `src/core/ai`.
2. `IntentParser` retorna JSON estruturado, nunca texto livre.
3. Tipos de intent suportados apenas:
   - `business_search`
   - `service_search`
   - `unknown`
4. Toda busca territorial usa `location_id`.
5. Nao criar campos ou filtros novos baseados em `city`/`neighborhood`.
6. Usar `BusinessService` para empresas.
7. Usar `SpatialSearchService` quando houver coordenadas.
8. Services canonicos continuam sendo donos das regras de dominio.
9. UI deve ser simples: input estilo Google + lista de resultados.
10. Se IA falhar, fallback deterministico deve buscar pelo texto cru.

## 4. Estrutura Minima

```text
src/core/ai/
  index.ts

  domain/
    types.ts

  providers/
    OpenAIProvider.ts
    MockAIProvider.ts

  intent/
    IntentParser.ts

  orchestrator/
    AIOrchestratorService.ts

  actions/
    IActionHandler.ts
    SearchBusinessesActionHandler.ts
    SearchServicesActionHandler.ts

  hooks/
    useAISearch.ts

  components/
    AISearchBox.tsx
    AISearchResults.tsx
```

Pagina:

```text
src/app/pages/BuscarPage.tsx
```

Rota:

```text
/buscar
```

## 5. Contratos TypeScript

### 5.1 Contexto

```ts
export interface AISearchContext {
  userId?: string | null;
  profileId?: string | null;
  locationId: string | null;
  coordinates?: {
    latitude: number;
    longitude: number;
  } | null;
}
```

### 5.2 Intent

```ts
export type AIIntentType =
  | 'business_search'
  | 'service_search'
  | 'unknown';

export interface AIIntent {
  type: AIIntentType;
  query: string;
  normalizedQuery: string;
  confidence: number;
  locationId: string | null;
  filters: {
    category?: string | null;
    tags?: string[];
    radiusKm?: number | null;
    openNow?: boolean;
    delivery?: boolean;
    urgent?: boolean;
  };
}
```

### 5.3 Resultado

```ts
export type AISearchResultType = 'business' | 'service';

export interface AISearchResultItem {
  type: AISearchResultType;
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  url?: string;
  imageUrl?: string;
  locationId: string | null;
  distanceMeters?: number;
  badges: string[];
  raw: unknown;
}

export interface AISearchResponse {
  intent: AIIntent;
  results: AISearchResultItem[];
  empty: boolean;
  message: string;
}
```

### 5.4 Handler

```ts
export interface IActionHandler {
  canHandle(intent: AIIntent): boolean;
  execute(intent: AIIntent, context: AISearchContext): Promise<AISearchResultItem[]>;
}
```

## 6. IntentParser

Responsabilidade:

- receber texto livre;
- retornar `AIIntent`;
- nunca retornar texto livre;
- limitar tipos a `business_search`, `service_search`, `unknown`;
- aplicar `locationId` do contexto;
- normalizar query e filtros simples.

Exemplo de retorno:

```json
{
  "type": "business_search",
  "query": "pizzaria barata com delivery",
  "normalizedQuery": "pizzaria",
  "confidence": 0.86,
  "locationId": "location-id-ativo",
  "filters": {
    "category": "gastronomy",
    "tags": ["barato", "delivery"],
    "radiusKm": 5,
    "delivery": true
  }
}
```

Fallback deterministico:

```ts
{
  type: 'business_search',
  query,
  normalizedQuery: query.trim().toLowerCase(),
  confidence: 0.3,
  locationId: context.locationId,
  filters: {
    radiusKm: context.coordinates ? 5 : null,
    tags: [],
  },
}
```

## 7. Provider

Fase 1 usa apenas um provider.

Implementacoes:

- `OpenAIProvider`: provider real, quando secret estiver configurado.
- `MockAIProvider`: provider deterministico para desenvolvimento/testes.

Contrato do provider:

```ts
export interface AIIntentProvider {
  parseIntent(input: {
    query: string;
    locationId: string | null;
  }): Promise<unknown>;
}
```

Regra:

- `IntentParser` valida e normaliza o JSON retornado.
- Componentes React nunca importam provider.
- Provider real nunca e chamado em teste unitario.

## 8. AIOrchestratorService

Responsabilidade:

1. Receber query e contexto.
2. Chamar `IntentParser`.
3. Escolher handler.
4. Executar handler.
5. Retornar `AISearchResponse`.

Fluxo:

```ts
export class AIOrchestratorService {
  constructor(
    private intentParser: IntentParser,
    private handlers: IActionHandler[],
  ) {}

  async search(query: string, context: AISearchContext): Promise<AISearchResponse> {
    const intent = await this.intentParser.parse(query, context);
    const handler = this.handlers.find((h) => h.canHandle(intent));

    if (!handler || intent.type === 'unknown') {
      return {
        intent,
        results: [],
        empty: true,
        message: 'Nao encontrei uma busca executavel para esse texto.',
      };
    }

    const results = await handler.execute(intent, context);

    return {
      intent,
      results,
      empty: results.length === 0,
      message: results.length > 0
        ? 'Encontrei alguns resultados para sua busca.'
        : 'Nao encontrei resultados nessa localizacao.',
    };
  }
}
```

## 9. SearchBusinessesActionHandler

Responsabilidade:

- buscar empresas reais;
- usar `BusinessService`;
- usar `SpatialSearchService` se houver coordenadas;
- respeitar `location_id`;
- retornar itens normalizados para UI.

Fluxo com coordenadas:

```ts
const spatialResults = await spatialSearchService.searchHybrid({
  center: context.coordinates,
  radiusKm: intent.filters.radiusKm ?? 5,
  entityType: 'business',
  locationIds: context.locationId ? [context.locationId] : undefined,
  limit: 20,
});

const businesses = await BusinessService.getBusinessesByIds(
  spatialResults.map((r) => r.id),
);
```

Fluxo sem coordenadas:

```ts
const { businesses } = await BusinessService.getBusinessesList({
  searchQuery: intent.normalizedQuery,
  filter: context.locationId
    ? { scope: 'location', location_id: context.locationId }
    : undefined,
  pageSize: 20,
});
```

Mapeamento:

```ts
{
  type: 'business',
  id: business.id,
  title: business.name,
  subtitle: business.category,
  description: business.description,
  url: business.slug ? `/empresas/${business.slug}` : undefined,
  locationId: business.location_id ?? null,
  badges: intent.filters.delivery ? ['delivery'] : [],
  raw: business,
}
```

## 10. SearchServicesActionHandler

Responsabilidade:

- buscar servicos/profissionais;
- usar service canonico de profissionais/servicos quando disponivel;
- usar `location_id` como base territorial;
- preparar evolucao para `CoverageService`.

Fase 1 pragmatica:

- se existir service canonico de profissionais com busca, usar esse service;
- se coverage estiver pronto para o entity type, filtrar por coverage;
- se nao houver handler confiavel ainda, retornar vazio com mensagem controlada, sem quebrar busca de empresas.

Contrato esperado:

```ts
class SearchServicesActionHandler implements IActionHandler {
  canHandle(intent: AIIntent) {
    return intent.type === 'service_search';
  }

  async execute(intent: AIIntent, context: AISearchContext) {
    // Integrar ProfessionalService/ServicesService canonico.
    // Usar location_id; nao usar city/neighborhood.
    return [];
  }
}
```

## 11. UI `/buscar`

### 11.1 BuscarPage

Responsabilidade:

- renderizar input;
- chamar `useAISearch`;
- mostrar estado de loading;
- mostrar lista de resultados.

Layout:

```text
[               O que voce procura?               ]

Resultados
- Card empresa/servico
- Card empresa/servico
- Card empresa/servico
```

### 11.2 AISearchBox

Props:

```ts
interface AISearchBoxProps {
  value: string;
  loading: boolean;
  onChange(value: string): void;
  onSubmit(): void;
}
```

### 11.3 AISearchResults

Props:

```ts
interface AISearchResultsProps {
  response: AISearchResponse | null;
}
```

## 12. Exemplos de Busca

### 12.1 Empresa

Input:

```text
pizzaria barata com delivery
```

Intent:

```json
{
  "type": "business_search",
  "normalizedQuery": "pizzaria",
  "confidence": 0.86,
  "filters": {
    "delivery": true,
    "tags": ["barato", "delivery"],
    "radiusKm": 5
  }
}
```

Resultado esperado:

- pizzarias reais;
- dentro do `location_id` ativo;
- se houver coordenadas, proximidade melhora ordenacao.

### 12.2 Servico

Input:

```text
preciso de encanador urgente
```

Intent:

```json
{
  "type": "service_search",
  "normalizedQuery": "encanador",
  "confidence": 0.9,
  "filters": {
    "urgent": true,
    "tags": ["urgente"],
    "radiusKm": 5
  }
}
```

Resultado esperado:

- profissionais/servicos reais quando handler estiver conectado;
- sempre filtrado por `location_id`;
- sem fallback para campos territoriais legados.

### 12.3 Unknown

Input:

```text
me conte uma piada
```

Intent:

```json
{
  "type": "unknown",
  "normalizedQuery": "me conte uma piada",
  "confidence": 0.2,
  "filters": {}
}
```

Resultado:

- mensagem de busca nao executavel;
- sem chamada a handlers.

## 13. Plano de Implementacao

### Etapa 1 - Tipos e Parser

Criar:

- `src/core/ai/domain/types.ts`
- `src/core/ai/providers/MockAIProvider.ts`
- `src/core/ai/providers/OpenAIProvider.ts`
- `src/core/ai/intent/IntentParser.ts`
- `src/core/ai/index.ts`

Validacao:

- parser retorna apenas tipos permitidos;
- fallback funciona;
- `locationId` e preservado.

### Etapa 2 - Orquestrador e Handlers

Criar:

- `AIOrchestratorService`
- `IActionHandler`
- `SearchBusinessesActionHandler`
- `SearchServicesActionHandler`

Validacao:

- busca de empresas usa `BusinessService`;
- busca com coordenadas usa `SpatialSearchService`;
- nao existe uso novo de `city`/`neighborhood`.

### Etapa 3 - Hook e UI

Criar:

- `useAISearch`
- `AISearchBox`
- `AISearchResults`
- `BuscarPage`
- rota `/buscar`

Validacao:

- usuario digita query;
- resultados reais aparecem;
- loading e empty state funcionam.

### Etapa 4 - Testes

Criar testes para:

- `IntentParser`;
- `AIOrchestratorService`;
- `SearchBusinessesActionHandler`;
- rota/pagina em teste de componente se houver padrao existente.

Comandos:

```powershell
npm run lint -- --max-warnings=0
npm run typecheck
```

## 14. Criterios de Aceite

Fase 1 esta pronta quando:

1. `/buscar` existe.
2. Usuario consegue pesquisar em linguagem natural.
3. `IntentParser` retorna JSON estruturado.
4. `business_search` retorna empresas reais.
5. `service_search` tem handler criado e preparado para service canonico.
6. Busca respeita `location_id`.
7. `SpatialSearchService` e usado quando coordenadas existem.
8. Nenhum novo contrato usa `city`/`neighborhood`.
9. `unknown` nao executa busca indevida.
10. Lint/typecheck passam.

## 15. Evolucao Depois da Validacao

Somente depois de validar a Fase 1:

1. `ai_jobs`
2. `ai_usage_events`
3. classificacao automatica
4. moderacao IA
5. recomendacao
6. personalizacao
7. embeddings
8. multiplos providers
9. dashboard de custo
10. CRM para empresas

