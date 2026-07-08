# Consolidacao: URLs Publicas e Permissoes

Atualizado: 2026-07-05
Status: ativo

Este documento consolida a politica atual de URLs publicas e a separacao entre URL publica de entidade e mini-site premium.

## Mapa Atual de URLs Publicas

| Tipo | URL publica preferencial | Contexto comunitario explicito | SSOT |
| --- | --- | --- | --- |
| Perfil pessoal | `/u/:username` | - | `buildPublicProfileUrl()` |
| Comunidade | `/comunidade/:communitySlug` | mesma rota | `community_public_aliases` + routing services |
| Empresas | `/empresas/:state/:city/:territorySlug/:slug` | `/comunidade/:communitySlug/empresas/:slug` | `BusinessUrlService` + routing policies |
| Gastronomia | `/gastronomia/:state/:city/:territorySlug/:slug` quando houver detalhe proprio; caso contrario usa a URL publica da empresa | `/comunidade/:communitySlug/gastronomia/:slug` | `GastronomyUrlService` + `BusinessUrlService` |
| Mini-site premium | `/p/:slug` | - | `buildBusinessPremiumUrl()` + `BusinessUrlService` |
| Profissional | `/profissionais/:state/:city/:slug` | - | `ProfessionalUrlService` |

## Regras de Produto

- Comunidade so entra por rota explicita: `/comunidade/santa-cruz`.
- Listagens publicas usam prefixo de modulo: `/empresas/ba/salvador/santa-cruz`
  e `/gastronomia/ba/salvador/santa-cruz`.
- Detalhe publico de empresa/restaurante usa URL de modulo:
  `/empresas/ba/salvador/santa-cruz/padaria-do-joao`.
- Rotas comunitarias de entidade existem apenas dentro do portal:
  `/comunidade/santa-cruz/empresas/padaria-do-joao`.
- Aliases curtos legados de entidade nao sao emitidos em codigo novo e devem
  falhar visivelmente quando nao correspondem a uma rota comunitaria canonica.
- `/gastronomia/:state/:city/:territory/:slug` so deve existir como detalhe
  publico quando houver pagina propria da vertical; caso contrario canonicaliza
  para a URL publica de empresa.
- `/p/:slug` continua reservado ao mini-site premium. Ele nao substitui a URL publica canonica da empresa.

## Relacao Empresa e Gastronomia

Uma empresa pode ter vertical de gastronomia ativo. A identidade publica continua sendo a empresa:

```text
business_data
  -> gastronomy_profiles
  -> public detail: /empresas/:state/:city/:territory/:slug
  -> community detail: /comunidade/:communitySlug/gastronomia/:slug
  -> premium site: /p/:slug
```

A listagem de gastronomia e especifica do modulo, mas o detalhe evita duplicacao de entidade:

```text
/gastronomia/ba/salvador/santa-cruz  -> lista restaurantes publica
/empresas/ba/salvador/santa-cruz/pizzaria-estrela -> detalhe publico do restaurante
/comunidade/santa-cruz/gastronomia/pizzaria-estrela -> detalhe comunitario
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

## Compatibilidade Esperada

```text
/santa-cruz                            -> compatibilidade do portal quando alias unico existir
/santa-cruz/empresas                   -> nao emitir em codigo novo; usar /comunidade/santa-cruz/empresas
/santa-cruz/empresas/padaria-do-joao   -> nao emitir em codigo novo; usar /comunidade/santa-cruz/empresas/padaria-do-joao
/santa-cruz/gastronomia/pizzaria-x     -> nao emitir em codigo novo; usar /comunidade/santa-cruz/gastronomia/pizzaria-x
/santa-cruz/padaria-do-joao            -> alias ambiguo de entidade; falha visivel quando nao canonico
/gastronomia/ba/salvador/santa-cruz/x  -> URL publica de empresa quando nao houver detalhe vertical proprio
```

## Validacoes

Comandos usados para validar esta consolidacao:

```bash
npm run validate:ssot
npx tsc -p tsconfig.app.json --noEmit
npx vitest run <testes focados de rotas e snapshots>
```
