# Pagina `/comunicacao` - Objetivo e Produto

Status: atualizado em 2026-05-15
Fonte canonica: `docs/COMUNICACAO_TERRITORIAL_ARCHITECTURE.md`

## Objetivo

A pagina `/comunicacao` deve ser a porta de entrada para descoberta de agentes de comunicacao do territorio.

Ela deve listar e organizar:

- portais locais;
- midias comunitarias;
- paginas de bairro;
- coletivos;
- radios;
- jornais regionais;
- agentes culturais/comunicadores;
- canais de utilidade publica validados.

Ela nao deve ser tratada como:

- diretorio de empresas comuns;
- feed social paralelo;
- clone de Instagram;
- CRUD publico de negocios.

## Papel no Ecossistema

`/comunicacao` resolve descoberta institucional/editorial.

`/comunidade` resolve consumo social/contextual do territorio.

Fluxo esperado:

1. Canal publica conteudo pela central.
2. Conteudo fica no feed/pagina do canal.
3. Conteudo tambem aparece na aba `Comunicacao` da comunidade relacionada.
4. Materia/reportagem abre no canal.
5. Postagem comum com texto/fotos pode ser consumida dentro da comunidade.

## O Que a Landing Deve Entregar

Prioridade P0:

- listar canais ativos;
- permitir descoberta por cidade/territorio;
- mostrar publicacoes recentes;
- deixar claro que canal de comunicacao nao e empresa comum;
- orientar solicitacao de canal.

Prioridade P1:

- estatisticas reais por territorio;
- canais em destaque por relevancia local;
- publicacoes agrupadas por tipo;
- links para comunidades relacionadas;
- filtros por midia, coletivo, radio, portal e utilidade publica.

Prioridade P2:

- ranking/trending territorial;
- recomendacao contextual por residencia/interesse;
- analitica publica de confiabilidade;
- onboarding guiado para comunicadores.

## Diferenca de Clique

`article`:

- representa materia, reportagem ou cobertura editorial;
- clique leva para canonical em `/comunicacao/...`;
- deve preservar autoria e contexto do canal.

`update`:

- representa postagem comum de canal;
- pode abrir inline na aba `Comunicacao` da comunidade;
- nao precisa sempre levar o usuario para o feed do canal.

## Estado Atual

Implementado:

- landing publica;
- hubs por cidade e territorio;
- pagina publica do canal;
- formulario de solicitacao;
- central de publicacao;
- admin de aprovacao e territorios;
- publicacoes com tipo editorial e territorio autorizado.

Ainda pendente para cumprir a visao completa:

- `content_format` (`article`/`update`);
- distribuicao formal para comunidade;
- aba `Comunicacao` na comunidade;
- cards com comportamento diferente por formato;
- relevancia/trending territorial;
- canonical resolvido pelo territorio primario real do canal.

## Proxima Implementacao Recomendada

Executar `docs/COMUNICACAO_DISTRIBUICAO_TERRITORIAL_PLANO.md`.

