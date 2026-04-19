# TASK MASTER - AI PLATFORM END-TO-END (SSOT, ESCALAVEL, CUSTO CONTROLADO)

Status: draft executavel  
Data: 2026-04-19  
Autor: Codex (baseado na arquitetura atual do repositorio)  
Destino: execucao por outra IA (Kiro IDE)  

---

## 1. Objetivo do Documento

Este documento define a implementacao completa de um sistema de IA para TODO o produto, com foco em:

1. arquitetura canonica SSOT;
2. baixo custo operacional;
3. alta escalabilidade;
4. seguranca e governanca;
5. evolucao por fases sem quebrar o sistema atual.

Este documento substitui plano parcial.  
A execucao deve seguir esta ordem, sem pular gates.

---

## 2. Resultado Esperado (Produto + Negocio)

Ao final da implementacao:

1. existe uma plataforma de IA central (`core/ai`) reutilizavel por todos os modulos;
2. a busca semantica unificada funciona para gastronomia, servicos, classificados e vagas;
3. existem recursos de IA por dominio (recomendacao, moderacao, suporte operacional);
4. custo por requisicao e por plano e controlado por quota/orcamento;
5. toda chamada de IA passa por rotas seguras (edge function), sem acoplamento direto no frontend;
6. tudo respeita o fluxo canonico `Database -> Service -> Hook -> Component`.

---

## 3. Regras Arquiteturais Obrigatorias (Nao Negociaveis)

1. Nao chamar provedor de IA direto de pagina/hook/componente.
2. Nao colocar logica de negocio em componente.
3. Nao criar service paralelo em modulo que ja possui service canonico.
4. Nao salvar segredo/token no frontend.
5. Nao armazenar PII sem necessidade no log de IA.
6. Todo comportamento configuravel deve ter SSOT em banco.
7. Todo fluxo novo deve ter teste unitario + integracao minima.
8. Toda entrega deve passar nos gates:
   - `npm run audit:architecture`
   - `npm run validate:architecture:governance`
   - `npm run validate:ssot`
   - `npm run validate:docs-structure`

---

## 4. Escopo Funcional Completo de IA

### 4.1 Funcionalidades Core (cross-system)

1. Roteador de modelos (OpenAI/Groq) por tarefa.
2. Registro de prompts versionados.
3. Cache de resposta por assinatura de entrada.
4. Quotas por plano e por usuario.
5. Telemetria de custo, latencia e qualidade.
6. Guardrails (sanitizacao, bloqueio, validacao de saida).
7. Avaliacao offline (quality checks).
8. Filas/jobs para tarefas assincronas.

### 4.2 Funcionalidades por Dominio

1. Busca semantica unificada (bairro + intencao + preco).
2. Recomendacao personalizada para feed/listas.
3. Moderacao assistida (score de risco + prioridade).
4. Copiloto de criacao de conteudo (anuncios, cardapio, campanhas).
5. Classificacao e enriquecimento automatico de dados.
6. Insights operacionais para business/admin.
7. Deteccao de anomalias para mobilidade/delivery.

---

## 5. Arquitetura Alvo (High Level)

### 5.1 Camadas

1. `supabase/functions/*`: borda de seguranca e integracao com provedores.
2. `src/core/ai/services/*`: orquestracao, politicas, cache e custos.
3. `src/core/ai/hooks/*`: acesso UI reativo.
4. `src/modules/*`: consumo via adapters por dominio.
5. `supabase` (Postgres + pgvector): SSOT de configuracao, logs e indices semanticos.

### 5.2 Fluxo Canonico de Requisicao IA

1. Component chama Hook.
2. Hook chama Service canonico do dominio.
3. Service dominio chama `AIOrchestratorService`.
4. Orquestrador chama edge function apropriada.
5. Edge function aplica seguranca/quota/model routing.
6. Resposta volta com metadados (modelo, tokens, custo estimado, cache hit).
7. Service persiste eventos/feedback quando aplicavel.

---

## 6. Estrutura de Codigo Nova (Obrigatoria)

Criar:

