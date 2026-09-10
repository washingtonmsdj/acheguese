# G42 — Runtime authority contracts, MFA e Edge fail-closed

Data: 2026-09-10

Implementation head consolidado antes deste checkpoint:
`d2ac7469864023675a29cee9c89f63606a5393b7`.

## Objetivo

Continuar o pente-fino de boundaries runtime da `main` sem invadir trabalho
paralelo de Mobilidade ou identidade visual e sem executar o cutover destrutivo
G39. O foco deste checkpoint é remover falso sucesso, contratos 2xx permissivos,
authority duplicada e decisões de segurança derivadas de estado controlável pelo
browser.

## Contenção de branches concorrentes

Branches confirmadas como trabalho paralelo e deliberadamente reservadas:

- `module/mobilidade` — desenvolvimento dedicado do módulo Mobilidade; não
  receber correções G42 por cherry-pick/reescrita automática e não deve ser
  sobrescrita pela `main`;
- `codex/identidade-visual-achegue-se` — identidade visual/layout ativo; seus
  deltas de UI devem ser preservados e a futura sincronização com `main` deve
  ocorrer por merge/rebase consciente, nunca substituindo a árvore visual;
- `codex/nova-home-comunidade` — branch visual/home anterior ainda existente;
- outras `codex/*`, `agent/*` e `DO_NOT_USE` continuam existentes e não foram
  apagadas, fundidas ou force-pushed neste checkpoint.

Arquivos visualmente sensíveis da branch de identidade não foram usados como
alvo do G42. O trabalho permaneceu em boundaries de `src/core`, infraestrutura,
Auth e Edge Functions da `main`.

## Contratos Edge e runtime fechados

### Education Lead

`PublicEducationLeadService` deixou de interpretar payload incompleto como lead
existente. O ACK agora exige forma completa, UUIDs válidos e correlação com o
`educationProfileId` solicitado.

### Push

O ciclo de vida ficou server-authoritative:

- subscribe só é efetivo depois de persistência confirmada no servidor;
- falha no Edge após criação da subscription do navegador dispara rollback
  local;
- unsubscribe desativa no servidor antes de remover o estado local;
- falha de leitura não é mascarada como lista vazia válida.

### Professional/Admin

Mutação de disponibilidade só conclui quando o broker devolve o mesmo
profissional e o mesmo estado solicitado. ACK de outro registro ou estado
incompatível é erro.

### Email

`EmailService` foi reduzido a self-email autenticado e exige receipt real do
provider (`success:true` + `emailId`). Wrappers não ignoram mais
`success:false`. Recuperação de senha permanece em Supabase Auth e foi removida
da facade de Notifications. O fluxo de confirmação MFA não transporta códigos
de recuperação locais.

### Territorial

`territorial.mutations.updateMetadataFlag()` exige sucesso correlacionado com o
mesmo ID, flag e valor solicitado. HTTP 2xx vazio não confirma mais mutação.

Permanece aberto um defeito funcional distinto: o Edge de location documenta
cascata para todos os descendentes, mas a implementação conhecida altera apenas
filhos diretos. Não foi introduzido loop de writes no Edge porque isso criaria
mutação parcial sem transação. O fechamento deve ocorrer no banco em uma
operação transacional/recursiva quando o remoto voltar a responder.

### AI platform

`aiClient` passou a validar em runtime os contratos canônicos:

- imagem: `generationId`, `model` e URLs válidos;
- texto/visão: `text`, `model` e `structured` coerentes;
- chamada com schema não aceita `structured:null` ou fallback `_raw` como
  structured output válido;
- códigos de erro desconhecidos são normalizados para `server_error`.

### Privacy/LGPD

O lifecycle de exclusão continua em `privacy-rpc`, não no handler destrutivo
legado. O cliente valida consent ID, request ID, status, timestamps, contadores
e coerência entre os campos de agendamento/cancelamento antes de produzir estado
válido na UI.

### Broker command compartilhado

`invokeSupabaseBrokerCommand()` deixou de aceitar qualquer 2xx como sucesso.
Comandos exigem envelope com propriedade `data` explícita e não nula. Os callers
ativos revisados (`admin-business-rpc`) já devolvem esse ACK.

### Media

`MediaService` foi revisado e não precisou de alteração: referência canônica,
owner, preset/version, asset ID, MIME, dimensões e byte size já são validados
antes do sucesso.

## MFA — correção de autoridade

O pente-fino encontrou uma falha estrutural de segurança:

1. `MFAService.checkMFARequired()` convertia falha/null do broker em
   `required:false` para sessão autenticada;
2. existiam recovery/backup codes gerados localmente, sem autoridade real no
   Supabase Auth;
3. `user_mfa_status.mfa_enabled` era usado como estado de política embora a
   tabela tivesse policies históricas de DML pelo browser;
4. `admin_mfa_enforcement` também possuía policy histórica `FOR ALL` para
   super_admin;
5. `requireAdmin` validava JWT + role, mas não exigia AAL2 na sessão atual.

O desenho G42 agora é:

