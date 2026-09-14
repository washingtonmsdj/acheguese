# Territory Home — contrato canônico

> Status: SSOT de produto e implementação da entrada pública e da Home territorial.
> Versão: 4.4 (MVP community-first no Complexo, Home territorial real e expansão por etapas).
> Escopo: entrada pública, Home territorial, Explorar/busca, navegação primária, composição e relação com rollout da Community.

## 1. Decisão de produto

O Achegue-se continua sendo Territory-first. Community é a camada de participação do território, não um sinônimo de toda a plataforma.

No MVP, porém, a **entrada pública é deliberadamente community-first**: o produto começa pelo Complexo do Nordeste de Amaralina. A primeira tela não pede ao visitante uma escolha territorial que ainda não altera o destino real do lançamento.

A Home territorial responde:

> Onde estou, o que está disponível e o que consigo resolver por aqui?

Ela deve ser útil antes de social, funcionar publicamente e ser honesta quando há pouca atividade.

## 2. Contrato de rotas

| Rota                                                     | Papel                                                                 |
| -------------------------------------------------------- | --------------------------------------------------------------------- |
| `/`                                                      | Entrada pública do MVP para o Complexo. Não é seletor genérico.       |
| `/:uf/:cidade`                                           | Home territorial ampla, preservada pela arquitetura territorial.      |
| `/:uf/:cidade/:territorio`                               | Home territorial de bairro ou grupo resolvido.                        |
| `/comunidade/:uf/:cidade[/:territorio]` ou alias público | Community: participação e vida comunitária do contexto.               |
| `/busca/:uf/:cidade[/:territorio]` e `/mapa/...`         | Explorar: descoberta, busca e mapa no território corrente.            |
| `/indicar-comunidade`                                    | Registro de interesse em expansão, sem criar comunidade por si só.    |
| `/cadastro`                                              | Criação de conta independente da seleção territorial.                 |
| `/inicio`                                                | Hub nacional legado; não é alias da Home territorial.                 |

A arquitetura permanece preparada para múltiplos territórios, mas a raiz não antecipa essa expansão. No lançamento, o CTA principal entra no Complexo por `LAUNCH_URLS`; a busca por cidade e o botão de geolocalização **não pertencem à primeira tela**.

Criar uma conta não transforma o endereço da pessoa em comunidade ativa. Visitantes de qualquer lugar podem explorar o Complexo e criar conta; a ativação de novos territórios depende do rollout do produto.

### Contrato visual e operacional de `/`

- existe uma única implementação canônica: `TerritoryEntryPage`;
- a tela apresenta o Complexo do Nordeste de Amaralina como **“Nossa primeira comunidade”**;
- o mapa é contexto territorial do lançamento: compacto no mobile e mais presente no desktop;
- o CTA principal é **“Explorar o Complexo”** e não exige cadastro;
- os quatro territórios do lançamento são apresentados como contexto: Nordeste de Amaralina, Santa Cruz, Vale das Pedrinhas e Chapada;
- não há busca por cidade, seletor de múltiplas comunidades ou geolocalização nessa superfície enquanto só existe uma comunidade de lançamento;
- `achegue:last_territory` pode registrar o contexto visitado, mas não deve pular silenciosamente a entrada do MVP nem reintroduzir um seletor antigo;
- a conta possui caminho próprio (`/cadastro`) e a entrada explicita que é possível conhecer a comunidade morando em outro lugar;
- o bloco **“Quer o Achegue-se na sua comunidade?”** leva a `/indicar-comunidade`;
- a indicação de comunidade usa persistência canônica e anti-spam/Turnstile quando configurado; confirmação visual local sem gravação não é aceita;
- o rodapé comunica que o produto está começando pelo Complexo e que a expansão ocorrerá por etapas;
- boundaries e geometria do mapa vêm do SSOT geoespacial; Production não inventa contorno territorial.

## 3. Públicos

### Visitante novo

- entra diretamente no contexto do Complexo a partir de `/`;
- explora conteúdo público sem criar conta;
- não precisa escolher cidade, permitir localização ou concluir onboarding;
- pode indicar outra comunidade por um fluxo separado;
- vê apenas ações públicas; ações de participação podem pedir login no momento correto.

