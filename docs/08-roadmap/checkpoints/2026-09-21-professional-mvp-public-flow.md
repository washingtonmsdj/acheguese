# Checkpoint R4 — Serviços / Professional public flow — 2026-09-21

## Escopo

Certificação parcial da jornada pública de Serviços:

`listagem territorial -> profissional -> detalhe canônico`.

## Finding real

O banco remoto de desenvolvimento continha um registro sintético de profissional com:

- `visibility=public_listed`;
- `is_accepting_clients=true`;
- `slug=NULL`.

A landing de Serviços renderizava esse registro como card clicável. Como o owner de URLs exige slug, o clique não abria detalhe: `useServiceUrls.detail()` caía silenciosamente para a própria listagem. Isso era um falso happy path.

O registro era fixture de desenvolvimento, não dado de produto. A criação profissional atual já deriva slug do handle; a correção permanente é o invariante genérico de roteabilidade, não qualquer exceção para a fixture.

## Correção

Migration remota e versionada:

`20260921101717_enforce_professional_public_slug_routability_mvp.sql`

Ela:

- o runtime remoto recebeu um backfill pontual antes desta revisão; ele é tratado apenas como histórico operacional da migration já aplicada, não como regra de produto;
- adicionou `professional_public_visibility_requires_slug`;
- permite draft `private` sem slug;
- exige slug para `public_listed` e `public_unlisted`;
- mantém a view `public_professional_search` com `security_invoker=true`;
- faz a view falhar fechado para linhas sem slug;
- preserva somente `SELECT` para `anon`, `authenticated` e `service_role`.

O broker `profile-rpc` também rejeita explicitamente `slug: null`, produzindo erro de request antes de atingir a constraint.

## Runtime remoto

- `profile-rpc`: **v20 ACTIVE**;
- `verify_jwt=true`;
- `index.ts` remoto igual ao arquivo da branch;
- hash remoto: `9f737cf7b0739a936e4c2111c0eb60f69d45ee31b45b802b2083f49c6752120c`.

## Evidência de autorização

O probe rollback-only
`tests/security/professional-mvp-public-flow-remote-probe.sql`
foi executado no Supabase canônico e concluiu sem exceção.

Ele prova:

1. tentar remover o slug de um perfil público é bloqueado pelo `CHECK`;
2. o read model público não expõe nenhuma linha sem slug;
3. quando existe uma fixture pública, ela é escolhida dinamicamente, sem nome ou UUID hardcoded;
4. a fixture escolhida, alterada temporariamente para `private`, deixa de ser legível por `anon` tanto em `professional_data` quanto no read model;
5. tudo termina em `ROLLBACK`.

## Natureza dos dados

Os registros atuais de profissionais, empresas e usuários do ambiente são sintéticos/fixtures; não devem ser usados como evidência de adoção ou conteúdo real. A única exceção de conteúdo externo real informada para o projeto são as escolas, enquanto a conta `washingtonsdj` é a identidade administrativa original. As provas deste checkpoint validam contratos, RLS e invariantes do runtime, não autenticidade comercial das fixtures.

## Ratchets

- `tests/architecture/professional-mvp-public-flow.test.ts`;
- `tests/security/professional-mvp-public-flow-remote-probe.sql`;
- constraint e view na migration;
- validação antecipada em `supabase/functions/profile-rpc/index.ts`.

## Estado R4

**Serviços: parcialmente certificado.**

Provado neste checkpoint:

- listagem usa território canônico;
- read model público real;
- o read model só permite itens públicos roteáveis;
- URL canônica de detalhe sem fallback silencioso para a listagem;
- autorização positiva e negativa;
- constraint de integridade;
- broker remoto atualizado e equalizado ao source;
- probe remota sem persistência.

Ainda pendente:

- loading/empty/error visual em browser no mesmo SHA;
- smoke mobile;
- E2E/browser no mesmo SHA;
- build/deploy web e smoke público no mesmo SHA.

Esses itens permanecem no R5/cauda de R4 e não são declarados como aprovados.
