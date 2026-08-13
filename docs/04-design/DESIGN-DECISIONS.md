# Design Decisions - Achegue-se

Status: decisoes aprovadas; fundacao Territorio Vivo implementada na Home
territorial e em Explorar na Fase 4.2.

## Direcao principal

O Achegue-se segue o conceito **Territorio Vivo**: uma experiencia Hybrid com
base Territory First.

Isso significa:

- A Home comunica territorio e "hoje".
- Explorar resolve busca e descoberta.
- Comunidade concentra feed e participacao.
- Atividade concentra mensagens e notificacoes.
- Conta concentra perfil e gestao.

Nao significa escolher uma tela final. Significa escolher uma direcao de experiencia.

## Decisoes que entraram

### 1. Plataforma territorial como identidade visual

Entrou:

- Territorio como primeiro elemento de orientacao.
- Nome do bairro/cidade sempre visivel.
- Conteudos organizados por relevancia local.
- Busca sempre contextual ao territorio.

Por que:

- Diferencia o produto de rede social e marketplace.
- Ajuda o usuario a entender valor em segundos.

### 2. Home como "Hoje no seu territorio"

Entrou:

- Resumo do dia.
- Destaques mistos.
- Acoes rapidas.
- Busca.
- Caminhos para aprofundar.

Por que:

- A Home precisa responder "o que importa agora?", nao "quantos modulos existem?".

### 3. Bottom navigation com cinco modos

Entrou:

- Hoje.
- Explorar.
- Comunidade.
- Atividade.
- Conta.

Por que:

- Mobile precisa de estabilidade.
- Cinco entradas sao suficientes para dezenas de funcionalidades quando ha contexto.

### 4. Busca como mecanismo central anti-complexidade

Entrou:

- Busca global territorial.
- Resultados mistos.
- Filtros progressivos.
- Sugestoes antes de resultados.

Por que:

- O usuario nao deve saber previamente se algo esta em empresas, servicos, classificados ou eventos.

### 5. Feed dentro de Comunidade

Entrou:

- Feed completo como destino de Comunidade.
- Amostra editorial do feed na Home.

Por que:

- Mantem vida social sem transformar o produto em rede social generica.

### 6. Empresas com experiencia propria

Entrou:

- Listagem propria.
- Filtros.
- Detalhe.
- Contato.
- Rota.
- Central para dono.

Por que:

- Empresa e parte do territorio, mas precisa de conversao e gestao.

### 7. Publicacao contextual por intencao

Entrou:

- acao "Publicar" somente quando rollout, perfil e policy permitirem;
- seletor futuro por intencao: perguntar, avisar, vender, divulgar, cadastrar;
- nenhum FAB global obrigatorio na fundacao da Home/Explorar.

Por que:

- Usuario entende intencoes melhor que formatos internos, sem receber uma acao
  que nao pode executar.

### 8. Atividade unifica mensagens e notificacoes

Entrou:

- Area de continuidade.
- Abas por tipo: todas, mensagens, respostas, alertas.

Por que:

- Para o usuario, o importante e "preciso responder ou acompanhar?", nao o tipo tecnico do evento.

## Decisoes que sairam

### 1. Home como grade de modulos

Saiu:

- Cards fixos para todos os dominios.
- Uma secao para cada modulo.

Por que:

- Causa excesso.
- Faz o produto parecer super app.
- Obriga o usuario a entender a arquitetura interna.

### 2. Feed como unica Home

Saiu:

- Home 100% feed social.

Por que:

- Reduz o produto a rede social.
- Enfraquece empresas, servicos, busca e resolucao pratica.

### 3. Mapa como primeira experiencia obrigatoria

Saiu:

- Mapa full-screen como Home padrao.

Por que:

- Forte para proximidade, mas pesado para todos os casos.
- Nem todo conteudo e espacial.
- Pode parecer vazio em territorios com poucos dados.

### 4. Empresas como tab fixa no bottom nav

Saiu:

- Empresas no nivel fixo mobile.

Por que:

- Abriria precedente para todos os outros modulos pedirem espaco fixo.
- Empresas devem aparecer em Explorar/Resolver e como destino.

### 5. Mensagens como modulo isolado de descoberta

Saiu:

- Mensagens como item principal para todos.

Por que:

- Conversa deve nascer de contexto: empresa, classificado, post, grupo, evento ou perfil.

## O que ficou secundario

### Administracao

Ficou secundaria e restrita.

Motivo:

- Nao pertence a experiencia comum do morador.

### Analytics

Ficou secundario dentro da Central.

Motivo:

- E importante para donos/operadores, mas nao para descoberta local.

### Planos

Ficou secundario em Conta/Central.

Motivo:

- Pode apoiar monetizacao sem interromper uso principal.

### Configuracoes profundas

Ficaram secundarias em Conta.

