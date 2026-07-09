# community-lost-found

Modulo transversal de achados e perdidos.

Boundary:
- Consome `core/location`, `core/social`, `core/comments` e servico canonico de lost-found em `core`.
- Nao importa outros modulos `src/modules/*`.
- Dados de localidade devem ser derivados de `location_id` sempre que disponivel.
- Rotas de pagina devem carregar `src/core/community-lost-found/pages/*` quando
  o launch gate for reaberto; este modulo nao deve recriar facades vazias para
  paginas.
