# Contrato de Identidade: UserId vs ProfileId

**Atualizado:** 2026-09-18  
**Status:** contrato ativo

Este documento define a fronteira de identidade entre conta autenticada e perfil
de domínio. Ele descreve o estado atual; histórico de migração fica em
`docs/08-roadmap/checkpoints` e `docs/10-archive`.

## Autoridades canônicas

A sessão autenticada pertence a:

- `src/core/session/services/SessionService.ts`;
- `src/core/session/state/SessionState.ts`;
- `src/core/session/providers/SessionProvider.tsx`;
- `src/core/session/hooks/useSessionContext.ts`.

O shape de perfil exposto pela sessão é
`src/core/profiles/views/SessionProfileView.ts`. Ele usa camelCase e contém
`id` como ProfileId e `userId` como UserId.

A projeção multi-profile em
`src/core/profiles/contexts/multi-profile-runtime-context.tsx` é uma projeção
rica para UI e contexto de módulo. Ela não é um segundo owner de autenticação:
trocas de perfil persistentes delegam a `SessionService.switchProfile()`.

## UserId

Use UserId para identidade de conta e operações ligadas a `auth.users`.

Exemplos:

- autenticação e sessão;
- roles globais;
- preferências globais de conta;
- auditoria técnica da conta;
- relação usuário → perfis;
- operações cuja autoridade backend é vinculada diretamente ao usuário
  autenticado.

Nunca use UserId como substituto de ProfileId em ownership de entidades de
domínio.

## ProfileId

Use ProfileId para identidade de perfil e ownership de entidades de domínio.

Exemplos:

- autoria de posts e comentários;
- membership e moderação contextual;
- perfis Business/Professional/Driver;
- favoritos e interações quando o contrato é profile-scoped;
- entidades cujo FK aponta para `profiles.id`.

Quando uma operação protegida puder derivar o ator no backend, o browser não
deve enviar `actor_user_id` ou `actor_profile_id` como autoridade. O backend
deve resolver e validar o ator autenticado.

## Shapes

### Sessão

`SessionProfileView` é o shape canônico de perfil dentro da sessão:

- `id` → ProfileId;
- `userId` → UserId;
- `profileType`;
- `displayName`;
- `username`;
- `avatarUrl`;
- campos territoriais e de estado necessários à sessão.

Não redefinir esse shape dentro de `core/session`.

### Multi-profile

Os contratos em `src/core/profiles/services/multi-profile` preservam o shape
necessário às superfícies multi-profile. Eles podem usar naming diferente do
`SessionProfileView`, mas não podem criar uma segunda sessão nem persistir
troca de perfil fora de `SessionService`.

## Branded types

`src/core/session/types/strict.ts` disponibiliza:

- `UserId`;
- `ProfileId`;
- `toUserId()`;
- `toProfileId()`.

A adoção é incremental. Esses tipos devem ser preferidos em boundaries novos ou
refatorados quando ajudam a impedir troca acidental entre IDs.

## Regras de implementação

1. `useSessionContext` é a API React canônica para identidade autenticada.
2. `useActiveProfile`, `useProfiles`, `useAuthContext` e `AuthProvider`
   foram aposentados e não podem retornar ao source ativo.
3. Não inferir autorização a partir de tipo de perfil no frontend.
4. UI pode usar capability preview apenas para visibilidade; comando protegido
   depende da autorização backend.
5. Não confundir `auth.users.id` com `profiles.id`.
6. Nomes de campos devem explicitar a identidade quando houver ambiguidade:
   `userId`, `profileId`, `authorProfileId`, etc.
7. Não manter shims ou aliases antigos depois do cutover.

## Guardrails

- `tools/architecture/validate-session-context.ts`;
- `tests/architecture/session-ssot-ownership.test.ts`;
- `tests/architecture/active-profile-canonical-owner.test.ts`;
- regras `session-context/*` em `eslint.config.js`.

Esses guardrails impedem a reintrodução de owners de sessão paralelos,
identificadores ambíguos e hooks de perfil aposentados.
