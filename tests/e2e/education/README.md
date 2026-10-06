# Education — testes E2E preservados

**Status:** pós-MVP / não certificante para ativação  
**Lifecycle:** Education permanece `paused`

Esta pasta preserva testes Playwright úteis para evolução da vertical Education,
mas **não deve ser interpretada como prova de readiness de produção**. A
certificação final exige banco/RLS/RPCs reconciliados, ambiente autenticado,
E2E determinístico e deployment do mesmo SHA.

## Inventário atual

| Suite | Estado | O que prova hoje |
| --- | --- | --- |
| `education-setup.spec.ts` | operacional, dependente de ambiente | fluxo real de setup e persistência quando credenciais/ambiente operacional estão disponíveis |
| `education-public.spec.ts` | `describe.skip` por lifecycle | cenários preservados para Explorer/Detail; não roda enquanto Education estiver pausado |
| `education-programs.spec.ts` | smoke operacional, dependente de ambiente | fixture técnica semeia programas; UI autenticada prova leitura, edição, estado `0` vagas e exclusão confirmada; criação pela UI depende de entitlement real |
| `education-leads.spec.ts` | smoke operacional, dependente de ambiente | fixture técnica semeia leads; UI autenticada prova renderização, avanço `new → contacted`, `lost` com motivo obrigatório e paginação 25/26 |
| `education-events.spec.ts` | smoke operacional, dependente de ambiente | fixture técnica semeia eventos; UI autenticada prova leitura, edição público/privado, aviso consultivo de sobreposição e exclusão; criação paga pela UI continua fora do escopo |
| `education-debug.spec.ts` | diagnóstico, `skip` | captura manual de conteúdo/screenshot; não conta como teste de aceitação |
| `education-cookie-debug.spec.ts` | diagnóstico, `skip` | inspeção manual de autenticação/cookies; não conta como teste de aceitação |
| `education-network-debug.spec.ts` | diagnóstico, `skip` | inspeção manual de conectividade; não conta como teste de aceitação |
| `education-dashboard-debug.spec.ts` | diagnóstico, `skip` | investigação manual histórica; não conta como teste de aceitação |
| `global-setup.ts` | suporte | preparação da autenticação/fixture quando aplicável |

## O que já tem cobertura fora do Playwright legado

A prontidão de código é protegida também por testes unitários, de componentes,
segurança e ratchets arquiteturais. Entre os comportamentos já cobertos estão:

- validação canônica de perfil, faixa etária, INEP e URL de proveniência;
- validação de programas e eventos;
- datas locais impossíveis em eventos;
- pipeline de leads e transições permitidas;
- motivo obrigatório para `lost` no write model;
- renderização de idade `0` e preferência por campos escolares canônicos;
- minimização de dados no formulário público;
- Analytics sem zeros/fallbacks sintéticos para estados desconhecidos;
- exportação CSV com neutralização de fórmulas;
- Billing/assinatura sem plano fictício;
- reduced-motion e semântica acessível em superfícies-chave;
- boundaries que mantêm Education fora do grafo ativo do MVP.

Essas provas reduzem risco de regressão, mas **não substituem E2E de produção**.

## Suites que não podem ser promovidas a “verdes” por permissividade

Antes da ativação pós-MVP, os smoke tests de Programas e Leads precisam deixar
de depender de padrões como:

- “há qualquer texto no body”;
- `test.skip()` porque um botão/campo esperado não apareceu;
- `waitForTimeout()` como sincronização principal;
- seletores opcionais para funcionalidades que deveriam ser obrigatórias;
- asserts que aceitam múltiplos resultados sem comprovar a operação realizada.

Um teste só conta como certificação quando falha se o comportamento real
esperado deixar de funcionar.

## Gaps E2E obrigatórios antes da ativação

1. **Setup**
   - a suite autenticada já prova formato inválido de INEP no formulário;
   - URL pública não-http(s) e faixa etária invertida são rejeitadas antes da persistência;
   - após cada tentativa inválida, a suite confirma ausência de `education_profile`;
   - compensação de criação parcial é coberta deterministicamente em
     `EducationService.setup-compensation.test.ts`: somente o draft criado pela
     tentativa falha pode ser removido; perfil preexistente é preservado;
   - não existe fault injection remoto de produção apenas para reproduzir erro;
     qualquer prova remota adicional deve usar mecanismo explicitamente seguro.

