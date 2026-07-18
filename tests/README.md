# Testes

Este documento define a taxonomia canonica das suites do Achegue-se. Testes
locais deterministas, testes remotos operacionais e E2E possuem runners
separados; um comando local nunca deve acessar o Supabase remoto por acidente.

## Suites

| Suite                              |                         Local |          Rede | Paralelismo | Comando                    |
| ---------------------------------- | ----------------------------: | ------------: | ----------: | -------------------------- |
| Unitarios, contratos e arquitetura |                           sim |      proibida | por arquivo | `npm test`                 |
| Operacional Supabase               |                           nao |   obrigatoria |      serial | `npm run test:operational` |
| E2E de browser                     | app local + backend declarado | conforme spec |      serial | `npx playwright test ...`  |

O runner deterministico usa no maximo quatro workers por padrao para evitar
pressao imprevisivel de memoria em maquinas locais e runners compartilhados.
O CI pode ajustar esse limite com `VITEST_MAX_WORKERS=<inteiro-positivo>` sem
alterar a separacao entre suites. Testes operacionais permanecem com um worker.
Variaveis publicas usam `.env.example` como baseline deterministico do runner;
arquivos locais podem sobrescreve-las, mas nunca sao requisito para a suite.

Testes deterministas ficam colocalizados em `src/**` ou nas pastas
`tests/architecture`, `tests/security` e equivalentes. Qualquer teste que
consulte ou altere um backend real pertence a `tests/operational`.

## Alvo Operacional

O runner operacional falha antes de coletar testes quando o alvo nao foi
autorizado. Para Supabase remoto, o operador deve fornecer:

```text
OPERATIONAL_TEST_TARGET=development|staging
OPERATIONAL_TEST_PROJECT_REF=<project-ref-nao-producao>
OPERATIONAL_TEST_CONFIRM=NON_PRODUCTION_REMOTE_CONFIRMED
```

`VITE_SUPABASE_URL` precisa ser HTTPS e corresponder exatamente a
`https://<project-ref>.supabase.co`. `OPERATIONAL_TEST_TARGET=production` e
rejeitado. O alvo `local` aceita somente enderecos de loopback.

Para E2E contra Supabase remoto, a origem exata de `PLAYWRIGHT_BASE_URL` deve
existir em `ALLOWED_ORIGINS` no projeto de development/staging. `localhost` e
`127.0.0.1`, assim como portas diferentes, nao sao equivalentes para CORS.

Credenciais e chaves permanecem em `.env.local` ou no secret manager do CI e
nunca sao versionadas. Suites que precisam de `service_role`, motorista ou
administrador E2E declaram esse requisito no `describeOperational` e sao
ignoradas quando a credencial dedicada nao existe.

## Identidade De Teste

- testes nunca redefinem senha de usuario encontrado no ambiente;
- atores arbitrarios de fixtures usam magic link administrativo efemero;
- fluxos administrativos usam apenas `E2E_ADMIN_EMAIL` e
  `E2E_ADMIN_PASSWORD`;
- fixtures de UI devem pertencer a uma conta E2E dedicada;
- clientes Supabase de teste nascem somente em
  `tests/helpers/operational-env.ts`.

## Convencoes

- arquivos: `*.test.ts`, `*.test.tsx` ou `*.spec.ts`;
- cada teste deve limpar somente as fixtures que criou;
- IDs, e-mails e nomes de fixture devem ser identificaveis e nao colidir com
  dados de produto;
- autorizacao negativa, ownership e isolamento entre atores sao obrigatorios
  para mutations;
- nenhum teste deve tratar falta de ambiente como sucesso silencioso no runner
  operacional.
- specs de browser devem aguardar estados observaveis e usar a acao real de
  recuperacao da UI para falhas transitorias; sleeps nao substituem readiness.

## Comandos

```powershell
npm test
npm run test:operational
npm run test:ssot
npm run test:regression
npx playwright test tests/e2e/<arquivo>.spec.ts --project=chromium
```

`test:release:smoke` preserva o smoke historico de SSOT, browser e regressao;
nao substitui as suites completas acima.