1. `src/core/ai/index.ts`
2. `src/core/ai/types/ai.types.ts`
3. `src/core/ai/services/AIOrchestratorService.ts`
4. `src/core/ai/services/AIProviderRouterService.ts`
5. `src/core/ai/services/AIPromptRegistryService.ts`
6. `src/core/ai/services/AICacheService.ts`
7. `src/core/ai/services/AIQuotaService.ts`
8. `src/core/ai/services/AIGuardrailService.ts`
9. `src/core/ai/services/AITelemetryService.ts`
10. `src/core/ai/services/AISemanticSearchService.ts`
11. `src/core/ai/services/AIRecommendationService.ts`
12. `src/core/ai/services/AIModerationAssistService.ts`
13. `src/core/ai/services/AIBehaviorProfileService.ts`
14. `src/core/ai/hooks/useSemanticSearch.ts`
15. `src/core/ai/hooks/useAIRecommendations.ts`
16. `src/core/ai/hooks/useAIModerationAssist.ts`
17. `src/core/ai/hooks/usePersonalizedSuggestions.ts`
18. `src/core/ai/constants/ai.constants.ts`

Criar edge functions:

1. `supabase/functions/ai-router/index.ts`
2. `supabase/functions/ai-embed/index.ts`
3. `supabase/functions/ai-search/index.ts`
4. `supabase/functions/ai-rerank/index.ts`
5. `supabase/functions/ai-moderation/index.ts`
6. `supabase/functions/ai-content-assist/index.ts`
7. `supabase/functions/ai-maintenance/index.ts`
8. `supabase/functions/_shared/ai-security.ts`
9. `supabase/functions/_shared/ai-providers.ts`
10. `supabase/functions/_shared/ai-usage.ts`

---

## 7. Modelo de Dados SSOT (Postgres + pgvector)

### 7.1 Extensao

1. habilitar `vector` (`pgvector`) em migration.

### 7.2 Tabelas Core IA

1. `ai_model_registry`
2. `ai_task_policies`
3. `ai_prompt_templates`
4. `ai_prompt_template_versions`
5. `ai_request_logs`
6. `ai_usage_daily`
7. `ai_cache_entries`
8. `ai_feedback_events`
9. `ai_guardrail_events`

### 7.3 Tabelas de Busca Semantica

1. `ai_search_documents`
2. `ai_search_embeddings`
3. `ai_search_jobs`

### 7.4 Tabelas de Recomendacao

1. `ai_recommendation_events`
2. `ai_recommendation_scores`

### 7.5 Tabelas de Moderacao Assistida

1. `ai_moderation_predictions`
2. `ai_moderation_actions`

### 7.6 Tabelas de Personalizacao Comportamental

1. `ai_personalization_preferences`
2. `ai_user_behavior_events`
3. `ai_user_interest_profiles`

### 7.6 Regras de Banco

1. Toda tabela com `created_at`, `updated_at`.
2. Indices para chaves de lookup frequentes.
3. Indice vetorial em embeddings.
4. RLS habilitado em todas.
5. Escrita sensivel apenas por service role/roles admin controladas.

---

## 8. Contratos Minimos de Dados (TypeScript)

Definir em `src/core/ai/types/ai.types.ts`:

1. `AITaskType` (semantic_search, rerank, moderation, content_assist, recommendation, anomaly_detection).
2. `AIProvider` (openai, groq).
3. `AIModelAlias` (cheap_fast, balanced, premium_reasoning, embed_default, moderation_default).
4. `AIInvokeInput`.
5. `AIInvokeOutput`.
6. `AISearchQuery`.
7. `AISearchResultItem`.
8. `AIUsageSnapshot`.
9. `AIQuotaDecision`.
10. `AIGuardrailDecision`.

---

## 9. Estrategia de Provedores (OpenAI + Groq)

### 9.1 Regra de uso padrao

1. Tarefas volumetricas de baixo risco -> Groq (custo baixo, latencia baixa).
2. Tarefas de alta qualidade/alta importancia -> OpenAI.
3. Embeddings -> modelo dedicado definido em `ai_model_registry`.
4. Fallback cross-provider em caso de erro/timeout.

### 9.2 Alias (nao hardcode no codigo)

Configurar em banco:

1. `cheap_fast`
2. `balanced`
3. `premium_reasoning`
4. `embed_default`
5. `moderation_default`

