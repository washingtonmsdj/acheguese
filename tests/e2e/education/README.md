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
| `education-programs.spec.ts` | smoke legado | parte do fluxo de Programas; contém skips condicionais, waits temporais e asserts ainda permissivos |
| `education-leads.spec.ts` | smoke legado | carregamento e alguns cenários do pipeline; não prova integralmente as operações atuais |
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
   - manter a suite operacional;
   - provar validação de INEP, fonte pública e faixa etária contra o write model;
   - provar compensação/rollback quando criação parcial falha.

2. **Programas**
   - CRUD determinístico;
   - preço `0` versus ausente;
   - vagas `0` versus ausente;
   - confirmação de exclusão;
   - limites/capabilities reais do nicho;
   - mobile do diálogo.

3. **Leads**
   - paginação;
   - avanço válido de estágio;
   - bloqueio de salto/backward;
   - `lost` com motivo obrigatório;
   - feedback de falha de mutation;
   - idade `0`;
   - contagens do pipeline inteiro.

4. **Eventos**
   - helper técnico alinhado às colunas canônicas `starts_at/ends_at`;
   - leitura/edição/exclusão determinísticas podem usar fixture técnica;
   - criação pela UI continua dependente de entitlement pago real e não deve
     ser simulada alterando plano fora do contrato;
   - datas impossíveis;
   - início/fim coerentes;
   - público/privado;
   - confirmação de exclusão.

5. **Analytics**
   - erro de assinatura versus acesso negado;
   - dados vazios reais;
   - `null` para métricas não mensuráveis;
   - exportação CSV autorizada e conteúdo fiel.

6. **Planos/Billing**
   - plano atual vindo do status canônico;
   - owner versus gestor;
   - checkout único;
   - falha de catálogo/assinatura.

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
