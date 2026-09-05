# Community Components

Esta pasta nao e um owner de superficies de Feed. As superficies de Post,
composer, Poll, comentarios, galeria e mensagem iniciada por Post vivem em
`src/core/community-feed`.

## Contrato mantido

- `styles/communityDesignSystem.ts` permanece temporariamente como token visual
  compartilhado por superficies Community que ainda possuem callers reais,
  inclusive Feed e Profile.
- Persistencia de Posts pertence a `src/core/posts`; comentarios a
  `src/core/comments`; Community Direct Messaging a `src/core/messaging`.

## Regras

- Nao criar `components/index.ts` ou facade para reexportar outros owners.
- Nao preservar componente ou helper sem caller apenas por compatibilidade nominal.
- Acessibilidade deve ser implementada na superficie ativa ou em shared quando
  houver reutilizacao comprovada; nao manter um toolkit paralelo sem consumidores.
