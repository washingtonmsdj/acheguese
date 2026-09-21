# Checkpoint — corte definitivo do MVP em três módulos

**Data:** 2026-09-21  
**Branch de trabalho:** `release/narrow-mvp-scope`  
**PR:** #283

## Decisão

O MVP público do Achegue-se fica reduzido a:

- **Empresas**;
- **Mapa**;
- **Perto de mim**.

Essa decisão substitui escopos anteriores que tratavam Comunidade, Busca, Classificados, Serviços, Gastronomia, Eventos, Vagas, Pontos Turísticos ou outras verticais como núcleo obrigatório do primeiro release.

## Arquitetura

A autoridade de lifecycle é `src/app/config/productModuleRegistry.ts`.

Estados:

- `active`: pode participar do produto;
- `paused`: pode permanecer versionado, mas deve estar fora do runtime público.

`nearby` depende de `map + business` e falha fechado se qualquer dependência estiver pausada.

`launchScope.ts` permanece somente como compatibilidade derivada do registry.

## Princípios de limpeza

O corte deve:

- remover código morto e owners duplicados;
- eliminar dependências de módulo ativo para módulo pausado;
- remover rotas funcionais abandonadas;
- retirar prefetch/providers/layers de módulos pausados;
- impedir previews escondidos que ainda executem queries;
- remover facades e bridges sem responsabilidade atual;
- evitar redirects usados para mascarar inconsistências;
- manter somente redirects com justificativa funcional legítima.

Código pós-MVP pode continuar no repositório quando possui owner claro e não interfere no produto ativo.

## Boundaries obrigatórias

- Business mantém ownership de dados e URLs de empresas;
- Mapa acessa Business somente por port público;
- Perto de mim usa Business + Map e não consulta verticais pausadas;
- Home é plataforma/shell e não um módulo adicional;
- Auth/Conta, sessão, localização, roteamento, segurança, storage e observabilidade são infraestrutura de plataforma.

## Documentação reconciliada neste corte

- `docs/03-architecture/PRODUCT_MODULE_LIFECYCLE.md`;
- `docs/FEATURE-MAP.md`;
- `docs/SCREEN-MAP.md`;
- `docs/05-ux/HOME-INVENTORY.md`;
- `docs/05-ux/HOME-SPEC.md`;
- `docs/08-roadmap/EXECUCAO_MAIN_ONLY.md`;
- `docs/08-roadmap/NEXT-STEPS.md`;
- `docs/README.md`;
- `README.md`.

## CI / release

No head auditado do PR #283, jobs de GitHub Actions classificados como failure retornaram `steps=null`; portanto não há prova de teste executado falhando.

A Vercel bloqueou deployment por limite diário de deployments.

Consequência:

- o código não deve ser marcado como falho com base nesses resultados vazios;
- o MVP também não pode ser marcado como certificado;
- security/lint/typecheck/test/build, E2E, deploy e smoke exact-SHA continuam gates abertos até execução real.

## Próximo gate

1. concluir a remoção de resíduos do escopo anterior;
2. validar os ratchets de lifecycle e boundaries;
3. executar os gates reais no mesmo SHA;
4. provar deploy e smoke de Empresas + Mapa + Perto de mim;
5. somente então marcar MVP READY.
