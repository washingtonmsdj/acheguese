# OrdaX Integration Boundary

Status: ADOTADO PARA INTEGRAÇÃO INCREMENTAL DO MVP  
Data: 2026-10-01

## 1. Decisão

O Achegue-se começa a integração com a OrdaX preservando os dois produtos como
bounded contexts independentes.

```text
Achegue-se
  User -> Profile
        |
        | OAuth / capability bridge
        v
OrdaX
  Account -> Space -> Network
```

O Achegue-se não acessa tabelas internas da OrdaX, não compartilha
`service_role`, não reutiliza senha e não cria foreign key entre bancos.

## 2. Ownership

Achegue-se continua dono de:

- Business / Empresas;
- território;
- Mapa;
- Perto de mim;
- Busca;
- Business Direct Messaging.

OrdaX continua dona de:

- Account;
- Space;
- Profile Packs;
- Network;
- comunidades/grupos OrdaX;
- mensagens OrdaX.

A integração não transfere ownership de agregado.

## 3. Identidade

O vínculo externo canônico é:

```text
Achegue-se Profile -> OrdaX Space
```

Um usuário do Achegue-se pode possuir vários Profiles e uma conta OrdaX pode
possuir vários Spaces. Portanto nenhum dos lados pode assumir relação 1:1 entre
contas.

O Space autorizado deve ser escolhido explicitamente durante a autorização.
Troca de Profile no Achegue-se nunca retargeta silenciosamente um Space OrdaX.

## 4. OAuth e tokens

O browser não recebe refresh token, segredo de cliente, `service_role` ou token
privilegiado da OrdaX.

Fluxo alvo:

```text
Profile autenticado no Achegue-se
 -> backend Achegue-se cria authorization request
 -> OrdaX OAuth + PKCE
 -> usuário escolhe/autoriza Space
 -> callback server-side valida state/PKCE
 -> credencial fica no secret owner server-side
 -> browser recebe somente vínculo sanitizado
```

O endpoint, issuer e scopes concretos só podem ser ativados quando publicados
pelo contrato público da OrdaX. Não inventar endpoints temporários.

## 5. Persistência local no Achegue-se

Quando implementada, a persistência do vínculo deve conter somente metadados
necessários:

- `profile_id`;
- identificador opaco do Space;
- nome de apresentação;
- permissions/scopes concedidos;
- estado do vínculo;
- timestamps.

Tokens e payload OAuth bruto ficam fora das tabelas públicas.

## 6. Mensagens

O Core Messaging mantém providers explícitos.

```text
Messaging
  -> BusinessMessagingProvider      # atual
  -> OrdaXMessagingProvider         # somente após certificação
```

Não existe tabela universal de mensagens e não existe dual-write.

Uma conversa Business continua pertencendo ao Achegue-se. Uma conversa OrdaX
continua pertencendo à OrdaX.

## 7. Falhas e disponibilidade

OrdaX indisponível:

- não derruba Home;
- não derruba Business;
- não derruba Mapa/Perto de mim/Busca;
- não invalida Business Messaging;
- exibe somente o estado real da integração.

Achegue-se indisponível não altera a identidade ou dados canônicos da OrdaX.

## 8. Gates antes de ativar

A integração online só pode ser promovida quando houver:

1. API/OAuth OrdaX estáveis;
2. scopes mínimos definidos;
3. callback server-side com state + PKCE;
4. armazenamento seguro de credencial;
5. revogação/desconexão real;
6. prova com duas contas e múltiplos Profiles/Spaces;
7. tentativa negativa de cross-Profile/cross-Space;
8. rate limit;
9. auditoria metadata-only;
10. zero acesso SQL cruzado entre produtos.

## 9. Primeira etapa implementada

Este incremento cria apenas o **boundary tipado e governança** da integração.

Ele deliberadamente não registra um provider OrdaX em Mensagens e não cria
endpoint falso. O próximo incremento depende da API Network pública e segura da
OrdaX.
