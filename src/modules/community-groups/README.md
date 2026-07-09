# community-groups

Modulo transversal de grupos sociais territoriais.

Boundary:
- Consome `core/social`, `core/location` e owners canonicos em `core/community-groups`.
- Nao importa outros modulos `src/modules/*`.
- Grupos territoriais devem ser relacionados por `location_id` quando o escopo for geografico.
- Rotas de pagina devem carregar `src/core/community-groups/pages/*` diretamente; este modulo nao deve recriar facades vazias para paginas.
