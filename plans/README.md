# Planos do Projeto

Status: EXECUCAO / NAO CANONICO
Data de classificacao: 2026-08-20

Esta pasta preserva planos de execucao ativos, futuros ou concluidos para continuidade entre conversas, agentes e revisoes. **Planos nao sao fonte de verdade arquitetural, de runtime, de schema, de seguranca ou de produto.**

A autoridade deve vir, conforme o assunto, de:

- codigo executavel e contratos exportados pelos owners canonicos;
- migrations versionadas e testes de autorizacao para banco/Supabase;
- `docs/` classificados como vivos/canonicos;
- scripts e gates executaveis;
- configuracao versionada efetivamente consumida pelo build/runtime.

Um plano pode apontar para essas fontes e registrar trabalho pendente, decisoes temporarias e contexto historico. Nenhum gate novo deve exigir texto/status/checklist de um plano como condicao de validade arquitetural.

## Planos Ativos

- [Core Platform Consolidation](./CORE_PLATFORM_CONSOLIDATION_PLAN.md)
- [Security Authority - plano de implementacao](./SECURITY_AUTHORITY_IMPLEMENTATION_PLAN.md)
- [Community Scale Readiness](./COMMUNITY_SCALE_READINESS_PLAN.md)

## Planos Concluidos / Historicos

- [Community First Architecture - plano de arquitetura](./COMMUNITY_FIRST_ARCHITECTURE_PLAN.md)
- [Community Page Concept - implementacao](./COMMUNITY_PAGE_CONCEPT_IMPLEMENTATION_PLAN.md)
- [Community Persistent Shell - implementacao](./COMMUNITY_PERSISTENT_SHELL_IMPLEMENTATION_PLAN.md)
- [Community Production Hardening](./COMMUNITY_PRODUCTION_HARDENING_PLAN.md)
- [Community Connectors Reliability](./COMMUNITY_CONNECTORS_RELIABILITY_PLAN.md)
- [Home real, anuncios, ranking e SSOT](./HOME_REAL_PRODUCT_COMPLETION_PLAN.md)

## Regra de autoridade

- Um plano **nao pode** ser listado como `ssotPath` nem substituir um documento canonico em `docs/`.
- Checklists/status historicos de um plano nao devem bloquear build, lint, typecheck ou validacao arquitetural.
- Se um gate ainda depender de texto literal em `plans/`, isso e divida de governanca a ser removida, nao um precedente para novos gates.
- Ao concluir um plano, preservar o historico; mover conhecimento permanente para o owner canonico apropriado.

## Regras para novos planos

- Registrar objetivo, escopo, fora de escopo e definicao de pronto.
- Apontar para docs, scripts, migrations, codigo e testes canonicos existentes.
- Evitar criar fonte paralela de verdade.
- Separar claramente plano de implementacao de contrato vigente.
- Manter checklist executavel apenas para continuidade, nunca como substituto de verificacao do ambiente alvo.