### Visitante de outra região

- pode explorar o Complexo normalmente;
- pode criar conta sem ativar automaticamente uma comunidade no próprio endereço;
- pode registrar interesse por cidade e bairro em `/indicar-comunidade`;
- receber novidades é uma opção separada, não requisito do registro de interesse.

### Visitante recorrente

- mantém contexto e navegação territoriais consistentes dentro do Complexo;
- não recebe uma seleção territorial artificial na raiz enquanto não houver mais de uma comunidade lançada;
- quando a expansão justificar múltiplas comunidades, a entrada pode evoluir sem romper os builders e contratos territoriais existentes.

### Usuário autenticado

- recebe notificações e contexto do perfil ativo;
- vê `Publicar` somente quando `CommunityAccessPolicy.can.create_post` permitir no território resolvido;
- não recebe permissões inferidas apenas por estar autenticado;
- criar conta e comprovar relação com um território são decisões distintas.

### Operador, empresa ou moderador

A Home pública não vira dashboard. Gestão permanece em Central/Conta e moderação em superfícies próprias.

## 4. Cobertura técnica x lançamento público

A arquitetura territorial do Achegue-se suporta cidade, bairro, grupos e expansão futura. Isso não significa que a experiência de lançamento deva anunciar múltiplas comunidades antes da hora.

O primeiro cluster oficial de lançamento é o **Complexo do Nordeste de Amaralina**, inicialmente concentrando:

- Nordeste de Amaralina;
- Santa Cruz;
- Vale das Pedrinhas;
- Chapada.

Cada bairro preserva sua identidade de `Territory`; o cluster não substitui nem funde os territórios canônicos.

Fora do lançamento:

- rotas, dados ou capacidades técnicas já existentes não autorizam a UI a afirmar que outra comunidade foi lançada;
- cadastro de usuário continua permitido quando aplicável;
- interesse em expansão é registrado por `/indicar-comunidade`;
- nenhuma comunidade é criada ou ativada apenas porque alguém informou cidade/bairro;
- a expansão deve ser evidence-gated, considerando demanda local, moderação, atividade, segurança e capacidade operacional.

Quando houver mais de um território efetivamente lançado, busca/seleção territorial na entrada volta a fazer sentido. Até lá, a simplicidade da raiz é parte do contrato do MVP.

## 5. Hierarquia canônica da Home territorial

1. Cabeçalho e contexto territorial.
2. Proposta local da Home.
3. Atalhos apenas para superfícies ativas no `launchScope`.
4. Atualizações e conversas reais quando existirem.
5. Empresas e serviços úteis.
6. Agenda e oportunidades quando seus owners e launch gates estiverem ativos.
7. Resumo de Community conforme acesso e disponibilidade.
8. Mapa como contexto/descoberta, sem substituir o conteúdo.
9. Estados vazios úteis e caminhos para Explorar.
10. Navegação adaptativa por viewport.

Se uma seção não tiver conteúdo real, ela deve ser omitida ou exibir um estado vazio útil. A ordem pode formar duas colunas no desktop, mas o modelo de dados e a prioridade semântica continuam coerentes com o mobile.

## 6. Dados e composição

| Bloco                           | Fonte canônica                                         | Regra                                                                                         |
| ------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| território                      | `TerritorialLayout` + `useModuleTerritoryFilter`       | rota resolvida; grupo/cidade respeitam descendentes canônicos                                 |
| busca/URLs                      | builders de `territoryUrls` + hooks de URLs de domínio | todo destino preserva o território                                                            |
| posts                           | `PostService.getFeed`                                  | somente publicados e recentes para resumo da Home                                             |
| eventos                         | `EventReadService`                                     | somente quando `events` está ativo e com data vigente                                         |
| vagas                           | `WorkOpportunitiesService`                             | somente quando `jobs` está ativo e lifecycle é válido                                         |
| empresas/serviços/classificados | `LandingFeaturedService`                               | registros públicos do território                                                              |
| destaques                       | `TerritorialHighlightService`                          | ativos e dentro da janela editorial                                                           |
| Community                       | `CommunityExperienceService` + rollout                 | participação somente onde o contrato comunitário estiver liberado                             |
| publicação                      | `useCommunityAccess` / `CommunityAccessPolicy`         | CTA apenas com `create_post = true`                                                           |
| launch gates                    | `src/app/config/launchScope.ts`                        | nenhuma Home/Busca deve expor atalho para superfície pública pausada                          |
| sessão                          | `SessionContext`                                       | personalização sem alterar visibilidade pública                                               |

