# DEMO FLOW

Roteiro de demonstracao do Achegue-se apos a FASE 1 de estabilizacao.

## Pre-condicoes

- App local rodando com `npm run dev`.
- Ambiente Supabase configurado nas variaveis esperadas pelo projeto.
- Usuario de teste disponivel para validar fluxos autenticados.
- Comunidade/cidade padrao carregando dados publicos.

## Smoke publico executado

Validados localmente em `http://127.0.0.1:5175/`:

| Rota | Resultado observado |
| --- | --- |
| `/` | HTTP 200, titulo `Salvador | Achegue-se`. |
| `/login` | HTTP 200, tela de login renderizada. |
| `/cadastro` | HTTP 200, tela de cadastro renderizada. |
| `/busca` | HTTP 200, layout principal renderizado. |
| `/configuracoes` | HTTP 200, layout principal renderizado. |

Observacao: a validacao automatizada final nao encontrou page exceptions nem respostas HTTP 5xx nessas rotas. O console registrou erros `TypeError: Failed to fetch` em chamadas Supabase de dados territoriais/cidade no ambiente local headless; revisar conectividade e variaveis de ambiente durante a demo manual.

## Fluxo 1 - Cadastro

1. Abrir `/cadastro`.
2. Preencher dados basicos de conta.
3. Avancar para bairro/territorio.
4. Confirmar termos e preferencias.
5. Submeter cadastro.

Resultado esperado: conta criada ou mensagem clara de erro de validacao/autenticacao.

## Fluxo 2 - Login

1. Abrir `/login`.
2. Informar email e senha do usuario de teste.
3. Submeter login.
4. Confirmar redirecionamento para area autenticada.

Resultado esperado: sessao iniciada, perfil ativo carregado e navegacao principal disponivel.

## Fluxo 3 - Perfil

1. Acessar a area de perfil/conta.
2. Ver dados publicos, identidade ativa e atalhos.
3. Editar um campo nao destrutivo.
4. Salvar e recarregar a tela.

Resultado esperado: alteracao persistida e exibida sem erro visual.

## Fluxo 4 - Feed, comentarios e curtidas

1. Acessar feed/comunidade.
2. Criar ou abrir um post existente.
3. Curtir/descurtir.
4. Abrir comentarios.
5. Adicionar comentario de teste.

Resultado esperado: contadores e lista atualizam sem reload forçado e sem erro de permissao inesperado.

## Fluxo 5 - Empresas

1. Acessar listagem de empresas.
2. Abrir detalhe de empresa.
3. Testar busca/filtro se disponivel.
4. Validar CTA principal do detalhe.

Resultado esperado: listagem e detalhe carregam, com links canonicos funcionando.

## Fluxo 6 - Busca

1. Abrir `/busca`.
2. Pesquisar por termo comum.
3. Alternar categorias quando disponivel.
4. Abrir um resultado.

Resultado esperado: resultados aparecem com estado de loading/empty claro.

## Fluxo 7 - Mensagens

1. Acessar central de mensagens com usuario autenticado.
2. Abrir conversa existente ou iniciar contato a partir de um perfil/post.
3. Enviar mensagem de teste.

Resultado esperado: conversa atualiza e notifica erro apenas quando houver restricao real.

## Fluxo 8 - Notificacoes

1. Acessar notificacoes.
2. Marcar uma notificacao como lida.
3. Validar contador global.

Resultado esperado: contador e estado da notificacao atualizam de forma consistente.

## Fluxo 9 - Configuracoes

1. Abrir `/configuracoes` ou entrada equivalente no app.
2. Navegar por privacidade, conta, seguranca e preferencias.
3. Alterar opcao de baixo risco.

Resultado esperado: tela carrega sem bloqueio e mensagens de sucesso/erro sao claras.

## Encerramento da demo

Antes de apresentar, confirmar:

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run validate:architecture:governance`
- `npm run validate:ssot`
