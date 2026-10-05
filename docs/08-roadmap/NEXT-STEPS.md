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
- `docs/README.md` e `docs/08-roadmap/README.md` separam SSOT vivo, planos futuros e histórico;
- **#305 — Supabase** encerrado após smoke autenticado real de produção com Conta + Business no candidato certificado, sem fallback de Auth/RLS;
- **#445 — Vercel** encerrado após a identidade canônica de release comprovar runtime `exact/equivalent`; não foi necessário forçar deployment quando o fingerprint deployável permaneceu idêntico;
- Account passou nos três viewports do smoke autenticado;
- Business lifecycle e Business Messaging passaram no mesmo gate de release;
- o build canônico confirmou `npm audit --omit=dev` com zero vulnerabilidades de produção.

## Agora

1. finalizar o acabamento de frontend sem ampliar escopo:
   - alinhar o shell geral de Criar/Editar onde ainda houver divergência visual objetiva;
   - fazer a última revisão responsiva e de consistência em Empresas, Busca, Mapa e Perto de mim;
   - revisar Mensagens e Notificações como capabilities horizontais, sem fazê-las depender de Business;
   - corrigir somente problemas objetivos encontrados nessa revisão;

2. continuar a higiene final do repositório:
   - remover código órfão somente com prova de não uso;
   - arquivar documento concluído/supersedido em vez de mantê-lo como backlog vivo;
   - preservar manifests, baselines e documentos consumidos por tooling;
   - manter histórico em checkpoints/archive/Git;
   - não apagar módulos pós-MVP apenas por estarem `paused`;

3. preservar a prontidão do candidato:
   - **não há blocker externo ativo conhecido** para o primeiro release;
   - regressão de Supabase/Auth, release identity ou runtime reabre o gate correspondente;
   - todo delta deployável novo exige nova prova de Production `READY` ou equivalência de fingerprint aceita pela política canônica;
   - somente paths explicitamente classificados como skippable podem receber `Ignored Build Step`; documentos críticos de governança que participam do fingerprint, como `EXECUCAO_MAIN_ONLY.md`, exigem nova prova de release mesmo sem alterar bytes de aplicação;

4. manter as dívidas corretamente fail-closed:
   - #68 continua como dívida LGPD avançada, sem habilitar exportação/purge antes de certificação;
   - #85 permanece hardening contínuo, não blocker genérico de lançamento;
   - #28 depende de permissão administrativa suficiente para comprovar a proteção clássica da `main`;
   - #447/#448 continuam condicionadas à autoridade OrdaX e não bloqueiam Business/Mapa/Nearby/Busca/Mensagens do Achegue-se;
   - #50/#118 continuam pós-MVP;

5. promover o primeiro release somente mantendo verdes os owners ativos:
   - Business;
   - Mapa;
   - Perto de mim;
   - Busca;
   - Mensagens;
   - Notificações;
   - Conta/Auth;
   - lifecycle/SSOT;
   - security/build/release identity.

## Proibições

- sem redirects de compatibilidade;
- sem fallback para esconder falha;
- sem feature flag local paralela ao lifecycle;
- sem mock tratado como dado real;
- sem consulta a domínio pausado para montar UI oculta;
- sem novo owner para responsabilidade já existente;
- sem documento vivo com snapshot antigo de blocker tratado como estado atual;
- sem apagar histórico necessário para auditoria ou proveniência;
- sem commit artificial de runtime para contornar `Ignored Build Step` ou equivalência de fingerprint;
- sem ampliar a allowlist de paths skippable apenas para evitar build de um input crítico de release;
- sem `npm audit fix --force`/upgrade major apenas para silenciar finding dev-only quando o audit de produção está limpo.

Detalhes e critérios completos: `EXECUCAO_MAIN_ONLY.md`.
