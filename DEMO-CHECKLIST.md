# DEMO CHECKLIST

Checklist de demonstracao para o Achegue-se. Marcar como concluido apenas quando o fluxo for testado manualmente com ambiente e usuario de teste validos.

## Gates tecnicos

- [x] `npm run lint` passou.
- [x] `npm run typecheck` passou.
- [x] `npm run build` passou.
- [x] `npm run validate:architecture:governance` passou.
- [x] `npm run validate:ssot` passou.

## Smoke publico

- [x] `/` carrega com HTTP 200.
- [x] `/login` carrega com HTTP 200.
- [x] `/cadastro` carrega com HTTP 200.
- [x] `/busca` carrega com HTTP 200.
- [x] `/configuracoes` carrega com HTTP 200.
- [ ] Revisar manualmente erros de console `Failed to fetch` em chamadas Supabase de cidade/territorio.

## Fluxos principais

- [ ] Cadastro cria conta ou mostra erro claro.
- [ ] Login autentica usuario de teste.
- [ ] Perfil carrega dados do usuario autenticado.
- [ ] Perfil permite salvar alteracao nao destrutiva.
- [ ] Feed carrega posts da comunidade.
- [ ] Comentarios abrem e permitem comentar.
- [ ] Curtidas atualizam estado e contador.
- [ ] Empresas carregam listagem.
- [ ] Detalhe de empresa abre por URL canonica.
- [ ] Busca retorna resultados ou empty state claro.
- [ ] Mensagens carregam conversas.
- [ ] Mensagens permitem envio de teste.
- [ ] Notificacoes carregam lista.
- [ ] Notificacoes permitem marcar como lida.
- [ ] Configuracoes carregam secoes de conta/privacidade/seguranca.

## UX e conteudo

- [ ] Textos principais aparecem com acentos corretos.
- [ ] Estados de loading nao travam a navegacao.
- [ ] Empty states orientam proximo passo.
- [ ] Erros de formulario sao visiveis e especificos.
- [ ] Layout mobile nao corta botoes ou texto.
- [ ] Layout desktop nao sobrepoe cards, sidebar ou overlays.

## Dados e seguranca

- [ ] Nenhum fluxo de demo exige permissao admin indevida.
- [ ] RLS bloqueia acesso quando usuario nao tem permissao.
- [ ] Acoes sensiveis pedem confirmacao quando aplicavel.
- [ ] Dados criados na demo podem ser identificados e removidos depois.

## Pendencias antes de uma demo publica

- [ ] Definir usuario de teste e senha temporaria.
- [ ] Definir cidade/comunidade usada na apresentacao.
- [ ] Preparar dados de empresa, post, comentario, mensagem e notificacao.
- [ ] Confirmar se os modulos pausados devem aparecer ou ficar fora do roteiro.
- [ ] Reexecutar gates no mesmo ambiente da demo.
