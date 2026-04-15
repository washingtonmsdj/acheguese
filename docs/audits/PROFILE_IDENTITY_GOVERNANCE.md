# Governanca de Identidade de Profile

## Objetivo
Definir o contrato vivo de identidade do ecossistema em torno de `profile`.

Este documento consolida:
- dados publicos vs privados
- `username` e namespace publico
- reputacao
- plano
- preferencias
- entidades vinculadas
- permissoes
- rotas publicas e privadas
- ponto de gestao administrativa

## SSOT atual
- Servico principal: `src/core/profiles/services/ProfileService.ts`
- Multi-profile: `src/core/profiles/services/multi-profile/profileService.ts`
- Entidade derivada de familia: `src/core/family/services/FamilyService.ts`
- Hook canonico de edicao privada: `src/core/profiles/hooks/useProfileEditor.ts`
- URL publica canonica: `src/core/profiles/utils/publicProfileUrl.ts`
- URL privada canonica de edicao: `buildProfileEditUrl(profileId)`
- Regras de dominio ja extraidas:
  - `src/modules/profile/utils/profileDomainRules.ts`
- Tabelas canonicas de familia:
  - `family_connections`
  - `family_locations`
  - `family_location_sharing_settings`
  - `family_geofences`
  - `family_location_alerts`
- Roteamento publico:
  - perfil publico pessoal: `/u/:username`
  - premium business: `/p/:slug`
- Cobertura administrativa oficial:
  - `src/core/admin/services/AdminProfileGovernanceService.ts`
  - `/admin/identidade`

## Modelo de identidade
### Entidade raiz
- `profile` e a entidade central de identidade.
- usuario autenticado pode operar um ou mais perfis conforme o contexto multi-profile.
- entidades como `business`, `professional`, `driver`, `family` e `members` orbitam o profile; nao substituem a identidade raiz.

### Separacao de dados
#### Publicos
- `name`
- `avatar_url`
- `bio`
- `username`
- `is_public`
- sinalizacoes publicas derivadas:
  - verificacao visivel
  - reputacao visivel
  - vinculos publicos com entidades

#### Privados
- `user_id`
- preferencias pessoais
- dados de contato nao expostos
- endereco completo e evidencias de residencia
- flags internas de moderacao/suspensao
- metadados operacionais de assinatura/permissao

### Regra
- dado privado so pode subir para superficie publica por contrato explicito do dominio.
- UI nao decide sozinha o que e publico; `ProfileService` e as regras de identidade precisam ser a fonte.

## Username e namespace
### Regra canonica
- perfil pessoal publico usa exclusivamente `/u/:username`
- business premium usa exclusivamente `/p/:slug`

### Regras operacionais
- `username` pertence ao dominio de identidade pessoal
- `slug` pertence ao dominio de business
- `userId` nao e namespace publico
- nenhuma nova rota publica de identidade pode ser aberta fora desse contrato

### Gestao administrativa necessaria
- busca por colisao e historico de `username`
- trilha de mudanca de identidade publica
- visao de impacto de rename

## Reputacao
### Fonte
- `ProfileService` e a fonte canonica de reputacao agregada do perfil
- `AdminProfileGovernanceService` decompone a reputacao administrativa por origem

### Principios
- reputacao e atributo de confianca do profile, nao da pagina
- exibicao publica depende de politica de visibilidade por origem
- origem da reputacao precisa ser auditavel por contexto:
  - agregado canonico do profile
  - mobilidade de passageiro
  - mobilidade de motorista
  - reviews de business
  - reviews profissionais

### Gestao administrativa faltante
- politica de visibilidade publica por fonte
- trilha de ajustes manuais excepcionais

## Plano
### Regra
- assinatura nao pode ficar ambigua entre usuario, perfil e entidade vinculada

### Fonte atual
- `ProfileService` trata `user_subscriptions`
- admin tambem possui `AdminSubscriptionsService`

### Decisao de governanca
- contrato administrativo deve sempre responder:
  - quem paga
  - quem consome
  - qual perfil e afetado
  - qual entidade derivada recebe beneficio

## Preferencias
### Tipos
- preferencias pessoais do usuario
- preferencias do profile
- configuracoes globais do sistema

### Regra
- essas tres camadas nao podem se misturar no mesmo formulario sem separacao explicita

### Cobertura administrativa atual
- `AdminProfileGovernanceService` expone preferencias por escopo em quatro blocos:
  - perfil publico
  - vinculos publicos
  - visibilidade de reputacao
  - notificacoes

