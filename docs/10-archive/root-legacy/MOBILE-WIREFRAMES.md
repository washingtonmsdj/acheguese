# Mobile Wireframes - Achegue-se

Status: wireframes textuais, sem desenho final e sem implementacao.

## Premissas

Mobile e a experiencia principal. Cada tela deve ter:

- Territorio claro.
- Uma acao primaria.
- Poucas decisoes simultaneas.
- Caminho de volta simples.
- Estado vazio util.

Bottom navigation base:

1. Hoje
2. Explorar
3. Comunidade
4. Atividade
5. Conta

## Tela 1 - Hoje

Objetivo: dar leitura rapida do territorio.

Wireframe textual:

```text
[Top bar]
  [Territorio: Pituba v]          [Busca] [Sinal atividade]

[Busca curta]
  "O que voce procura no bairro?"

[Resumo do dia]
  "Hoje na Pituba"
  - Alerta ou aviso importante
  - Evento proximo
  - Movimento da comunidade

[Acoes rapidas]
  [Procurar] [Publicar] [Perto de mim] [Comunidade]

[Destaques]
  Card 1: postagem relevante
  Card 2: empresa/servico recomendado
  Card 3: classificado ou evento selecionado

[Continuar explorando]
  Ver tudo em Explorar

[Bottom nav]
```

Decisao:

- Home nao lista modulos.
- Home mostra sinais do territorio.

## Tela 2 - Seletor de territorio

Objetivo: trocar bairro/cidade sem perder contexto.

Wireframe textual:

```text
[Sheet inferior]
  "Onde voce quer explorar?"

  [Meu bairro]
  Pituba

  [Perto de mim]
  Usar localizacao atual

  [Recentes]
  Barra
  Rio Vermelho
  Salvador

  [Buscar bairro ou cidade]
```

Decisao:

- Troca de bairro e global.
- Preserva modo atual quando fizer sentido.

## Tela 3 - Explorar

Objetivo: descobrir qualquer coisa no territorio.

Wireframe textual:

```text
[Top bar]
  [Pituba v]                      [Conta/atividade]

[Busca grande]
  "Buscar empresas, servicos, eventos..."

[Filtros rapidos]
  [Perto de mim] [Aberto agora] [Hoje] [Mais filtros]

[Categorias]
  Comida
  Servicos
  Empresas
  Eventos
  Classificados
  Imoveis
  Vagas

[Colecoes]
  "Mais procurados no bairro"
  "Abertos agora"
  "Recomendados por moradores"

[Mapa compacto]
  Ver no mapa

[Bottom nav]
```

Decisao:

- Explorar e a porta contra excesso de modulos.
- Categorias sao organizadas por necessidade, nao por estrutura interna.

## Tela 4 - Busca digitando

Objetivo: ajudar antes de mostrar resultados.

Wireframe textual:

```text
[Busca ativa]
  "pizza"
  [Cancelar]

[Sugestoes]
  pizza perto de mim
  pizzaria aberta agora
  pizza delivery

[Categorias relacionadas]
  Restaurantes
  Promocoes
  Posts
  Eventos

[Recentes]
  farmacia
  encanador
```

Decisao:

- Busca deve orientar, nao esperar input perfeito.

## Tela 5 - Resultados de busca

Objetivo: mostrar resultados mistos sem confundir.

Wireframe textual:

```text
[Busca]
  pizza

[Escopo]
  Em Pituba     [Ampliar para Salvador]

[Abas/Grupos]
  Top resultados
  Empresas
  Posts
  Eventos
  Classificados

[Top resultados]
  Empresa: Pizzaria aberta agora
  Promocao: combo local
  Post: recomendacao de morador
  Evento: noite de pizza

[Filtros progressivos]
  [Aberto agora] [Entrega] [Ate 2km]
```

Decisao:

- Primeiro resultado e misto.
- Aprofundamento acontece por grupo.

## Tela 6 - Comunidade

Objetivo: participar da vida social local.

Wireframe textual:

```text
[Top bar]
  Comunidade da Pituba             [Busca]

[Tabs leves]
  Feed
  Grupos
  Alertas

[Composer compacto]
  "O que voce quer compartilhar?"

[Feed social]
  Postagem
  Pergunta
  Alerta
  Evento comunitario

[FAB]
  Publicar

[Bottom nav]
```

Decisao:

- Feed completo mora em Comunidade.
- Home mostra apenas amostra do feed.

## Tela 7 - Criar publicacao

Objetivo: publicar por intencao.

Wireframe textual:

