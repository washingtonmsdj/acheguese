# Navigation System - Achegue-se

Status: fundacao adaptativa implementada em Home territorial e Explorar na
Fase 4.2. Community, Feed, Perfil e demais superficies continuam no shell
anterior ate migracao explicita.

## Objetivo da navegacao

A navegacao deve esconder a complexidade estrutural do produto e revelar opcoes conforme contexto, intencao e permissao.

O usuario nao deve navegar por uma lista de modulos. Ele deve navegar por modos de uso.

## Modelo recomendado

### Nivel 1 - Modos globais

Entradas globais:

- Hoje
- Explorar
- Community
- Atividade
- Conta

Essas entradas devem ser estaveis, especialmente no mobile.

### Nivel 2 - Categorias contextuais

Categorias que aparecem dentro de um modo:

- Empresas.
- Gastronomia.
- Servicos.
- Classificados.
- Eventos.
- Grupos.
- Alertas.
- Imoveis.
- Vagas.
- Mapa.

### Nivel 3 - Destinos

Destinos que o usuario abre para agir:

- Perfil de empresa.
- Cardapio.
- Prestador.
- Evento.
- Classificado.
- Grupo.
- Post.
- Conversa.
- Configuracao.

### Nivel 4 - Acoes

Acoes de contexto:

- Publicar.
- Comentar.
- Curtir.
- Compartilhar.
- Salvar.
- Contatar.
- Ver rota.
- Pedir orcamento.
- Comprar/reservar/candidatar.
- Editar.

## Mobile-first

### Bottom Navigation

Proposta:

1. Hoje
2. Explorar
3. Comunidade
4. Atividade
5. Conta

Justificativa:

- "Hoje" da ao usuario retorno imediato.
- "Explorar" concentra busca, mapa e categorias.
- "Comunidade" concentra feed, grupos, alertas e participacao.
- "Atividade" concentra mensagens e notificacoes.
- "Conta" concentra perfil, configuracoes e Central quando aplicavel.

O bottom nav nao deve conter:

- Empresas como tab fixa.
- Classificados como tab fixa.
- Eventos como tab fixa.
- Vagas como tab fixa.
- Mapa como tab fixa.

Esses itens sao importantes, mas devem aparecer dentro de Explorar, Comunidade ou Resolver conforme intencao.

### Top Bar mobile

Elementos recomendados:

- Chip de territorio ativo: cidade/bairro.
- Acesso rapido a busca.
- Sinal de notificacao quando houver algo novo.

Elementos que devem ser evitados na Top Bar mobile:

- Muitos links textuais.
- Logo grande depois do primeiro contato.
- Alternancia de tema como item primario.
- Entradas administrativas permanentes.

### Acao de publicacao

A publicacao deve representar uma intencao contextual, nao um modulo fixo nem
um destino permanente da navegacao.

Acao possivel:

- Publicar.

Quando a superficie oferecer um seletor de intencao:

- Postagem.
- Pergunta.
- Alerta.
- Classificado.
- Evento.
- Empresa/Servico, se o usuario tiver permissao ou intencao comercial.

Regras:

- a acao so aparece quando rollout, perfil ativo e policy permitem;
- autenticacao isolada nao habilita publicacao;
- Home e Explorar nao reservam um FAB global apenas para preencher layout;
- quando adotado, o seletor abre intencoes compreensiveis, nao formatos tecnicos.

### Busca mobile

Busca deve ser global e territorial.

Comportamento esperado:

- Campo unico: "Buscar no bairro".
- Sugestoes antes de digitar.
- Resultados agrupados por tipo.
- Filtros progressivos.
- Correcoes de termo.
- Estado vazio com sugestoes.

Primeiros filtros:

- Perto de mim.
- Aberto agora.
- Hoje/esta semana.
- Categoria.
- Bairro.

Filtros avancados so aparecem depois de uma categoria.

### Troca de bairro

Troca de bairro deve ser um controle global, sempre compreensivel.

Proposta:

