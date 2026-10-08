# Auditoria aprofundada — Empresas (08/10/2026)

**Escopo:** código `main` de `washingtonmsdj/acheguese` e alterações isoladas nas PRs #641, #644 e nesta branch. Sem inspeção de dados sensíveis, sem mutações de Supabase/Vercel e sem certificação de deploy. **Este é um inventário de achados verificáveis no código, não uma afirmação de cobertura exaustiva de todas as superfícies ou de exploração efetiva.**

## Ownership e limites de segurança

- UI e navegação: `src/modules/business`, `src/modules/central`.
- Domínio e mutações: `src/core/business/services`. Autoridade de cadastro: `BusinessService.createBusiness` / `ProfileRpcService.createBusiness`.
- Autorização frontend **não** substitui enforcement confiável por RLS/RPC. `profiles.id` (identidade do perfil) e `business_data.id` (identidade do agregado) não são intercambiáveis.
- Nenhum caminho alternativo de escrita, migration ad hoc ou fallback para tabelas antigas é permitido.

## Achados e medidas

| ID | Prioridade | Evidência / causa | Encaminhamento |
| --- | --- | --- | --- |
| BUS-01 | P0 consistência | `business.mutations.createBusiness` fazia read `getBusinessById` **depois** do broker confirmar a criação, permitindo falso erro de cadastro após commit | #644: recibo de criação obtido do broker; testar falha da leitura posterior |
| BUS-02 | P0 duplicidade | `CriarEmpresaPage` protegia reenvio apenas com `isCreating`; eventos síncronos de submit podem preceder render | #644: trava síncrona por montagem e bloqueio pós-sucesso; **idempotência servidor continua não certificada** |
| BUS-03 | P1 integridade UX | Upload de logo/capa ou atualização de mídia pós-commit falhava e gerava `onError` para criação já confirmada | #644: sucesso de cadastro distinto de configuração incompleta, com aviso e logs |
| BUS-04 | P1 dado público | `getBusinessesList` devolvia lista vazia em erro PostgREST/transport, confundindo falha com zero empresas | Esta PR: propagar erro e preservar estado de erro dos consumidores TanStack Query |
| BUS-05 | P1 performance | `getBusinessesList` fazia `SELECT profile_id LIMIT 1` na view antes da consulta verdadeira em **todas** as páginas | Esta PR: consulta única da view |
| BUS-06 | P1 abrangência territorial | `getBusinessesList` engolia erro na resolução de descendentes e restringia silenciosamente a localidade exata | Esta PR: propagar erro; nunca representar recorte incompleto como busca normal |
| BUS-07 | P1 paginação | `getBusinessesList` ordenava por atributos não únicos sem desempate estável antes de `range` | Esta PR: desempate por `profile_id`; offset ainda exige testes de concorrência de escrita |
| BUS-08 | P1 identificação | `BusinessUrlService` convertia erro de resolução de slug/premium/ID em `null` | #641 já aberta, sem sobreposição |
| BUS-09 | P1 leitura agregada | `business.queries.getBusinessesByIds` devolve `[]` em erro; isso pode ocultar falha em Nearby e recomendações | Esta PR: erros propagados na consulta canônica e regressão de vazio verdadeiro versus indisponibilidade; consumidores com UX própria ainda em revisão |
| BUS-10 | P1 detalhe | `business.queries.getBusinessBySlug` retorna `null` em erro, lido como inexistência em `useBusiness` | Esta PR: erro tipado de ausência, falhas relançadas ao hook |
| BUS-11 | P1 gestão | `BusinessAdminGuard` ignora o `error` de `useBusiness` e redireciona para listagem com mensagem de “não encontrada” quando o fetch falha | Esta PR: guard bloqueado com erro explícito/retry; redireciona apenas ausência confirmada |
| BUS-12 | P1 ID de domínio | `getBusinessDataIdByProfileId` retorna `null` em transporte com erro, confundindo falha e ausência no fluxo de autoridade | Esta PR: consulta de identidade relança falhas; DashboardAccess diferencia indisponibilidade e negação; Gastronomy deixa de substituir ID quando há erro; outros consumidores permanecem sujeitos a E2E |
| BUS-13 | P1 autoridade | `BusinessOwnershipService.resolveOwnerProfileId` retorna `null` em erro SQL; é **fail-closed quanto à permissão**, mas UI pode reportar ausência/negação falsa | Esta PR: resolução de ownership preserva falhas para o hook; acesso negado por padrão; respostas antigas de outra sessão/perfil são descartadas; RLS ainda não certificado |
| BUS-14 | P0 certificação | Atomicidade do `AddressService` externo versus transação de broker, compensação e idempotência entre requisições não foram comprovadas ponta a ponta | Pendente: revisão de contrato do broker e provas transacionais; não criar escritor paralelo |
| BUS-15 | P0 segurança | Autorização negativa real (não owner, gestor revogado, cross-profile), RLS/grants de Business e ações sensíveis exigem prova no backend | Pendente; **nenhuma vulnerabilidade de escalada foi demonstrada** apenas com inspeção do frontend |
| BUS-16 | P1 criação produto | `business.mutations.createProduct` insere diretamente em `business_products`; contrato RLS precisa ser comprovado, e `created_at` retornado é `new Date()`, não timestamp persistido | #644: mapper canônico lê timestamp persistido do registro retornado; ownership/RLS da mutação ainda exige prova no backend |
| BUS-17 | P2 contrato legado | `BusinessService.getBusinesses` retorna só primeira página (100) e depois filtra bairro/delivery em memória; consumidores podem receber resultados incompletos | Pendente: migrar consumidores restantes para consultas filtradas no owner e aposentar fachada |
| BUS-18 | P2 higiene | Prévia, testes mobile, CRUD de fotos/horários/catálogo e navegação já têm auditorias anteriores; não equivalem a smoke com conta real e mesmo SHA | Pendente: certificação funcional create → edit → página pública → gestão e cleanup |
| BUS-19 | P1 mídia | Upload confirmado sem associação ao perfil pode deixar artefato não referenciado; não há prova aqui de coleta de órfãos ou rollback seguro | Risco **não comprovado**; verificar owner `core/media` antes de propor limpeza |

