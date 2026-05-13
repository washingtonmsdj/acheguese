## Análise do estado atual

O módulo `src/modules/ai` hoje contém **apenas** `virtual-tryon`. Não existe:

- Gateway/cliente unificado para chamar a Lovable AI a partir de edge functions
- Camada de capabilities reutilizáveis (texto, JSON estruturado, embeddings, visão, moderação)
- Padrão para os demais módulos consumirem IA (cada feature reinventa)
- Observabilidade (custo, tokens, latência), rate-limit por usuário/feature, cache semântico
- Sistema próprio de **geração de imagem** (o Try-On usa Replicate; o resto do projeto não tem nada)

Edge functions com IA hoje: `tryon-generate` (Replicate IDM-VTON) e `territory-ai-content` (Lovable AI direto, sem abstração). O erro 401 recorrente vem de chamadas ao gateway sem padronização do header e sem fallback claro entre providers.

Comunidade, gastronomia, empresas e classificados não consomem IA hoje — há grande oportunidade.

---

## Objetivo

Transformar `src/modules/ai` em **plataforma de IA SSOT** do projeto, com:

1. Gateway único (Lovable AI por padrão, fallback para providers externos)
2. Capabilities tipadas e reutilizáveis
3. Sistema de geração/edição de imagem robusto (Nano Banana 2 + Pro)
4. Integrações em comunidade, gastronomia, empresas e classificados
5. Governança: custo, rate-limit, moderação, auditoria

---

## Arquitetura alvo

```text
src/modules/ai/
├── core/                          # SSOT
│   ├── domain/
│   │   ├── types.ts               # AiRequest, AiResponse, AiUsage, AiError
│   │   ├── models.ts              # catálogo de modelos (gemini-3-flash, gpt-5, etc.)
│   │   └── capabilities.ts        # text, json, vision, image, embed, moderation
│   ├── client/
│   │   ├── gatewayClient.ts       # cliente fetch único p/ ai.gateway.lovable.dev
│   │   ├── streaming.ts           # parser SSE robusto (line-by-line, CRLF, [DONE])
│   │   └── errors.ts              # mapeia 401/402/429 → AiError tipado
│   └── policies/
│       ├── rateLimit.ts           # por user_id + feature
│       ├── safety.ts              # negative prompts, moderação de input
│       └── cost.ts                # estimativa e tracking de custo
│
├── capabilities/                  # APIs de alto nível p/ frontend e edge
│   ├── text/                      # completions (chat, summarize, rewrite)
│   ├── structured/                # JSON via tool-calling (sempre que possível)
│   ├── vision/                    # análise de imagem (descrever produto, OCR)
│   ├── image/                     # geração + edição (substitui hoje fragmentado)
│   ├── embeddings/                # gemini-embedding-001 p/ busca semântica
│   └── moderation/                # filtro de conteúdo (texto + imagem)
│
├── features/                      # casos de uso de produto (UIs prontas)
│   ├── virtual-tryon/             # módulo atual, refatorado p/ usar core
│   ├── content-assistant/         # composer com sugestões IA
│   ├── moderation-assistant/      # admin: triagem de denúncias
│   └── search-semantic/           # busca semântica transversal
│
├── integrations/                  # adapters p/ outros módulos
│   ├── community/                 # composer, alertas, recomendações
│   ├── business/                  # descrições, FAQ, classificação NCM
│   ├── gastronomy/                # cardápio (foto→prato), descrições
│   └── classifieds/               # título/descrição/categoria sugeridos
│
└── shared/
    ├── components/                # AiButton, AiSuggestionPanel, AiImagePicker
    ├── hooks/                     # useAiCompletion, useAiImage, useAiStream
    └── ui/                        # design tokens "AI" (badges, glow, etc.)

supabase/functions/
├── _ai/                           # helpers compartilhados (gateway, auth, log)
│   ├── gateway.ts                 # fetch padronizado + retry + error mapping
│   ├── usage.ts                   # grava em ai_usage_log
│   └── moderation.ts
├── ai-text/                       # endpoint genérico (text/json/structured)
├── ai-image/                      # geração + edição (Nano Banana 2)
├── ai-vision/                     # análise de imagem
├── ai-embed/                      # embeddings (batch)
└── tryon-generate/                # mantém, refatorado p/ usar _ai/gateway
```