- Chip no topo com nome do territorio.
- Toque abre seletor.
- Opcoes: meu bairro, cidade atual, perto de mim, escolher outro bairro.
- Ao trocar, manter o modo atual quando fizer sentido.

Exemplo:

- Usuario esta em Empresas e troca de Pituba para Barra.
- Deve continuar em Empresas, agora filtrado pela Barra.

### Fluxos mobile principais

Hoje:

1. Abrir app.
2. Ver territorio ativo.
3. Ver destaques.
4. Abrir item ou explorar.

Explorar:

1. Tocar em Explorar.
2. Buscar ou escolher categoria.
3. Filtrar.
4. Abrir destino.

Comunidade:

1. Tocar em Comunidade.
2. Ver feed/grupos/alertas.
3. Publicar via FAB.
4. Acompanhar respostas.

Atividade:

1. Tocar em Atividade.
2. Alternar mensagens/notificacoes.
3. Abrir contexto.

Conta:

1. Tocar em Conta.
2. Ver perfil e configuracoes.
3. Acessar Central se tiver empresa, perfil profissional ou papel operacional.

## Desktop

### Estrutura desktop recomendada

Desktop deve aproveitar espaco, mas nao expor tudo ao mesmo tempo.

Layout implementado na fundacao Territorio Vivo:

- Sidebar esquerda com modos principais.
- Top bar territorial com troca de contexto, notificacoes e conta/entrada.
- Area central para conteudo.
- Painel direito contextual somente quando agregar valor.

Sidebar principal:

- Hoje.
- Explorar.
- Community.
- Atividade.
- Conta/Entrar.

Dentro de cada modo, usar navegacao secundaria contextual.

### Sidebar desktop

Regras:

- Mostrar exatamente os cinco modos globais na fundacao atual.
- Expor Resolver, mapa e modulos dentro da Home/Explorar, nao no nivel principal.
- Exibir "Central" apenas para usuarios autenticados e com papel relevante.
- Ao entrar em uma comunidade, a sidebar pode se tornar contextual, mas mantendo saida clara para modos globais.

### Top Bar desktop

Elementos recomendados:

- Busca global.
- Territorio ativo.
- Notificacoes.
- Mensagens.
- Perfil.

Elementos secundarios:

- Planos.
- Sobre.
- Tema.
- Logout.

Esses elementos devem ficar em menus ou area de conta, nao disputar atencao com tarefas primarias.

### Desktop: painel direito

Painel direito deve ser contextual:

- Em Hoje: agenda, alertas, sugestoes.
- Em Comunidade: grupos, regras, pessoas ativas.
- Em Empresas: filtros salvos, mapa pequeno, categorias.
- Em Evento: detalhes, local, participantes.
- Em Central: status e proximas acoes.

Nao deve virar uma segunda navegacao global.

### Breakpoints canônicos da fundacao

- `< 768 px`: bottom navigation fixa; padding inferior respeita safe area.
- `768–1279 px`: navigation rail fixa de 72 px.
- `>= 1280 px`: sidebar de 224 px; rail contextual pertence a cada modo.

Os três formatos usam o mesmo array de modos e o mesmo resolvedor de contexto
territorial. Trocar viewport nao muda a arquitetura de informacao.

## Navegacao por estado de login

Visitante:

- Hoje.
- Explorar.
- Comunidade em modo leitura.
- Entrar/criar conta quando tentar participar.

Morador autenticado:

- Hoje.
- Explorar.
- Comunidade.
- Atividade.
- Conta.

Dono/prestador:

- Mesma base do morador.
- Central aparece em Conta e como atalho desktop.

Administrador:

- Central/Admin separado, sem contaminar navegacao comum.

## Regras contra excesso

1. Nunca mostrar mais de cinco entradas fixas no mobile.
2. Nunca listar todos os dominios como tabs globais.
3. Usar "Mais" apenas para destinos, nao para despejar modulos.
4. Promover modulos por relevancia contextual.
5. Esconder modulos pausados ou sem dados.
6. Separar descoberta, participacao e gestao.
