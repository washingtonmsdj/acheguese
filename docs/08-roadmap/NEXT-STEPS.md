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
- detalhe público de Empresa usa `BusinessHoursService` como autoridade de aberto/fechado;
- teste arquitetural impede retorno da aritmética manual de horários no detalhe;
- handoff CP-016 concluído arquivado;
- `RECOVERY-ROADMAP.md` supersedido removido da árvore viva;
- especificações antigas de Feed/Post retiradas da UX ativa porque Community permanece pausado;
- **#305 — Supabase** encerrado após smoke autenticado real no runtime de produção, sem fallback, bypass de OIDC ou relaxamento de RLS;
- leitura privada de Profile usada por Business corrigida para o boundary canônico de broker;
- release identity passou a reconhecer corretamente runtime `exact` ou `equivalent` antes de consultar status do provider;
- cleanup técnico de Business E2E passou a usar `profile-rpc/deactivateBusiness`, sem escrita direta em `profiles`/`business_data`.

## Blocker atual de release

- **#445 — Vercel / certificação de produção permanece aberto.**
- O runtime Production atual é aceito como `equivalent` quando o fingerprint deploy-relevant é idêntico; nesse caso o status Vercel do commit não-deploy é corretamente ignorado.
- O broker OIDC e Conta autenticada já passam.
- O gate ainda precisa completar **Business lifecycle + Business Messaging** no mesmo smoke autenticado.
- A falha mais recente é de harness: o job autenticado fornecia `E2E_SUPABASE_*`, mas o novo processo Playwright de Business exigia também `VITE_SUPABASE_*`. A correção deve manter ambos apontando para o mesmo endpoint/key públicos e não pode adicionar service-role key.

## Agora

1. fechar #445 com evidência, não com bypass:
   - corrigir o env público do smoke autenticado;
   - provar release identity `exact` ou `equivalent`;
   - provar Conta;
   - provar Business lifecycle;
   - provar Business Messaging;
   - exigir `All Tests Passed` no push da `main`;

2. finalizar o acabamento de frontend sem ampliar escopo:
   - revisar shell de Criar/Editar e consistência em Empresas, Busca, Mapa e Perto de mim;
   - corrigir somente problemas objetivos encontrados;

3. continuar hardening sem transformar dívida controlada em blocker artificial:
   - priorizar drift live comprovado nas superfícies ativas;
   - preservar gates fail-closed de LGPD;
   - não reabrir módulos pós-MVP para justificar arquitetura;

4. declarar MVP READY somente quando Business + Mapa + Nearby + Busca + Mensagens + Notificações + Conta/Auth estiverem certificados para o conteúdo de runtime candidato.

## Proibições

- sem redirects de compatibilidade;
- sem fallback para esconder falha;
- sem feature flag paralela ao lifecycle;
- sem mock tratado como dado real;
- sem consulta a domínio pausado para montar UI oculta;
- sem novo owner para responsabilidade já existente;
- sem documento vivo com snapshot antigo de SHA tratado como estado atual;
- sem commit artificial de runtime para contornar `Ignored Build Step`;
- sem relaxar release identity `exact/equivalent`, Auth, RLS ou grants para fazer #445 passar.

Detalhes e critérios completos: `EXECUCAO_MAIN_ONLY.md`.
