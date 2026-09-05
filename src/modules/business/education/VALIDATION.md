# Validação atual — Módulo Educação

**Data do checkpoint:** 2026-09-04  
**Checkpoint técnico:** `de2f7e0da061b65a5e210e25a5e11edaff45cf4d`  
**Status:** G6 EM PRÉ-CERTIFICAÇÃO — NÃO MVP CERTIFICADO

Este arquivo substitui o checklist histórico de 2026-04-28 que declarava
“APROVADO PARA PRODUÇÃO / 98/100”. Aquela declaração não representa a
Definition of Done atual do repositório e não deve ser usada como evidência de
release.

O owner de UI/aplicação permanece em `src/modules/business/education`. O owner
técnico de contratos, persistência, tracking e observabilidade pertence a
`src/core/education`.

## 1. Arquitetura / ownership

Estado comprovado:

- `src/core/education/contracts.ts` mantém os contratos canônicos do domínio;
- `src/core/education/services/education.queries.ts` é o read model canônico;
- `src/core/education/services/education.mutations.ts` é o write model canônico;
- `EducationTrackingService` é o único writer de
  `public.education_analytics_events`;
- `EducationObservabilityService` é observabilidade técnica e não persiste no
  funil de analytics do domínio;
- `tools/architecture/validate-education-module-boundaries.ts` impede acesso
  runtime direto a integrations a partir do módulo e bloqueia recriação dos
  bridges aposentados;
- `tests/architecture/education-module-boundary-ratchet.test.ts` congela essas
  fronteiras.

As rotas públicas de Educação continuam `launch-paused`. Não remover a pausa
por existência de páginas ou testes históricos.

## 2. Drift de observabilidade fechado

A revalidação G6 encontrou incompatibilidade real entre source e banco:

- `education_analytics_events` aceita somente os sete eventos do funil:
  `profile_view`, `program_view`, `event_view`, `whatsapp_click`,
  `enrollment_cta_click`, `lead_submitted` e `event_interest`;
- o antigo `EducationObservabilityService` tentava inserir eventos técnicos
  como `education_profile_published`, `education_lead_created`,
  `education_lead_save_failed` e `education_api_timeout`;
- esses INSERTs eram rejeitados pela constraint do banco e o serviço apenas
  registrava a falha em log;
- métricas `avgPageLoadTime`/`apiErrorRate`, `trackPerformance`,
  `trackUserJourney` e `getMetrics` não possuíam caller runtime.

O corte
`31377a685c518454a50e844ee4d29f7c87b0e905`
(`fix(g6): separate education observability from funnel tracking`) corrigiu a
fronteira sem migration:

- `EducationTrackingService` continua gravando o funil canônico;
- `EducationObservabilityService` não importa Supabase e usa logger/gtag/Sentry
  quando disponíveis;
- APIs técnicas sem caller runtime foram aposentadas;
- o ratchet agora exige que apenas Tracking acesse
  `education_analytics_events`.

Esse SHA chegou a `READY` na Vercel.

## 3. Banco e RLS — revalidação viva

No projeto Supabase canônico:

- `education_profiles`: RLS habilitado;
- `education_programs`: RLS habilitado;
- `education_leads`: RLS habilitado;
- `education_lead_events`: RLS habilitado;
- `education_events`: RLS habilitado;
- `education_analytics_events`: RLS habilitado.

As policies privadas de profile/program/lead/lead-event/event usam a autoridade
Business canônica `private.can_operate_business_profile(...)`, direta ou por
join ao `education_profile`.

As leituras públicas ficam limitadas ao contrato publicado:

- profile: apenas `status = published`;
- programas: vinculados a profile publicado;
- eventos: `is_public = true` e profile publicado.

## 4. Analytics de domínio

`education_analytics_events` permanece uma store específica de Education,
separada do SSOT horizontal `public.analytics_events`.

O browser possui somente INSERT por coluna para:

- `education_profile_id`;
- `business_id`;
- `niche_key`;
- `event_type`;
- `program_id`;
- `education_event_id`;
- `lead_id`;
- `source_page`;
- `session_id`;
- `metadata`.

Esse allowlist coincide com o payload de `EducationTrackingService`. Não
restaurar INSERT amplo de tabela e não expandir a constraint para acomodar
eventos técnicos aposentados.

## 5. Prova remota de autorização

O probe versionado
`tests/security/education-management-authority-remote-probe.sql`, commit
`de2f7e0da061b65a5e210e25a5e11edaff45cf4d`, foi executado contra o Supabase
canônico e retornou `status=pass`.

A prova é inteiramente `BEGIN ... ROLLBACK` e cria o fixture temporário dentro
da própria transação. Ela não usa os 16 perfis Education existentes e exclui
explicitamente `washingtonmsdj`.

Resultado comprovado:

- owner direto do Profile Business temporário:
  `can_operate_business_profile=true`;
- owner lê e atualiza profile Education draft e programa;
- autenticado não-owner:
  helper `false`, leitura privada `0`, update `0`;
- após membership temporária `admin`, o mesmo usuário passa a administrar:
  profile, programa, lead, evento e lead-event;
- lead/event/lead-event temporários são inseridos via RLS;
- toda a prova é revertida por `ROLLBACK`.

## 6. Inventário de dados observado

No checkpoint da auditoria remota:

- 16 `education_profiles`;
- 16 publicados;
- 82 `education_programs`;
- 0 `education_leads`;
- 0 `education_events`.

A ausência de leads/eventos persistidos foi tratada no probe com fixtures
transacionais; não foi usada como justificativa para fabricar dados permanentes.

## 7. Estado de testes / provider

GitHub Actions permanece instável no ambiente hosted: nos SHAs recentes os jobs
de Security, SSOT Enforcement e SSOT Territorial terminaram antes do primeiro
step (`steps=null`). Isso é blocker de infraestrutura, não PASS nem source
failure.

Evidência independente de build:

- `31377a685c518454a50e844ee4d29f7c87b0e905`: Vercel `READY`;
- o probe de `de2f7e0...` passou diretamente no Supabase canônico;
- o deploy de `de2f7e0...` deve ser classificado pelo provider antes de usar
  esse SHA como prova same-SHA completa.

## 8. Pendências antes de Education READY

### Crítico / alto

- nenhuma falha crítica/alta de RLS identificada no primeiro sweep G6;
- ainda falta executar os gates hosted com steps reais no mesmo SHA;
- ainda falta certificar E2E público e operacional atual sem aceitar
  `launch-paused` como sucesso.

### Médio

- revalidar pages/hooks/services por caller census e retirar APIs sem consumidor;
- revalidar UX de setup/programas/leads/eventos contra o escopo MVP;
- executar cobertura mobile e acessibilidade nas superfícies que realmente
  entrarem no lançamento;
- reconciliar qualquer teste E2E antigo que seja debug-only ou aceite fallback
  como PASS.

### Launch decision

Educação continua `launch-paused`. Só pode ser despausada após:

1. fluxo público territorial real;
2. setup mínimo autenticado;
3. programa mínimo operacional;
4. autorização positiva/negativa comprovada;
5. lint/typecheck/unit/security/E2E com steps reais;
6. deploy + smoke do mesmo SHA.

## 9. Do not repeat

- não usar documentos arquivados como prova de produção atual;
- não restaurar bridges `modules -> core` aposentados;
- não escrever observabilidade técnica em `education_analytics_events`;
- não expandir a enum/constraint do funil apenas para acomodar código sem caller;
- não tocar em `washingtonmsdj` durante probes/fixtures;
- não converter `steps=null` em PASS;
- não retirar `launch-paused` antes da certificação G6.
