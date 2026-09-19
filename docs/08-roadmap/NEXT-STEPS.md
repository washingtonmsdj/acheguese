# Próximos passos — lançamento MVP

Este arquivo é um resumo navegacional. O **SSOT operacional** continua em [`EXECUCAO_MAIN_ONLY.md`](./EXECUCAO_MAIN_ONLY.md), agora orientado ao primeiro release público.

## Objetivo imediato

Publicar um MVP pequeno, verificável e seguro no território inicial. Até esse release:

- não adicionar feature nova;
- não usar Mobilidade, Educação, IA, expansão territorial ou limpeza histórica como blocker;
- não remover capacidade válida apenas para obter gate verde;
- corrigir causa raiz dos blockers do núcleo;
- manter qualquer superfície não certificada fechada por `launchScope.ts`.

## Ordem atual

1. **Convergir a linha de release**
   - rebasear/integrar os PRs urgentes de forma sequencial, sem merge em massa;
   - priorizar alterações já aplicadas no Supabase/runtime para eliminar drift Git ↔ produção;
   - reconciliar migrations, Edge Functions e tipos gerados.

2. **Restaurar autoridade de release**
   - concluir o publisher de tipos Supabase via PR;
   - fazer GitHub Actions executar steps reais;
   - provar security/lint/typecheck/test/build verdes no mesmo SHA;
   - exigir PR + checks executáveis na `main`.

3. **Fechar Auth, Privacy e segurança do escopo público**
   - consolidar autoridade de senha/autenticação;
   - integrar hardening das boundaries usadas pelo MVP;
   - manter account deletion/purge bloqueado enquanto LGPD purge não estiver certificado;
   - manter exportação LGPD desligada até exact-SHA + probe real;
   - confirmar contato/DPO/origem pública sem placeholders.

4. **Certificar apenas o núcleo do MVP**
   - Auth/conta e Profile;
   - Home territorial;
   - Comunidade básica;
   - Empresas/Gastronomia/Serviços;
   - Classificados;
   - Busca;
   - Mapa/Perto de Mim;
   - Pontos Turísticos.
   - Eventos e Vagas entram somente se passarem pelo mesmo padrão; caso contrário, pausar no launch scope antes do release.

5. **Executar candidato exact-SHA**
   - corrigir contratos de release divergentes;
   - security + lint + typecheck + testes + build;
   - E2E funcional e mobile sem placeholder;
   - deploy real do mesmo SHA;
   - smoke do domínio público e fluxos autenticados principais.

6. **Lançar e observar**
   - liberar apenas superfícies certificadas;
   - acompanhar erros, feedback e comportamento real;
   - corrigir regressões do MVP antes de ampliar escopo.

## Fica para durante o MVP

- hardening adicional que não seja boundary compartilhada do núcleo;
- refinamentos de UX/acessibilidade não bloqueadores;
- performance guiada por métricas reais;
- observabilidade e dashboards adicionais;
- conteúdo/cobertura territorial incremental;
- Eventos/Vagas, se forem pausados no primeiro release.

## Fica para depois do MVP

- Mobilidade;
- Educação;
- Comunicação global;
- Alertas/Problemas/Achados e Perdidos/Safety familiar;
- Cupons, Gamificação e Analytics público;
- IA/virtual try-on;
- expansão de monetização;
- rollout dos 170 bairros e ETL completo de boundaries;
- limpeza das refs históricas remanescentes;
- redesigns/refactors amplos sem impacto de lançamento.

## Critério de MVP READY

O release só recebe `MVP READY` quando o escopo efetivamente habilitado estiver certificado em **um único SHA**: Git/runtime reconciliados, gates executados de verdade, autorização sensível testada, deploy real comprovado e smoke de produção sem erro crítico recorrente.

Superfícies explicitamente pausadas não precisam ser concluídas para o primeiro release; precisam apenas permanecer inacessíveis, não interferir no núcleo e não compartilhar um risco de segurança aberto com o MVP.