## Plano de execução

1. **Source imediatamente:** #644 para cadastro confirmado/duplicidade; esta PR para consultas e paginação. Esperar checks no HEAD exato; não mesclar #621 durante gates.
2. **Próxima frente:** listas agregadas por IDs, propagação de falhas de autoridade no DashboardAccess e demais consumers; coordenação com #641 para não duplicar resolver.
3. **Hardening de segurança:** prova de autorização via RPC/RLS, mutações de produto, concessão/revogação e isolamento `profile_id`/`business_data.id`.
4. **Integridade persistente:** idempotência real do broker, referência de mídias, ownership de endereço e compensação; não substituir transação por retries na UI.
5. **Certificação de Business MVP:** criar, editar, detalhe público, gestão, testes negativos, performance/paginação em volume, typecheck/lint/unit/build e smoke same-SHA. Sem chamar runner pendente de PASS.

## Evidências de origem

- `src/core/business/services/business.mutations.ts`, `business.queries.ts`, `BusinessService.ts`, `BusinessOwnershipService.ts`;
- `src/modules/business/hooks/useBusinessCreateMultiProfile.ts`, `src/modules/business/pages/CriarEmpresaPage.tsx`, `src/modules/central/guards/BusinessAdminGuard.tsx`;
- `src/core/business/hooks/useBusiness.ts`, `useDashboardAccess.ts`, `useBusinessList.ts`;
- `src/modules/business/README.md`, `VALIDATION.md`, `docs/audits/central-business-2026-10-01.md`;
- PRs #641, #644; testes de regressão de `business.mutations.spec.ts` e `business-public-list-errors.spec.ts`.

