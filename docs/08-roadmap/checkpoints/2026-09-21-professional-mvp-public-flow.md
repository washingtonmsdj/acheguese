# Checkpoint R4 — Serviços / Professional public flow — 2026-09-21

## Escopo

Certificação parcial da jornada pública de Serviços:

`listagem territorial -> profissional -> detalhe canônico`.

## Finding real

O launch cluster continha um profissional real com:

- `visibility=public_listed`;
- `is_accepting_clients=true`;
- `slug=NULL`.

A landing de Serviços renderizava esse registro como card clicável. Como o owner de URLs exige slug, o clique não abria detalhe: `useServiceUrls.detail()` caía silenciosamente para a própria listagem. Isso era um falso happy path.

O registro legado afetado era Antônio Costa. A criação profissional atual já deriva slug do handle, mas o banco ainda permitia que um perfil público permanecesse ou voltasse a ficar sem slug.

## Correção

Migration remota e versionada:

`20260921101717_enforce_professional_public_slug_routability_mvp.sql`

Ela:

- backfillou o único legado para `antonio-costa`;
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
2. `anon` lê Antônio Costa em `public_professional_search`;
3. o território retornado é `/br/ba/salvador/nordeste-de-amaralina`;
4. um segundo profissional alterado temporariamente para `private` deixa de ser legível por `anon` tanto em `professional_data` quanto no read model;
5. tudo termina em `ROLLBACK`.

## Evidência real do launch cluster

Como `anon`, o read model retorna dois profissionais no grupo inicial, ambos roteáveis:

- Antônio Costa -> `/servicos/ba/salvador/profissional/antonio-costa`;
- Joao Eletricista IA -> `/servicos/ba/salvador/profissional/joao-eletricista-ia-1777812847554`.

Após a probe, João permaneceu `public_listed`, comprovando o rollback.

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
- todos os itens públicos listados são roteáveis;
- URL canônica de detalhe;
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
