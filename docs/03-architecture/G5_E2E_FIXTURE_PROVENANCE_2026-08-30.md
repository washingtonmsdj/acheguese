# G5 — E2E fixture provenance — 2026-08-30

## Status

`fixtures/E2E sem provenance`: **CLOSED** no snapshot auditado em 2026-08-30.

Este fechamento cobre **provenance, isolamento e autoridade de mutação** dos fixtures operacionais. Ele não declara as suites E2E aprovadas, não substitui execução same-SHA e não transforma ausência de runner em PASS.

## 1. Alvo remoto fail-closed

O client administrativo de testes continua centralizado em `tests/helpers/operational-env.ts` e exige `assertApprovedOperationalMutationTarget` antes de expor service role para mutações operacionais.

As suites Playwright mutantes conhecidas continuam bloqueadas pelo `playwright.config.ts` quando o alvo remoto não é um target E2E isolado explicitamente aprovado.

Não existe segundo client administrativo de testes autorizado por este corte.

## 2. Provenance de Auth e Business

`tests/helpers/operational-env.ts` aplica automaticamente provenance técnica a identidades Auth criadas pelas suites operacionais:

- `acheguese_fixture = operational-e2e`;
- `source = e2e`;
- `source_kind = technical_fixture`.

Writes de `business_data` feitos pelo client operacional continuam recebendo:

- `metadata.source = e2e`;
- `metadata.source_kind = technical_fixture`.

O seeder `tools/seeds/seed-e2e-network.ts` mantém validação própria e se recusa a adotar Auth user ou Business sem os markers esperados.

## 3. Seeder canônico de usuário E2E

`tools/seeds/seed-e2e-users.ts` foi endurecido neste corte:

- resolve o Supabase target antes de criar o service-role client;
- exige `assertApprovedRemoteMutationTarget(config.url)`;
- removeu `E2E_ADOPT_USERNAME` e a adoção heurística de identidade existente;
- `reset`/`revoke` só atuam sobre Auth user com marker canônico `account-authenticated-e2e`;
- se o email solicitado já estiver ocupado por uma identidade não marcada, a operação falha em vez de reescrever essa identidade.

## 4. Education

`tests/helpers/education-setup.ts` não descobre mais um owner/admin arbitrário para redefinir sua senha.

Contrato atual:

1. credenciais E2E precisam ser explicitamente configuradas;
2. o Business alvo precisa possuir `metadata.source=e2e` e `metadata.source_kind=technical_fixture`;
3. quando service role está disponível, o usuário configurado precisa ser owner/admin daquele Business técnico;
4. nenhum caminho do helper usa `auth.admin.updateUserById` para alterar senha;
5. criação, publicação e cleanup de objetos Education passam pela validação do Business técnico.

O Business histórico usado pela suite Education foi verificado no remoto e possui a provenance técnica esperada. O Auth owner legado não foi reescrito apenas para produzir um marker novo.

## 5. Mobility Gate 5/6/7

A auditoria encontrou referências históricas a profiles que não eram fixtures técnicas isoladas. Essas referências foram retiradas do registry e do Gate 5.

O registry `tests/fixtures/gate6-fixtures.json` agora contém somente:

- três actors `driver` privados;
- dois actors `personal` privados usados como passageiros;
- todos com `user_id` e Auth user existentes no remoto.

A checagem ao vivo confirmou, para os cinco actors atuais:

- relation presente em `public.profiles`;
- `is_public = false`;
- tipo do profile coerente com o papel no registry;
- Auth user correspondente presente.

Nenhuma linha de aplicação ou Auth user foi criada, apagada ou alterada no remoto para produzir essa reconciliação; a correção foi feita nas referências versionadas.

## 6. Autenticação de actors dos Gates

`tests/helpers/auth-helper.ts` não redefine mais senha de profile descoberto.

Para actors Mobility:

1. o profile precisa estar registrado em `gate6-fixtures.json`;
2. drivers precisam continuar `profile_type=driver`;
3. passageiros precisam continuar `profile_type=personal`;
4. o profile precisa continuar privado;
5. o Auth user precisa existir;
6. a sessão técnica é obtida por magic-link administrativo e `verifyOtp`, sem mudança de senha;
7. a identidade devolvida pela sessão precisa corresponder ao `user_id` do profile registrado.

`tests/helpers/gate6-setup-helpers.ts` autentica/valida o driver **antes** do primeiro `upsert` em `driver_data`, evitando que um UUID arbitrário seja mutado antes da rejeição.

## 7. Pricing runtime

O antigo helper que selecionava o “primeiro admin ativo” foi aposentado.

`PricingService.runtime.test.ts` agora só habilita o runtime quando `E2E_ADMIN_EMAIL` e `E2E_ADMIN_PASSWORD` estão explicitamente configurados. O helper autentica exatamente essa identidade e valida que ela possui role admin/super-admin ativa e não revogada antes de retornar o profile usado pelo teste.

## 8. Ratchet

`tests/security/remote-e2e-mutation-safety-contract.test.ts` protege o contrato acumulado:

- target administrativo isolado;
- markers de Auth/Business;
- seeders fail-closed;
- Education sem password reset e limitada a Business técnico;
- Mobility sem os profiles não-técnicos aposentados;
- autenticação Mobility por registry técnico/magic-link;
- validação do driver antes do primeiro write de setup;
- Pricing com admin explicitamente configurado.

## 9. Escopo que permanece fora deste fechamento

Este item não afirma:

- que Playwright/Vitest executou no HEAD atual;
- que CI hosted está saudável;
- que todo dado de teste antigo já foi fisicamente removido do ambiente;
- que testes de carga, estabilidade ou cleanup pós-crash estão certificados.

Esses pontos pertencem à execução/certificação G6/G7 ou a uma limpeza operacional com provenance própria. O requisito G5 fechado aqui é que os fixtures ativos e os caminhos de mutação E2E tenham owner, marker/registry e fail-closed boundary conhecidos.

## 10. Evidência de execução deste corte

Nenhum DDL e nenhuma mutação de dados/Auth foram executados no Supabase durante esta reconciliação. O banco remoto foi consultado somente para classificar provenance e validar os actors escolhidos.

GitHub Actions associado ao HEAD do checkpoint não apresentou workflow de PR observável no momento da consulta. Portanto o estado de CI continua **não certificado**, nunca inferido como PASS.
