# Entity Private Data SSOT

Status: vigente
Owner: Core Platform + dominios Business e Professional
Migration canonica: `20260718170000_consolidate_entity_contact_channels.sql`

## 1. Objetivo

Este contrato define onde contatos institucionais e credenciais profissionais
sao armazenados, quem pode le-los e como podem ser alterados. Ele impede que
dados privados voltem a ser copiados para Profile, `metadata`, tabelas de
dominio, busca, listagens ou snapshots anonimos.

## 2. Fontes de verdade

| Dado | SSOT de persistencia | Owner de aplicacao |
|---|---|---|
| telefone, WhatsApp e e-mail de Business/Professional | `private.entity_contact_channels` | `src/core/contact` |
| numero e UF de registro profissional | `private.professional_credentials` | `ProfessionalCredentialsService` |
| identidade publica da empresa | `public.business_data` | `src/core/business` |
| identidade publica do profissional | `public.professional_data` | `src/core/professional` |
| contato pessoal e consentimento de Profile | contrato privado de Profile | `profile-rpc` |

Contatos de uma entidade nunca usam `profiles.phone`, `profiles.whatsapp` ou
`profiles.contact_email` como fallback. Business e Professional possuem
contatos proprios, mesmo quando pertencem ao mesmo User.

## 3. Modelo

`private.entity_contact_channels` usa FKs reais e exige exatamente um owner:

- `business_id` ou `professional_id`, nunca ambos;
- um registro por entidade e tipo de canal;
- `private`: somente owner/admin;
- `authenticated`: usuarios autenticados quando a entidade esta disponivel;
- valores nao aparecem no log de auditoria.

`private.professional_credentials` possui FK unica para
`professional_data.id`. A descoberta publica recebe apenas `is_verified`; o
numero de registro e sua UF permanecem privados.

## 4. Contratos de leitura e escrita

Leitura de contato:

```text
UI -> EntityContactService -> contact-rpc -> contact_rpc_get_visible_channels
```

Escrita de contato:

```text
UI/domain owner -> EntityContactService -> contact-rpc
-> contact_rpc_patch_owned_channels -> private.entity_contact_channels
```

Credenciais profissionais:

```text
edicao do proprio Profile -> ProfessionalCredentialsService
-> professional-credentials-rpc -> RPC actor-bound
-> private.professional_credentials
```

Os brokers validam JWT com `auth.getUser`, ignoram qualquer ator fornecido pelo
cliente, aplicam rate limit e chamam somente RPCs exclusivas de `service_role`.
Ownership e derivado de `profiles.user_id` ou de `profile_members` com role
`owner`/`admin`.

Criacoes de Business e Professional tambem derivam o User da sessao. APIs de
dominio nao aceitam `userId` da UI para decidir ownership.

## 5. Projecoes publicas

- `public_professional_search` nao contem User owner, contato ou credenciais;
- browser recebe allowlist explicita de colunas de `professional_data`;
- snapshots anonimos de Business/Gastronomy retornam contato nulo;
- contato e hidratado somente depois da chamada publica, por sessao autenticada;
- `metadata` de Business e Professional possui constraint contra chaves de
  contato.

## 6. Regras obrigatorias

1. Nao adicionar coluna de contato a `business_data`, `professional_data` ou
   `profiles` para reutilizacao entre dominios.
2. Nao armazenar contato em `metadata`.
3. Nao chamar as RPCs privadas diretamente no browser.
4. Nao registrar valor de contato ou credencial em logs/auditoria.
5. Listas, busca, ranking e feed nao hidratam contatos.
6. Detalhes podem hidratar contato em uma unica chamada limitada e autenticada.
7. Novos tipos de canal exigem migration, validacao, classificacao de
   visibilidade e teste negativo de autorizacao.

## 7. Escala e operacao

Indices parciais atendem lookup por entidade e evitam duplicacao. O broker
aceita no maximo 50 entidades e tres canais por alteracao. Listagens publicas
nao fazem N+1 de contato. Para lotes autenticados, o consumidor deve usar uma
chamada `getVisible` com IDs delimitados.

Falhas de autorizacao sao fechadas. Falha no carregamento opcional de contato
nao torna a entidade publica indisponivel, mas nunca pode reutilizar PII de
Profile como fallback.

## 8. Evidencias

- `tests/security/entity-private-data-boundary-security.test.ts`;
- `tests/architecture/entity-private-data-ssot.test.ts`;
- `scripts/security/entity-private-data-exposure-probe.mjs`;
- `docs/audits/ENTITY_PRIVATE_DATA_BOUNDARY_2026-07-18.md`.
