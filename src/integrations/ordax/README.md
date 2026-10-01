# Integração OrdaX

Este diretório é o boundary do Achegue-se para a OrdaX.

Ele **não** contém cliente Supabase da OrdaX, credencial `service_role`, refresh token
ou acesso a tabelas internas da OrdaX.

## Autoridade

- a identidade interna do Achegue-se continua sendo `User -> Profile`;
- a identidade profissional externa autorizada é um `OrdaX Space`;
- o vínculo é `Achegue-se Profile -> OrdaX Space`;
- autorização ocorre por OAuth da OrdaX e é concluída no backend;
- o browser recebe somente estado sanitizado do vínculo e URLs de autorização
  emitidas pelo backend do Achegue-se;
- tokens da OrdaX pertencem ao secret owner server-side e nunca entram em
  `localStorage`, React state persistido, telemetry ou tabelas públicas.

## Mensagens

A capability horizontal `messaging` continua com seus providers atuais.

Um futuro `OrdaXMessagingProvider` somente pode ser registrado quando:

1. a OrdaX Network tiver API pública estável e autorização por Space;
2. o Achegue-se possuir bridge server-side autenticado;
3. leitura/escrita usarem scopes mínimos;
4. testes negativos provarem que um Profile não consegue usar Space de outro usuário;
5. não houver dual-write de mensagens entre bancos.

Até lá, não registrar provider fictício nem fallback para Business Messaging.
