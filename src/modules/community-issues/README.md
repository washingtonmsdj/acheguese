# community-issues

Modulo transversal de problemas urbanos.

Boundary:
- `core/community-issues` e o owner explicito de tipos, UI, hooks, schema e `CommunityIssueService`.
- Consome `core/location`, `core/social` e servicos administrativos via `core/admin` quando necessario.
- Nao depende do namespace historico `core/community/issues`.
- Nao importa outros modulos `src/modules/*`.
- `location_id` e o SSOT territorial; cidade/bairro sao apenas apresentacao.
