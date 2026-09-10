# G41 — contratos de cliente Edge + consolidação de authorities

Data: 2026-09-10
Branch de execução: `main`
Baseline funcional deste checkpoint: `4860f84692021d6e1874512f658b804281de016b`

## Objetivo

Continuar o hardening iniciado em G40, corrigindo uma classe transversal de defeitos: clientes browser/core que chamavam Supabase Edge Functions e tratavam respostas `4xx/5xx` apenas por `error.message`, aceitavam payloads incompletos como sucesso ou mantinham APIs apontando para Edge Functions inexistentes.

A regra consolidada neste checkpoint é:

1. `src/integrations/supabase` conhece `FunctionsHttpError` e extrai o body seguro do servidor;
2. `core` consome o adapter canônico e não importa `@supabase/supabase-js` diretamente;
3. cada domínio valida o contrato mínimo de sucesso que realmente precisa;
4. fallback silencioso só permanece onde ele é comportamento deliberado do domínio;
5. endpoints inexistentes não são mascarados com fan-out ou novas authorities paralelas.

## Mudanças principais

### Billing

- `e0e8b02f` / `35435ec1`: `BillingService` passou a preservar erros estruturados de `billing-create-checkout` e `billing-create-portal`;
- checkout exige `sessionId` e `url` não vazios;
- portal exige `url` válida como contrato estrutural;
- payload primitivo, vazio ou parcial falha fechado antes de qualquer redirect;
- `04babbcf`: cobertura de sucesso, erro Edge e payload inválido.

### Territorial

- `0bdca666`: `territorial-get-tree` preserva o erro estruturado do Edge e mantém validação de `locations/groups`;
- `89b69e42`: `TerritorialAIService.generateAIContent` preserva respostas não-2xx e rejeita payload nulo/primitivo;
- `4bd7e511` / `bd47f908`: cobertura para árvore territorial, memberships, erro administrativo, structured AI e fail-closed.

### Verificação administrativa

- `23d5b935`: `VerificationAdminService` deixou de aceitar `{}` como listagem/estatísticas/comando válido;
- listagem exige `items` array;
- stats exigem contadores numéricos não negativos;
- review/verify exigem envelope contendo `verification`;
- `4c7d7c3a`: testes impedem regressão para “0 pendentes / 0 aprovados” quando o Edge devolve contrato incompleto.

### Privacidade / LGPD

- `ef7284b6`: corrigido mismatch real entre `PrivacyService` e `user-export-data`;
- o Edge não retorna `export_metadata.size_bytes`; por isso o cliente antigo reportava `sizeBytes=0`;
- o cliente antigo contava apenas as chaves externas do payload e podia reportar `tablesExported=2`, embora as seções exportadas estejam em `export_metadata.sections` / `data`;
- agora o tamanho é calculado usando a mesma serialização JSON indentada do Edge e a quantidade de seções usa o contrato real;
- `724005a2`: cobertura de tamanho, seções, sessão inválida e payload LGPD malformado.

A flag `LGPD_EXPORT_MATRIX_IMPLEMENTATION_COMPLETE=false` permanece intocada: este checkpoint corrige o cliente, não autoriza rollout prematuro da exportação.

### Safety — email de emergência

- `a3e554bf`: `EmailNotificationProvider` passou a validar correlação entre request/response;
- sucesso exige `success=true`, mesmo `contactId`, `channel=email`, timestamp e `status=sent`;
- uma resposta nominalmente bem-sucedida para outro contato ou com lifecycle incoerente é rejeitada;
- erros seguros como alerta inativo/rate-limit são preservados;
- `d5d6aefb`: cobertura do contrato de entrega.

### Administração de usuários

- `2e691d5a`: `AdminUserService` passou a validar paginação de `admin-list-users`, envelope de `admin-get-user` e sucesso explícito de `admin-suspend-profile`;
- erros estruturados de autorização/moderação são preservados;
- `getUserById` continua retornando `null` em falha porque esse fallback faz parte do comportamento atual dos callers, mas deixou de confiar em envelope inválido;
- `869cb11f`: cobertura dos contratos.

### Cadastro de interesse comunitário

- `9b6b26a7`: `registerCommunityInterest` usa o adapter canônico para distinguir payload inválido, verificação/configuração indisponível, origem inválida e falha de persistência;
- `4126c45c`: cobertura dos outcomes públicos e fail-closed.

### IA — correção de authority inexistente

Problema de raiz encontrado:

- `IntentParser` usava `OpenAIProvider` por padrão;
- esse provider chamava `ai-intent-parse`;
- não existe `supabase/functions/ai-intent-parse` na árvore real do projeto;
- portanto a camada remota de intenção podia falhar continuamente e cair silenciosamente no `RuleBasedAIProvider`.