```text
[Sheet ou tela]
  "O que voce quer fazer?"

  [Perguntar]
  Pedir ajuda ou recomendacao

  [Avisar]
  Alerta ou informacao importante

  [Vender]
  Criar classificado

  [Divulgar]
  Evento ou novidade local

  [Cadastrar]
  Empresa ou servico
```

Decisao:

- Usuario escolhe intencao.
- Produto escolhe formato.

## Tela 8 - Empresas

Objetivo: encontrar negocios locais.

Wireframe textual:

```text
[Top bar]
  Empresas na Pituba               [Busca]

[Filtros rapidos]
  [Aberto agora] [Perto de mim] [Bem avaliadas]

[Categorias]
  Mercado
  Farmacia
  Beleza
  Saude
  Restaurante
  Outros

[Lista]
  Card empresa
    Nome
    Categoria
    Distancia
    Aberto/fechado
    CTA: Ver / Ligar / Rota

[Mapa compacto]
```

Decisao:

- Empresas tem experiencia propria.
- Nao e apenas conteudo do feed.

## Tela 9 - Detalhe de empresa

Objetivo: decidir e agir.

Wireframe textual:

```text
[Topo]
  Foto/logo
  Nome
  Categoria
  Status: aberto agora

[Acoes principais]
  [Mensagem] [Ligar] [Rota]

[Resumo]
  Horario
  Endereco
  Avaliacao
  Descricao

[Conteudo]
  Produtos/cardapio/servicos
  Promocoes
  Avaliacoes

[Contexto local]
  Perto desta empresa
```

Decisao:

- Detalhe precisa priorizar conversao.
- Conteudo social e apoio, nao centro.

## Tela 10 - Servicos

Objetivo: resolver uma necessidade com profissional local.

Wireframe textual:

```text
[Top bar]
  Servicos na Pituba               [Busca]

[Problemas comuns]
  Casa
  Beleza
  Saude
  Aulas
  Automovel

[Filtros]
  [Atende hoje] [Perto] [Melhor avaliados]

[Lista de profissionais]
  Card prestador
    Nome
    Especialidade
    Area atendida
    CTA: Pedir orcamento
```

Decisao:

- Servicos deve falar por necessidade, nao por cadastro.

## Tela 11 - Classificados

Objetivo: comprar, vender ou anunciar localmente.

Wireframe textual:

```text
[Top bar]
  Classificados na Pituba          [Busca]

[Acoes]
  [Anunciar item]

[Categorias]
  Moveis
  Eletronicos
  Imoveis
  Veiculos
  Outros

[Filtros]
  [Mais recentes] [Ate R$] [Perto]

[Lista]
  Card item
    Foto
    Titulo
    Preco
    Bairro
    CTA: Ver detalhe
```

Decisao:

- Classificados e mercado local.
- Entra na Home somente em selecao curta.

## Tela 12 - Atividade

Objetivo: continuar o que exige resposta.

Wireframe textual:

```text
[Top bar]
  Atividade

[Tabs]
  Todas
  Mensagens
  Respostas
  Alertas

[Lista]
  Notificacao contextual
  Mensagem
  Comentario
  Atualizacao de item salvo

[Estado vazio]
  "Quando alguem responder ou interagir com voce, aparece aqui."
```

Decisao:

- Mensagens e notificacoes compartilham a mesma logica: continuidade.

## Tela 13 - Conta

Objetivo: controlar identidade e preferencias.

Wireframe textual:

```text
[Perfil compacto]
  Foto
  Nome
  @usuario
  Completar perfil

[Acoes pessoais]
  Editar perfil
  Preferencias
  Privacidade
  Notificacoes

[Gestao se aplicavel]
  Minha empresa
  Perfil profissional
  Central

[Suporte]
  Planos
  Ajuda
  Sair da conta
```

Decisao:

- Central aparece por permissao e contexto, nao como item global para todos.

## Tela 14 - Empty state generico

Objetivo: evitar sensacao de erro.

Wireframe textual:

```text
[Contexto]
  Nenhum resultado em Pituba

[Explicacao]
  "Ainda nao encontramos isso neste bairro."

[Acoes]
  Ampliar para Salvador
  Trocar bairro
  Criar publicacao pedindo recomendacao
```

Decisao:

- Empty state sempre oferece proximo passo.

## Tela 15 - Loading longo

Objetivo: impedir abandono por loading sem sentido.

Wireframe textual:

```text
[Skeleton leve]
  Conteudo anterior preservado se existir

[Mensagem apos 2s]
  "Buscando novidades em Pituba..."

[Mensagem apos 5s]
  "Esta demorando mais que o normal."
  [Tentar novamente] [Explorar categorias]
```

Decisao:

- Loading precisa virar comunicacao, nao tela parada.