### Banco (novas tabelas)

- `ai_usage_log` — telemetria por chamada (user_id, feature, model, tokens_in/out, cost_estimate, latency_ms, status)
- `ai_rate_limits` — janelas configuráveis por feature
- `ai_moderation_log` — bloqueios + motivo
- `ai_embeddings` — `entity_type`, `entity_id`, `vector` (pgvector) p/ busca semântica
- `ai_image_generations` — histórico unificado de imagens IA (try-on é caso especial)

Tudo com RLS por `user_id`; admin com `has_role`.

---

## Sistema de imagem (renovação completa)

Substitui o fluxo Replicate-only por **pipeline padronizado**:

1. **Provider primário**: Lovable AI Gateway com `google/gemini-3.1-flash-image-preview` (Nano Banana 2) — rápido + qualidade pro
2. **Provider premium opcional**: `google/gemini-3-pro-image-preview` quando o usuário marca "alta fidelidade"
3. **Provider especialista**: Replicate IDM-VTON **só para virtual try-on de roupas** (caso onde Nano Banana ainda perde)
4. Edge function única `ai-image` aceita: `{ mode: "generate" | "edit" | "tryon", prompt, refs[], style, count, seed }`
5. Upload automático no bucket `ai-images` (público leitura, RLS escrita por owner) com paths `{user_id}/{feature}/{uuid}.png`
6. Cache: hash do `(prompt + refs + model)` evita regenerar igual em <24h
7. Retry com backoff em 429; surface 402 como toast "Adicionar créditos"
8. Hook `useAiImage()` único com estados `pending|streaming|done|failed`
9. Componente `<AiImagePicker />` reutilizável (variações, seleção, regenerar)

---

## Integrações por módulo

### Comunidade (foco principal)

- **Composer inteligente** (`UnifiedComposer`): sugere título, melhora texto, gera imagem ilustrativa, sugere categoria/tags e bairro a partir do conteúdo
- **Alertas**: classifica severidade automaticamente, sugere tipo (ALERT_SEVERITY) e gera resumo curto p/ push
- **Issues cívicos**: detecta tipo de problema a partir da foto (vision), sugere órgão responsável
- **Lost & Found**: matching semântico entre "perdi" e "achei" via embeddings
- **Recommendations**: gera resumo "porque recomendar" a partir das interações
- **Moderação**: triagem automática de posts/comentários antes do feed
- **Feed**: ranking semântico personalizado (embedding do post × interesses do user)

### Gastronomia

- **Cardápio por foto**: lojista tira foto do prato → IA preenche nome, descrição, alérgenos, sugere preço
- **Geração de imagem do prato** quando o lojista não tem foto (Nano Banana 2)
- **Descrição do estabelecimento** + tags de cozinha (CUISINE_TYPES) sugeridas
- **Resposta automática de avaliações** (rascunho p/ owner)

### Empresas (business)

- **Onboarding**: a partir de nome + categoria, sugere bio, horários típicos, palavras-chave SEO
- **Classificação** automática em vertical/categoria
- **FAQ generativo** baseado em perguntas frequentes da própria página
- **Geração de banner/logo placeholder** via Nano Banana 2

### Classificados

- **Foto → Anúncio**: vision detecta produto, sugere título, categoria, condição (novo/usado), faixa de preço regional
- **Reescrita** do anúncio em tom mais vendedor
- **Detecção de duplicatas** via embedding
- **Moderação** automática (conteúdo proibido, imagens impróprias)

### Mobilidade / Profissionais (bônus, escopo menor)

- Resumo automático de chamados; classificação de denúncias

---

## Governança e segurança

