# Decisao Canonica: Roteamento Territorial

Data: 2026-05-07
Atualizado: 2026-06-05
Status: ativo

Este documento e o SSOT de produto/SEO para rotas territoriais publicas do Achegue-se.

## Regra Principal

O Achegue-se tem quatro camadas publicas:

1. Site geral da cidade e do territorio.
2. Modulos publicos por cidade ou territorio.
3. Comunidade local por alias publico curto, quando o alias for unico.
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

## Camada 3: Comunidade

Uso: experiencia social/local, vida de bairro, feed, grupos, alertas, problemas, recomendacoes e contexto comunitario.

URL publica principal vista pelo usuario:

```text
/santa-cruz
/chapada-do-rio-vermelho
```

Rotas publicas dentro da comunidade:

```text
/santa-cruz/empresas
/santa-cruz/gastronomia
/santa-cruz/feed
/santa-cruz/grupos
/santa-cruz/problemas
```

Detalhe publico preferencial de empresa ou restaurante:

```text
/santa-cruz/padaria-do-joao
/santa-cruz/pizzaria-estrela
```

Aliases legados de detalhe, mantidos apenas para compatibilidade e redirecionamento:

```text
/santa-cruz/empresas/padaria-do-joao
/santa-cruz/gastronomia/pizzaria-estrela
```

Fallbacks tecnicos, nao preferenciais para compartilhamento:

```text
/comunidade/ba/salvador
/comunidade/ba/salvador/santa-cruz
/empresas/ba/salvador/santa-cruz/padaria-do-joao
/gastronomia/ba/salvador/santa-cruz/pizzaria-estrela
```

Regras:

- O alias curto usa a raiz do site somente quando for unico e nao colidir com rotas reservadas.
- O alias precisa ser unico em `community_public_aliases`; em caso de colisao, o sistema nao escolhe uma comunidade arbitrariamente.
- O banco continua guardando estado, cidade, territorio, tipo e comunidade como SSOT.
- Sitemap, canonical e compartilhamentos favorecem a URL curta quando houver alias unico.
- `/comunidade/:state/:city...` e `/comunidade/:communitySlug...` sao rotas tecnicas/legadas.
- A URL publica nao expoe tipo tecnico (`area`, `district`, `territorial_group`, `locality`).

## Empresa, Restaurante e Premium

Empresa e restaurante compartilham a mesma URL publica quando representam a mesma entidade:

```text
/santa-cruz/padaria-do-joao
/santa-cruz/pizzaria-estrela
```

O fallback tecnico de detalhe e:

```text
/empresas/ba/salvador/santa-cruz/padaria-do-joao
```

Detalhe antigo de gastronomia redireciona para a URL publica da empresa:

```text
/gastronomia/ba/salvador/santa-cruz/pizzaria-estrela
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
- Rotas curtas de comunidade (`/:communitySlug`, `/:communitySlug/empresas`, `/:communitySlug/gastronomia`, etc.) usam `index, follow` e canonical self quando o alias for unico.
- Detalhes de empresa/restaurante usam `/:communitySlug/:slug` quando houver alias; sem alias, usam `/empresas/:state/:city/:district/:slug`.
- Rotas legadas de detalhe redirecionam para a URL publica da entidade.
- Rotas editoriais/institucionais (`/comunicacao/...`) usam `index, follow` e canonical self quando publicas e verificadas.
- Conteudo editorial exibido dentro da comunidade aponta canonical para `/comunicacao/...`.

## Criterios Para Novas Rotas

Antes de criar uma rota nova, responder:

1. A rota e uma vitrine publica/SEO? Use prefixo de modulo direto.
2. A rota e social/comunitaria com alias unico? Use `/:communitySlug`.
3. A rota e fallback tecnico comunitario? Use `/comunidade/...`.
4. A rota e editorial/institucional de canal territorial? Use `/comunicacao/...`.
5. A rota e operacional para dono/motorista/motoboy/profissional/canal? Use `/central`.
6. A rota e configuracao de identidade pessoal? Use `/conta`.
7. A rota e mini-site premium de empresa? Use `/p/:slug`.

## Status de Fechamento

- Runtime de URL curta de comunidade, listagens e detalhe `/:communitySlug/:slug` fechado em testes unitarios de roteamento.
- Sitemap dinamico do app e Edge Function prioriza alias curto quando houver alias unico e usa fallback tecnico quando necessario.
- E2E amplo pode ser ampliado por fluxo de produto, mas nao e pre-requisito para o contrato SSOT de URL.
