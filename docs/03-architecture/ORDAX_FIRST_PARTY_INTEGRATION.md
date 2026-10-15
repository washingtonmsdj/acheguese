# OrdaX × Achegue-se — First-party product boundary

Status: **Network multi-tenant provada; Product OAuth público ainda desativado**

Achegue-se é tratado como um produto vertical first-party do ecossistema OrdaX.
Isso não transforma Achegue-se em módulo do sistema operacional nem compartilha
banco, credenciais privilegiadas ou ownership de dados.

## Princípio permanente de produto

A integração deve preservar duas missões diferentes:

> **Achegue-se descobre e conecta. OrdaX organiza e opera.**

Achegue-se continua sendo um produto público, territory-first, Web/SEO/discovery-first. OrdaX continua sendo a plataforma pessoal/profissional de Account, Spaces, operação privada, Network e Intelligence.

Portanto:

- Achegue-se **não** vira frontend obrigatório do OrdaX;
- OrdaX **não** absorve Mapa, Perto de mim, território ou catálogo público do Achegue-se;
- os repositórios, deploys, bancos, identidade visual, roadmaps e releases permanecem separados;
- cada produto continua funcional sem o outro nas suas capacidades básicas;
- integração acontece somente por OAuth/API/eventos/projeções explicitamente autorizadas.

## Divisão de ownership

### Achegue-se

Permanece owner de:

- território;
- Mapa e Perto de mim;
- descoberta e Busca territorial;
- Business/página pública;
- SEO/rotas públicas;
- Education pública quando essa vertical for ativada;
- vagas/ofertas/eventos públicos quando seus owners/lifecycles forem ativados;
- Inbox/Notificações próprias do produto conforme contracts atuais.

### OrdaX

Permanece owner de:

- Account;
- Spaces;
- membership/entitlements;
- operação privada do negócio;
- Network;
- Intelligence;
- relações/portais privados e verticais operacionais quando implementados;
- People/Payments/Finance conforme owners futuros.

Uma entidade pública no Achegue-se pode estar vinculada a um Space OrdaX sem se tornar a mesma entidade física nem compartilhar banco.

## Experiência desejada

Uma empresa ou escola pode usar Achegue-se normalmente. Se quiser recursos OrdaX,
o responsável conecta explicitamente sua conta e escolhe um Space elegível.

```text
Achegue-se User/Profile
       |
       | OAuth 2.1 + PKCE + consentimento
       v
OrdaX Account -> Space
```

Para o usuário a experiência pode ser contínua. Tecnicamente, as identidades
continuam separadas e o vínculo é revogável.

## Escola

Achegue-se continua dono da página pública, território, descoberta e dados do
perfil Education. OrdaX continua dono do Account, Space, Network, Intelligence e
capabilities de plataforma.

Uma escola vinculada não é duplicada na OrdaX. O Space representa a identidade
profissional/institucional autorizada.

Dados privados escolares, como boletim, faltas individuais, responsáveis, autorizações, localização de aluno e documentos privados, **não** são projeções públicas do Achegue-se. Esses dados pertencem ao owner operacional autorizado no OrdaX e a seus portais privados quando existirem.

## Matriz de projeções futuras

A integração pode evoluir para projeções explícitas sem alterar o ownership:

| Caso | SSOT principal | Destino/uso permitido |
|---|---|---|
| página pública de empresa | Achegue-se Business | OrdaX pode vincular/deep-linkar |
| operação interna da empresa | OrdaX Space/vertical | não projetar automaticamente |
| oferta local originada no OrdaX | OrdaX owner da oferta | Achegue-se pode distribuir territorialmente |
| vaga originada no Space | OrdaX Talent/Jobs quando existir | Achegue-se pode distribuir territorialmente |
| candidatura/processo seletivo | OrdaX Talent/Jobs | permanece privado |
| escola pública | Achegue-se Education/Business público | pode linkar para Portal OrdaX |
| boletim/família | OrdaX Education | somente acesso privado autorizado |
| comunidades/diretório profissional | OrdaX Network | Achegue-se consome apenas scopes autorizados |

A existência desta matriz não ativa nenhum módulo pausado nem cria novo scope automaticamente.

## Independência operacional

Falha ou indisponibilidade do OrdaX não deve retirar do Achegue-se suas funções públicas próprias de Business, Mapa, Perto de mim e Busca. Da mesma forma, indisponibilidade do Achegue-se não deve impedir que um Space OrdaX opere internamente.

A integração deve degradar isoladamente e nunca mascarar falha com dados sintéticos ou conexão simulada.

## Sincronização

Não existe sincronização irrestrita. Somente campos públicos aprovados podem ser
projetados entre produtos. Toda projeção futura exige:

- event id imutável;
- revisão monotônica;
- idempotência;
- rejeição de revisão stale;
- source of truth explícito;
- update e revoke;
- unlink sem apagar dados que pertencem ao outro produto.

