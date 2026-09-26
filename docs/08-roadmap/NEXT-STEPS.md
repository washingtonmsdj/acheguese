# Próximos passos — lançamento MVP

Este arquivo é apenas o resumo de execução. O SSOT operacional é `EXECUCAO_MAIN_ONLY.md`; o lifecycle executável está nos registries de `src/app/config`.

## Escopo vigente

**Domínio ativo:** Business / Empresas.

**Capabilities horizontais ativas:** Mapa, Perto de mim, Busca, Mensagens, Notificações, Auth, Perfis/Conta, Território, Localização e Central.

Todos os demais domínios permanecem `paused` até certificação individual. Pausar vertical não pausa capability horizontal; apenas retira seus providers.

## Agora

1. continuar a higiene final do repositório:
   - remover código órfão comprovado;
   - remover documentos supersedidos da árvore viva;
   - manter histórico em checkpoints/archive/Git;
   - não apagar base pós-MVP com owner legítimo;

2. fechar o blocker externo restante:
   - **#305:** indisponibilidade/timeout do data plane Supabase e sessão autenticada real;
   - não compensar com fallback de login, retry artificial, timeout maior, bypass OIDC ou mudança de RLS sem evidência;

3. executar um candidato único da `main`:
   - security;
   - arquitetura/SSOT;
   - lint/typecheck;
   - testes;
   - build;
   - E2E público;
   - E2E autenticado;
   - deploy exact-SHA, incluindo Edge Functions pelo caminho automático já restaurado;
   - smoke exact-SHA;

4. declarar MVP READY somente se Business + Mapa + Nearby + Busca + Mensagens + Notificações + Conta/Auth passarem no mesmo candidato.

## Proibições

- sem redirects de compatibilidade;
- sem fallback para esconder falha;
- sem feature flag local paralela ao lifecycle;
- sem mock tratado como dado real;
- sem consulta a domínio pausado para montar UI oculta;
- sem novo owner para responsabilidade já existente;
- sem documento vivo com snapshot antigo de PR/SHA tratado como estado atual.

Detalhes, critérios completos e blocker: `EXECUCAO_MAIN_ONLY.md`.