Resolver alias em runtime no `AIProviderRouterService`.

---

## 10. Controle de Custo e Escala

### 10.1 Principios de custo

1. Evitar LLM completo em toda busca.
2. Priorizar vetor + filtro + ranking deterministico.
3. Usar rerank/LLM somente quando necessario.
4. Cachear por assinatura de consulta.
5. Debounce no frontend e limite de requests.
6. Batch assicrono para indexacao.

### 10.2 Quotas

Quota por:

1. plano (`free`, `plus`, `pro`, `business`);
2. usuario;
3. feature (`semantic_search`, `content_assist`, etc);
4. periodo diario e mensal.

### 10.3 Politica inicial sugerida

1. Free: busca semantica limitada, sem recursos pesados.
2. Plus: limite maior + copiloto leve.
3. Pro: recursos completos + prioridade.
4. Business: quotas altas + analytics IA.

---

## 11. Busca Semantica Unificada (Pilar 1)

### 11.1 Objetivo

Uma busca unica para varios dominios com entendimento de intencao e contexto territorial.

### 11.2 Fontes de documento

1. Gastronomia: negocios, itens de menu, tags.
2. Servicos: profissionais, especialidades.
3. Classificados: anuncios, atributos de produto.
4. Vagas: titulo, descricao, skills.
5. (opcional fase 2) Eventos e promocoes.

### 11.3 Pipeline de indexacao

1. evento de create/update em cada dominio;
2. normalizacao do documento canonico;
3. geracao de embedding;
4. persistencia em `ai_search_documents` + `ai_search_embeddings`;
5. job de reindex periodico para consistencia.

### 11.4 Pipeline de consulta

1. validar query e contexto;
2. buscar candidatos lexical + semantico;
3. aplicar filtros obrigatorios (bairro, faixa de preco, categoria, status);
4. fusao de scores;
5. rerank opcional (somente top N e somente se politica permitir);
6. retornar resultados com explicabilidade simples.

### 11.5 Integracao com busca atual

Atualizar `src/core/search/services/SearchService.ts` para:

1. manter busca legacy como fallback;
2. adicionar `searchUnifiedSemantic(...)`;
3. acionar novo service de IA apenas se policy habilitada.

---

## 12. Recomendacao (Pilar 2)

### 12.1 Casos

1. gastronomia: recomendacao de negocio/item por horario, distancia, historico;
2. servicos: recomendacao de profissional por necessidade;
3. classificados: sugestao de itens relevantes por contexto;
4. vagas: vagas relacionadas por perfil de interesse.

### 12.2 Implementacao

1. event tracking canonico em `ai_recommendation_events`;
2. score em `ai_recommendation_scores`;
3. serve recommendation via `AIRecommendationService`;
4. fallback deterministico se sem dados suficientes.

### 12.3 Aprendizado por comportamento do usuario (aprovado)

Decisao: implementar.  
Motivo: alto impacto em conversao e retencao, se houver governanca de privacidade.

Regras:

1. coletar apenas eventos necessarios (view, click, add_favorite, add_cart, contato, conversao);
2. nao coletar dado sensivel para personalizacao;
3. gerar perfil de interesse derivado (tags/categorias/faixa de preco/territorio), evitando PII bruta;
4. permitir opt-out de personalizacao a qualquer momento;
5. respeitar limite de retention e minimizacao de dados;
6. nunca bloquear acesso do usuario por nao aderir a personalizacao.

### 12.4 Entrada no roadmap (agora vs depois)

1. Entra agora na fundacao: preferencia de personalizacao, trilha de consentimento, coleta minimizada e telemetria.
2. Entra depois na ativacao: ranking personalizado avancado e experimentos de modelo.
3. Se consentimento/preferencia nao existir, usar ranking contextual nao personalizado.

---

## 13. Moderacao Assistida (Pilar 3)

### 13.1 Objetivo

Priorizar fila admin com score de risco sem remover controle humano.

### 13.2 Integracao

1. consumir eventos de report dos modulos community/classificados;
2. classificar risco (spam, fraude, abuso);
3. gravar predicao e racional curto;
4. ordenar fila admin por risco e impacto;
5. manter acao final humana.

### 13.3 Arquivos alvo