## Publicação cruzada

Uma publicação OrdaX não aparece automaticamente no Achegue-se. Para aparecer,
precisa de Space vinculado, scope de escrita, alvo explícito e ingest server-side
do Achegue-se.

O inverso segue a mesma regra. Cada produto mantém seu próprio histórico de
notificações e preferências; a ponte transporta eventos autorizados, não tabelas.

A publicação futura de ofertas, vagas ou eventos deve ser uma projeção versionada e revogável. Ela não transforma o Achegue-se em reader direto do banco operacional do Space.

## Segurança

Proibido:

- compartilhar senha;
- compartilhar `service_role`;
- importar o client Supabase da OrdaX;
- consultar tabelas OrdaX diretamente;
- criar foreign key entre bancos;
- espelhar todo conteúdo automaticamente;
- usar fallback/mocks que façam a UI parecer conectada sem OAuth/API real;
- projetar para superfícies públicas boletim, prontuário, localização de criança, Memory, mensagens privadas, folha, financeiro interno ou documentos privados;
- usar dados escolares, de saúde, de menores ou relações privadas para segmentação publicitária.

Contrato executável:
`src/integrations/ordax/boundary.ts`.

Contrato de arquitetura:
`docs/contracts/ordax-first-party-integration.json`.

A prova multi-tenant da OrdaX Network já foi concluída no OrdaX. O gate restante é
o Product OAuth público: o provider possui autoridade persistente e boundary HTTP
em source, mas o cliente `acheguese-web-01` continua desativado, sem redirect HTTPS
registrado e sem listener público habilitado.

O Achegue-se já possui primitivas server-side fail-closed em
`supabase/functions/_shared/ordaxProductOAuth.ts`: state aleatório, PKCE S256,
validação estrita de issuer/redirect, exchange e revogação. Elas não habilitam o
runtime por presença de source e não expõem tokens ao browser.

## Ordem futura de rollout

O rollout não começa antes dos gates atuais do MVP Achegue-se e da janela apropriada do OrdaX.

Quando promovido, a ordem recomendada é:

1. registrar redirect HTTPS real e manter scopes mínimos;
2. provar linking real com duas contas e múltiplos Spaces;
3. UX de conectar/desconectar Space;
4. read-only Network/directory/comunidades;
5. somente depois definir scopes de escrita específicos;
6. publication adapters separados para ofertas, vagas, eventos ou outras projeções;
7. update/revoke e auditoria antes de qualquer rollout amplo.

Não habilitar write scopes antecipadamente "para deixar pronto".

## Client e audience

O identificador lógico first-party no Achegue-se é `acheguese`; o registro OAuth real no OrdaX é `acheguese-web-01`. A audience esperada continua sendo
`ordax:first-party:acheguese`.

Todo vínculo persistível deve carregar e validar ambos. Um token/conexão emitido
para Product MCP, outro produto ou outra audience não pode ser reinterpretado
como autorização do Achegue-se.

Isso preserva a possibilidade de um mesmo emissor OrdaX atender produtos
diferentes sem compartilhar autoridade entre eles.

## Escopos do primeiro rollout OAuth

Embora o boundary de produto conheça escopos futuros adicionais, o registro OAuth
atual do OrdaX permite inicialmente somente:

- `network.space.read`;
- `network.directory.read`;
- `network.communities.read`.

O client server-side não solicita `network.messages.read`, escrita ou publicação
enquanto o provider não registrar e provar esses escopos para o cliente do
Achegue-se. Não existe promoção automática de escopo.

## Resource server read-only

O provider OrdaX já possui uma boundary read-only provada para os três scopes
iniciais. O Achegue-se mantém primitivas server-side correspondentes em
`supabase/functions/_shared/ordaxProductNetwork.ts`, ainda sem runtime público.

As únicas rotas conhecidas por esse client são:

- `GET /product/network/v1/space`;
- `GET /product/network/v1/directory`;
- `GET /product/network/v1/communities`.

O resource origin é configuração server-side própria e não é inferido do issuer
OAuth. O bearer token fica somente no header `Authorization`; não entra em URL,
query, storage do browser ou payload de banco. Respostas são validadas contra os
schemas provider-owned antes de serem aceitas.

A presença desse source não ativa conexão. O runtime continua fechado até o
OrdaX registrar o redirect HTTPS real, habilitar o client `acheguese-web-01` e
provar o linking real previsto em #917.

## Referência de planejamento no OrdaX

A direção cross-product está preservada no plano `00-PLANOS-PRIORITARIOS/plans/ACHEGUESE-001-FIRST-PARTY-PRODUCT-INTEGRATION.md` do repositório `ordaxsystems/ordax-os`.

Esse plano não é autoridade sobre o Achegue-se. Este documento e os contracts executáveis do próprio Achegue-se continuam governando este lado da integração.
