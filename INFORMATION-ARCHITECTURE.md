# Information Architecture - Achegue-se

Status: proposta de organizacao de informacao, sem implementacao.

## Principio central

A arquitetura de informacao deve organizar o produto por **territorio + intencao + entidade**.

Formula:

> Territorio define relevancia. Intencao define entrada. Entidade define destino.

Exemplo:

- Territorio: Salvador / Pituba.
- Intencao: encontrar algo para comer.
- Entidade: restaurante, cardapio, promocao, avaliacao.

## Taxonomia recomendada

### Territorio

Camada que filtra tudo:

- Pais.
- Estado.
- Cidade.
- Bairro.
- Comunidade/grupo territorial.
- Perto de mim.

### Intencao

Camada que guia a navegacao:

- Saber o que acontece.
- Procurar algo.
- Participar.
- Resolver necessidade.
- Conversar.
- Gerenciar.

### Entidade

Camada que estrutura conteudo:

- Post.
- Alerta.
- Grupo.
- Empresa.
- Servico.
- Produto/cardapio.
- Classificado.
- Imovel.
- Vaga.
- Evento.
- Mensagem.
- Notificacao.
- Perfil.

### Acao

Camada final:

- Ver.
- Buscar.
- Filtrar.
- Publicar.
- Comentar.
- Curtir.
- Compartilhar.
- Salvar.
- Contatar.
- Comprar/pedir/reservar.
- Candidatar.
- Editar.
- Configurar.

## Mapa de modos e funcionalidades

| Modo | Funcao | Funcionalidades naturais |
| --- | --- | --- |
| Hoje | Atualizacao local rapida | feed resumido, alertas, eventos, empresas em destaque, classificados recentes |
| Explorar | Descoberta e busca | busca, categorias, mapa, perto de mim, filtros |
| Comunidade | Participacao social | feed, posts, grupos, comentarios, curtidas, alertas, problemas, achados e perdidos |
| Resolver | Necessidades praticas | empresas, gastronomia, servicos, classificados, imoveis, vagas, eventos |
| Atividade | Retorno e continuidade | notificacoes, mensagens, respostas, mencoes, alertas acompanhados |
| Gerenciar | Controle e operacao | perfil, configuracoes, central, administracao, analytics |

## Home, destinos e telas secundarias

### Homes

Homes sao pontos de retomada. Elas devem responder "onde estou e o que importa agora?".

Homes recomendadas:

- Home territorial: "Hoje em [territorio]".
- Home de comunidade: "Meu bairro/comunidade".
- Home de explorar: busca e categorias locais.
- Home de atividade: notificacoes + mensagens.
- Home de conta: perfil, configuracoes e acessos de gestao.
- Home da Central: operacao para quem gerencia algo.

### Destinos

Destinos sao paginas onde o usuario decide ou age.

Destinos recomendados:

- Detalhe de empresa.
- Lista de empresas filtrada.
- Perfil de prestador.
- Detalhe de classificado.
- Detalhe de imovel.
- Detalhe de vaga.
- Detalhe de evento.
- Grupo.
- Post.
- Conversa.
- Mapa com resultado selecionado.

### Secundarias

Telas secundarias existem para configurar, editar ou aprofundar.

Secundarias recomendadas:

- Editar perfil.
- Trocar foto.
- Preferencias de notificacao.
- Privacidade.
- Criar/editar post.
- Criar/editar classificado.
- Criar/editar empresa.
- Dados comerciais.
- Analytics.
- Moderacao.
- Planos.

Regra:

- Tela secundaria nao deve virar entrada principal.

## Como lidar com dezenas de modulos

### 1. Agrupar por linguagem do usuario

O usuario pensa:

- "Quero achar."
- "Quero postar."
- "Quero comprar."
- "Quero falar."
- "Quero gerenciar."

O sistema pensa:

- Empresas.
- Servicos.
- Classificados.
- Eventos.
- Mensagens.
- Notificacoes.

A interface deve falar a linguagem do usuario.

### 2. Usar hubs por intencao

Em vez de uma grade com 14 modulos, usar hubs:

- Hoje: resumo.
- Explorar: descobrir.
- Comunidade: participar.
- Resolver: comprar/contratar.
- Gerenciar: operar.

### 3. Revelar por contexto

Exemplos:

- Vagas aparecem quando usuario busca trabalho, entra em Resolver ou segue categorias de oportunidade.
- Imoveis aparecem dentro de Classificados/Resolver, nao como item global fixo.
- Mensagens aparecem quando ha conversa ou acao de contato.
- Administracao aparece apenas para papel autorizado.

### 4. Priorizar por disponibilidade

Se um modulo nao esta pronto, sem dados ou sem permissao, ele nao deve aparecer como promessa principal.

Estados possiveis:

- Disponivel.
- Em breve.
- Restrito.
- Sem dados neste territorio.
- Oculto.

### 5. Limitar densidade da Home

A Home deve ter poucos blocos:

1. Territorio e busca.
2. Hoje/agora.
3. Acoes rapidas.
4. Destaques mistos.
5. Caminhos para explorar mais.

Nao deve ter:

- Uma secao completa para cada modulo.
- Todos os filtros possiveis.
- Listas longas.
- Painel administrativo.

## Feed: composicao recomendada

O feed deve ser um stream editorial territorial.

Tipos permitidos:

- Postagem.
- Pergunta.
- Alerta.
- Problema local.
- Evento proximo.
- Classificado recente.
- Promocao local limitada.
- Nova empresa verificada.
- Atualizacao de grupo.

Pesos recomendados:

- Alerta urgente: prioridade alta, baixa frequencia.
- Postagem de morador: base do feed.
- Evento proximo: prioridade temporal.
- Promocao: limitada para nao virar publicidade.
- Classificado: limitado e filtravel.
- Empresa: apenas novidades ou recomendacoes, nao catalogo.

Regra:

- Se o conteudo pede decisao comercial detalhada, ele deve levar ao destino do modulo.
- Se o conteudo pede conversa social, pode ficar no feed.

## Empresas na arquitetura

Empresas devem existir em quatro lugares:

1. Hoje: destaques e novidades.
2. Explorar: resultados de busca.
3. Resolver: listagem, filtros e detalhe.
4. Central: gestao.

Empresas nao devem dominar Comunidade, mas devem aparecer quando forem relevantes para a vida local.

Separacao recomendada:

- Comunidade pergunta: "o que as pessoas estao falando e fazendo?"
- Empresas responde: "quem oferece algo aqui?"
- Central responde: "como eu gerencio minha presenca?"

## Nomenclatura recomendada

Termos bons para usuario:

- Hoje.
- Explorar.
- Comunidade.
- Perto de mim.
- Publicar.
- Atividade.
- Conta.
- Central.

Termos a evitar como navegacao primaria:

- Modulos.
- Hub.
- Surface.
- Gestao para usuario comum.
- Comunicacao territorial.
- Administracao, exceto para usuarios autorizados.
