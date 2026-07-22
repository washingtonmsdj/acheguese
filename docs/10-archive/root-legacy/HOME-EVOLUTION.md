# Home Evolution - Achegue-se

Status: evolucao conceitual da Home, sem implementacao.

## Objetivo

Mostrar como a Home deve evoluir para sustentar a arquitetura UX definida.

Premissa:

> A Home nao deve ser uma vitrine de modulos. Ela deve ser a leitura rapida do territorio.

## Problema inicial

O Achegue-se possui muitos dominios:

- Feed.
- Comunidades.
- Empresas.
- Servicos.
- Classificados.
- Eventos.
- Alertas.
- Grupos.
- Imoveis.
- Vagas.
- Mensagens.
- Notificacoes.
- Perfil.
- Administracao.

Se a Home tentar mostrar todos, o usuario entende complexidade antes de entender valor.

## Versao 1 - Home modular

### Descricao

A Home mostra um bloco para cada modulo:

- Comunidades.
- Empresas.
- Servicos.
- Classificados.
- Eventos.
- Alertas.
- Grupos.
- Vagas.
- Imoveis.

### Decisao visual

Grade de cards com icones e atalhos.

### Por que parecia boa

- Todos os modulos ficam visiveis.
- Ajuda stakeholders a enxergar o escopo.
- Facilita demonstracao de funcionalidades existentes.

### Problemas

- Parece super app generico.
- Exige que o usuario escolha um modulo antes de entender sua propria necessidade.
- Causa paralisia por excesso.
- Comunidade, comercio e gestao competem no mesmo nivel.
- Nao cria identidade territorial forte.

### Aprendizado

Mostrar tudo nao e clareza. A Home precisa revelar valor, nao inventario.

## Versao 2 - Home Feed First

### Descricao

A Home vira um feed do bairro, misturando postagens, eventos, alertas, empresas e classificados.

### Decisao visual

Stream vertical com cards de conteudo e etiquetas de tipo.

### Por que melhorou

- Parece vivo.
- Reduz a lista de modulos.
- Favorece recorrencia.
- Mostra acontecimentos reais.

### Problemas

- Pode parecer rede social com conteudo local.
- Empresas e servicos perdem profundidade.
- Se o feed esta vazio ou fraco, toda a Home parece fraca.
- O usuario que quer resolver algo precisa procurar mais.

### Aprendizado

Feed e importante, mas nao deve ser a unica lente. O Achegue-se nao e apenas conversa.

## Versao 3 - Home Discovery/Territorio

### Descricao

A Home passa a abrir com territorio, busca e blocos por intencao:

- Hoje.
- Explorar.
- Participar.
- Resolver.

### Decisao visual

Topo territorial, busca forte, resumo do dia e secoes curtas.

### Por que melhorou

- O usuario entende onde esta.
- A busca reduz a necessidade de navegar por modulos.
- A Home combina vida local e utilidade.
- Empresas e servicos aparecem sem dominar.

### Problemas

- Ainda pode ficar generica se os blocos forem muito parecidos.
- Precisa de curadoria para decidir o que entra em "Hoje".
- Pode esconder demais alguns modulos se nao houver bons caminhos contextuais.

### Aprendizado

O territorio deve ser o primeiro elemento visual, e as intencoes devem guiar a descoberta.

## Versao Final - Home territorial editorial

### Nome

Hoje no seu territorio

### Descricao

A Home final e um painel editorial do lugar. Ela responde rapidamente:

1. Onde estou?
2. O que importa agora?
3. O que posso fazer?
4. Para onde vou se quiser aprofundar?

### Estrutura recomendada

1. Topo territorial
   - Nome do bairro/cidade.
   - Trocar territorio.
   - Busca curta.

2. Resumo do dia
   - Alertas importantes.
   - Evento proximo.
   - Movimento da comunidade.
   - Destaque util, como empresa aberta ou servico em alta.

3. Acoes por intencao
   - Procurar algo.
   - Publicar.
   - Ver perto de mim.
   - Participar da comunidade.

4. Destaques mistos
   - Postagem relevante.
   - Empresa recomendada.
   - Classificado selecionado.
   - Grupo ativo.

5. Caminhos de aprofundamento
   - Explorar tudo.
   - Ir para Comunidade.
   - Ver mapa.
   - Ver empresas/servicos por categoria.

### O que aparece

- Poucos conteudos, muito bem escolhidos.
- Conteudos com motivo claro de aparecer.
- Misto de comunidade, utilidade e comercio.
- Links para aprofundar.

### O que nao aparece

- Grade completa de modulos.
- Painel administrativo.
- Todas as categorias.
- Listas longas.
- Conteudo comercial sem relevancia local.
- Filtros avancados.

### Por que essa e a melhor direcao

Ela preserva a tese de plataforma territorial, evita excesso de informacao e ainda permite que todos os modulos existam como destinos contextuais.

## Regras editoriais da Home final

### Regra 1 - Maximo de informacao util

Cada bloco deve responder uma pergunta do usuario. Se o bloco existe apenas para expor modulo, sai.

### Regra 2 - Territorio sempre explicito

O usuario nunca deve se perguntar "isso e de onde?".

### Regra 3 - Conteudo misto, mas com limite

Home pode misturar posts, alertas, eventos, empresas e classificados, mas cada tipo deve aparecer em baixa densidade.

### Regra 4 - Busca sempre disponivel

Busca e a saida para usuarios que nao querem rolar.

### Regra 5 - Gestao fora da Home comum

Central, administracao e analytics aparecem por perfil/permissao, nao na Home do morador.

## Evolucao resumida

| Versao | Foco | Problema resolvido | Problema criado |
| --- | --- | --- | --- |
| V1 | Modulos | Expor escopo | Excesso |
| V2 | Feed | Produto vivo | Parece rede social |
| V3 | Busca + territorio | Clareza e utilidade | Precisa curadoria |
| Final | Editorial territorial | Equilibrio e identidade | Exige disciplina de conteudo |

## Decisao final

A Home deve seguir o conceito Hybrid com base Territorio First.

Formula:

> Territorio no topo, Hoje como narrativa, Explorar como caminho, Comunidade como participacao, Resolver como destino.

