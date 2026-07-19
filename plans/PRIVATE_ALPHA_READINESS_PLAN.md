# Private Alpha Readiness

Status: codigo pronto; ativacao operacional pendente
Data: 2026-07-18
Escopo: acesso controlado e gates das superficies ativas

## Objetivo

Liberar o Achegue-se para um grupo pequeno de testadores em ambiente nao
produtivo, sem caracterizar lancamento publico e sem flexibilizar controles de
seguranca para acelerar o teste.

## Fontes De Verdade

- superficies ativas: `src/config/launchScope.ts`;
- seguranca Supabase: `docs/governance/security/SUPABASE_SECURITY_MODEL.md`;
- acesso alpha: migrations `20260718210000` e `20260718211000`;
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
- [ ] Confirmar backup, monitoramento, contato de incidente e forma de feedback.
- [ ] Ativar protecao de acesso no deployment para impedir descoberta da URL.
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
```

O browser nunca recebe `service_role`. O e-mail e normalizado no banco, o
convite expira, possui limite de uso e cada emissao, consumo ou revogacao gera
auditoria sem copiar o e-mail para o log.

## Criterio De Pronto

O alpha pode iniciar quando um cadastro sem convite falhar, um convite valido
funcionar uma unica vez, os gates ativos passarem, nao houver residuos de E2E e
os responsaveis operacionais souberem pausar acesso e receber incidentes. Isso
nao equivale a prontidao para publico geral.

Se a URL do ambiente tambem precisar ficar invisivel ao publico, o gate de
cadastro nao basta: habilitar Vercel Deployment Protection (ou controle de
acesso equivalente no provedor) antes de enviar o link. Nao substituir essa
barreira por segredo ou senha implementados no bundle do frontend.

`npm run test:operational` executa apenas o escopo ativo acima. A auditoria
historica completa, incluindo Mobilidade pausada, permanece disponivel em
`npm run test:operational:all` e nao e usada como evidencia de release do alpha.
