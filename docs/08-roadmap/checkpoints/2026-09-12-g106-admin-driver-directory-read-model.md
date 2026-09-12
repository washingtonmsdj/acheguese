# G106 — Admin driver directory read-model authority

Status: **SOURCE-CLOSED / REMOTE CERTIFICATION PENDING**

Data: 2026-09-12

## Problema de raiz

A gestão administrativa de motoristas tratava `driver_complete_profile` como um DTO completo e consumia campos que o contrato Supabase gerado não expõe, entre eles `user_id`, colunas `vehicle_*` achatadas, `cnh_image_url`, `neighborhood` e `city`.

Além disso:

- `useDriverManagement` fazia N+1 via `ProfileService.getProfileContext()`;
- ausência de decisão de moderação era convertida antecipadamente em `pending`, impedindo o fallback para `driver_data.is_verified`;
- o hook filtrava a lista antes das estatísticas e a página filtrava novamente;
- o filtro `rejected` do utilitário devolvia sempre uma lista vazia;
- a UI mostrava uma imagem de CNH baseada em `cnh_image_url`, coluna sem authority no schema gerado/versionado.

## Authority resultante

O diretório administrativo agora compõe fatos por responsabilidade:

- **cadastro, habilitação e veículo:** `driver_data` com projeção explícita;
- **identidade pública e rótulos territoriais:** relação explícita com `profiles` (`name`, `display_name`, `avatar_url`, `neighborhood`, `city`);
- **presença operacional:** `driver_availability`, sobreposta por `AdminMobilityRuntimeService`;
- **decisões de aprovação/rejeição:** eventos de moderação;
- **suspensão:** estado administrativo do perfil, composto por `AdminDriverModerationService`.

`user_id` não faz mais parte da projeção do diretório, porque deixou de existir o N+1 baseado no usuário.

## Semântica de verificação

A regra ficou explícita:

1. decisão administrativa `approved` / `rejected`, quando existe, vence;
2. sem decisão explícita, usa-se `driver_data.is_verified` como fallback do cadastro;
3. ausência de decisão não é mais fabricada como `pending` dentro do reader de moderação.

O DTO entregue à UI sempre recebe um dos estados resolvidos: `pending`, `verified` ou `rejected`.

## UI e filtros

- `ProfileContext` saiu do `DriverRequest` administrativo;
- `cnh_image_url` saiu do DTO e do card;
- o card de CNH usa os campos existentes `license_number`, `license_category`, `license_state` e `license_expiry`;
- rejeitados são exibidos como `Rejeitado`, não como pendentes;
- o hook mantém o conjunto completo de motoristas e filtros ficam somente na camada de apresentação;
- estatísticas deixam de variar de forma incorreta conforme a aba selecionada;
- o filtro `rejected` passou a usar `verification_status === "rejected"`.

## Projeção mínima do diretório

`getDriverProfiles()` não usa mais `driver_complete_profile.select("*")` e não lê presença de `driver_data`.

A projeção administrativa traz somente os fatos cadastrais necessários e os rótulos públicos necessários à tela. `is_online`, `is_available`, localização operacional e timestamps de presença não são selecionados de `driver_data`.

## Ratchet

Adicionado:

`src/modules/mobility/__tests__/AdminDriverDirectoryAuthorityG106.test.ts`

O ratchet protege:

- `driver_data` como origem cadastral explícita do diretório;
- ausência de `select("*")` e de `driver_complete_profile` no reader administrativo;
- ausência de presença operacional no reader cadastral;
- ausência de `user_id`, `ProfileContext`, N+1 e `cnh_image_url`;
- fallback de verificação baseado em `driver_data.is_verified`;
- helpers/filtros baseados no read model resolvido;
- metadados reais de habilitação na UI.

## Validação

As alterações foram verificadas por diff/source no `main` e protegidas pelo ratchet estático.

A certificação remota continua **pendente**: os workflows recentes do repositório vinham falhando antes da execução, com jobs sem steps e `runner_id=0`. Isso não constitui falha dos testes nem permite declarar suíte verde.

A conexão SQL/metadata do projeto Supabase também permanece indisponível por timeout; nenhum DDL foi necessário ou aplicado no G106.

## Próximo corte

Auditar os leitores restantes de `driver_complete_profile`, especialmente:

- `MobilityRuntimeService.ts`, que ainda possui leitura `select("*")`;
- a classe estática duplicada `MobilityService.impl.ts` e seus consumidores remanescentes.

Objetivo do próximo gate: remover dependências duplicadas/inválidas sem alterar a authority canônica de presença.
