# Business Module Validation

## Auditoria de 2026-04-10

### Corrigido nesta rodada

- Favoritos do fluxo `empresas` mantidos com `business_favorites` (compat).
- Favoritos do fluxo `gastronomia` consolidados em `user_favorite_businesses` com fallback SSOT em leitura direta.
- Navegação pública passou a resolver contexto territorial por ID/slug quando necessário.
- Fluxos paralelos removidos:
  - `useBusinessActions`
  - `useBusinessListSSO`
  - `useBusinessQueries`
  - stores duplicadas de business
- Listagem pública voltou a usar coordenadas canônicas de `address`.
- Documentação do módulo e dos hooks foi reduzida para o contrato real.

### Validação executada

- `npm run typecheck`
- `npx eslint src/modules/business src/core/business --ext .ts,.tsx`

### Riscos remanescentes

- Ainda existem componentes legados no módulo que não fazem parte da API recomendada.
- O módulo segue sem suíte própria de testes automatizados.