1. integrar com `src/core/moderation/services/ModerationService.ts`;
2. integrar com `src/core/admin/services/AdminFraudService.ts`;
3. expor dados para pagina admin correspondente.

---

## 14. Copiloto de Conteudo (Pilar 4)

### 14.1 Objetivo

Ajudar criacao de conteudo de forma segura e economica.

### 14.2 Casos

1. gerar anuncio de classificado (titulo, descricao, tags).
2. gerar texto de cardapio/promocao em gastronomia.
3. gerar texto de vaga com estrutura padrao.
4. gerar notificacao/campanha para business.

### 14.3 Regras

1. sempre draft (nao publicar automatico).
2. mostrar aviso de conteudo gerado por IA.
3. salvar feedback de usuario (aceito/editado/rejeitado).

---

## 15. Deteccao de Anomalia (Pilar 5)

### 15.1 Escopo inicial

1. mobilidade: padroes atipicos de cancelamento, aceite, rota.
2. delivery: atrasos persistentes, falhas operacionais fora da curva.

### 15.2 Entrega

1. score de anomalia por evento;
2. alerta para admin/fraud pipeline;
3. sem bloqueio automatico na fase inicial.

---

## 16. Seguranca e LGPD

### 16.1 Regras de dados

1. remover/anomizar PII antes de envio ao modelo quando possivel.
2. nao enviar telefone/documento/dado sensivel sem justificativa.
3. logs com mascaramento.
4. retention configuravel para logs de IA.

### 16.2 Regras de prompt/saida

1. proteger contra prompt injection.
2. validar schema de saida com `zod` antes de persistir.
3. fallback seguro em erro de parse.
4. registrar falha em `ai_guardrail_events`.

### 16.3 Credenciais

1. chaves de provedor apenas no ambiente server/edge.
2. nenhuma chave no frontend.
3. rotacao periodica de segredo.

### 16.4 Requisitos de personalizacao sob LGPD

1. registrar base legal do tratamento para personalizacao em `ai_personalization_preferences`;
2. exibir transparencia clara na politica de privacidade e configuracoes de conta;
3. permitir revogacao/opt-out sem friccao;
4. disponibilizar trilha para atendimento dos direitos do titular (acesso/correcao/elimincao/revisao);
5. manter mecanismo de revisao humana para decisoes automatizadas que afetem interesses do titular;
6. produzir insumos para RIPD quando risco alto for identificado.

---

## 17. Observabilidade (Obrigatorio)

Instrumentar:

1. latencia p50/p95 por task;
2. tokens input/output por task e por plano;
3. custo estimado diario/mensal;
4. cache hit ratio;
5. taxa de erro por provider/model;
6. taxa de aceite de sugestao de IA;
7. zero-result rate da busca.

Dashboard minimo em modulo analytics/admin.

---

## 18. Plano de Entrega por Fases

## Fase 0 - Preparacao

1. criar branch e baseline.
2. criar docs e ADR do desenho.
3. validar gates atuais.

Done quando:

1. doc aprovado;
2. nenhuma quebra de arquitetura.

## Fase 1 - Plataforma Core IA

1. criar `core/ai` com types/services base.
2. criar migrations de tabelas core IA.
3. criar `ai-router` edge function.
4. implementar quota/cache/telemetry basico.
5. implementar preferencia de personalizacao (opt-in/opt-out) e trilha de consentimento.

Done quando:

1. chamada padrao `invokeTask` funcionando;
2. request log e quota funcionando em ambiente local.

## Fase 2 - Busca Semantica Unificada

1. criar tabelas de documentos/embeddings.
2. criar pipeline de indexacao para 4 dominios iniciais.
3. criar `ai-search` function.
4. integrar com `SearchService`.
5. criar pagina dedicada de busca do bairro.

Done quando:

1. query natural retorna resultados multi-dominio;
2. filtros territoriais e de preco aplicados corretamente.

## Fase 3 - Recomendacao + Copiloto

1. recommendation events/scores.
2. componentes de recomendacao em gastronomia/servicos.
3. copiloto de criacao para classificados/vagas/gastronomia.
4. ativar ranking personalizado por comportamento para usuarios elegiveis.

Done quando:

