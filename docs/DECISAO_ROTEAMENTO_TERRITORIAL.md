# Decisao Canonica: Roteamento Territorial

Data: 2026-05-07
Atualizado: 2026-07-05
Status: ativo

Este documento e o SSOT de produto/SEO para rotas territoriais publicas do Achegue-se.

## Regra Principal

O Achegue-se tem quatro camadas publicas/operacionais:

1. Site geral da cidade e do territorio.
2. Modulos publicos por cidade ou territorio.
3. Portal de comunidade por rota explicita.
4. Comunicacao territorial institucional/editorial.

Essas camadas podem apontar para os mesmos dados, mas nao devem ter a mesma intencao de produto.

## Camada 1: Site Geral

Uso: porta publica ampla, SEO de cidade, descoberta inicial e navegacao institucional.

Rotas canonicas:

```text
/ba/salvador
/ba/salvador/nordeste-de-amaralina
/ba/salvador/complexo-do-nordeste-de-amaralina
```

Papel:

- `/ba/salvador` representa a cidade.
- `/ba/salvador/:bairro` representa um bairro.
- `/ba/salvador/:grupo` representa um grupo territorial.

## Camada 2: Modulos Publicos

Uso: vitrine/listagem transacional e SEO por modulo.

Rotas canonicas:

```text
/empresas/ba/salvador
/servicos/ba/salvador
/classificados/ba/salvador
/gastronomia/ba/salvador

/empresas/ba/salvador/santa-cruz
/servicos/ba/salvador/santa-cruz
/gastronomia/ba/salvador/santa-cruz
```

Papel:

- Cidade: listagem ampla do modulo na cidade.
- Bairro/grupo: listagem publica filtrada por territorio, util para SEO e descoberta direta.
- Essas rotas nao substituem a experiencia comunitaria.

Regra importante: listagem de gastronomia continua em `/gastronomia/...`, mas detalhe de restaurante nao e canonico em `/gastronomia/.../:slug`.

## Camada 3: Portal de Comunidade

Uso: experiencia social/local, vida de bairro, feed, grupos, alertas, problemas, recomendacoes e contexto comunitario.

URL principal vista pelo usuario quando ele entra no portal:

```text
/comunidade/santa-cruz
/comunidade/chapada-do-rio-vermelho
```

Rotas dentro da comunidade:

```text
/comunidade/santa-cruz/empresas
/comunidade/santa-cruz/gastronomia
/comunidade/santa-cruz/feed
/comunidade/santa-cruz/grupos
/comunidade/santa-cruz/problemas
```

Detalhe comunitario de empresa ou restaurante, apenas quando a origem for o
portal:

```text
/comunidade/santa-cruz/empresas/padaria-do-joao
/comunidade/santa-cruz/gastronomia/pizzaria-estrela
```

Aliases curtos legados, mantidos apenas para compatibilidade e redirecionamento:

```text
/santa-cruz
/santa-cruz/empresas/padaria-do-joao
/santa-cruz/gastronomia/pizzaria-estrela
/santa-cruz/padaria-do-joao
```

Rotas publicas de entidade, usadas fora da comunidade:

```text
/empresas/ba/salvador/santa-cruz/padaria-do-joao
/gastronomia/ba/salvador/santa-cruz/pizzaria-estrela
```

Regras:

- O alias curto na raiz nao e rota canonica nova; o portal comunitario canonico
  usa `/comunidade/:communitySlug`.
- O alias precisa ser unico em `community_public_aliases`; em caso de colisao, o sistema nao escolhe uma comunidade arbitrariamente.
- O banco continua guardando estado, cidade, territorio, tipo e comunidade como SSOT.
- Sitemap publico nao emite URLs de comunidade.
- `/comunidade/:communitySlug...` e a rota canonica do portal comunitario.
- `/comunidade/:state/:city...` existe como fallback tecnico quando nao ha alias
  publico unico.
- A URL do portal nao expoe tipo tecnico (`area`, `district`, `territorial_group`, `locality`).