### Gestao faltante
- ownership formal de persistencia por escopo
- historico administrativo de suporte e diagnostico

## Entidades vinculadas
### Entidades atuais
- `business`
- `professional`
- `driver`
- `family`
- `members`

### Regra
- profile continua sendo raiz de identidade
- entidades vinculadas devem ser navegaveis e auditaveis a partir do profile
- vinculo precisa ter dono administrativo claro
- `family` usa `FamilyService` como contrato canonico; page, hook e admin nao acessam as tabelas diretamente

### Gestao faltante
- painel unico de entidades ligadas ao profile
- consistencia de ownership entre admin central e dashboards especificos
- rollout da migration de `family` nos ambientes e validacao operacional do RLS

## Permissoes
### Camadas
- autenticacao
- roles administrativas
- permissoes operacionais por dominio
- capacidade derivada por tipo de perfil

### Regra
- UI nao decide permissao final
- role e capability precisam ser centralizadas em services/guards

### Gestao faltante
- historico administrativo de alteracao
- trilha administrativa formal de fontes de permissao

## Rotas
### Publicas
- `/u/:username`
- `/p/:slug`

### Privadas
- hub privado oficial: `/perfil` em `src/modules/profile/pages/PerfilHubPage.tsx`
- edicao/identidades/conta em `src/modules/profile/pages/*`
- navegacao administrativa relacionada:
  - `/admin/usuarios`
  - `/admin/roles`
  - `/admin/assinaturas`
  - `/admin/verificacoes`
  - `/admin/identidade`

### Regra
- rota publica e contrato de identidade
- rota privada e contrato operacional
- nenhuma rota legada de identidade deve voltar ao fluxo ativo

## Coverage admin atual
### Existe
- usuarios
- roles
- assinaturas
- verificacoes
- governanca de identidade em `/admin/identidade`

### Coberto nesta fase
- identidade publica x privada do `profile`
- historico e integridade de `username`
- snapshot efetivo de conta via `ProfileService`
- snapshot privado canonico do hub com profile, stats, roles, businesses, corrida ativa e verificacao
- snapshot privado canonico do editor com autorizacao, hydration, extensoes por tipo e persistencia centralizada
- entrada unica de edicao privada via `/perfil/editar/:profileId`; o hub nao renderiza mais editor paralelo
- plano atual, roles e entidades vinculadas principais
- residencia canonica primaria via `user_residences`, `addresses` e `locations`
- snapshot de permissoes efetivas via `AuthorizationEngine`
- estado persistido de notificacoes via `NotificationService`, sem defaults locais no hub privado
- persistencia correta de `username`/`handle` do perfil pessoal no fluxo privado oficial
- compatibilidade administrativa de `family`:
  - quando `family_connections` existir no ambiente, o admin le o agregado via `FamilyService`
  - quando nao existir no schema local, a lacuna fica exposta explicitamente
- hardening tecnico de `family`:
  - `FamilyService` concentra leituras, escrita, realtime, geofences, alertas e summary administrativo
  - `useFamily` consome o service canonico diretamente e nao usa `ts-nocheck`
  - `FamiliaPage` consome hook tipado e nao expone atalhos para rotas inexistentes
  - o facade legado `familyTracking` foi removido por nao haver consumidor ativo
  - o gate arquitetural bloqueia `.from(...)` nas tabelas de familia fora de `FamilyService`
  - a migration local `20260409000001_create_family_identity_ssot.sql` formaliza schema, triggers e RLS do dominio
- diagnostico administrativo de preferencias por escopo:
  - perfil publico
  - vinculos publicos
  - visibilidade de reputacao
  - notificacoes
- reputacao por origem:
  - agregado canonico do profile
  - mobilidade de passageiro
  - mobilidade de motorista
  - reviews de business
  - reviews profissionais

### Ainda nao existe de forma adequada
- aplicacao e validacao da migration de `family` nos ambientes ainda nao estao fechadas
- entidades derivadas de identidade alem de residence/family
- historico administrativo formal de permissoes efetivas por profile
- politica administrativa de ajustes manuais excepcionais em reputacao

## Execucao recomendada
1. Aplicar e validar a migration de `family` nos ambientes de desenvolvimento/homologacao.
2. Tipar `PerfilHubPage` e componentes ativos remanescentes sem `ts-nocheck`, em fases controladas.
3. Registrar historico administrativo de permissoes efetivas por profile.
4. Consolidar entidades derivadas adicionais de identidade no mesmo coverage.
5. Formalizar politica administrativa de override e ajuste excepcional de reputacao.
