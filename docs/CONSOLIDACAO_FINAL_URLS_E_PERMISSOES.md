# Consolidacao: URLs Publicas e Permissoes

Atualizado: 2026-06-05
Status: ativo

Este documento consolida a politica atual de URLs publicas e a separacao entre URL publica de entidade e mini-site premium.

## Mapa Atual de URLs Publicas

| Tipo | URL publica preferencial | Fallback tecnico | SSOT |
| --- | --- | --- | --- |
| Perfil pessoal | `/u/:username` | - | `buildPublicProfileUrl()` |
| Comunidade | `/:communitySlug` | `/comunidade/:state/:city/:territorySlug` | `community_public_aliases` + routing services |
| Empresas da comunidade | `/:communitySlug/empresas` | `/empresas/:state/:city/:territorySlug` | `BusinessUrlService` + territory SSOT |
| Gastronomia da comunidade | `/:communitySlug/gastronomia` | `/gastronomia/:state/:city/:territorySlug` | `GastronomyUrlService` + territory SSOT |
| Empresa/restaurante | `/:communitySlug/:slug` | `/empresas/:state/:city/:district/:slug` | `BusinessUrlService` |
| Mini-site premium | `/p/:slug` | - | `buildBusinessPremiumUrl()` + `BusinessUrlService` |
| Profissional | `/profissionais/:state/:city/:slug` | - | `ProfessionalUrlService` |

## Regras de Produto

- Comunidade curta e a URL que o usuario deve ver quando o alias for unico: `/santa-cruz`.
- Listagens usam o contexto da comunidade: `/santa-cruz/empresas` e `/santa-cruz/gastronomia`.
- Detalhe de empresa e restaurante usa a mesma URL publica: `/santa-cruz/padaria-do-joao`.
- `/santa-cruz/empresas/padaria-do-joao` e `/santa-cruz/gastronomia/pizzaria-estrela` sao aliases legados e redirecionam.
- `/gastronomia/:state/:city/:district/:slug` e legado para detalhe; o canonical aponta para a URL publica de empresa.
- `/p/:slug` continua reservado ao mini-site premium. Ele nao substitui a URL publica canonica da empresa.

## Relacao Empresa e Gastronomia

Uma empresa pode ter vertical de gastronomia ativo. A identidade publica continua sendo a empresa:

```text
business_data
  -> gastronomy_profiles
  -> public detail: /:communitySlug/:slug
  -> premium site: /p/:slug
```

A listagem de gastronomia e especifica do modulo, mas o detalhe evita duplicacao de entidade:

```text
/santa-cruz/gastronomia              -> lista restaurantes da comunidade
/santa-cruz/pizzaria-estrela         -> detalhe publico do restaurante
/p/pizzaria-estrela                  -> mini-site premium, quando habilitado
```

## Permissoes de Gastronomia

Permissoes e limites de funcionalidades continuam centralizados em `GastronomyPermissions`.

Planos atuais:

| Plano | Uso |
| --- | --- |
| `free` | Presenca basica, cardapio simples e contato |
| `pro` | Recursos avancados de cardapio, pedidos e promocoes |
| `delivery` | Recursos de entrega, rastreamento e operacao expandida |

Regra de implementacao:

- Nunca testar plano diretamente em UI compartilhada quando existir helper em `GastronomyPermissions`.
- Nunca construir URL de empresa/restaurante manualmente em componente; usar service SSOT.
- Nunca usar `/p/:slug` como link publico geral da empresa sem permissao premium apropriada.
- Nunca gerar perfil publico com `id`/UUID; `/u/:username` exige `username` publico.

## Redirecionamentos Esperados

```text
/comunidade/santa-cruz                  -> /santa-cruz
/comunidade/santa-cruz/empresas         -> /santa-cruz/empresas
/santa-cruz/empresas/padaria-do-joao    -> /santa-cruz/padaria-do-joao
/santa-cruz/gastronomia/pizzaria-x      -> /santa-cruz/pizzaria-x
/empresas/ba/salvador/santa-cruz/x      -> /santa-cruz/x quando alias existir
/gastronomia/ba/salvador/santa-cruz/x   -> URL publica de empresa
```

## Validacoes

Comandos usados para validar esta consolidacao:

```bash
npm run validate:ssot
npx tsc -p tsconfig.app.json --noEmit
npx vitest run <testes focados de rotas e snapshots>
```