- **Rate-limit duplo**: por user_id (janela diária) + por feature (janela curta)
- **Moderação de input** antes de gastar créditos
- **Auditoria** completa em `ai_usage_log` (admin pode ver custo por feature)
- **Surfaçar 402/429** sempre como toast amigável, com CTA p/ créditos
- **Sem chamadas client-side ao gateway**: tudo via edge functions
- **Cache semântico** opcional (embedding do prompt) p/ reduzir custo

---

## Fases de execução

### Fase 1 — Núcleo (`ai/core` + edge `_ai`)

1. Criar `src/modules/ai/core` com types, gatewayClient, streaming SSE, errors
2. Criar `supabase/functions/_ai/gateway.ts` (fetch padronizado, retry, mapping 401/402/429)
3. Migration: `ai_usage_log`, `ai_rate_limits`, `ai_moderation_log` (com RLS)
4. Refatorar `tryon-generate` e `territory-ai-content` p/ usar `_ai/gateway`

### Fase 2 — Capabilities + edge functions genéricas

5. Edge `ai-text` (chat, json, structured via tool-calling, streaming opcional)
6. Edge `ai-image` (generate, edit, com Nano Banana 2 + cache + bucket `ai-images`)
7. Edge `ai-vision` (descrever imagem, OCR)
8. Edge `ai-embed` (batch embeddings) + tabela `ai_embeddings` com pgvector
9. Hooks `useAiCompletion`, `useAiImage`, `useAiVision`, `useAiSearch`
10. Componentes compartilhados: `AiButton`, `AiSuggestionPanel`, `AiImagePicker`, `AiStreamingText`

### Fase 3 — Refatorar Virtual Try-On

11. Mover para `features/virtual-tryon`, consumir `ai-image` (tryon mode) e `ai_image_generations`
12. Manter Replicate só como provider interno do tryon, atrás do gateway
13. Resolver definitivamente o 401 (header + key trim + log estruturado)

### Fase 4 — Comunidade (prioridade do usuário)

14. Composer com sugestões IA (título, tags, imagem, bairro)
15. Classificação automática de alertas + severidade
16. Vision em issues cívicos
17. Matching semântico Lost & Found (embeddings)
18. Moderação automática no pipeline de publicação

### Fase 5 — Gastronomia + Empresas + Classificados

19. Gastronomia: foto→prato, geração de imagem, descrição
20. Empresas: onboarding assistido + FAQ + classificação
21. Classificados: foto→anúncio, dedup, moderação

### Fase 6 — Governança e UX final

22. Painel admin `/admin/ai` com métricas (custo, latência, top features, erros)
23. Página `/ai` (dashboard do usuário com seu uso, créditos, histórico de imagens)
24. Documentação `docs/ai/PLATFORM.md` + atualização de `CURRENT_RULES.md` ("acesso à IA só via `modules/ai`")

---

## Detalhes técnicos relevantes

- Modelo padrão: `google/gemini-3-flash-preview` (texto), `google/gemini-3.1-flash-image-preview` (imagem). Override por feature.
- Structured output: sempre via **tool-calling** (não pedir "retorne JSON" no prompt).
- Streaming SSE: parser line-by-line, com flush final, tratando CRLF e `[DONE]`.
- Edge functions: validação Zod no body, CORS via `npm:@supabase/supabase-js@2/cors`, sem hardcoded paths.
- Embeddings: `google/gemini-embedding-001`, dimensão 768, pgvector + índice HNSW.
- Bucket novo `ai-images` (público leitura, escrita restrita por `storage.foldername(name)[1] = auth.uid()`).
- Lockfile: usar `npm:` em vez de `esm.sh` para evitar problemas de deploy já documentados.

---

## Não será alterado nesta entrega

- Schema de domínios existentes (community, business, gastronomy, classifieds) — IA é aditiva
- Rotas públicas atuais
- Auth, billing, mobility (fora de escopo)
- Replicate continua disponível, mas só como provider interno do tryon