**Status deste documento:** auditoria de código/versionamento; não declaração de MVP READY nem atestado de exploração de segurança.

## Atualização de implementação — 08/10/2026

- **PR #645**: `getBusinessDataIdByProfileId`, `BusinessOwnershipService`, `getBusinessesByIds` e `resolveGastronomyBusinessId` diferenciam ausência normal de erro do serviço. O hook `useDashboardAccess` liga cada resposta à conta e ao perfil consultados e invalida checagens antigas; isso é controle defensivo de interface, **não** enforcement no servidor.
- **PR #645**: testes adicionados para erros de identidade, papéis owner/admin versus negativas reais, race de mudança de sessão, retry explícito e agregação de empresas.
- **PR #644**: `createProduct` usa o mapper canônico existente para retornar a linha persistida, incluindo `created_at`; não fabrica horário no navegador. O backend/RLS da operação ainda precisa de testes negativos.
- As PRs permanecem sem merge e não alteram o candidato #621. Checks de CI pendentes devem ser julgados no HEAD de cada PR, nunca herdados de commit anterior.

### Revisão de escopo

O inventário acima é baseado no código inspecionado, não em prova de ataque nem em certificação funcional completa. Evidências de segurança dependem de políticas/RPCs e testes autenticados. Alterações operacionais de Supabase/Vercel estão explicitamente fora deste ciclo.

### Revisão da autoridade delegada — contrato do Membership Owner

A auditoria encontrou uma segunda camada de mascaramento: `ProfileMembersService.getActiveRole()` transforma a falha de `getActiveRoleResult()` em `null` para compatibilidade de callers simples. O owner de Business **agora consome o `getActiveRoleResult` existente**, exigindo `success === true` antes de interpretar `data` como role. Dessa forma, consulta de membership indisponível gera erro técnico e o hook mantém a interface sem acesso; ausência legítima de membership continua negando normalmente. O contrato de autorização de servidor (`private.can_manage_profile`) não foi modificado. Ratchets arquiteturais de Business e membership foram ajustados para verificar a delegação ao método canônico de resultado, e os testes de ownership cobrem admin, owner, negativa e falha.

O guard de gestão foi ajustado para priorizar estados de erro sobre spinner de verificação em caso de dados em cache, com testes de renderização para recuperação e negação.

## Integridade das respostas de broker — 08/10/2026

**Achado:** ao criar um Address fora da transação do broker e perder a resposta da chamada `profile-rpc`, o cliente não sabe se o Business já foi confirmado. Uma compensação destrutiva nesse estado pode remover o endereço de uma empresa efetivamente persistida. O mesmo vale para uma atualização que troca a referência do endereço.

**Correção defensiva implementada:**

- Antes de enviar o comando ao broker, ou depois de uma resposta **explicitamente rejeitada** (`success: false`), a compensação do Address continua permitida.
- Assim que o comando foi enviado, sem uma resposta conclusiva, o domínio classifica a situação como `BusinessBrokerOutcomeUnknownError`, registra a identidade do Address para reconciliação e **não** executa `deleteAddress`. Uma resposta `success: true` sem recibo obrigatório também é tratada como resultado desconhecido.
- A UI informa que o cadastro deve ser verificado e desabilita novo envio na mesma instância da página, em vez de declarar que a empresa não existe. A edição diferencia esse estado no aviso.
- Regressões simulam resposta perdida e recibo incompleto após comando enviado, para criação e atualização.

**Limite ainda aberto (P0):** isso evita exclusão indevida, mas **não implementa idempotência no servidor, reconciliação automática nem uma transação única entre Address e Business**. A falha de resposta pode deixar um Address sem associação, que deverá ser inspecionado mediante uma rotina segura de reconciliação no owner persistente. Não criar retry cego ou exclusão periódica sem comprovar as referências existentes no banco. A correção definitiva requer contrato versionado de idempotência/status no broker e validação de RLS/migrations na frente autorizada de backend, que permanece fora do escopo operacional desta PR.

