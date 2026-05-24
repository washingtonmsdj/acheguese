# Correcoes De Seguranca Aplicadas

Este documento registra o baseline atual validado por `npm run security:scan`.

## Escopo

- Renderizacao de HTML de usuario centralizada em `SafeHtml`.
- Links externos validados por componente seguro.
- Imagens de usuario validadas por componente seguro.
- CSP configurada em `vercel.json`.
- Edge Functions revisadas para headers de seguranca centralizados.
- Credenciais removidas de arquivos versionados de ambiente.
- Scanner de seguranca portavel entre Windows, Linux e CI.

## Regras Operacionais

- `dangerouslySetInnerHTML` so pode existir em `src/shared/components/security/SafeHtml.tsx`.
- Atribuicao direta a `.innerHTML` deve ser evitada; excecoes exigem sanitizacao explicita e comentario `// SAFE:` ou `// SEGURO:`.
- Dados sensiveis devem ficar em variaveis de ambiente e secrets da plataforma, nunca em arquivos versionados.
- Mudancas em CSP, RLS, Edge Functions, autenticacao ou permissao exigem revisao de seguranca.

## Gates Obrigatorios

```bash
npm run security:validate
npm run security:scan
npm run lint:security
npm run validate:ssot
npm run build
```

## Status

Baseline ativo em 2026-05-24. Este arquivo deve ser atualizado quando novas protecoes forem adicionadas ou quando uma excecao de seguranca for aprovada.