Falhas parciais não derrubam a Home. Cada grupo de dados possui loading independente; conteúdo resolvido aparece sem esperar todas as fontes. A seção afetada fica vazia e a interface informa que parte dos dados não pôde ser atualizada. Não existe fallback editorial fictício na Home de Production.

Entidades econômicas e conteúdo técnico são filtrados por marcadores canônicos já disponíveis e, defensivamente, por identidade pública explicitamente técnica. Nome comercial legítimo não deve ser ocultado por inferência frágil. Enquanto o schema não possuir proveniência explícita (`production`, `seed`, `e2e`), casos ambíguos permanecem uma dívida de dados, não uma licença para inventar classificação na UI.

## 7. Freshness e veracidade

- evento `upcoming` com data passada não aparece;
- evento `ongoing` sem término não permanece atual indefinidamente;
- resumo de Community aceita apenas conteúdo compatível com a janela de recência definida pelo owner;
- vagas respeitam lifecycle calculado pelo serviço; status de banco isolado não basta;
- empresa nunca recebe “aberto agora” sem horários reais;
- distância nunca é exibida sem cálculo real;
- contagens vêm de queries reais; zero é um estado válido;
- ausência de dados nunca autoriza nomes, alertas, ofertas, avaliações ou datas inventadas;
- mocks conceituais podem existir somente como ferramenta de desenvolvimento explicitamente gated; Production sempre usa owners e dados reais.

## 8. Estados

### Loading

Skeletons preservam a estrutura. A resolução territorial bloqueia apenas a fundação necessária; depois disso, blocos independentes carregam progressivamente. Mock não ocupa o lugar do conteúdo em Production.

### Pouca atividade

Explicar com linguagem neutra e oferecer busca, serviços, mapa ou outro caminho real disponível. Não inflar atividade com dados fictícios.

### Community ainda não ativa

Fora do rollout, a interface não deve fingir comunidade ativa. Pode oferecer indicação/interesse quando fizer sentido, sem transformar registro de interesse em ativação.

### Erro parcial

Manter seções bem-sucedidas e informar a indisponibilidade parcial sem atribuí-la a falta de atividade.

### Território sem resolução

Não executar queries globais como fallback. Usar o fluxo territorial canônico ou o contexto de lançamento apropriado.

## 9. Navegação

No mobile, a navegação territorial começa por:

1. `Hoje` → Home do território atual;
2. `Explorar` → busca e descoberta federada no território atual;
3. `Community` → participação no mesmo território, respeitando rollout;
4. `Atividade` → notificações do usuário, ou login quando visitante;
5. `Conta` / `Entrar` → identidade e preferências.

Busca não ocupa uma segunda tab concorrente com Explorar. Mapa, serviços, empresas, classificados e gastronomia permanecem como atalhos contextuais da Home e superfícies de descoberta.

Atalhos e menus devem respeitar `launchScope`. **Mobilidade e Educação permanecem pausadas no estado atual do MVP** e não podem reaparecer por hardcode em Home, Busca, sidebar ou navegação contextual.

`Publicar` não é destino global permanente. É ação contextual condicionada à policy e à disponibilidade comunitária do contexto.

No desktop, a Home usa largura real: conteúdo principal e rail lateral com serviços/contexto. Não é uma coluna mobile centralizada.

### Contrato visual Território Vivo