1. usuarios conseguem usar sugestoes e aceitar/editar;
2. feedback registrado.
3. personalizacao respeita opt-out e fallback contextual.

## Fase 4 - Moderacao + Anomalia

1. `ai-moderation` function.
2. integracao com fila admin.
3. score anomalia mobilidade/delivery.

Done quando:

1. admin visualiza fila priorizada;
2. alertas de anomalia disponiveis.

## Fase 5 - Otimizacao e Rollout

1. feature flags por modulo.
2. rollout canario por territorio/plano.
3. tuning de custo/latencia.

Done quando:

1. KPI de negocio melhora sem explosao de custo;
2. fallback confiavel validado.

---

## 19. Backlog Tecnico Detalhado (Checklist Executavel)

### 19.1 Banco e Migration

1. [ ] Criar migration `supabase/migrations/20260419000001_create_ai_platform_core.sql`.
2. [ ] Criar extension `vector` com protecao idempotente.
3. [ ] Criar tabelas core IA listadas na secao 7.
4. [ ] Criar tabelas semanticas listadas na secao 7.
5. [ ] Criar tabelas de personalizacao (`ai_personalization_preferences`, `ai_user_behavior_events`, `ai_user_interest_profiles`).
5. [ ] Criar indices (btree + ivfflat/hnsw conforme disponibilidade).
6. [ ] Habilitar RLS e policies minimas.
7. [ ] Criar seeds de policy/model aliases.

### 19.2 Edge Functions

1. [ ] Implementar `_shared/ai-security.ts`.
2. [ ] Implementar `_shared/ai-providers.ts`.
3. [ ] Implementar `_shared/ai-usage.ts`.
4. [ ] Implementar `ai-router` com roteamento por alias.
5. [ ] Implementar `ai-embed` para embeddings de documentos.
6. [ ] Implementar `ai-search` para busca vetorial + filtros.
7. [ ] Implementar `ai-rerank` opcional.
8. [ ] Implementar `ai-moderation`.
9. [ ] Implementar `ai-content-assist`.
10. [ ] Implementar `ai-maintenance` para reindex e limpeza cache.

### 19.3 Core Services

1. [ ] `AIProviderRouterService`: resolve provider/model por task + policy.
2. [ ] `AIPromptRegistryService`: busca template ativo por versao.
3. [ ] `AIQuotaService`: decide allow/deny + reason.
4. [ ] `AICacheService`: cache read/write + TTL.
5. [ ] `AIGuardrailService`: sanitize input/output.
6. [ ] `AITelemetryService`: logs de uso e custo.
7. [ ] `AIOrchestratorService`: pipeline unico de invocacao.
8. [ ] `AISemanticSearchService`: query semantica unificada.
9. [ ] `AIRecommendationService`: recomendacao basica.
10. [ ] `AIModerationAssistService`: score de risco.
11. [ ] `AIBehaviorProfileService`: perfil de interesse derivado + elegibilidade de personalizacao.

### 19.4 Integracao por Modulo

1. [ ] Atualizar `src/core/search/services/SearchService.ts` para busca unificada.
2. [ ] Integrar gastronomia com ranking/recomendacao.
3. [ ] Integrar servicos com matching semantico.
4. [ ] Integrar classificados com sugestao de texto/preco.
5. [ ] Integrar vagas com sugestao de descricao/skills.
6. [ ] Integrar community/moderation com score IA.
7. [ ] Integrar admin analytics com painel de custo e qualidade.
8. [ ] Integrar notifications/promotions para copy assistida opcional.
9. [ ] Integrar preferencia de personalizacao no perfil/conta do usuario.

### 19.5 Frontend

1. [ ] Criar pagina `src/app/pages/BuscaInteligentePage.tsx`.
2. [ ] Criar componentes de resultado por tipo de entidade.
3. [ ] Exibir explicacao curta do match (ex.: "similar a blusa rosa, bairro X").
4. [ ] Adicionar filtros universais (bairro, preco, categoria, distancia).
5. [ ] Criar estado de fallback quando IA indisponivel.
6. [ ] Criar controle de configuracao de personalizacao (opt-in/opt-out) acessivel no perfil.

### 19.6 Testes

