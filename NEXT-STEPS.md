# NEXT STEPS

Proximos passos permitidos: apenas estabilizacao, validacao, limpeza comprovada e reducao de risco. Nao adicionar novas funcionalidades, dependencias, migrations, RLS, Edge Functions ou mudancas de identidade visual.

## Prioridade P0 - Validacao de demo privada

### 1. Validar ambiente Supabase local

- Motivo: smoke headless carregou rotas com HTTP 200, mas registrou `TypeError: Failed to fetch` em chamadas Supabase de cidade/territorio.
- Acao: revisar variaveis de ambiente, conectividade e origem permitida.
- Resultado esperado: rotas publicas carregam sem erros de fetch no console.
- Validacao: repetir smoke em navegador real e observar console/network.

### 2. Preparar usuario e dados de teste

- Motivo: fluxos autenticados nao foram completamente exercitados.
- Acao: definir usuario de teste, cidade/comunidade, empresa, post, comentario, mensagem e notificacao.
- Resultado esperado: demo privada executavel sem depender de dados improvisados.
- Validacao: preencher `DEMO-CHECKLIST.md` com resultado observado.

### 3. Executar roteiro manual completo

- Motivo: os gates estaticos passaram, mas isso nao substitui validacao de fluxo.
- Acao: executar `DEMO-FLOW.md` de ponta a ponta.
- Resultado esperado: Cadastro, Login, Perfil, Feed, Comentarios, Curtidas, Empresas, Busca, Mensagens, Notificacoes e Configuracoes classificados como OK, bloqueado ou com ressalva.
- Validacao: atualizar checklist com evidencias objetivas.

## Prioridade P1 - Consolidar estabilizacao ja feita

### 4. Revisar visualmente os arquivos convertidos para UTF-8

- Motivo: `ProfilePublicRoute.tsx` e `useProfileHub.ts` foram convertidos de encoding para destravar build.
- Acao: abrir as telas afetadas e conferir acentos/textos.
- Resultado esperado: nenhum texto com mojibake ou caractere substituto.
- Validacao: busca por `Ã`, `ï¿½` e `�` em `src`.

### 5. Testar registro de interesse da comunidade

- Motivo: o acesso direto ao Supabase foi movido para service.
- Acao: testar formulario com sucesso, duplicidade e Turnstile invalido.
- Resultado esperado: mesmos comportamentos anteriores, agora respeitando boundary de service.
- Validacao: conferir linha criada em `community_interest_registrations` e mensagens de toast.

### 6. Testar rascunho de post offline/online

- Motivo: `postDraftSync` passou a usar `SessionService.getCurrentUser()`.
- Acao: criar rascunho autenticado, simular offline, reconectar e sincronizar.
- Resultado esperado: rascunho preservado e enviado sem erro de autenticacao.
- Validacao: verificar storage local, tabela remota e ausencia de erros no console.

## Prioridade P2 - Reducao de ruido tecnico

### 7. Auditar candidatos a codigo morto sem remover automaticamente

- Motivo: ha duplicidades/facades entre `core` e `modules`.
- Acao: mapear imports, rotas e referencias antes de propor remocao.
- Resultado esperado: lista de candidatos com evidencia.
- Validacao: nenhum arquivo removido sem confirmacao explicita.

### 8. Registrar checklist de gates como rotina

- Motivo: lint, typecheck, build e validators sao a linha minima de seguranca.
- Acao: manter lista curta de comandos obrigatorios para cada rodada de estabilizacao.
- Resultado esperado: regressao detectada cedo.
- Validacao: todos os comandos verdes antes de demo.

### 9. Rever warnings de performance do build sem otimizar ainda

- Motivo: build passa, mas mostra chunks grandes e tempo relevante em plugins.
- Acao: apenas registrar maiores chunks e rotas associadas.
- Resultado esperado: backlog de performance baseado em evidencia.
- Validacao: nenhuma mudanca de split/vendor antes de confirmar necessidade.

## Classificacao de prontidao

- [ ] Nao pronto
  - Justificativa: nao e a melhor classificacao atual porque os gates tecnicos principais passaram e as rotas publicas basicas carregam. Ainda existem ressalvas, mas nao ha bloqueio total.

- [x] Pronto para demonstracao privada
  - Justificativa: lint, typecheck, build, governance e SSOT passaram; smoke publico basico carregou com HTTP 200. A demo privada permite controlar ambiente, dados, credenciais e explicar pendencias.

- [ ] Pronto para demonstracao publica
  - Justificativa: ainda falta validar fluxos autenticados completos, resolver/entender os `Failed to fetch` do console local e preparar dados estaveis. Demonstracao publica exige menor margem para ressalvas.

- [ ] Pronto para beta fechado
  - Justificativa: beta fechado exige validacao real de usuarios, dados, permissao, notificacoes, mensagens, recuperacao de erro e monitoramento minimo. A fase atual ainda esta em estabilizacao.

- [ ] Pronto para producao
  - Justificativa: producao exige validacao E2E, ambiente definitivo, observabilidade, seguranca operacional, dados reais, rollback e criterios de performance. Esses itens ainda nao foram comprovados nesta rodada.
