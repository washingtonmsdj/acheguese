# OrdaX × Achegue-se — First-party product boundary

Status: **arquitetura adotada; runtime ainda desativado**

Achegue-se é tratado como um produto vertical first-party do ecossistema OrdaX.
Isso não transforma Achegue-se em módulo do sistema operacional nem compartilha
banco, credenciais privilegiadas ou ownership de dados.

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

## Segurança

Proibido:

- compartilhar senha;
- compartilhar `service_role`;
- importar o client Supabase da OrdaX;
- consultar tabelas OrdaX diretamente;
- criar foreign key entre bancos;
- espelhar todo conteúdo automaticamente;
- usar fallback/mocks que façam a UI parecer conectada sem OAuth/API real.

Contrato executável:
`src/integrations/ordax/boundary.ts`.

Contrato de arquitetura:
`docs/contracts/ordax-first-party-integration.json`.

O runtime só pode ser ativado depois da prova multi-tenant da OrdaX Network e de
um OAuth/API de produto real.


## Client e audience

O cliente first-party canônico é `acheguese` e a audience esperada é
`ordax:first-party:acheguese`.

Todo vínculo persistível deve carregar e validar ambos. Um token/conexão emitido
para Product MCP, outro produto ou outra audience não pode ser reinterpretado
como autorização do Achegue-se.

Isso preserva a possibilidade de um mesmo emissor OrdaX atender produtos
diferentes sem compartilhar autoridade entre eles.