1. [ ] Unit tests para todos services de `core/ai`.
2. [ ] Tests de schema/guardrail.
3. [ ] Integration tests para edge functions.
4. [ ] Teste de regressao no SearchService atual.
5. [ ] E2E da busca inteligente (consulta natural -> resultado multi-dominio).
6. [ ] Testes de quota (free vs paid).
7. [ ] Testes de fallback provider.
8. [ ] Testes de personalizacao respeitando opt-out.
9. [ ] Testes de minimizacao de dados no payload enviado ao modelo.

### 19.7 Observabilidade

1. [ ] Logs estruturados por request id.
2. [ ] Medicao de token/custo por task.
3. [ ] Dashboard admin IA.
4. [ ] Alertas de erro p95 e custo diario.

---

## 20. Criterios de Aceite (Definition of Done)

Aceitar entrega somente se todos abaixo estiverem verdadeiros:

1. busca semantica multi-dominio funcionando com filtros territoriais corretos;
2. custo por requisicao e por plano mensuravel no admin;
3. quotas funcionando (bloqueio gracioso + mensagem amigavel);
4. nenhum acesso direto a provider no frontend;
5. RLS e seguranca validos;
6. fallback legado funcional se IA cair;
7. testes essenciais passando;
8. gates de arquitetura/SSOT/documentacao passando;
9. documentacao atualizada em `docs/`.
10. personalizacao comportamental desativavel por usuario e auditavel.

---

## 21. Riscos Principais e Mitigacoes

### Risco 1: custo subir rapido

Mitigar:

1. quotas estritas;
2. cache;
3. rerank apenas top N;
4. rota barata por padrao.

### Risco 2: latencia alta

Mitigar:

1. timeout agressivo;
2. fallback deterministico;
3. precomputacao/indexacao assicrona.

### Risco 3: saida inconsistente

Mitigar:

1. prompts versionados;
2. schema validation;
3. guardrail output.

### Risco 4: violacao de fronteira SSOT

Mitigar:

1. todo acesso via service canonico;
2. revisao de import cross-module;
3. gates obrigatorios.

---

## 22. Plano de Rollback

1. feature flags por funcionalidade de IA;
2. chave global `AI_PLATFORM_ENABLED=false`;
3. fallback para busca legacy e fluxo atual;
4. manter migrations reversiveis para estruturas novas (quando possivel);
5. desativar functions de IA sem derrubar app.

---

## 23. Comandos de Validacao Obrigatorios

Rodar ao final de cada fase:

```bash
npm run audit:architecture
npm run validate:architecture:governance
npm run validate:ssot
npm run validate:docs-structure
npm test
```

Para migrations/functions:

```bash
npm run validate:migrations
supabase db push --linked --dry-run
```

---

## 24. Guia de Execucao para Kiro IDE (Prompt Operacional)

Usar este prompt na outra IA:

1. "Implemente exatamente o `docs/tasks/TASK_MASTER_AI_PLATFORM_END_TO_END.md`."
2. "Siga as fases em ordem e nao pule gates."
3. "Nao crie services paralelos fora do desenho SSOT."
4. "Nao use acesso direto ao Supabase fora de services/repositories/functions."
5. "Para cada fase, entregue: codigo + testes + atualizacao documental."
6. "Antes de finalizar fase, rode e reporte comandos de validacao."
7. "Se houver ambiguidade, priorize menor risco arquitetural e mantenha compatibilidade."

---

## 25. Ordem Recomendada de PRs

1. PR-1: core schema + core/ai baseline + ai-router.
2. PR-2: semantic index + ai-search + SearchService integration.
3. PR-3: bairro intelligent search page + e2e.
4. PR-4: recommendation + content assist.
5. PR-5: moderation assist + anomaly scoring.
6. PR-6: observability + dashboard + rollout flags.

Cada PR deve ser pequeno o suficiente para review seguro.

---

## 26. Decisao de Design (Modulo ou Nao)

Decisao: IA sera uma CAPACIDADE CORE, nao um modulo de produto isolado.

Motivo:

1. IA atende varios dominios.
2. evita duplicacao por modulo.
3. facilita governanca de custo/seguranca.
4. preserva SSOT com adapters por dominio.

Implementacao:

