# Decisao Canonica: Roteamento Territorial

Data: 2026-05-07
Status: ativo

Este documento define a separacao entre site publico de cidade, modulos publicos e experiencia de comunidade. Use como SSOT de produto/SEO antes de criar ou alterar rotas territoriais.

## Regra Principal

O Achegue-se tem quatro camadas publicas:

1. Site geral da cidade.
2. Modulos publicos por cidade ou territorio.
3. Comunidade local por territorio (slug publico unico por cidade).
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
- `/ba/salvador/:grupo` representa um grupo territorial, como o Complexo.

## Camada 2: Modulos Publicos

Uso: vitrine/listagem transacional e SEO por modulo.

Rotas canonicas:

```text
/empresas/ba/salvador
/servicos/ba/salvador
/classificados/ba/salvador
/gastronomia/ba/salvador

/empresas/ba/salvador/nordeste-de-amaralina
/servicos/ba/salvador/nordeste-de-amaralina

/empresas/ba/salvador/complexo-do-nordeste-de-amaralina
/servicos/ba/salvador/complexo-do-nordeste-de-amaralina
```

Papel:

- Cidade: listagem ampla do modulo na cidade.
- Bairro/grupo: listagem publica filtrada por territorio, util para SEO e descoberta direta.
- Grupo territorial usa slug publico direto no mesmo padrao `/:state/:city/:territorySlug`.
- Essas rotas nao devem tentar substituir o feed comunitario.

Regra de titulo SEO:

```text
Hub:     Territorio | Achegue-se
Modulo:  Achegue-se Territorio | Modulo em Cidade
```

Exemplos:

```text
Complexo do Nordeste de Amaralina | Achegue-se
Achegue-se Complexo do Nordeste de Amaralina | Servicos em Salvador
```

## Camada 3: Comunidade

Uso: experiencia social/local, vida de bairro, feed, grupos, alertas, problemas, recomendacoes e contexto comunitario.

Rotas canonicas:

```text
/comunidade/ba/salvador
/comunidade/ba/salvador/nordeste-de-amaralina
/comunidade/ba/salvador/complexo-do-nordeste-de-amaralina

/comunidade/ba/salvador/complexo-do-nordeste-de-amaralina/feed
/comunidade/ba/salvador/complexo-do-nordeste-de-amaralina/grupos
/comunidade/ba/salvador/complexo-do-nordeste-de-amaralina/alertas
/comunidade/ba/salvador/complexo-do-nordeste-de-amaralina/problemas
```

Papel:

- A comunidade e a experiencia principal de bairro/territorio.
- Todo conteudo social deve ter territorio claro.
- Feed, grupos, alertas, problemas urbanos, eventos comunitarios, recomendacoes e achados/perdidos pertencem primeiro a esta camada.
- URL publica de comunidade nunca expoe tipo tecnico (`area`, `district`, `territorial_group`, `locality`).

## Rotas de Modulo Dentro da Comunidade

Rotas como estas podem existir:

```text
/comunidade/ba/salvador/complexo-do-nordeste-de-amaralina/empresas
/comunidade/ba/salvador/complexo-do-nordeste-de-amaralina/servicos
/comunidade/ba/salvador/complexo-do-nordeste-de-amaralina/classificados
```

Mas o papel delas e diferente das rotas publicas diretas:

- `/empresas/...`: vitrine publica e SEO.
- `/comunidade/.../empresas`: visao contextual da comunidade, com navegacao comunitaria, sinais sociais e retorno ao bairro.

Se uma tela nao entregar contexto comunitario adicional, ela deve preferir linkar para a rota publica direta em vez de duplicar experiencia.

## Camada 4: Comunicacao Territorial

Uso: camada editorial/institucional para canais comunitarios confiaveis, noticias hiperlocais, utilidade publica e alertas autorizados.

Rotas canonicas:

```text
/comunicacao
/comunicacao/ba/salvador
/comunicacao/ba/salvador/nordeste-de-amaralina
/comunicacao/ba/salvador/complexo-do-nordeste-de-amaralina
/comunicacao/ba/salvador/complexo-do-nordeste-de-amaralina/:channelSlug
```

Papel:

- `/comunicacao/...` e editorial/institucional.
- `/comunidade/...` e social/comunitario.
- Um canal de comunicacao nao e usuario comum nem empresa.
- Publicacoes institucionais podem aparecer no feed comunitario, mas a URL canonica do conteudo editorial deve pertencer a `/comunicacao/...`.
- Alertas institucionais exigem verificacao, permissao territorial e controle de reputacao.

Contrato detalhado: [COMUNICACAO_TERRITORIAL_ARCHITECTURE.md](./COMUNICACAO_TERRITORIAL_ARCHITECTURE.md).

## SEO e Canonical

- Rotas publicas de modulo (`/empresas/...`, `/servicos/...`, `/classificados/...`) usam `index, follow` e canonical self.
- Rotas comunitarias com conteudo social proprio (`/comunidade/...`, `/feed`, `/grupos`, `/alertas`, `/problemas`) usam `index, follow` e canonical self.
- Rotas editoriais/institucionais (`/comunicacao/...`) usam `index, follow` e canonical self quando publicas e verificadas.
- Rotas de modulo embutidas dentro da comunidade (`/comunidade/.../empresas`, `/servicos`, `/classificados`, etc.) usam `noindex, follow` e canonical para a rota publica equivalente enquanto nao tiverem conteudo comunitario exclusivo suficiente.
- Conteudo de comunicacao exibido dentro de `/comunidade/...` deve apontar canonical para `/comunicacao/...` quando for apenas espelho editorial.

## Decisao de Produto

O site geral nao deve ser somente a comunidade. A cidade precisa ter uma vitrine publica ampla para descoberta, SEO e entrada de visitantes.

A comunidade deve ser a experiencia mais forte para bairro/grupo, especialmente para moradores autenticados ou visitantes que querem acompanhar a vida local.

Portanto:

- Manter rotas diretas por cidade para modulos publicos.
- Manter rotas diretas por bairro/grupo quando houver valor de SEO/listagem territorial.
- Fortalecer `/comunidade/...` como cockpit social do territorio.
- Evitar telas duplicadas sem diferenca clara de contexto.

## Criterios Para Novas Rotas

Antes de criar uma rota nova, responder:

1. A rota e uma vitrine publica/SEO? Use prefixo de modulo direto.
2. A rota e social/comunitaria? Use prefixo `/comunidade`.
3. A rota e editorial/institucional de canal territorial? Use prefixo `/comunicacao`.
4. A rota e operacional para dono/motorista/motoboy/profissional/canal? Use `/central`.
5. A rota e configuracao de identidade pessoal? Use `/perfil`.
6. A rota exige dados territoriais? Deve passar por `TerritorialLayout`, `CommunityTerritorialShell` ou helper canonico de URL territorial conforme a camada.

## Pendencias

- Criar testes E2E para cidade, bairro e grupo nas rotas de comunidade.
- Revisar se `/comunidade/.../empresas` e `/comunidade/.../servicos` entregam contexto comunitario real ou apenas duplicam vitrines.
- Atualizar sitemap dinamico conectado ao banco para respeitar esta separacao em producao.
