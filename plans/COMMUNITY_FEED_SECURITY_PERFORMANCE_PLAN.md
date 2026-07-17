# Community Feed Security And Performance

Status: em andamento
Data: 2026-07-14
Escopo: posts de texto, midia publica e leitura paginada da Comunidade

## Objetivo

Fechar os riscos verificaveis do feed antes do lancamento sem prometer seguranca
absoluta ou escala de grandes redes sem evidencias. O banco continua sendo a
autoridade de identidade, territorio, limites e contadores; a interface apenas
valida cedo e apresenta o estado autorizado.

## Riscos Confirmados

- `posts.images` aceita qualquer URL HTTPS, permitindo imagem de terceiro usada
  para rastreamento e dependencia externa nao auditada.
- O bucket `post_images` limita MIME e tamanho, mas ainda nao limita uploads por
  perfil em uma janela distribuida.
- Campos estruturados de posts precisam de limites de tamanho no banco, nao
  somente no formulario.
- A imagem principal do card nao declara carregamento diferido e cada pagina
  acumulada continua participando do custo de renderizacao.
- Nao existe E2E dedicado a texto hostil, imagem canonica e varias paginas de
  feed.

## Decisoes

- Persistir imagem de post como referencia canonica
  `storage://post_images/{profile_id}/posts/{arquivo}.jpg`; a origem publica e
  derivada da configuracao Supabase no adaptador de exibicao.
- Remover referencias externas ou invalidas durante a reconciliacao. Nao manter
  dois contratos de midia.
- Aplicar cota de upload no PostgreSQL com lock transacional por perfil. O
  limite do navegador e apenas conveniencia.
- Manter paginacao keyset por `(created_at, id)` e limitar o tamanho solicitado
  pela aplicacao.
- Usar lazy loading, dimensoes estaveis e `content-visibility` nos cards. Teste
  local de muitas paginas prova comportamento do cliente, nao capacidade do
  backend.
- Testes de carga e abuso autenticado so podem rodar em staging isolado.

## Checklist

- [ ] Criar parser/resolvedor unico da referencia de imagem de post.
- [ ] Validar o contrato na mutacao e no trigger do PostgreSQL.
- [ ] Normalizar referencias existentes e descartar URLs externas.
- [ ] Adicionar limite diario transacional ao bucket `post_images`.
- [ ] Limitar payload estruturado, canais e metadados no banco.
- [ ] Limitar pagina solicitada e eliminar expansao territorial N+1.
- [ ] Adicionar lazy loading, decoding assincrono e contencao de renderizacao.
- [ ] Cobrir texto hostil, referencias de midia e limites em testes unitarios.
- [ ] Cobrir texto, imagem e varias paginas em E2E sem escrita remota.
- [ ] Executar typecheck, lint focado, testes, build, scanners e validadores SSOT.
- [ ] Aplicar migration remota somente depois de auditar as referencias atuais.
- [ ] Registrar a pendencia de carga autenticada no staging com p50/p95/p99.

## Criterio De Pronto

Posts novos nao aceitam midia fora do bucket canonico; uploads concorrentes sao
limitados no banco; payloads possuem limites server-side; texto hostil permanece
texto; imagens fora da viewport nao sao baixadas/renderizadas precocemente; e o
E2E percorre varias paginas sem erro, duplicacao ou requisicao sem limite. A
comparacao com Instagram ou Reddit permanece qualitativa ate existir teste de
carga em staging e telemetria de producao.
