# Catálogo público sob o domínio Achegue-se — checkpoint 2026-10-06

## Decisão

O domínio público continua sendo `acheguese.com.br`, com duas aplicações independentes:

- `/` — aplicação Achegue-se, dona da raiz;
- `/catalogo/` — aplicação Catálogo, mantida em `washingtonmsdj/catalogo`.

Os repositórios **não são fundidos** e o Catálogo **não é copiado** para dentro do código do Achegue-se.

## Roteamento

O Achegue-se funciona como gateway público no Vercel:

- `/catalogo` normaliza para `/catalogo/`;
- `/catalogo/:path*` é reescrito para a origem GitHub Pages do Catálogo;
- `/catalogo-api/:path*` é reescrito para o Worker Cloudflare do Catálogo;
- o catch-all SPA do Achegue-se continua depois desses mounts.

O owner do roteamento é `src/shared/config/publicExternalApps.config.ts`, consumido pela geração de `vercel.json`.

## Raiz durante o pré-lançamento

A home existente do Achegue-se **não é removida nem redirecionada**.

Enquanto `VITE_PUBLIC_CATALOG_ANNOUNCEMENT=true`, a raiz mostra uma faixa temporária de pré-lançamento acima da home com duas ações:

1. **Abrir catálogo** → `/catalogo/`;
2. **Conhecer o Achegue-se** → continua na própria home (`#conteudo`).

A faixa é reversível pela flag `VITE_PUBLIC_CATALOG_ANNOUNCEMENT`; remover o aviso futuro não exige alterar rotas, mover arquivos ou reestruturar aplicações.

## Restrições

- não redirecionar `/` automaticamente para `/catalogo/`;
- não mover o Catálogo para o repositório Achegue-se;
- não duplicar o Worker/D1/R2 dentro do Achegue-se;
- não criar um segundo owner manual de rewrites fora de `PUBLIC_EXTERNAL_APPS`;
- preservar `tests/architecture/public-catalog-mount-boundary.test.ts`.

## Catálogo

O repositório `washingtonmsdj/catalogo` já está preparado para o mount:

- canonical público versionado: `https://acheguese.com.br/catalogo/`;
- no host `acheguese.com.br`, a API usa o proxy first-party `/catalogo-api`;
- no GitHub Pages, o preview continua usando o Worker configurado;
- assets usam base relativa compatível com `/catalogo/`;
- Turnstile contempla `acheguese.com.br` e `www.acheguese.com.br`.

## Resultado esperado

Para o visitante:

```text
https://acheguese.com.br/
→ home do Achegue-se + aviso temporário de pré-lançamento

https://acheguese.com.br/catalogo/
→ Catálogo Tonecos Studios
```

Para engenharia:

```text
washingtonmsdj/acheguese  → raiz/gateway público
washingtonmsdj/catalogo   → aplicação Catálogo independente
```
