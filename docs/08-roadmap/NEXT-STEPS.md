# Próximos passos — lançamento MVP

Este arquivo é apenas o resumo de execução. O SSOT operacional é `EXECUCAO_MAIN_ONLY.md`; o lifecycle executável está nos registries de `src/app/config`.

## Escopo vigente

**Domínio ativo:** Business / Empresas.

**Capabilities horizontais ativas:** Mapa, Perto de mim, Busca, Mensagens, Notificações, Auth, Perfis/Conta, Território, Localização e Central.

Todos os demais domínios permanecem `paused` até certificação individual. Pausar vertical não pausa capability horizontal; apenas retira seus providers.

## Fechado nesta etapa

- Central de Empresas, Perto de mim e fluxo Criar/Editar convergidos visualmente com o MVP;
- Busca pública sem copy de arquitetura interna;
- horários que atravessam meia-noite tratados no catálogo;
- detalhe público de Empresa passou a usar `BusinessHoursService` como autoridade de aberto/fechado;
- teste arquitetural impede retorno da aritmética manual de horários no detalhe;
- handoff CP-016 concluído arquivado;
- `RECOVERY-ROADMAP.md` supersedido removido da árvore viva;
- especificações antigas de Feed/Post retiradas da UX ativa porque Community permanece pausado;
- `docs/README.md` e `docs/08-roadmap/README.md` agora separam claramente SSOT vivo, planos futuros e histórico.

## Agora

1. finalizar o acabamento de frontend sem ampliar escopo:
   - alinhar o shell geral de Criar/Editar;
   - fazer a última revisão responsiva e de consistência em Empresas, Busca, Mapa e Perto de mim;
   - corrigir somente problemas objetivos encontrados nessa revisão;

2. continuar a higiene final do repositório:
   - remover código órfão somente com prova de não uso;
   - arquivar documento concluído/supersedido em vez de mantê-lo como backlog vivo;
   - preservar manifests, baselines e documentos consumidos por tooling;
   - manter histórico em checkpoints/archive/Git;

3. fechar o blocker externo restante:
   - **#305:** indisponibilidade/timeout do data plane Supabase e sessão autenticada real;
   - não compensar com fallback de login, retry artificial, timeout maior, bypass OIDC ou mudança de RLS sem evidência;

4. executar um único candidato da `main`:
   - security;
   - arquitetura/SSOT;
   - lint/typecheck;
   - testes;
   - build;
   - E2E público;
   - E2E autenticado;
   - deploy exact-SHA;
   - smoke exact-SHA;

5. declarar MVP READY somente se Business + Mapa + Nearby + Busca + Mensagens + Notificações + Conta/Auth passarem no mesmo candidato.

## Proibições

- sem redirects de compatibilidade;
- sem fallback para esconder falha;
- sem feature flag local paralela ao lifecycle;
- sem mock tratado como dado real;
- sem consulta a domínio pausado para montar UI oculta;
- sem novo owner para responsabilidade já existente;
- sem documento vivo com snapshot antigo de PR/SHA tratado como estado atual;
- sem apagar histórico necessário para auditoria ou proveniência.

Detalhes, critérios completos e blocker: `EXECUCAO_MAIN_ONLY.md`.
