# community-recommendations

Modulo transversal de recomendacoes/perguntas comunitarias.

Boundary:
- Consome `core/posts`, `core/comments`, `core/social`, `core/location`, `core/community-recommendations` e contrato QA em `core`.
- Nao importa outros modulos `src/modules/*`.
- Conteudo territorial deve ser filtrado por `location_id`.
- Rotas de pagina devem carregar `src/core/community-recommendations/pages/*` diretamente; este modulo nao deve recriar facades vazias para paginas.
