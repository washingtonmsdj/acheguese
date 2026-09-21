# Checkpoint MVP — launch scope, rotas e governança documental

**Data local:** 2026-09-20  
**Base após integração:** `375bb44432f6bd97709beac70d9dd3d388995ab6`  
**Autoridade operacional:** `docs/08-roadmap/EXECUCAO_MAIN_ONLY.md`

## Escopo deste corte

Este checkpoint registra somente a auditoria/limpeza executada sobre a `main` atual. Não substitui o roadmap e não altera launch gates.

### 1. Navegação Admin respeita o launch scope

PR #266, squash `03a8ca7143e12500c9ad387aebea02b823156e17`.

Problema encontrado:
- o item que aponta para `/admin/motoristas` usa `id: "mobilidade"`;
- o filtro de destinos pausados usava `"motoristas"`;
- portanto Mobilidade podia continuar visível na sidebar mesmo com a rota Admin pausada.

Correção:
- filtro alterado para o ID real `mobilidade`;
- teste arquitetural agora associa cada rota Admin pausada ao ID real do item de navegação, em vez de apenas procurar strings.

### 2. Segunda autoridade de lazy imports Admin removida

PR #267, squash `c41f42ee120bd74f224e41f9acce81c03f2181bb`.

Auditoria confirmou:
- `AdminRoutes.tsx` usa exclusivamente `adminLazyImports.ts`;
- `lazyImports.ts` ainda continha 45 exports administrativos duplicados, incluindo Guide Admin e Locations Admin;
- todos possuíam counterpart canônico em `adminLazyImports.ts`;
- nenhum caller runtime do AppLayout dependia desses exports;
- um teste antigo de Mobilidade ainda importava Admin pelo barrel genérico.

Correção:
- 58 linhas duplicadas removidas de `lazyImports.ts`;
- teste de Mobilidade migrado para `adminLazyImports.ts`;
- ratchet impede `Admin*` e `LocationsAdminPage` de voltarem ao barrel do AppLayout;
- páginas e rotas Admin reais foram preservadas.

### 3. `URGENTE...` reduzido a ponteiro de compatibilidade

PR #268, squash `375bb44432f6bd97709beac70d9dd3d388995ab6`.

Problema:
- o arquivo dizia ser “não SSOT”, mas ainda duplicava SHAs, estado de CI, migrations e blockers antigos;
- documentos vivos ainda o chamavam de plano permanente/authority.

Correção:
- o arquivo raiz agora contém apenas a ordem de leitura e aponta para as autoridades reais;
- D-013 foi alinhada: raiz permanente = `README.md` + `SECURITY.md`; `URGENTE...` é compatibilidade temporária;
- Business, Location, template de módulo, Compatibility Bridges e tombstone de Status passaram a apontar para `docs/README.md`, `EXECUCAO_MAIN_ONLY.md` e/ou `SSOT_REGISTRY.md`;
- o teste arquitetural renomeou `PERMANENT_PLAN` para `ROOT_COMPAT_POINTER`.

## Auditorias sem mudança

- `CentralRoutes.tsx` mantém `concept-mock` apenas quando `import.meta.env.DEV` e query explícita `concept-mock=1`; não há mock conceitual nesse caminho em Production.
- `/inicio` continua sendo o hub nacional legado porque o contrato atual de `HOME-SPEC.md` ainda o preserva. Não foi alterado por preferência durante esta auditoria.

## Estado do CI observado

No head exato do PR #267 (`d4652903c66297af08313daa80d55796acd98b0f`):

- `SSOT Territorial Tests` run `35554082494`: failure antes de steps;
- `Security Check` run `35554082488`: failure antes de steps;
- `Security Scan` run `35554082438`: failure antes de steps;
- `SSOT Enforcement` run `35554082447`: failure antes de steps;
- os jobs inspecionados retornaram `steps=[]` e não possuíam blob de log executável;
- `Heavy PR Certification (Auto)` run `35554082524` permaneceu queued, também sem steps;
- Vercel do PR #267 reportou status success/ignored;
- Vercel do PR #268 foi bloqueado por build rate-limit.

Conclusão: **não existe evidência de regressão de teste nesses cortes, mas também não existe certificação real de CI hosted para o SHA candidato.** O gate de release permanece aberto.

## Próximo P0

1. obter execução real de lint/typecheck/security/test/build em runner no SHA candidato;
2. obter deploy Vercel `READY` do mesmo SHA, sem rate-limit/ignored build;
3. executar smoke/E2E do mesmo SHA;
4. concluir required checks/ruleset da `main` quando houver check executável;
5. continuar auditoria de veracidade funcional das superfícies MVP ativas; não ativar Mobilidade/Educação/Billing ou demais módulos pausados para contornar gates.
