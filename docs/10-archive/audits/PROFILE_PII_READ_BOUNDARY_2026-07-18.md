# Profile PII Read Boundary - 2026-07-18

Status: concluido e aplicado no Supabase remoto.

## Problema confirmado

A chave publica conseguia selecionar todas as colunas de `profiles`. Em uma
amostra de 100 perfis ativos, a prova encontrou 14 telefones, 13 WhatsApps e 30
e-mails de contato. A view `public_profiles` excluia PII, mas nao protegia a
tabela base porque duas policies publicas e grants integrais continuavam ativos.

Classificados tambem incluia telefone e WhatsApp do vendedor em toda listagem,
mesmo quando a tela nao precisava desses dados.

## Correcao

- removidas as duas policies publicas redundantes;
- criada uma unica policy para perfil ativo e publico;
- excluidos perfis suspensos da policy e da view publicas;
- removido `SELECT` integral de `anon` e `authenticated`;
- concedida allowlist de colunas sem contato, endereco exato ou estado de corrida;
- mantida `public_profiles` como projecao publica territorial PII-free;
- criados RPCs exclusivos de `service_role` para perfis acessiveis e contato;
- estendido `profile-rpc` com JWT, ator verificado, rate limit e auditoria;
- removido contato do read model generico de Classificados;
- leitura administrativa de contato migrou para lote autorizado pelo broker;
- lista administrativa de suspensoes migrou para IDs limitados e lote privado;
- corrigido o regex de UUID do broker, que rejeitava UUIDs validos;
- limitado o leitor privado a IDs ou usuario-alvo, no maximo 100 IDs, e a
  proprietarios, gestores (`owner`/`admin`) ou administradores da plataforma.
- revogados do browser `location_id` e `main_territory_location_id`, pois os
  identificadores brutos podem revelar a residencia mesmo quando a exibicao
  publica estiver configurada como `hidden` ou `city_only`;
- `public_profiles.location_id` agora e uma projecao consentida: `NULL` para
  `hidden`, cidade para `city_only` e bairro para `district`.
- `hidden` tambem anula cidade, bairro e estado derivados; a regra e
  deny-by-default para qualquer valor desconhecido de visibilidade.
- `public_profiles` permanece `security_invoker`; a derivacao da residencia
  passa pela RPC publica minima `profile_public_territory_projection`, que
  reaplica ativo/publico/nao suspenso e nunca retorna endereco ou residencia.

## Prova remota

`npm run security:profiles:pii-probe` passou:

- projecao de PII anonima: negada;
- projecao de PII autenticada: negada;
- `public_profiles`: leitura segura permitida e coluna `phone` inexistente;
- IDs territoriais brutos em `profiles`: negados para anonimo e autenticado;
- perfil com visibilidade `hidden`: sem ID, cidade, bairro ou estado publicos;
- boundary territorial publica: executavel sem acesso direto a
  `user_residences`;
- join de contato em Classificados: negado;
- contato do proprio perfil via broker: permitido;
- chamada privada sem escopo: negada.

Nenhum valor de PII e impresso pelo probe. Migrations aplicadas:
`20260718100000_harden_profile_pii_read_boundaries.sql`,
`20260718110000_tighten_profile_private_broker_scope.sql` e
`20260718120000_enforce_profile_location_visibility.sql`, complementada por
`20260718130000_enforce_hidden_profile_location_projection.sql` e
`20260718140000_add_public_profile_territory_boundary.sql`.

## Rollback

Rollback nao deve restaurar grants integrais nem telefone em payload publico.
Se o broker falhar, a degradacao aceita e ocultar o CTA externo e manter o chat
interno; reabrir `profiles(*)` para o browser nao e rollback valido.
