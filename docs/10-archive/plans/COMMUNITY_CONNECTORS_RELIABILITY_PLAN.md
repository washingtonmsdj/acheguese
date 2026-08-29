# Community Connectors Reliability

Status: concluido em 2026-07-13
Data: 2026-07-13
Responsavel: Comunidades / Notificacoes

## Objetivo

Fazer com que efeitos internos derivados de interacoes sociais da Comunidade
sejam consistentes com a mutacao que os originou. O navegador nao pode ser
responsavel por criar notificacoes de outro usuario.

## Fonte de verdade e fronteiras

- Escritas de post, comentario e reacao: tabelas canonicas `posts`,
  `comments` e `post_likes_new`, protegidas por RLS e guards do banco.
- Notificacao in-app: `notifications` e `notification_preferences`.
- Identidade: `profiles`; o cliente nunca informa o destinatario.
- Auditoria do fato de dominio: `community_social_audit_log` existente.

Nao criar um event bus generico nem uma fila sem consumidor operacional. Para
notificacoes in-app, que sao uma projecao interna no mesmo banco, a melhor
garantia e uma derivacao transacional no PostgreSQL. Um outbox so sera criado
quando houver um consumidor externo real (push, e-mail ou webhook), com
agendador, tentativas, DLQ e observabilidade definidos antes do deploy.

## Escopo

- Notificacoes in-app de like, comentario, resposta, mencao em post e mencao
  em comentario.
- Idempotencia por evento persistido e destinatario.
- Respeito a preferencias de notificacao e minimizacao de dados.
- Remocao do broker cliente-servidor legado para notificacoes sociais.
- Testes estruturais de seguranca e regressao do contrato.

## Fora de escopo

- Push, e-mail, webhooks e qualquer entrega de terceiros.
- Eventos completos, albuns, ranking e agregados publicos de membros.
- Um worker ou fila global sem SLO, credenciais e monitoramento proprios.

## Checklist

- [x] Inventariar os conectores atuais e identificar chamadas posteriores ao commit.
- [x] Criar derivacao transacional privada e gatilhos de banco para eventos sociais.
- [x] Impedir que o navegador escolha destinatario ou crie notificacao social.
- [x] Cobrir comentarios, respostas e mencoes que nao estavam conectados ao broker.
- [x] Remover o broker e os wrappers cliente-servidor obsoletos.
- [x] Corrigir a criacao de alertas para usar a auditoria canonica, inclusive
  sob requisicoes concorrentes.
- [x] Aplicar a migration no projeto Supabase remoto e executar a validacao remota.
- [x] Executar suite de tipos, testes, build e validadores de seguranca.
- [x] Atualizar o status para concluido com evidencias de validacao.

## Definicao de pronto

Uma interacao social persistida gera, no mesmo commit, no maximo uma
notificacao por destinatario e evento; eventos proprios e destinatarios sem
conta sao ignorados; preferencias sao respeitadas; nenhum identificador de
destinatario ou chave privilegiada sai do servidor; e os contratos sao
verificados por testes e migration remota.

## Evidencias

- Migrations remotas sincronizadas: 20260713150000 e 20260713151000.
- Endpoint legado community-notifications-rpc removido do projeto remoto.
- `create_community_alert` passou a usar `community_social_audit_log`, com
  serializacao por perfil, indices das verificacoes criticas e sem expor
  detalhes internos de banco.
- Typecheck, testes focados de hardening e seguranca transacional, build e
  security:validate executados apos a migracao.
