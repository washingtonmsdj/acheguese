# Private Alpha Readiness

Status: codigo e perimetro prontos; recuperacao e ativacao dos testadores pendentes
Data: 2026-07-19
Escopo: acesso controlado e gates das superficies ativas

## Objetivo

Liberar o Achegue-se para um grupo pequeno de testadores em ambiente nao
produtivo, sem caracterizar lancamento publico e sem flexibilizar controles de
seguranca para acelerar o teste.

## Fontes De Verdade

- superficies ativas: `src/config/launchScope.ts`;
- seguranca Supabase: `docs/governance/security/SUPABASE_SECURITY_MODEL.md`;
- acesso alpha: migrations `20260718210000`, `20260718211000` e
  `20260718230000`;
- exposicao do deployment: `deployment/release-stage.json`;
- testes remotos: `tests/helpers/operational-env.ts`;
- escala de Comunidade: `plans/COMMUNITY_SCALE_READINESS_PLAN.md`.

## Dentro Do Escopo

- Home, Comunidades, Empresas, Gastronomia, Servicos, Classificados, mapa,
  busca e demais superficies marcadas como ativas no launch scope;
- toda criacao de identidade, inclusive administrativa, somente por convite de
  e-mail consumivel;
- login de usuarios existentes;
- RLS real para Comunidade e Posts;
- build, testes, verificadores de seguranca, migrations e smoke E2E;
- registro honesto de bloqueios externos e dominios pausados.

## Fora Do Escopo

- lancamento publico;
- Mobilidade, Eventos completos, vagas e demais superficies pausadas;
- prometer milhares de requisicoes por segundo antes da carga em staging;
- usar o projeto de producao como alvo de testes destrutivos ou de carga.

## Checklist

- [x] Confirmar o launch scope e separar gates de dominios pausados.
- [x] Corrigir carregamento allowlisted de credenciais nas suites operacionais.
- [x] Tornar os usuarios de E2E efemeros e confirmar cleanup remoto.
- [x] Validar o acesso comunitario autenticado com e sem residencia verificada.
- [x] Modernizar a suite RLS de Posts e validar `9/9` casos no remoto.
- [x] Implementar gate de cadastro por convite no banco, auditavel e fail-closed.
- [x] Criar comandos de emissao e revogacao restritos a ambiente nao produtivo.
- [x] Aplicar e provar o gate de alpha no Supabase remoto de desenvolvimento.
- [x] Separar o gate operacional do alpha da auditoria de dominios pausados.
- [x] Executar todos os gates locais de release sem regressao.
- [x] Executar a suite operacional apenas para superficies ativas.
- [x] Configurar monitoramento Sentry pseudonimo no ambiente de Preview.
- [x] Manter a aplicacao fora dos dominios publicos durante a alpha privada.
- [x] Proteger o Preview com Vercel Authentication e `noindex`.
- [x] Criar kill switch auditavel para pausar admissoes e revogar convites ativos.
- [x] Definir politica executavel de backup e recuperacao do Supabase/Storage.
- [x] Auditar a disponibilidade de restore do banco remoto sem escrita.
- [ ] Habilitar backup diario acessivel no Supabase remoto.
- [ ] Ensaiar restauracao de banco e Storage em projeto descartavel separado.
- [ ] Definir contato nominal de incidente e canal de feedback dos testadores.
- [ ] Validar SMTP/Auth com um e-mail real convidado.
- [ ] Resolver no Supabase os tres registros historicos que quebram as paginas
      281 a 283 do Auth Admin com `perPage=1`, sem apagar identidades desconhecidas.
- [ ] Cadastrar os e-mails reais dos primeiros testadores.
- [ ] Fazer smoke manual final com uma conta convidada real.

## Evidencias De 2026-07-18

- `npm test`: 315 arquivos e 1.707 testes aprovados;
- `npm run test:operational`: 8 arquivos e 58 testes remotos aprovados;
- `community-access-gate.spec.ts`: 2 fluxos Chromium autenticados aprovados
  contra o runtime Vite 8;
- `npm run verify:deploy`: projeto pronto para deploy;
- `npm run build`: Vite 8.1.5 gerou o bundle de producao;
- `npm audit`: zero vulnerabilidades conhecidas;
- `npm run security:advisor:residuals`: 75 achados, todos ligados a excecoes
  explicitas e com cache key exata;
- `tests/operational/professional-review-authz-runtime.test.ts`: anonymous,
  cross-owner e input invalido rejeitados; solicitante legitimo aprovado;
- Auth Admin: lotes recentes funcionam e nao restaram usuarios sinteticos do
  teste de Reviews. Tres registros historicos ainda causam erro interno em
  paginacao profunda e exigem diagnostico pelo Dashboard/Supabase Support.
- `session-rpc` autenticado respondeu HTTP 200 para a origem local `5174`, com
  `Access-Control-Allow-Origin` exato.
- Vercel Hobby usa protecao Standard `all_except_custom_domains`: os URLs de
  deployment exigem Vercel Authentication, mas dominios de producao nao podem
  receber protecao total nesse plano.
