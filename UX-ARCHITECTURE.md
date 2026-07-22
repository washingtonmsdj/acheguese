# UX Architecture - Achegue-se

Status: proposta de arquitetura de experiencia, sem implementacao.

## Tese principal

O Achegue-se deve ser percebido como uma **plataforma territorial de vida local**.

Ele nao deve se posicionar principalmente como rede social, super app ou marketplace. Esses termos explicam partes do produto, mas confundem o centro da experiencia:

- Rede social: reduz o produto a feed, curtidas e conversa.
- Super app: comunica excesso, complexidade e promessa ampla demais.
- Marketplace local: favorece compra e venda, mas deixa de fora comunidade, alertas, eventos e vida territorial.
- Plataforma territorial: organiza tudo a partir de uma pergunta simples: "o que eu posso descobrir, resolver ou participar perto de mim?"

Identidade recomendada:

> Achegue-se e o lugar digital do seu bairro: para saber o que acontece, encontrar o que precisa e participar da vida local.

## O que o usuario deve entender em 5 segundos

Nos primeiros 5 segundos, o usuario deve entender quatro coisas:

1. Onde estou: cidade, bairro ou comunidade ativa.
2. O que esta acontecendo agora: destaques locais relevantes.
3. O que posso fazer: buscar, explorar, publicar ou entrar em contato.
4. Por que isso importa: tudo e filtrado pelo territorio, nao por uma rede generica.

A primeira impressao nao deve listar todos os modulos. Ela deve responder:

> "Estou vendo Salvador/Pituba/Nordeste de Amaralina. Aqui eu encontro pessoas, negocios, servicos, eventos e avisos do territorio."

## Promessa de produto

Promessa curta:

> Tudo do seu bairro em um so lugar.

Promessa funcional:

> Descobrir, resolver e participar da vida local sem precisar saber em qual modulo procurar.

Promessa emocional:

> O produto deve parecer proximo, util e confiavel, nao grande, tecnico ou burocratico.

## Principios de UX

### 1. Territorio antes de modulo

O usuario nao deve comecar escolhendo entre Empresas, Eventos, Vagas, Grupos e Classificados. Ele deve comecar pelo territorio e pela intencao.

Ordem mental recomendada:

1. Meu lugar.
2. Minha necessidade.
3. O tipo de resultado.

Exemplo:

- "Preciso achar uma farmacia aberta perto de mim" leva a empresas.
- "Quero saber o que tem hoje" leva a eventos e feed.
- "Quero vender uma bicicleta" leva a classificados.
- "Quero avisar um problema" leva a alertas/problemas.

### 2. Menos portas, mais contexto

Dezenas de funcionalidades nao devem virar dezenas de entradas fixas. O produto deve ter poucas portas principais e muitos destinos contextuais.

Portas principais:

- Hoje
- Explorar
- Comunidade
- Resolver
- Gerenciar

Destinos contextuais:

- Empresa especifica
- Evento especifico
- Grupo especifico
- Classificado especifico
- Conversa especifica
- Configuracao especifica

### 3. Feed como resumo vivo, nao gaveta de tudo

O feed deve misturar conteudos locais, mas com regras editoriais claras. Ele nao deve virar uma lista infinita de qualquer entidade do sistema.

O feed pode conter:

- Postagens de moradores.
- Alertas relevantes.
- Eventos proximos.
- Novas empresas em destaque.
- Promocoes limitadas.
- Classificados recentes com baixa frequencia.
- Atualizacoes de grupos do usuario.

O feed nao deve conter:

- Catalogos completos de empresas.
- Listas longas de vagas.
- Painel administrativo.
- Todos os produtos de uma empresa.
- Conteudos sem relacao territorial.

Regra: o feed mostra "o que merece atencao agora"; os modulos mostram "tudo que existe sobre aquele assunto".

### 4. Empresas pertencem ao territorio, mas precisam de experiencia propria

Empresas devem aparecer dentro da comunidade porque fazem parte da vida local. Mas a experiencia de empresa nao deve ser tratada como uma simples postagem.

Modelo recomendado:

- Na comunidade: empresas aparecem como sinais locais, recomendacoes, novidades, promocoes e respostas a buscas.
- Em Empresas/Gastronomia/Servicos: elas possuem listagem, filtros, detalhe, contato, avaliacao e conversao.
- Na Central: donos gerenciam dados, cardapio, horarios, pedidos, anuncios, analytics e planos.

Assim, empresa e uma entidade territorial com tres contextos:

- Descoberta comunitaria.
- Avaliacao comercial.
- Gestao operacional.

## Grandes modos de uso

### Hoje

Objetivo: entender rapidamente o que importa no territorio agora.

Funcionalidades naturais:

- Destaques do bairro.
- Feed resumido.
- Alertas urgentes.
- Eventos de hoje.
- Empresas ou servicos em alta.
- Classificados recentes selecionados.
- Sugestoes de grupos.

### Explorar

Objetivo: procurar algo sem saber exatamente o modulo.

Funcionalidades naturais:

- Busca federada.
- Categorias.
- Mapa.
- Perto de mim.
- Filtros por distancia, bairro, aberto agora, preco, data, tipo.
- Resultados mistos agrupados.

### Comunidade

Objetivo: participar da vida social local.

Funcionalidades naturais:

- Feed de postagens.
- Grupos.
- Comentarios.
- Curtidas.
- Alertas.
- Problemas locais.
- Achados e perdidos.
- Eventos comunitarios.
- Mensagens a partir de contexto.

### Resolver

Objetivo: concluir uma necessidade pratica.

Funcionalidades naturais:

- Empresas.
- Gastronomia.
- Servicos.
- Classificados.
- Imoveis.
- Vagas.
- Agenda de eventos.
- Contato, rota, orçamento, pedido, reserva ou candidatura.

### Gerenciar

Objetivo: controlar identidade, operacao e configuracoes.

Funcionalidades naturais:

- Perfil.
- Notificacoes.
- Mensagens.
- Configuracoes.
- Central de empresas.
- Painel profissional.
- Painel motorista/motoboy.
- Administracao.

## Modelo de percepcao

O Achegue-se deve parecer:

- Local antes de social.
- Util antes de divertido.
- Organizado antes de abundante.
- Vivo antes de institucional.
- Confiavel antes de promocional.

Deve evitar parecer:

- Um menu gigante de funcionalidades.
- Uma rede social generica com CEP.
- Um marketplace com posts anexados.
- Um painel administrativo disfarçado de produto para moradores.

## Decisoes recomendadas

1. Posicionar o produto como plataforma territorial.
2. Fazer da Home uma pagina "Hoje no seu territorio", nao uma vitrine de modulos.
3. Usar busca e exploracao como principal solucao contra excesso de informacao.
4. Separar participacao social de resolucao pratica, mas permitir cruzamentos.
5. Tratar empresas como parte do territorio com experiencia propria.
6. Manter gestao longe da navegacao principal de moradores, aparecendo por perfil/permissao.
7. Reduzir a navegacao global a poucos modos de uso.