1. `core/ai` central;
2. cada modulo consome via seu service canonico;
3. UI especifica pode existir por modulo, mas orquestracao fica no core.

---

## 27. Lacunas Atuais Prioritarias (Mapeadas no Repositorio)

Estas lacunas devem ser tratadas antes ou junto das fases de expansao de IA, para evitar que a camada inteligente amplifique inconsistencias operacionais.

### 27.1 Mobilidade (motoboy) - pendencias funcionais

Fonte: `src/modules/mobility/MOTOBOY.md`

1. Integrar AddressSelector real no fluxo de criacao de entrega.
2. Integrar acoes de motoboy no dashboard/pagina de motorista.
3. Criar historico de entregas dedicado.
4. Implementar upload de foto para `proof_of_delivery.photo_url`.
5. Garantir regra de pricing `motoboy` ativa no banco.

Prioridade: P0 (bloqueador para IA operacional de mobilidade/delivery).

### 27.2 Busca global incompleta

Fonte: `src/core/search/services/SearchService.ts`

1. Busca atual cobre business e professionals.
2. Classificados, eventos e cupons ainda estao como TODO.
3. Antes de IA semantica total, garantir fonte canonica de todos os dominios na busca.

Prioridade: P0 (base obrigatoria para busca semantica unificada).

### 27.3 Moderacao com inconsistencias de SSOT

Fonte: `src/core/moderation/services/ModerationService.ts`

1. Existem fallbacks e mapeamentos que misturam responsabilidades de tabela.
2. Necessario consolidar contrato canonico de reports/moderacao antes do scoring IA.

Prioridade: P0 (evita decisao automatizada em base inconsistente).

### 27.4 Classificados com fallback de mock em runtime

Fonte: `src/modules/classifieds/hooks/useClassificados.ts`

1. Quando API retorna vazio/erro, fluxo pode cair para mock.
2. IA de recomendacao/price assist nao deve operar sobre fallback mock em producao.

Prioridade: P1 (qualidade de dados para ranking e recomendacao).

---

## 28. Novas Funcionalidades e Paginas Recomendadas (IA)

### 28.1 P0 - alto impacto imediato

1. Pagina `Busca Inteligente do Bairro` (multi-dominio, semantica + filtros territoriais).
2. Pagina `Central de IA Admin` (custo, latencia, quotas, qualidade, cache hit ratio).
3. Pagina `Copiloto do Anunciante` (classificados, vagas, cardapio, promocoes - sempre em draft).

### 28.2 P1 - impacto operacional

1. Pagina `Command Center Operacional` (mobilidade + delivery com alertas de SLA/anomalia).
2. Pagina `Trust & Safety` (fila unica de moderacao com score de risco IA).
3. Pagina `Recomendacoes do Bairro` (feed personalizado por territorio e perfil).

### 28.3 P2 - evolucao de produto

1. Assistente conversacional contextual dentro da busca (somente para refinamento, nao para substituir resultados).
2. Ferramenta de previsao de demanda local para business/profissionais.
3. Modulo de experimentos IA (A/B de ranking, prompts e politicas de modelo).

### 28.4 Ordem recomendada de implementacao dessas paginas

1. `Busca Inteligente do Bairro`
2. `Central de IA Admin`
3. `Copiloto do Anunciante`
4. `Trust & Safety`
5. `Command Center Operacional`
6. `Recomendacoes do Bairro`

---

## 29. Critico: O que NAO fazer

1. Nao usar IA generativa em toda busca sem cache/limite.
2. Nao fazer hardcode de modelo no frontend.
3. Nao gravar tudo em log sem anonimizar.
4. Nao acoplar modulo A ao modulo B diretamente para IA.
5. Nao publicar conteudo de IA automatico sem revisao na fase inicial.
6. Nao remover fallback legacy antes do rollout estabilizar.

---

## 30. Entregavel Final Esperado

No estado final, o repositorio deve conter:

1. plataforma `core/ai` implementada e testada;
2. busca semantica unificada funcionando em producao controlada;
3. recomendacao + copiloto + moderacao assistida com feature flags;
4. painel de custo/qualidade de IA para admin;
5. documentacao tecnica completa atualizada.

FIM.
