# AI Agent Security Rules

Status: ativo
Data: 2026-07-07

Estas regras valem para Codex, Cursor, Kiro ou qualquer outro agente de IA que
modifique este repositorio.

## Antes De Editar

O agente deve identificar se a alteracao toca:

- Supabase, migrations, RLS, RPC, grants, Storage ou Auth;
- secrets, env vars, service role ou provider keys;
- rotas protegidas, guards, perfil ativo ou sessao;
- dados pessoais, pedidos, delivery, trust/moderacao ou pagamentos;
- SSOT territorial, URLs canonicas ou regras de acesso.

Se tocar qualquer item acima, consultar:

- [Security Authority](./SECURITY_AUTHORITY.md)
- [Modelo Supabase seguro](./SUPABASE_SECURITY_MODEL.md)
- [Niveis de risco](./RISK_LEVELS.md)
- [Excecoes](./EXCEPTIONS.md)

## Proibicoes

- Nao criar redirect para esconder falha de rota, permissao ou autorizacao.
- Nao criar mock, fallback falso ou sucesso artificial em runtime final.
- Nao mover regra de seguranca para o frontend quando ela precisa existir no
  banco ou backend.
- Nao expor `service_role` em browser, `VITE_*`, logs, docs com valor real ou
  arquivos versionados.
- Nao adicionar `SECURITY DEFINER` para resolver erro de permissao sem revisar
  RLS, grants, `SET search_path` e escopo de chamada.
- Nao liberar `EXECUTE TO anon` sem classificar a RPC como publica.
- Nao usar `TO authenticated` como autorizacao completa quando a tabela contem
  dados por usuario, perfil, empresa, pedido ou territorio.
- Nao editar migration aplicada no remoto sem entender impacto de drift.

## Checklist Para Migrations

- Classificar risco.
- Confirmar se a migration altera tabela, grant, policy, view, function,
  trigger, storage ou dado sensivel.
- Incluir `GRANT` explicito quando uma tabela nova precisar ser acessada via
  Data API.
- Se a tabela nova nao deve ser acessada via Data API, registrar no SQL:

```sql
-- security-authority: no-data-api public.nome_da_tabela
```

- Habilitar RLS em tabela exposta.
- Criar policies com predicado real de autorizacao.
- Nao tentar corrigir `public.spatial_ref_sys` ou `public.st_estimatedextent`
  por migration padrao sem preflight de owner/plataforma. Se a via foi aprovada
  e evidenciada, registrar:

```sql
-- security-authority: extension-owner-preflight EXC-2026-07-08-POSTGIS-EXTENSION-OWNER
```

- Evitar `SECURITY DEFINER`; se inevitavel, usar `SET search_path`, grants
  explicitos e checagem interna de identidade/escopo.
- Rodar:

```powershell
npm run validate:migrations
npm run validate:migrations:remote
npm run validate:security-authority
```

## Checklist Para RPC E Functions

- A funcao precisa mesmo ser RPC publica?
- Pode ser `SECURITY INVOKER`?
- Se for `SECURITY DEFINER`, qual RLS ela precisa atravessar?
- Quais roles podem executar: `anon`, `authenticated`, `service_role`?
- Existe checagem interna de ownership, membership, perfil, empresa, pedido ou
  territorio?
- O `search_path` esta fixado?
- O retorno expoe PII ou dado operacional indevido?
- Se houver `GRANT EXECUTE ... TO anon` ou `TO PUBLIC`, registrar no SQL:

```sql
-- security-authority: public-rpc public.nome_da_funcao
```

## Checklist Para Frontend/Services

- O frontend usa apenas chave publica.
- Qualquer operacao sensivel depende de RLS/RPC/backend, nao apenas de guard UI.
- IDs vindos de URL, props ou estado sao tratados como nao confiaveis.
- Rotas protegidas nao substituem autorizacao no banco.
- Nao ha fallback silencioso para dados mockados em runtime final.

## Checklist Final

Antes de encerrar a tarefa, registrar no resumo:

- arquivos alterados;
- nivel de risco;
- comandos executados;
- comandos nao executados e motivo;
- excecoes abertas, se houver.
