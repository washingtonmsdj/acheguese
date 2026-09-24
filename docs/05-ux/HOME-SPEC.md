# Territory Home — contrato canônico do MVP

> **Status:** SSOT da Home/shell territorial do MVP.
>
> **Decisão vigente:** 2026-09-21.
>
> **Domínio de produto ativo:** **Empresas (Business)**.
>
> **Capabilities horizontais ativas:** **Mapa + Perto de mim + Busca + Mensagens**, além de Auth/Perfis/Conta/Território/Localização/Notificações/Central.

## 1. Papel da Home

A Home não é um módulo de produto adicional.

Ela é uma superfície de plataforma responsável por:

- estabelecer o contexto territorial;
- apresentar somente capacidades efetivamente ativas;
- encaminhar para Empresas, Mapa, Perto de mim e Busca;
- manter Mensagens acessível pela topbar autenticada e pelos CTAs dos domínios habilitados;
- manter estados de loading, erro e ausência de dados coerentes;
- não recriar regras de domínio que pertencem aos módulos.

A Home não pode funcionar como agregador monolítico de módulos pausados.

## 2. Escopo público atual

O domínio de produto ativo é:

| Domínio | ID | Estado |
| --- | --- | --- |
| Empresas | `business` | `active` |

Capabilities horizontais ativas:

| Capability | Estado | Dependências relevantes |
| --- | --- | --- |
| Mapa | `active` | Território; providers de domínios ativos |
| Perto de mim | `active` | Mapa + Localização; providers de domínios ativos (Business no MVP) |
| Busca | `active` | Território + providers de domínios ativos |
| Mensagens | `active` | Auth + Perfis; providers de domínios ativos (Business no MVP) |

As autoridades executáveis são `productModuleRegistry.ts`,
`platformCapabilityRegistry.ts` e `lifecycleRegistry.ts`.
`launchScope.ts` é apenas compatibilidade derivada.

## 3. O que a Home pode exibir

A Home pode apresentar:

- entrada para Empresas;
- entrada para Mapa;
- entrada para Perto de mim;
- entrada para Busca;
- contexto territorial necessário a essas experiências;
- estado de localização quando necessário;
- estados vazios e mensagens operacionais reais.

A Home **não pode** consultar, pré-carregar ou montar cards escondidos de módulos pausados.

## 4. O que fica fora do MVP

Enquanto estiverem `paused`, não participam da Home:

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
- demais verticais pós-MVP.

Esses módulos podem continuar versionados para evolução futura, desde que não permaneçam acoplados ao produto ativo.

## 5. Navegação

A navegação pública do MVP deve ser simples e derivada do lifecycle.

Regras:

- não hardcodar links para módulos pausados;
- não exibir teaser que pareça funcionalidade disponível;
- não usar aliases para reabrir uma superfície pausada;
- não manter rota funcional apenas para preservar legado;
- redirect só é válido quando existe mudança legítima de URL pública e compatibilidade externa justificável.

Home, Conta/Auth e outros elementos de plataforma podem existir quando necessários ao uso do produto, mas não contam como módulos adicionais.

## 6. Dados e composição

A Home não é owner dos dados de Empresas, Mapa, Perto de mim ou Busca.

Direções esperadas:

- Home -> URL/port público do módulo;
- Mapa -> `businessMapQueryService` -> read model público de Business;
- Perto de mim -> provider registry lifecycle-scoped + Map/Location; Business é o provider ativo no MVP;
- Busca -> Search providers -> owners ativos, sem acesso cruzado direto;
- nunca Home/Mapa/Nearby -> tabela interna de módulo pausado.

A antiga composição multi-domínio da Home não deve retornar por conveniência.

## 7. Perto de mim

Perto de mim é parte formal do MVP.

Contratos obrigatórios:

- no corte atual, consultar somente o provider Business porque é o único domínio ativo certificado para Nearby;
- integrar resultado ao Mapa;
- usar URLs canônicas de Empresas;
- distinguir localização GPS real de fallback territorial;
- não fabricar distância pessoal quando não existe coordenada confiável;
- falhar fechado se Map/Location estiverem indisponíveis; se uma vertical estiver `paused`, retirar somente seu provider e manter a capability horizontal coerente;
- respeitar lifecycle também no prefetch/warmup.

## 8. Estados de UX

### Loading

Mostrar skeleton/feedback somente para fontes realmente utilizadas pelos módulos ativos.

### Localização indisponível

Não inventar posição do usuário. O fallback territorial deve ser identificado como contexto territorial, não como geolocalização pessoal.

### Sem resultados

Zero resultados é estado válido. Não preencher a Home com fixtures, cards editoriais ou conteúdo de módulos pausados.

### Erro parcial

A falha de um módulo não deve transformar dados de outro módulo em fallback improvisado.

## 9. Arquitetura modular

Ativar, pausar, remover ou adicionar um módulo deve ser uma operação previsível.

### Pausar

A mudança no registry deve ser suficiente para retirar o módulo da superfície pública. Se callers continuarem ativos, há uma falha arquitetural a corrigir.

### Ativar

Exige dependências satisfeitas, owner claro, rotas, prefetch e testes certificados.

### Remover

Depois de provar zero dependência ativa, remover implementação, imports, rotas, assets e documentação exclusiva. Não manter módulo fantasma apenas por legado.

### Adicionar

Novo módulo nasce isolado e `paused`; só vira `active` após certificação.

## 10. Veracidade

- não fabricar distância;
- não fabricar “aberto agora” sem horários;
- não fabricar ranking, atividade, avaliações, patrocinados ou métricas;
- não usar fixtures como evidência pública;
- não usar módulos pausados para preencher ausência de conteúdo;
- não transformar fallback territorial em GPS real.

## 11. Critérios de aceite

A Home do MVP está correta quando:

- apresenta somente Business e as capabilities horizontais certificadas para o MVP;
- nenhuma superfície pausada aparece por navegação, card, provider, prefetch ou layer;
- `nearby` depende formalmente de Map + Location; Business é provider separado pelo lifecycle;
- Mensagens usa somente o provider Business enquanto os demais domínios estão pausados;
- Mapa acessa Business por port público;
- a Home não contém agregador multi-domínio paralelo;
- redirects existentes possuem justificativa funcional legítima;
- zero resultado/erro/localização indisponível possuem estados honestos;
- os ratchets arquiteturais impedem regressão do escopo.

## 12. Referências

- `src/app/config/productModuleRegistry.ts`;
- `src/app/config/platformCapabilityRegistry.ts`;
- `src/app/config/lifecycleRegistry.ts`;
- `src/app/config/launchScope.ts`;
- `docs/03-architecture/PRODUCT_MODULE_LIFECYCLE.md`;
- `docs/FEATURE-MAP.md`;
- `docs/SCREEN-MAP.md`;
- `docs/08-roadmap/EXECUCAO_MAIN_ONLY.md`.