Correção:

- `a66ef28d`: criado `EdgeAIProvider` sobre o broker canônico existente `aiClient.text` -> `ai-text`, usando structured output;
- `ceb1145e`: `IntentParser` passou a usar `EdgeAIProvider` como provider primário;
- `dd3a98aa`: ratchet de segurança impede retorno de `ai-intent-parse` e exige o broker canônico;
- `6bc224f4`: `OpenAIProvider.ts` removido fisicamente;
- `121522e1`: testes garantem structured output, fallback em resposta não estruturada e ownership local dos campos `query/source`.

O provider remoto não escolhe `source` nem altera a consulta original; esses campos são derivados no cliente antes da validação por `AIIntentSchema`.

### Push — self-service real, bulk fantasma removido

Problemas encontrados:

- `PushService.sendToUsers()` apontava para `send-push-bulk`, Edge Function inexistente;
- `usePush` expunha `sendToUser(targetUserId, ...)`, embora `send-push` autorize explicitamente apenas `user.id === userId`;
- `send-push` pode retornar HTTP 200 com `success=true`, `successCount=0` e falhas de provider, e o cliente antigo mostrava isso como notificação enviada.

Correção:

- `6393085c`: contratos de config/subscribe/unsubscribe/send validados e erros Edge preservados;
- envio individual virou primitive privada usada somente por `sendTestNotification`;
- sucesso do autoteste exige `successCount >= 1`;
- `send-push-bulk`/`sendToUsers` foram removidos; bulk futuro deverá nascer como operação server-owned apropriada, não como fan-out browser;
- `32fa6a99`: hook limitado a subscribe/unsubscribe/self-test;
- `4860f846`: ratchet exige ownership de `send-push`, `verify_jwt=true`, ausência de bulk e primitive privada.

### Profiles/Admin — owner duplicado aposentado

- busca de callers confirmou que `src/core/profiles/services/multi-profile/adminService.ts` não possuía consumidor runtime; só era reexportado pelo barrel;
- o projeto já possui o owner administrativo canônico em `src/core/admin` e `AdminUserService` para moderação;
- `a1679018`: removido o reexport duplicado;
- `7215956e`: arquivo `multi-profile/adminService.ts` removido;
- `4890fb42`: teste G36 atualizado para exigir ausência do owner duplicado e continuar verificando Edge + RPC server-owned.

Há ainda uma entrada stale em `eslint.config.js` referenciando o arquivo removido dentro de um bloco de exceções antigo. Ela não cria runtime authority, mas deve ser eliminada quando o arquivo de configuração puder ser reescrito de forma segura junto com o próximo ratchet de allowances, em vez de manter uma exceção morta indefinidamente.

## Segurança preservada

- nenhum grant/RLS foi ampliado;
- nenhum secret foi movido ao browser;
- nenhum endpoint público novo foi criado;
- nenhum SQL destrutivo G39 foi aplicado;
- `send-push` continua self-only e `verify_jwt=true`;
- `admin-suspend-profile` continua broker admin sobre RPC `service_role`;
- o parser de intenção passou a reutilizar `ai-text`, evitando uma authority Edge paralela;
- erros 5xx continuam seguros porque o servidor já devolve mensagens genéricas quando necessário; o adapter apenas preserva o body que o próprio Edge decidiu expor.

## Estado dos gates

No baseline `4860f846`, GitHub criou jobs de `SSOT Territorial Tests` e `Security Check`, porém a API reportou `steps: null` para os jobs examinados, incluindo Runtime Tests, Phase Core Gate, Lint/Type Check e Maps Architecture Enforcement. Não há log de step para atribuir o `failure` ao código.

Portanto:

- cobertura foi **implementada**;
- execução verde/vermelha dos testes novos **não está comprovada**;
- não marcar typecheck/lint/security/architecture como aprovados nem como regressão de código com esse sinal;
- Vercel segue sujeito ao blocker de rate-limit já registrado nos checkpoints anteriores.

## Próximas ações

1. eliminar allowances/configurações stale associados aos owners removidos;
2. continuar o pente-fino dos callers diretos de `supabase.functions.invoke`, priorizando loaders/admin e notificações sem alterar fallbacks deliberados;
3. executar os testes G39/G40/G41 e gates globais em executor que realmente rode os steps;
4. reconciliar/deployar Edge Functions modificadas somente quando houver alteração server-side necessária e prova same-SHA;
5. manter G39 pending até frontend certificado + smoke anônimo/autenticado do lead broker + gates reais verdes.