### Correção incremental: versão imutável de Address em alterações Business

Antes, `syncAddress` executava `AddressService.updateAddress(existingAddressId, payload)` **antes** de `profile_rpc_update_business`, alterando imediatamente um endereço potencialmente compartilhado. Se a operação do broker fosse rejeitada ou sua resposta fosse perdida, o endereço antigo já estaria modificado, mesmo sem novo vínculo confirmado com a empresa.

Nesta branch, uma alteração física gera novo Address pelo **mesmo owner canônico `AddressService`**, com `owner_user_id` do ator; o broker passa a receber o novo ID e só troca a associação após confirmar a mutation. O Address anterior não sofre escrita in-place. Se a rejeição é explicitamente confirmada, a compensação atua **somente sobre o registro recém-criado**. Se o commit é incerto, mantém-se o registro staged até reconciliação, sem exclusão destrutiva. Para alteração apenas de complemento, a geolocalização já existente é lida e preservada após validar o mesmo logradouro/território, sem inventar nova proveniência; mudança de logradouro exige nova geocodificação.

**Limites importantes:** ainda há duas operações persistentes separadas, não há chave de idempotência/estado consultável no broker, a rejeição pode deixar registros órfãos se a compensação falhar, e um gestor delegado depende das políticas efetivas de Address. Não declarar essa etapa como atomicidade ACID entre Address e Business. A solução persistente definitiva continua no issue **#649** e requer backend/DB com transação versionada, RLS, permissões de gestor e reconciliação segura. Não alterar migrations ou infraestrutura nesta PR.

### Contrato de entrada: uma única origem de Address por operação

Uma mutation de Empresa não pode vincular um `address_id` existente **e simultaneamente** solicitar alteração física via rua, número, complemento, CEP/alias `cep` ou coordenadas. Antes, `syncAddress` priorizava `address_id` e ignorava silenciosamente os demais campos, criando uma falsa impressão de salvamento.

O schema canônico agora rejeita a combinação em **create** e **update**, antes de qualquer escrita. Referência isolada segue válida; atualização física isolada segue o versionamento de Address da PR #650. O cadastro exige logradouro para endereço novo; a atualização parcial pode herdar logradouro apenas quando já existe um Address, após resolver a entidade. Regressões no schema e na mutation verificam bloqueio antes do dispatch.

Esse contrato não substitui autenticação, RLS, idempotência ou atomicidade do broker. O issue #649 permanece P0 para resolução backend.

### CEP legado e consistência da geocodificação no owner de Address

**Falha concreta:** o schema aceitava `cep` como alias de `postal_code`, mas `ADDRESS_SYNC_FIELDS` e `ADDRESS_LOCATOR_FIELDS` não incluíam `cep`. Um PATCH apenas com o alias atualizava os metadados/resumo da empresa e deixava a referência Address antiga, produzindo CEPs divergentes. Além disso, dois aliases diferentes podiam ser enviados ao mesmo tempo, e o mapper escolhia um silenciosamente.

**Correção incremental:** os dois campos disparam o mesmo fluxo canônico de Address; se `cep` e `postal_code` forem informados juntos, o schema exige o **mesmo CEP numérico**, com ou sem hífen. Em mudanças de CEP, a geocodificação é renovada: um resultado cujo CEP conhecido diverge do solicitado não passa no filtro, mesmo com confiança elevada e território aparentemente correto. Onde o provedor não fornece CEP, a regra anterior de território/precisão continua aplicável.

Testes cobrem o PATCH por `cep` isolado, ausência de Address prévio, dois aliases concordantes/discordantes e geocoder com CEP conhecido divergente. O versionamento copy-on-write das PRs #650/#651 permanece o único caminho de alteração física; nenhuma nova gravação ou API paralela foi criada.

**Fronteira não resolvida:** a API não torna o Address e Business atomicamente consistentes e não introduz idempotência persistente. O issue #649 mantém essa exigência P0.