`JWT -> get_user_roles -> verified Auth factors -> current AAL -> requireAdmin`

Mudanças principais:

- `MFAService` não grava mais `user_mfa_status` como authority;
- status habilitado é derivado de `supabase.auth.mfa.listFactors()`;
- fake recovery codes locais foram removidos do fluxo;
- policy desconhecida para usuário autenticado falha fechado;
- `useMFA` mantém estado de requirement como desconhecido e expõe
  `isMFARequirementResolved`; enquanto não resolvido, `isMFARequired` é true;
- criado `_shared/mfaPolicy.ts` como owner server-side;
- fatores são listados com Admin Auth e somente fatores `verified` contam;
- JWT atual precisa apresentar `aal2` quando o ator é admin/super_admin;
- `_shared/adminAuth.ts` reutiliza essa política, portanto Edge Functions que
  chamam `requireAdmin`/`requireSuperAdmin` passam pelo mesmo gate;
- `session-rpc` reutiliza a mesma política para a UI e o backend não divergirem.

### Janela conservadora até o DDL G42

A revisão posterior provou que também não é seguro usar `user_roles.created_at`
como origem de grace: a história de schema inclui policy `FOR ALL` de
super_admin sobre `user_roles`.

Por isso, enquanto o fechamento DDL não puder ser aplicado e provado no remoto:

- `admin` e `super_admin` são sempre considerados sujeitos a MFA pelo runtime;
- `admin_mfa_enforcement.mfa_required` não pode enfraquecer autorização;
- `user_mfa_status.is_exempt` não pode enfraquecer autorização;
- `user_mfa_status.grace_period_expires_at` não pode estender acesso;
- grace/isenção não participam da decisão de autorização;
- o tracker serve somente como cache sincronizado a partir do Supabase Auth.

Isso é deliberadamente mais restritivo que o comportamento histórico, mas
elimina bypass enquanto a autoridade de DML do banco ainda não foi fechada.
Reintroduzir grace/isenção exige uma fonte server-owned comprovada.

### DDL MFA pendente

Foi criado apenas em staging documental:

`docs/09-reference/migrations-pending/20260910203000_harden_mfa_authority_g42.sql`

Ele não está em `supabase/migrations` e não deve ser aplicado até o banco remoto
estar acessível. O arquivo prevê retirar DML direto de `user_mfa_status` e
`admin_mfa_enforcement` e contém pre/postflight explícito.

## Virtual Try-On

`tryon-generate` foi endurecido:

- 500 fatal não expõe `err.message`/provider/infra ao cliente;
- erro interno completo permanece apenas no log server-side;
- `tryon_generations.error_message` recebe mensagem pública sanitizada;
- transições `processing`, progresso e `completed` verificam erro de persistência;
- falha ao persistir o próprio estado `failed` é registrada separadamente;
- cliente continua exigindo ACK correlacionado `ok:true + generationId +
  provider:'replicate'`.

Ratchet: `tests/security/tryon-edge-contract-g42.test.ts`.

## Supabase remoto

O projeto conhecido é `xhdowzacfujckjelqhtd` (`acheguese`). Chamadas de banco
para inspeção de catálogo/migrations repetiram
`Connection terminated due to connection timeout`.

Consequências:

- nenhuma migration G42 foi aplicada;
- nenhuma afirmação de schema remoto atualizado foi feita;
- não houve loop de retry indefinido;
- o fechamento territorial transacional e o DDL MFA permanecem gates remotos.

## CI/Actions

No head `1846159c10088a6790ef7bdaf305729169dc746e`, os workflows automáticos
`SSOT Enforcement` e `Security Check` foram criados, mas os jobs observados
falharam antes de executar steps (`steps=[]`) e o log do job SSOT sequer estava
disponível (`BlobNotFound`).

Logo:

- não existe prova de teste verde;
- também não existe, nesses runs, teste executado demonstrando regressão;
- o estado correto é **gate de execução indisponível/não executado**;
- não disparar reruns pesados até haver capacidade real do Actions.

## G39 continua intocado

O cutover Professional continua proibido até cumprir seus próprios gates:

- frontend novo LIVE;
- smoke anônimo + autenticado pelo broker/Turnstile;
- zero caller LIVE do creator direto antigo;
- certificação de security/architecture/typecheck/build executada de verdade.

Não mover nem aplicar
`docs/09-reference/migrations-pending/20260910133000_finalize_professional_lead_intake_g39.sql`
antecipadamente.

## Próximos passos

1. quando o Supabase remoto voltar, executar preflight read-only do DDL MFA e
   confirmar policies/grants reais antes de promover qualquer migration;
2. fechar a cascata territorial em uma autoridade transacional recursiva;
3. repetir certificação real de security/architecture/typecheck/build quando o
   Actions tiver runner/steps executáveis;
4. continuar o pente-fino de boundaries da `main` sem tocar nos deltas próprios
   de `module/mobilidade` e `codex/identidade-visual-achegue-se`;
5. integrar branches paralelas somente por merge/reconciliação consciente após
   cada linha de trabalho estabilizar, nunca por force-push ou substituição de
   árvore.