## Empresa, Restaurante e Premium

Empresa e restaurante compartilham a mesma URL publica quando representam a mesma entidade:

```text
/empresas/ba/salvador/santa-cruz/padaria-do-joao
/empresas/ba/salvador/santa-cruz/pizzaria-estrela
```

Quando o restaurante tiver detalhe vertical proprio, a rota publica da
gastronomia tambem pode existir:

```text
/gastronomia/ba/salvador/santa-cruz/pizzaria-estrela
```

Dentro do portal de comunidade, a entidade usa rota comunitaria explicita e
canonical SEO para a rota publica equivalente:

```text
/comunidade/santa-cruz/empresas/padaria-do-joao
/comunidade/santa-cruz/gastronomia/pizzaria-estrela
```

Mini-site premium continua sendo uma camada propria:

```text
/p/padaria-do-joao
```

`/p/:slug` nao substitui a URL publica canonica da empresa. Ele existe para o mini-site premium e recursos premium.

## Camada 4: Comunicacao Territorial

Uso: camada editorial/institucional para canais comunitarios confiaveis, noticias hiperlocais, utilidade publica e alertas autorizados.

Rotas canonicas:

```text
/comunicacao
/comunicacao/ba/salvador
/comunicacao/ba/salvador/:channelSlug
```

Papel:

- `/comunicacao/...` e editorial/institucional.
- Comunidade e social/comunitaria.
- Publicacoes institucionais podem aparecer no feed comunitario, mas a URL canonica de materia/reportagem pertence a `/comunicacao/...`.

Contrato detalhado: [COMUNICACAO_TERRITORIAL_ARCHITECTURE.md](./COMUNICACAO_TERRITORIAL_ARCHITECTURE.md).
Plano de distribuicao: [COMUNICACAO_DISTRIBUICAO_TERRITORIAL_PLANO.md](./COMUNICACAO_DISTRIBUICAO_TERRITORIAL_PLANO.md).

## SEO e Canonical

- Rotas publicas de modulo (`/empresas/...`, `/servicos/...`, `/classificados/...`, `/gastronomia/...`) usam `index, follow` e canonical self para listagens.
- Rotas do portal comunitario (`/comunidade/...`) usam `noindex, follow` por
  padrao.
- Modulos publicos duplicados dentro da comunidade usam `noindex, follow` e
  canonical para a rota publica equivalente.
- Detalhes publicos de empresa/restaurante usam rota publica de modulo, como
  `/empresas/:state/:city/:territory/:slug`.
- Rotas curtas legadas nao aparecem em sitemap ou compartilhamento novo e nao
  devem ser preservadas como segunda superficie publica.
- Rotas editoriais/institucionais (`/comunicacao/...`) usam `index, follow` e canonical self quando publicas e verificadas.
- Conteudo editorial exibido dentro da comunidade aponta canonical para `/comunicacao/...`.

## Criterios Para Novas Rotas

Antes de criar uma rota nova, responder:

1. A rota e uma vitrine publica/SEO? Use prefixo de modulo direto.
2. A rota e social/comunitaria com alias unico? Use `/comunidade/:communitySlug`.
3. A rota e fallback tecnico comunitario? Use `/comunidade/...`.
4. A rota e editorial/institucional de canal territorial? Use `/comunicacao/...`.
5. A rota e operacional para dono/motorista/motoboy/profissional/canal? Use `/central`.
6. A rota e configuracao de identidade pessoal? Use `/conta`.
7. A rota e mini-site premium de empresa? Use `/p/:slug`.

## Status de Fechamento

- Runtime de entidade comunitaria nao canonica falha visivelmente em vez de
  redirecionar para `/comunidade/:communitySlug...`.
- Sitemap publico nao emite `/comunidade/...`; comunidade fica fora de
  indexacao publica e entra apenas por CTA/contexto explicito.
- E2E amplo pode ser ampliado por fluxo de produto, mas nao e pre-requisito para o contrato SSOT de URL.