- mobile abaixo de 768 px: topbar territorial, conteúdo editorial e bottom navigation;
- tablet entre 768 e 1279 px: navigation rail fixa; o conteúdo nunca fica sem navegação;
- desktop a partir de 1280 px: sidebar fixa, conteúdo principal fluido e rail contextual quando agrega informação;
- Home e Explorar compartilham topbar, busca, superfícies, títulos, estados e linguagem visual;
- mapas entram como contexto e descoberta; não substituem a Home;
- `prefers-reduced-motion` reduz transições e animações no shell;
- alvos principais preservam área de toque adequada e foco visível.

## 10. Microcopy

Na entrada do MVP, preferir:

- “Nossa primeira comunidade”;
- “Seu lugar, mais perto.”;
- “Explorar o Complexo”;
- “Sem cadastro para explorar.”;
- “Quer o Achegue-se na sua comunidade?”;
- “Estamos começando pelo Complexo. A expansão será por etapas.”

Na Home/Explorar:

- usar linguagem territorial concreta como “Na sua comunidade”, “Explore por perto” e “O que você procura por aqui?”;
- não chamar cidade de bairro;
- não declarar território “movimentado”, empresa “aberta” ou conteúdo “agora” sem evidência;
- Community deve ser explicada como participação local, não como todo o produto;
- módulos pausados não recebem teaser que pareça funcionalidade já disponível.

## 11. Critérios de aceite

### Entrada `/`

- existe uma única implementação canônica em `TerritoryEntryPage`;
- não existe busca por cidade nem botão de geolocalização na primeira tela do MVP;
- o Complexo é a única comunidade apresentada como lançada;
- os quatro territórios do Complexo aparecem como contexto, sem simular quatro comunidades independentes;
- “Explorar o Complexo” funciona sem cadastro;
- “Criar minha conta” é um caminho separado;
- pessoas de outras localidades podem indicar comunidade sem ativá-la;
- a indicação persiste via owner canônico e respeita proteção anti-spam quando configurada;
- mapa responsivo não inventa geometria;
- não há contadores fictícios nem atividade simulada em Production.

### Home e Explorar

- contexto territorial e URLs permanecem canônicos;
- Home e Busca não mostram Mobilidade/Educação enquanto seus launch gates forem `false`;
- filtros, coleções e atalhos não expõem superfícies pausadas;
- visitante público explora sem onboarding obrigatório;
- `Publicar` só aparece com policy positiva e contexto comunitário elegível;
- refresh direto mantém o mesmo contexto;
- nenhuma seção contém mock/fallback fictício em Production;
- mobile não tem overflow horizontal e desktop usa composição própria;
- loading, erro parcial e vazio são distinguíveis;
- console não contém erro novo e requests territoriais não falham por URL incorreta.

## 12. Prova automatizada

- testes de regressão devem cobrir a entrada community-first e impedir retorno de busca/geolocalização na raiz enquanto este contrato estiver vigente;
- Home deve ter regressão que confirme que todo quick action é filtrado pelo `launchScope`;
- `BuscaPage` deve provar que filtros/links de superfícies pausadas não aparecem;
- a suíte pública intercepta apenas leituras necessárias no navegador de teste; não existe caminho de fixture no bundle de Production;
- sessão autenticada usa credenciais fornecidas ao ambiente, sem segredo padrão no repositório;
- console sem exceção, requests críticos sem HTTP 4xx/5xx e ausência de overflow horizontal fazem parte da prova pública quando o gate E2E for executado.

## 13. Evolução posterior

Quando houver mais de uma comunidade realmente lançada, a raiz poderá ganhar seleção territorial e, se houver valor comprovado, busca por cidade/geolocalização. Essa evolução deve usar o mesmo SSOT territorial existente, sem restaurar seletores legados em paralelo.

Também permanecem futuras:

- telemetria de utilidade e atalhos semânticos;
- métricas de demanda para orientar expansão;
- alertas cívicos quando o launch scope e o contrato de validade forem ativados;
- ranking contextual explicável;
- busca assistida por IA com respostas rastreáveis a fontes locais;
- preferências pessoais sem criar bolha ou ocultar informação cívica relevante.

Essas evoluções não podem reintroduzir conteúdo fictício nem contornar Territory, Rollout, `launchScope` ou `CommunityAccessPolicy`.
