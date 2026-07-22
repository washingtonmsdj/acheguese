# Mobile-first Strategy - Achegue-se

Status: estrategia de experiencia mobile, sem implementacao.

## Tese mobile

O mobile deve ser a experiencia principal do Achegue-se.

O produto e territorial, cotidiano e situacional. O usuario provavelmente esta:

- Na rua.
- No bairro.
- Procurando algo rapido.
- Respondendo uma notificacao.
- Compartilhando um acontecimento.
- Entrando em contato com alguem.

Portanto, o mobile precisa ser mais simples que o desktop, nao uma versao compactada dele.

## Primeira tela mobile

Objetivo da primeira tela:

- Confirmar territorio.
- Mostrar valor imediato.
- Oferecer busca.
- Dar uma acao clara.

Informacao essencial:

- Territorio ativo.
- Busca curta.
- Destaques de hoje.
- Uma chamada para participar/publicar.

Informacao que nao deve aparecer de cara:

- Todos os modulos.
- Cards administrativos.
- Listas completas.
- Analytics.
- Configuracoes.
- Secoes repetidas de comercio.

## Bottom Navigation

Proposta final:

1. Hoje
2. Explorar
3. Comunidade
4. Atividade
5. Conta

### Hoje

Uso:

- Retomar o produto.
- Ver o que mudou.
- Abrir destaques.

Conteudo:

- Feed resumido.
- Alertas.
- Eventos proximos.
- Destaques comerciais limitados.
- Acoes rapidas.

### Explorar

Uso:

- Procurar qualquer coisa.
- Navegar por categorias.
- Usar mapa.

Conteudo:

- Busca.
- Perto de mim.
- Categorias.
- Empresas.
- Servicos.
- Gastronomia.
- Classificados.
- Imoveis.
- Vagas.
- Eventos.

### Comunidade

Uso:

- Participar.
- Ler postagens.
- Entrar em grupos.
- Ver alertas e problemas.

Conteudo:

- Feed social.
- Grupos.
- Comentarios.
- Curtidas.
- Alertas.
- Achados e perdidos.

### Atividade

Uso:

- Continuar conversas.
- Ver respostas.
- Acompanhar notificacoes.

Conteudo:

- Mensagens.
- Notificacoes.
- Mencoes.
- Respostas.
- Atualizacoes de itens salvos.

### Conta

Uso:

- Ver perfil.
- Editar dados.
- Configurar preferencias.
- Acessar Central se aplicavel.

Conteudo:

- Perfil.
- Foto.
- Preferencias.
- Privacidade.
- Enderecos.
- Central.
- Planos.
- Sair.

## FAB mobile

O FAB deve existir em Hoje, Comunidade e alguns contextos de Explorar.

Label conceitual:

- Publicar.

Opcoes por contexto:

- Postagem.
- Pergunta.
- Alerta.
- Classificado.
- Evento.
- Empresa.
- Servico.

Regras:

- Em Comunidade, priorizar post/pergunta/alerta.
- Em Explorar, priorizar classificado/empresa/servico quando fizer sentido.
- Em Conta/Central, FAB nao deve competir com acoes de gestao.
- Se o usuario nao estiver logado, abrir convite de login contextual.

## Busca mobile

Busca e uma das principais solucoes contra excesso.

Comportamento:

- Sempre territorial.
- Sempre tolerante a termos amplos.
- Sempre com agrupamento por tipo.

Exemplo de resultado para "pizza":

- Restaurantes.
- Promocoes.
- Postagens.
- Eventos relacionados.
- Classificados apenas se relevantes.

Estados obrigatorios:

- Digitando.
- Buscando.
- Resultados.
- Sem resultado.
- Erro.
- Offline/lento.

O estado vazio deve sugerir caminhos:

- Procurar em outro bairro.
- Ver categorias proximas.
- Publicar pedido de recomendacao.

## Filtros mobile

Filtros devem ser progressivos.

Primeira camada:

- Territorio.
- Categoria.
- Perto de mim.
- Aberto agora.
- Data.

Segunda camada:

- Preco.
- Avaliacao.
- Distancia.
- Tipo de entrega/atendimento.
- Disponibilidade.

Terceira camada:

- Especifica do modulo.

Regra:

- Nunca mostrar todos os filtros antes do usuario escolher uma categoria ou tipo de resultado.

## Troca de bairro mobile

O territorio e o eixo do produto. A troca de bairro precisa ser facil, mas nao invasiva.

Proposta:

- Chip fixo no topo.
- Texto curto: "Salvador" ou "Pituba".
- Toque abre seletor.
- Seletor mostra: meu bairro, cidade, perto de mim, recentes, buscar bairro.

Comportamento:

- Trocar bairro preserva o modo.
- Se nao houver dados no novo bairro, mostrar estado vazio util.
- Se o usuario estiver em uma entidade especifica, perguntar se quer voltar para listagem do novo territorio.

## Atividade: mensagens e notificacoes

Mensagens e notificacoes devem ser uma unica area de continuidade.

Abas recomendadas:

- Todas.
- Mensagens.
- Respostas.
- Alertas.

Por que:

- Usuario nao separa mentalmente "notificacao" de "coisa que preciso responder".
- O centro da experiencia e continuidade, nao tipo tecnico.

## Criacao de conteudo

Criar conteudo deve comecar por intencao:

- Quero perguntar.
- Quero avisar.
- Quero vender.
- Quero divulgar evento.
- Quero cadastrar negocio/servico.

Depois o produto decide o formato adequado.

Campos devem aparecer em etapas:

1. Tipo de publicacao.
2. Conteudo essencial.
3. Territorio/alcance.
4. Revisao.

## Performance percebida

Mobile deve evitar loading sem saida.

Regras:

- Loading acima de 2 segundos deve mostrar texto util.
- Loading acima de 5 segundos deve oferecer tentar novamente.
- Home deve renderizar algo mesmo com dados parciais.
- Busca deve mostrar historico/sugestoes enquanto carrega.
- Feed deve preservar conteudo anterior quando atualizar.

## Empty states

Estados vazios devem orientar proximo passo.

Exemplos:

- Sem empresas: "Nenhuma empresa encontrada neste bairro. Tente Salvador ou cadastre uma empresa."
- Sem eventos: "Nada marcado hoje. Ver fim de semana ou criar evento."
- Sem grupos: "Ainda nao ha grupos neste bairro. Criar grupo ou explorar cidade."
- Sem notificacoes: "Quando alguem responder ou interagir com voce, aparece aqui."

## Acessibilidade mobile

Regras:

- Acoes por icone precisam de nome acessivel.
- Botao de sair deve se chamar "Sair da conta".
- Curtir, comentar, compartilhar e salvar precisam de labels claros.
- Alvos de toque devem ser confortaveis.
- Texto nao deve depender so de cor.
- Banner de cookies nao deve cobrir CTA principal.

## O que fica fora do mobile primario

Nao devem ser prioridade no mobile comum:

- Analytics detalhado.
- Configuracoes administrativas profundas.
- Edicao avancada de empresa.
- Dashboards densos.
- Moderacao completa.

Esses fluxos podem existir, mas devem ser tratados como secundarios ou otimizados para desktop/tablet.
