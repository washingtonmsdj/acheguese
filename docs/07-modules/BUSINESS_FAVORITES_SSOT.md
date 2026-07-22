# Business Favorites SSOT

Status: canonical
Data: 2026-07-14
Finding encerrado: CP-005

## Decisao

`public.user_favorite_businesses` e a unica persistencia de favoritos de
Empresa. O favorito pertence a conta autenticada (`auth.users.id`) e aponta
para a identidade empresarial (`business_data.id`). Ele nao pertence ao
Profile ativo e nao e especifico de Gastronomia.

Por essa semantica, renomear `user_*` para `profile_*` seria incorreto no
modelo atual. Uma mudanca futura de ownership para Profile exige ADR, regra de
compartilhamento entre Profiles e migracao explicita; nao pode ser uma troca
cosmetica de nome.

## Ownership

```text
UI / hook de Empresas ou Gastronomia
  -> BusinessFavoriteService (policy adapter de Business)
    -> BusinessFavoriteStore (owner de persistencia em core/favorites)
      -> RPC autenticada
        -> user_favorite_businesses / trigger de contador / audit privado
```

- `BusinessFavoriteStore` e o unico chamador das RPCs e deriva tipos do schema
  Supabase gerado.
- `BusinessFavoriteService` expoe a linguagem do dominio de Empresas e nao
  acessa Supabase.
- Gastronomia compoe o read model culinario e a URL, mas nao le nem escreve a
  tabela de favoritos.
- `businessFavoriteKeys` e a raiz unica de cache e invalidacao.

## Contrato de banco

| Funcao | Responsabilidade |
| --- | --- |
| `get_current_user_business_favorites` | pagina registros proprios, limite 1..100 e offset limitado |
| `get_current_user_business_favorite_ids` | retorna estado para ate 100 empresas visiveis |
| `is_current_user_business_favorite` | consulta pontual propria |
| `set_current_user_business_favorite` | define estado desejado de forma idempotente e serializada |
| `patch_current_user_business_favorite` | altera preferencias sem sobrescrever campos omitidos |

Nenhuma funcao recebe `user_id`. O comando `set` usa lock transacional por
conta/empresa e `ON CONFLICT DO NOTHING`, portanto retry com o mesmo estado nao
inverte o resultado. Favoritar exige empresa ativa; remover continua possivel
por ID.

O browser nao possui `SELECT`, `INSERT`, `UPDATE` ou `DELETE` direto na tabela.
RLS de leitura propria permanece como defesa adicional contra concessao
acidental futura. Notas tem no maximo 500 caracteres; tags aceitam no maximo
10 itens de 1 a 32 caracteres e sao normalizadas no backend.

## Auditoria e privacidade

`private.business_favorites_audit_log` registra ator, owner, empresa, acao e
nomes dos campos alterados. Valores de notas e tags nao sao copiados para o
audit. `anon` e `authenticated` nao leem essa tabela.

O contador publico continua em `business_data.favorites_count` e e mantido
pelo trigger de `user_favorite_businesses`. O RPC antigo de contagem foi
removido porque nao tinha consumidor.

## Remocao do legado

A pre-auditoria remota encontrou:

- 8 registros canonicos, todos unicos e sem orfaos;
- zero registros em `business_favorites`;
- nenhuma relacao dependente da tabela antiga.

A migration `20260714123000` aborta se a tabela antiga contiver dados e a
remove sem `CASCADE`. Os RPCs com `p_user_id` e o contador sem consumidor
tambem foram removidos. O schema gerado nao contem esses contratos.

## Evidencias

- `tests/security/business-favorites-preflight-remote-audit.sql`
- `tests/security/business-favorites-remote-audit.sql`
- `tests/security/business-favorites-remote-probe.sql`
- `tests/security/business-favorites-consolidation-security.test.ts`
- `docs/architecture/core-platform-ownership.json`

O probe remoto termina em `ROLLBACK` e cobre create/remove repetidos, batch,
patch parcial, normalizacao, bloqueio de acesso direto e audit sem valores.

## Limites conscientes

- A lista detalhada de favoritos ainda usa offset; keyset deve ser adotado
  quando a pagina ganhar scroll infinito ou telemetria indicar volume alto.
- O batch de vitrine aceita ate 100 IDs por chamada. Superficies maiores devem
  paginar a entidade, nao ampliar silenciosamente o limite.
- Favoritos de Post, Evento, Classificado e Profile permanecem agregados
  distintos. Compartilhar o conceito nao autoriza tabela polimorfica.
