# Auditorias Estruturais

## Arquivos ativos
- [PROJECT_INVENTORY.md](./PROJECT_INVENTORY.md): inventario gerado do codigo, rotas, services, hooks, tabelas e docs por dominio.
- [MASTER_REPORT.md](./MASTER_REPORT.md): relatorio executivo completo com auditoria por dominio, front-end base, admin, perfil e plano em fases.
- [EXECUTION_CHECKLIST.md](./EXECUTION_CHECKLIST.md): checklist operacional por prioridade.
- [QUICK_WINS.md](./QUICK_WINS.md): ganhos de curto prazo sem abrir feature nova.
- [ADMIN_COVERAGE_MATRIX.md](./ADMIN_COVERAGE_MATRIX.md): matriz viva de coverage e ownership administrativo por dominio.
- [PROFILE_IDENTITY_GOVERNANCE.md](./PROFILE_IDENTITY_GOVERNANCE.md): contrato vivo de identidade de profile, publico/privado, username, reputacao, plano, preferencias e permissoes.
- [MAP_GOVERNANCE.md](./MAP_GOVERNANCE.md): contrato vivo de governance do produto mapa, seus providers, camadas, superficies e hotspots operacionais.
- [ADMIN_UI_BASELINE.md](./ADMIN_UI_BASELINE.md): contrato visual canonico do admin, com shell, filtros, estados e superficies prioritarias migradas.
- [POST_READINESS_BACKLOG.md](./POST_READINESS_BACKLOG.md): itens que devem ficar para depois da prontidao.

## Gates de blindagem
- `npm run audit:architecture`: regenera o inventario estrutural.
- `npm run validate:architecture:governance`: bloqueia acesso fora de service, imports cruzados entre modulos, services paralelos, tipos canonicos duplicados e regra de negocio em hook/page.

## Uso recomendado
1. Ler o [MASTER_REPORT.md](./MASTER_REPORT.md).
2. Executar o [EXECUTION_CHECKLIST.md](./EXECUTION_CHECKLIST.md) por ordem.
3. Regenerar o [PROJECT_INVENTORY.md](./PROJECT_INVENTORY.md) a cada consolidacao grande.

