# community-alerts

Modulo transversal de alertas territoriais.

Boundary:
- Consome `core/community/alerts`, `core/location`, `core/notifications` e `core/social`.
- Nao importa outros modulos `src/modules/*`.
- Escrita deve permanecer em RPC/service canonico, com `location_id` obrigatorio.

