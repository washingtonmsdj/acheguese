# Próximos passos — lançamento MVP

Este arquivo é um resumo navegacional. O **SSOT operacional** permanece em [`EXECUCAO_MAIN_ONLY.md`](./EXECUCAO_MAIN_ONLY.md) e o lifecycle de módulos em [`PRODUCT_MODULE_LIFECYCLE.md`](../03-architecture/PRODUCT_MODULE_LIFECYCLE.md).

## Decisão vigente — 2026-09-21

O MVP público possui **um domínio de produto ativo: Empresas (`business`)**.

Capabilities horizontais ativas no lançamento:

1. **Mapa** (`map`);
2. **Perto de mim** (`nearby`);
3. **Busca** (`search`);
4. **Mensagens** (`messaging`, provider MVP = Business);
5. Auth, Perfis/Conta, Território, Localização, Notificações e Central.

`nearby` depende de Map + Location + Business. `messaging` depende de Auth +
Perfis + Business e registra somente providers de domínios ativos.

Todos os demais módulos de produto permanecem **pausados e fail-closed** até certificação individual. Código preservado para pós-MVP não pode aparecer em navegação, rotas funcionais, prefetch, discovery, providers públicos ou layers do Mapa.

## Objetivo imediato

Entregar um candidato pequeno, verificável e profissional sem reabrir escopo.

Regras:

- não adicionar novos módulos ao MVP;
- corrigir causas raiz, não sintomas;
- não criar redirect, alias, fallback ou feature flag local para esconder arquitetura quebrada;
- manter as autoridades de lifecycle separadas: `productModuleRegistry.ts` para domínios, `platformCapabilityRegistry.ts` para capabilities e `lifecycleRegistry.ts` como avaliador único;
- remover código morto, duplicidades e dependências cruzadas que pertençam apenas ao runtime antigo;
- manter código pós-MVP apenas quando houver owner claro, fronteira limpa e zero interferência no produto ativo;
- nenhuma superfície pausada pode ser consultada apenas para montar UI escondida;
- nenhuma mudança recebe status de release por ter sido apenas mergeada.

## Ordem atual

1. **Concluir o corte modular**
   - manter `business` como domínio ativo;
   - manter `map`, `nearby`, `search` e `messaging` como capabilities ativas;
   - provar `nearby -> map + location + business`;
   - provar `messaging -> auth + profiles + business` e provider Business-only;
   - manter Mapa consumindo Business por port público, sem conhecer schema/tabelas internas;
   - eliminar imports e delegações do núcleo ativo para módulos pausados.

2. **Fechar rotas, navegação e prefetch**
   - navegação pública deve expor somente destinos do MVP e infraestrutura necessária;
   - módulo pausado não pode possuir rota funcional acessível;
   - prefetch/warmup deve consultar lifecycle antes de carregar qualquer módulo;
   - redirects só permanecem quando há mudança legítima de URL pública com compatibilidade externa real.

3. **Limpar resíduos do escopo anterior**
   - remover componentes, services, helpers, facades, previews, aliases e imports sem caller real;
   - remover implementações paralelas e owners duplicados;
   - manter migrations históricas somente quando necessárias à integridade/proveniência;
   - atualizar testes arquiteturais para impedir reintrodução do legado.

4. **Certificar o núcleo ativo**
   - Empresas;
   - Mapa;
   - Perto de mim;
   - Busca;
   - Mensagens/Business Direct Messaging;
   - contratos de plataforma utilizados diretamente pelo domínio e capabilities;
   - truthfulness de localização/distância;
   - boundary Map -> Business;
   - rotas e navegação launch-safe.

5. **Executar candidato exact-SHA**
   - security;
   - lint;
   - typecheck;
   - testes arquiteturais/unitários;
   - build;
   - E2E do domínio Business + capabilities públicas do MVP;
   - deploy do mesmo SHA;
   - smoke público do mesmo SHA.

6. **Lançar e observar**
   - corrigir regressões no núcleo antes de ampliar produto;
   - qualquer módulo futuro nasce/retorna `paused`, é certificado isoladamente e só então passa a `active`.

## Estado do CI observado em 2026-09-21

Os runners hospedados voltaram a executar steps reais no PR #292. A certificação atual deve ser julgada pelos resultados reais do mesmo SHA; failures antigos com `steps=null` permanecem apenas como histórico de infraestrutura.

O contrato de certificação foi corrigido antes da próxima execução real:

- `test:mvp:architecture` prova registry de domínios, registry de capabilities, launch scope, Map -> Business, Nearby, Search, Messaging e fluxo público de Business;
- `test:e2e:mvp` cobre raiz/Home + Empresas + Mapa + Perto de mim + Busca; Messaging possui testes de boundary/service e CTA Business;
- o mesmo E2E inclui `launch-scope-public.spec.ts` para provar que módulos pós-MVP continuam isolados;
- `certify-heavy.yml` permanece a autoridade exact-SHA e agora chama explicitamente essas provas;
- o workflow automático de PR agrega o mesmo contrato, sem criar uma segunda definição de MVP.

A Vercel também bloqueou novos deploys por limite diário de deployments. Isso mantém o gate de deploy exact-SHA aberto, mas não deve ser registrado como regressão funcional do projeto.

Até existir execução real, security/lint/typecheck/test/build/E2E continuam **não certificados**.

## Pós-MVP

Ficam fora do produto ativo até trabalho individual e reintegração formal, entre outros:

- Comunidade/Feed;
- Classificados;
- Serviços/Profissionais;
- Gastronomia;
- Eventos;
- Vagas;
- Pontos Turísticos;
- Mobilidade;
- Educação;
- monetização/billing;
- gamificação;
- analytics público;
- demais verticais preservadas no repositório.

Preservar código pós-MVP não significa mantê-lo conectado ao runtime ativo.

## Critério de MVP READY

O release só recebe **MVP READY** quando **Business + Mapa + Perto de mim + Busca + Mensagens (Business provider)** estiverem certificados em um único SHA, com:

- lifecycle modular coerente;
- zero dependência ativa em módulo pausado;
- rotas/navegação/prefetch alinhados;
- security/lint/typecheck/test/build realmente executados;
- E2E/smoke das superfícies ativas e fluxo de Mensagens Business;
- deploy real do mesmo SHA;
- nenhum erro crítico recorrente.

Módulos pausados não precisam ser concluídos para o primeiro release. Precisam permanecer realmente fora do produto ativo.