Motivo:

- Devem existir, mas nao competir com descobrir, participar e resolver.

### Vagas e imoveis

Ficaram secundarios dentro de Resolver/Explorar/Classificados.

Motivo:

- Sao importantes, mas nao devem ocupar navegacao fixa inicial.

## O que virou contexto

### Empresas

Virou contexto em:

- Hoje: destaque local.
- Explorar: resultado.
- Resolver: destino.
- Comunidade: recomendacao ou novidade.
- Central: gestao.

### Eventos

Virou contexto em:

- Hoje: o que acontece agora.
- Comunidade: evento comunitario.
- Explorar: agenda filtrada.
- Central: criacao e gestao.

### Classificados

Virou contexto em:

- Hoje: selecao curta.
- Explorar: busca e categoria.
- Comunidade: anuncio leve.
- Resolver: mercado local.

### Mensagens

Virou contexto em:

- Empresa.
- Classificado.
- Grupo.
- Post.
- Evento.
- Perfil.
- Atividade.

### Notificacoes

Viraram contexto de continuidade:

- Respostas.
- Mencoes.
- Alertas.
- Mensagens.
- Atualizacoes de itens salvos.

### Mapa

Virou contexto em:

- Explorar.
- Empresas.
- Eventos.
- Perto de mim.
- Alertas.

## O que desapareceu da Home

Sai da Home:

- Lista completa de modulos.
- Sidebar administrativa.
- Cards de analytics.
- Todos os filtros.
- Todas as categorias.
- Mensagens como bloco isolado.
- Notificacoes como lista completa.
- Planos.
- Configuracoes.
- Cadastro de empresa como chamada permanente.
- Vagas e imoveis como secoes fixas.

Permanece na Home:

- Territorio.
- Busca.
- Hoje/agora.
- Acoes rapidas.
- Destaques mistos.
- Caminhos para aprofundar.

## Decisoes sobre aparencia e percepcao

### Densidade

Decisao:

- Densidade baixa na Home.
- Densidade media em Explorar.
- Densidade alta somente em Desktop/Central.

Motivo:

- O primeiro contato precisa ser simples.

### Hierarquia visual

Decisao:

1. Territorio.
2. Busca.
3. Hoje.
4. Acoes.
5. Conteudos.

Motivo:

- Essa ordem responde as perguntas essenciais do usuario.

### Cards

Decisao:

- Cards devem ser usados para destinos e conteudos, nao para envolver secoes inteiras.

Motivo:

- Evita pagina card-heavy e reduz sensacao de excesso.

### Icones

Decisao:

- Icones ajudam categorias, mas nao substituem texto em acoes criticas.

Motivo:

- QA ja mostrou risco de acoes por icone sem nome claro.

### Empty states

Decisao:

- Empty state sempre tem contexto territorial e proximo passo.

Motivo:

- Uma tela vazia em produto local parece abandono do bairro, nao apenas falta de dados.

### Loading

Decisao:

- Loading longo precisa explicar o que esta acontecendo e oferecer alternativa.

Motivo:

- Produto territorial depende de dados remotos e nao pode deixar usuario preso.

## Decisao sobre cada conceito

### Feed First

Nao deve ser a experiencia principal, mas influencia Comunidade.

O que aproveita:

- Sensacao de vida.
- Cards de atualizacao.
- Recorrencia.

### Territorio First

Deve ser a base da identidade.

O que aproveita:

- Topo territorial.
- Home como pagina do lugar.
- Conteudo por contexto local.

### Mapa First

Nao deve ser Home padrao, mas deve fortalecer Explorar.

O que aproveita:

- Perto de mim.
- Empresas.
- Eventos.
- Alertas.

### Discovery First

Deve fortalecer busca e Explorar.

O que aproveita:

- Categorias.
- Colecoes.
- Filtros progressivos.
- Resultados agrupados.

### Hybrid

Deve ser a direcao mais completa.

O que aproveita:

- Territorio como identidade.
- Feed como vida social.
- Discovery como utilidade.
- Mapa como proximidade.
- Atividade como continuidade.

## Decisao final de produto

Direcao recomendada:

> Hybrid com Home Territorio First.

Resumo:

- Home: territorio editorial.
- Feed: Comunidade.
- Busca: Explorar.
- Empresas/Servicos/Classificados: Resolver/Explorar.
- Mensagens/Notificacoes: Atividade.
- Perfil/Central/Admin: Conta/Gerenciar.

## Principio de governanca visual

Antes de qualquer nova tela ou modulo entrar na navegacao, responder:

1. Isso precisa ser Home, destino ou contexto?
2. Qual intencao do usuario justifica aparecer?
3. Em qual territorio isso faz sentido?
4. O usuario entende sem conhecer o modulo?
5. Se sumir da Home, o produto fica pior ou apenas menos cheio?
