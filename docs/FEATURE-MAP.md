# FEATURE-MAP

> **MVP 2026-10-05**
>
> **Domínio de produto ativo:** Empresas (`business`).
>
> **Capacidades horizontais ativas:** Mapa, Perto de mim, Busca, Mensagens,
> Auth, Conta/Perfis, Território, Localização, Notificações e Central.
>
> Owners executáveis:
> - `src/app/config/productModuleRegistry.ts`;
> - `src/app/config/platformCapabilityRegistry.ts`;
> - `src/app/config/lifecycleRegistry.ts`.

## Domínio ativo

### Empresas

Responsabilidade: catálogo institucional público de Business, detalhe canônico,
contato, localização, gestão da empresa e integrações horizontais.

Superfícies ativas do MVP:

- catálogo público de empresas;
- detalhe público canônico;
- cadastro de empresa em três etapas;
- edição de identidade, contato/localização e apresentação;
- Central da empresa com visão geral, edição, fotos, horários, localização,
  produtos e serviços, dados e configurações;
- CTA de Mensagens quando o provider Business está ativo;
- projeção no Mapa;
- descoberta em Perto de mim;
- resultados em Busca.

Regras:

- não depende de Gastronomia, Educação ou outras verticalizações;
- categorias continuam válidas mesmo quando a vertical especializada está pausada;
- `Business.id` é identidade de Profile; `Business.business_data_id` é a identidade do agregado Business;
- registros sem identidade/slug/território válidos falham fechado;
- fixtures sintéticas não podem aparecer como conteúdo público;
- Billing/premium pausado não pode gerar CTA ou rota funcional dentro da Central ativa;
- horários alimentam catálogo e detalhe público e devem convergir para o SSOT de Business Hours;
- localização pessoal só aparece quando existe coordenada real adequada para proximidade.

## Capacidades horizontais ativas

### Mapa

Projeta geograficamente providers de domínios ativos. No MVP, Business é o único layer de domínio público. Mapa não possui Business nem acessa seus internals; consome o port público do domínio.

### Perto de mim

Descoberta por proximidade. Depende de `map` e `location`; providers de produto são adicionados separadamente pelo lifecycle. No MVP, Business é o provider disponível.

### Busca

Orquestra providers de domínios ativos. No MVP, Business é o provider público principal. Providers de Community, Serviços, Classificados, Eventos e Vagas permanecem fail-closed.

### Mensagens

Inbox/Chat horizontal da plataforma.

No MVP:

- `messaging=true`;
- Inbox canônica: `/mensagens`;
- thread canônica: `/mensagens/:providerId/:threadId`;
- Business Direct Messaging é o provider disponível enquanto `business=active`;
- pausar Business remove esse provider, mas **não desativa Messaging**;
- futuros providers de Community, Classificados ou outros domínios entram apenas quando seus próprios lifecycles forem ativados;
- a Inbox não pertence a Community, Business nem Comunicação Territorial.

### Notificações

Capability horizontal da plataforma.

No MVP:

- `notifications=true`;
- Inbox canônica: `/notificacoes`;
- preferências canônicas: `/conta/notificacoes`;
- rotas legadas `/notifications` e `/settings/notifications` permanecem aposentadas;
- eventos de verticais passam pelo lifecycle do owner de origem;
- pausar uma vertical impede novas ações/eventos daquela vertical, mas **não desativa Notifications**.

## Plataforma ativa

Auth, sessão, Conta/Perfis, Território, Localização, Mensagens, Notificações, Central, segurança, storage e observabilidade são infraestrutura transversal. Não devem ser modelados como verticais de negócio.

## Domínios pausados

Permanecem versionados e fail-closed até certificação individual:

- Community;
- Gastronomia;
- Serviços/Profissionais;
- Classificados;
- Pontos Turísticos;
- Educação;
- Vagas/Oportunidades;
- Eventos;
- Comunicação territorial;
- Mobilidade;
- Cupons;
- Gamificação;
- Analytics público;
- Alertas/Issues/Achados e Perdidos;
- Safety familiar;
- Billing.

Código preservado não autoriza rota pública, navegação, prefetch, query, provider de Busca, provider de Mensagens, evento acionável de Notificações ou layer de Mapa.

## Lifecycle

Novo domínio nasce `paused`. Nova capability horizontal também nasce `paused` quando sua ativação puder expor funcionalidade incompleta.

Ativar exige:

1. owner e contratos claros;
2. autorização e dados reais;
3. dependências explícitas;
4. testes de fronteira;
5. E2E/smoke quando aplicável;
6. alteração no registry correto.

**Regra permanente:** capability horizontal não depende de uma vertical apenas por ela ser o provider atual. Redirect não é mecanismo de lifecycle.
