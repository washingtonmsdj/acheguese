# Security Policy

Este arquivo é a entrada para regras de segurança não negociáveis e gates de release do Achegue-se. Detalhes de implementação devem permanecer nas autoridades documentais já existentes; não criar um segundo plano de segurança concorrente.

## Autoridades canônicas

- Política e gates de segurança: [`SECURITY.md`](./SECURITY.md)
- Diretrizes de desenvolvimento seguro: [`docs/09-reference/SECURITY.md`](./docs/09-reference/SECURITY.md)
- Security Authority: [`docs/09-reference/governance/security/SECURITY_AUTHORITY.md`](./docs/09-reference/governance/security/SECURITY_AUTHORITY.md)
- Índice documental: [`docs/README.md`](./docs/README.md)
- Execução operacional atual: [`docs/08-roadmap/EXECUCAO_MAIN_ONLY.md`](./docs/08-roadmap/EXECUCAO_MAIN_ONLY.md)

Checkpoints antigos em `docs/10-archive/` são evidência histórica, não autoridade atual.

## Regras não negociáveis

- Nenhum segredo real em arquivo versionado.
- Nenhuma `service_role`, JWT signing secret, provider secret, cron secret ou credencial administrativa em browser code ou variável `VITE_*`.
- Nenhum fallback permissivo de CORS em produção.
- Nenhum caminho de sucesso falso para provider externo em produção.
- Nenhum body bruto sem guarda centralizada de tamanho e content-type.
- Nenhum endpoint crítico sem method guard, validação, autenticação/autorização quando aplicável, headers seguros e controle de abuso apropriado.
- Nenhuma mudança permanente de schema de produção sem migration versionada equivalente.
- Nenhuma Edge Function deve ser tratada como canônica sem source equivalente na `main`.
- Nenhuma mutação manual de produção fora de contenção de incidente; mudança emergencial precisa ser reconciliada em Git imediatamente.
- Nenhuma nova RPC `SECURITY DEFINER` exposta sem desenho explícito de autorização, `search_path` fixo, grants intencionais e testes negativos.
- O schema `private` não pode ser exposto pela Data API sem decisão de segurança e revisão de grants.
- Releases precisam ser atribuíveis a um SHA conhecido da `main`.
- Decisão de autorização no frontend é somente UX; a autoridade permanece em RLS, RPC, Edge Function ou backend confiável.

## Política de drift de produção

GitHub é a fonte pretendida para código persistente da aplicação, migrations e source de Edge Functions. O processo de release deve detectar, bloquear ou reconciliar explicitamente quando:

- uma migration existe remotamente e não existe em `supabase/migrations/`;
- uma migration versionada esperada para release está ausente no remoto;
- uma Edge Function implantada diverge do source versionado;
- um deployment de produção aponta para SHA diferente do release aprovado;
- uma mudança sensível não pode ser mapeada para commit revisável.

Merge, migration versionada ou status de provider não equivalem sozinhos a `PROD/DONE`. Runtime correspondente precisa de prova pós-rollout.

## Secret handling

### Valores públicos

Somente valores explicitamente públicos podem existir em configuração Vite/browser. A chave pública/anon do Supabase não substitui autorização; RLS/RPC continuam autoritativos.

### Valores privilegiados

Devem permanecer nos secret stores corretos e nunca ser commitados ou expostos por `VITE_*`:

- Supabase `service_role`;
- JWT signing secrets;
- billing/provider webhook secrets;
- API/provider private keys;
- cron/authentication secrets;
- credenciais administrativas.

### Templates

Arquivos de ambiente versionados devem conter apenas placeholders ou configuração deliberadamente pública. Preferir nomes explícitos de template e manter validação automatizada contra credenciais reais.

## Supabase / Edge boundary

- Escritas sensíveis devem usar RLS, RPC segura ou broker Edge confiável.
- `SECURITY DEFINER` é excepcional, não padrão.
- RPC privilegiada não pode confiar apenas no papel `authenticated`.
- Edge Functions devem reutilizar helpers centralizados de CORS/segurança quando disponíveis.
- Mutação crítica não pode depender apenas de rate limit best-effort em memória; controles autoritativos devem falhar fechado.
- Mudança manual de Supabase precisa ser reconciliada em Git antes do próximo release normal.

## Checks obrigatórios

Executar antes de release ou mudança sensível, conforme o escopo:

```powershell
npm run security:validate
npm run security:config:validate
npm audit
npm run validate:migrations
npm run validate:migrations:remote
npm run validate:security-authority
npm run validate:ssot
npm run validate:hardcodes
npm run validate:architecture:incremental
npm run validate:architecture:governance
npm run validate:taxonomy
npm run validate:docs-structure
npm run typecheck
npm run build
node scripts/verify-deploy-ready.mjs
```

`verify-deploy-ready.mjs` deve usar o ambiente de release e falhar em valores ausentes/placeholders. Se CI/runner externo não iniciar os steps, isso deve ser tratado como indisponibilidade do gate, não como teste aprovado.

## Prioridades atuais — 2026-08-26

1. restaurar gates de CI confiáveis (#17);
2. proteger `main` contra force-push/deleção e exigir checks executáveis (#28);
3. continuar hardening sistemático de RLS/RPC/grants sem ampliar superfícies públicas apenas para silenciar advisors (#85);
4. reconciliar o fluxo LGPD antes de qualquer rollout de delete/export (#68);
5. estabilizar SSOT/estrutura antes de refatoração visual ampla (#51);
6. certificar fluxos funcionais reais dos módulos; `paused`, placeholder ou fallback não contam como sucesso (#50).

O estado operacional e a ordem de execução ficam em [`docs/08-roadmap/EXECUCAO_MAIN_ONLY.md`](./docs/08-roadmap/EXECUCAO_MAIN_ONLY.md).