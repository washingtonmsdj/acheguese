# Homologação Visual — Fase 2.8

## 1. Status da Fase 2.8

**APROVADA TECNICAMENTE / PENDENTE DE HOMOLOGAÇÃO VISUAL MANUAL.**

Status confirmado:
- DriverGuard sem regressão.
- `/central/motorista/*` exige `can_do_rides !== false`.
- `/central/motoboy/*` exige `can_do_delivery === true`.
- Motorista sem `can_do_delivery === true` não acessa motoboy.
- Motoboy com `can_do_rides === false` não acessa motorista.
- `lint` passou sem warnings.
- `typecheck` passou.
- `build` passou.
- Correções visuais aplicadas:
  - Cardápio com ícone `BookOpen`.
  - Nome da empresa truncado no desktop.
  - Nome da empresa truncado no mobile.
  - Breadcrumbs com `overflow-x-auto` e truncamento.

## 2. Rotas para testar manualmente

- `/central`
- `/central/empresas`
- `/central/empresas/:businessId`
- `/central/empresas/:businessId/gastronomia`
- `/central/empresas/:businessId/gastronomia/cardapio`
- `/central/empresas/:businessId/gastronomia/pedidos`
- `/central/motorista`
- `/central/motorista/disponibilidade`
- `/central/motorista/ganhos`
- `/central/motoboy`
- `/central/motoboy/entregas`
- `/central/profissional`

## 3. Checklist desktop

- [ ] sidebar não cobre conteúdo
- [ ] breadcrumbs aparecem corretamente
- [ ] item ativo correto
- [ ] nome longo da empresa trunca corretamente
- [ ] subitens de gastronomia aparecem corretamente
- [ ] páginas de motorista/motoboy utilizáveis

## 4. Checklist mobile

- [ ] navegação não fica poluída
- [ ] scroll horizontal funciona
- [ ] breadcrumbs não quebram
- [ ] nome da empresa trunca corretamente
- [ ] subitens não poluem a interface

## 5. Checklist de acesso

- [ ] motorista não acessa motoboy sem permissão
- [ ] motoboy não acessa motorista sem permissão
- [ ] usuário sem `driver_data` vê empty state
- [ ] usuário sem profissional vê empty state
- [ ] usuário sem empresa vê empty state