2. **Programas**
   - lifecycle autenticado prova criação, edição, reativação e exclusão com confirmação;
   - a exclusão é verificada pelo mesmo `program.id` no backend;
   - preço/vagas `0` são preservados e campos limpos são persistidos como `null`, provando zero versus ausente;
   - entitlement FREE real é usado para a criação, sem falsificar plano;
   - o mesmo lifecycle abre o diálogo em `390×844`, verifica dimensões, rolagem interna e ações alcançáveis no viewport, fechando sem persistir dados extras.

3. **Leads**
   - smoke operacional prova paginação 25/26 e mantém a contagem global da etapa nas duas páginas;
   - prova `new → contacted` com `first_contact_at` persistido;
   - prova ausência de salto/backward e ausência de ações em `enrolled`;
   - `lost` exige motivo operacional e persiste `lost_reason`;
   - falha simulada somente no `PATCH` do navegador produz feedback e mantém o lead `new` no backend;
   - idade `0` permanece visível como `0 anos`;
   - esta fatia não tem gap funcional conhecido no source; ainda precisa executar no ambiente autorizado do candidato de release.

4. **Eventos**
   - helper técnico usa as colunas canônicas `starts_at/ends_at`;
   - smoke operacional prova leitura, edição público→privado, sobreposição consultiva e exclusão com confirmação;
   - término igual/anterior ao início é rejeitado e o teste confirma que os timestamps persistidos não mudam;
   - datas locais impossíveis permanecem cobertas pelos testes canônicos de `educationEventDateTime`/core;
   - criação pela UI continua dependente de entitlement pago real e não é simulada alterando plano fora do contrato.

5. **Analytics**
   - query canônica prova erro de leitura separado de dados reais e `null` quando não há amostra de primeiro contato;
   - CSV prova célula vazia para métricas não mensuráveis e neutralização de fórmulas;
   - source/ratchets distinguem falha de assinatura, acesso negado e dados carregados;
   - ainda falta E2E de release com entitlement pago real para acesso autorizado, empty state real e download CSV pelo navegador.

6. **Planos/Billing**
   - teste dedicado prova que falhas de identidade Business, assinatura e catálogo não viram plano Free sintético;
   - ausência de policy no catálogo usa baseline somente do mesmo tier canônico;
   - plano atual e entitlements continuam vindo das autoridades de Billing;
   - falha ao resolver owner/gestor tem estado de erro próprio com retry e não é apresentada como gestor read-only;
   - ainda faltam E2E de release para owner versus gestor, checkout único e falhas reais de catálogo/checkout;
   - nenhum desses cenários deve ser produzido adulterando plano/entitlement da fixture.

7. **Explorer e Detail**
   - só podem ser reativados depois do lifecycle;
   - responsividade;
   - teclado e foco;
   - estados loading/error/empty;
   - filtros acessíveis;
   - formulário público e autoridade de atendimento;
   - smoke público contra deployment do mesmo SHA.

## Execução

As suites devem ser executadas apenas no ambiente que fornece suas dependências
explícitas. Consulte os helpers de `tests/helpers` e a configuração do
Playwright do repositório; não crie credenciais de fallback e não transforme
ausência de ambiente em sucesso.

Exemplo para uma suite específica:

```bash
npx playwright test tests/e2e/education/education-setup.spec.ts
```

A suite pública continua pausada enquanto o módulo estiver `paused`.

## Critério de certificação

Education só pode ser candidata a ativação quando:

- source gates estiverem verdes no SHA exato;
- schema/RLS/RPCs estiverem reconciliados;
- probes remotos autorizados passarem;
- E2E administrativos forem determinísticos;
- E2E públicos forem executados após a liberação do lifecycle;
- mobile, teclado e acessibilidade estiverem comprovados;
- o deployment testado corresponder ao mesmo SHA.

Até lá, esta pasta representa **material de manutenção e preparação**, não uma
certificação concluída.