- O SSOT `deployment/release-stage.json` faz o build de producao gerar somente
  a pagina fechada, sem bundle da aplicacao, formulario, script ou redirect. A
  aplicacao completa e gerada apenas em Preview protegido.
- `acheguese.com.br` respondeu HTTP 200 com pagina fechada, `noindex`, CSP e
  HSTS; o HTML nao referencia o bundle da aplicacao.
- O Preview remoto da aplicacao completa foi gerado com 5.866 modulos, zero
  vulnerabilidades no install e respondeu com Vercel Authentication e
  `X-Robots-Tag: noindex` para acesso anonimo.
- Sentry foi habilitado tambem no Preview com ambiente `private-alpha`, replay
  mascarado, `sendDefaultPii: false`, remocao de payload/query/cookies/headers
  e usuario limitado ao identificador pseudonimo.
- O kill switch remoto bloqueou a emissao de convite enquanto pausado, retornou
  codigo de falha controlado e terminou retomado com zero convites ativos.

## Evidencias De 2026-07-19

- `supabase backups list --project-ref <development> --output json` retornou
  `backups: []` e `pitr_enabled: false`; `walg_enabled: true` nao oferece ponto
  de restauracao acessivel ao operador.
- O projeto remoto permanece `ACTIVE_HEALTHY` em `us-west-2`, mas recuperacao
  ainda bloqueia o inicio da alpha com pessoas reais.
- `backup:database:status` e `alpha:backup:gate` transformam esse estado em
  diagnostico e gate reproduziveis.
- O backup de Storage passou a ser atomico, inventariado e verificado por
  SHA-256. Restore no projeto de origem e alvo produtivo e recusado.
- Smoke real exportou e verificou localmente `65` objetos em `12` buckets,
  totalizando `23.926.702` bytes; o artefato sensivel foi removido depois da
  verificacao.
- `npm test -- --maxWorkers=2`: `317` arquivos e `1.726` testes aprovados.
- `npm run verify:deploy`: arquitetura, SSOT, migrations remotas, Security
  Authority e configuracao de seguranca aprovadas.
- O script redundante `backup-config.ts` foi removido: configuracao, migrations
  e funcoes ja possuem SSOT versionado no Git.

Os residuais PostGIS dependem do owner `supabase_admin`; a protecao HIBP do
Auth depende de plano/configuracao do Dashboard ou Management API. Eles
permanecem documentados em `docs/governance/security/EXCEPTIONS.md` e impedem
afirmar prontidao para publico geral, mas nao abrem cadastro fora da allowlist
do alpha.

## Operacao De Convites

Os comandos exigem `OPERATIONAL_TEST_TARGET=development|staging`, project ref
correspondente e `OPERATIONAL_TEST_CONFIRM=NON_PRODUCTION_REMOTE_CONFIRMED`.
Secrets permanecem somente no ambiente local/CI.

```powershell
npm run alpha:invite -- pessoa@example.com
npm run alpha:revoke -- pessoa@example.com
npm run alpha:status
npm run alpha:pause
npm run alpha:resume
```

O browser nunca recebe `service_role`. O e-mail e normalizado no banco, o
convite expira, possui limite de uso e cada emissao, consumo ou revogacao gera
auditoria sem copiar o e-mail para o log.

`alpha:pause` revoga atomicamente todos os convites ainda ativos e impede tanto
novos convites quanto novas identidades. Contas existentes nao sao apagadas.
`alpha:resume` reabre somente a emissao e o consumo de novos convites; convites
revogados pela pausa nao sao reativados.

## Perimetro De Deployment

Enquanto `publicLaunchApproved` for `false`, pushes para `main` publicam apenas
a pagina fechada nos dominios de producao. A aplicacao para testadores deve ser
gerada como Preview e acessada pela protecao da Vercel. Nao publicar links
compartilhaveis em commits, issues, documentos ou canais publicos; eles sao
credenciais bearer e devem ser revogados ao final da rodada.

Liberar a aplicacao no dominio publico exige alterar o SSOT de release em um
commit revisado, executar todos os gates e resolver os bloqueios de lancamento
publico. Uma variavel de ambiente isolada nao pode substituir essa aprovacao
versionada.

## Criterio De Pronto

O alpha pode iniciar quando um cadastro sem convite falhar, um convite valido
funcionar uma unica vez, os gates ativos passarem, nao houver residuos de E2E e
os responsaveis operacionais souberem pausar acesso e receber incidentes. Deve
existir tambem backup diario acessivel e um restore ensaiado em projeto
descartavel. Isso nao equivale a prontidao para publico geral.

O gate de cadastro nao substitui o perimetro. No plano Hobby, a aplicacao fica
em Preview protegido e o dominio de producao serve somente a pagina fechada.
Nao substituir essa barreira por segredo ou senha no bundle do frontend.

`npm run test:operational` executa apenas o escopo ativo acima. A auditoria
historica completa, incluindo Mobilidade pausada, permanece disponivel em
`npm run test:operational:all` e nao e usada como evidencia de release do alpha.
