# Security Risk Levels

Status: ativo
Data: 2026-07-07

Esta matriz classifica alteracoes por impacto de seguranca. O nivel define a
evidencia minima antes de concluir uma tarefa.

## Critical

Alteracoes Critical podem expor dados, quebrar autorizacao ou afetar fluxos
transacionais.

Exemplos:

- Auth, sessao, cookies, guards e perfil ativo.
- `service_role`, secrets, env vars sensiveis e provider keys.
- Supabase RLS, grants, views, RPCs e funcoes `SECURITY DEFINER`.
- Storage privado/publico, policies de listagem e upload.
- Migrations, drift remoto/local e dados de producao.
- PII/LGPD, dados pessoais, enderecos, contatos e identificadores.
- Pedidos, pagamentos, delivery, trust/moderacao e auditoria.
- Fluxos que permitem acesso por `profile_id`, `business_id`, `order_id`,
  `user_id`, `location_id` ou `territorial_group_id`.

Evidencia minima:

```powershell
npm run validate:migrations
npm run validate:migrations:remote
npm run validate:security-authority
npm run security:validate
npm run verify:deploy
```

Tambem exige teste focado de autorizacao ou justificativa formal de excecao.

## High

Alteracoes High podem abrir caminho para regressao, mas normalmente nao mudam
diretamente o modelo de seguranca do banco.

Exemplos:

- Services Supabase de leitura/escrita.
- Hooks que carregam dados por usuario, perfil, empresa ou territorio.
- Rotas protegidas, dashboards e paineis operacionais.
- Mutations de negocio sem dados financeiros.
- Integracoes server-side com permissao limitada.

Evidencia minima:

```powershell
npm run typecheck:app
npm run lint
```

Quando aplicavel, adicionar teste focado do modulo alterado.

## Medium

Alteracoes Medium afetam superficie publica ou comportamento de produto sem
alterar autorizacao sensivel diretamente.

Exemplos:

- Consultas publicas com dados nao sensiveis.
- SEO, sitemap, metadados e rotas publicas canonicas.
- Filtros territoriais de leitura publica.
- Componentes que exibem dados ja classificados como publicos.

Evidencia minima:

```powershell
npm run typecheck:app
```

Se tocar rota, territorio ou URL:

```powershell
npm run validate:ssot
```

## Low

Alteracoes Low nao devem afetar dados, autorizacao, runtime sensivel ou rotas.

Exemplos:

- Docs sem regra operacional nova.
- Estilos.
- Textos.
- Testes isolados.
- Refactors internos sem acesso a dados.

Evidencia minima:

```powershell
git diff --check
```

## Regra De Escalada

Se uma alteracao tocar mais de uma categoria, usar o maior risco. Se houver
duvida entre dois niveis, classificar pelo maior ate provar o contrario.
