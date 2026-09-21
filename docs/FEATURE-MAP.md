# FEATURE-MAP

> **Escopo MVP:** **Empresas + Mapa + Perto de mim + Busca**.
>
> Lifecycle: `src/app/config/productModuleRegistry.ts`.
>
> Estado atual: `map=true`, `nearby=true`, `business=true`, `search=true`, `billing=false`, `gastronomy=false`, `services=false`, `touristPoints=false`, `education=false`, `jobs=false`, `events=false`, `communityEventsPreview=false`, `communication=false`, `messaging=false`, `mobility=false`, `coupons=false`, `gamification=false`, `communityCommunication=false`.

## Módulos ativos

### Empresas

Responsabilidade: catálogo institucional público de entidades Business, detalhe canônico, dados de contato, localização e integração com Mapa/Perto de mim.

Regras:
- não depende de Gastronomia, Educação ou outras verticalizações;
- categorias continuam válidas mesmo quando a vertical especializada correspondente está pausada;
- registros sem identidade/slug/território válidos falham fechado;
- fixtures sintéticas não devem ser expostas como conteúdo público.

### Mapa

Responsabilidade: visualização geográfica dos módulos ativos.

No MVP:
- somente Business é layer de domínio público;
- layers de Gastronomia, Serviços, Classificados, Eventos, Alertas e Pontos Turísticos permanecem desligados pelo lifecycle;
- pins de empresa usam a URL canônica de Business.

### Perto de mim

Responsabilidade: descoberta por proximidade de Empresas e transição para Mapa/detalhe Business.

Dependências declaradas:
- `map`;
- `business`.

Se qualquer dependência for pausada, Perto de mim deve falhar fechado automaticamente pelo registry.

### Busca

Responsabilidade: descoberta textual nos módulos atualmente ativos, preservando o território e delegando cada consulta ao owner do domínio.

No MVP:
- Business é o provider público ativo;
- providers de Community, Serviços, Classificados, Eventos e Vagas permanecem desligados pelo lifecycle;
- filtros e coleções de módulos pausados não aparecem na interface;
- Search não possui dados de outros domínios: apenas orquestra providers habilitados.

## Infraestrutura, não módulos

Auth/Conta, território, roteamento, localização, sessão, segurança, storage e observabilidade continuam disponíveis quando necessários aos quatro módulos.

## Mensagens — arquitetura pós-MVP

`messaging=false` no release atual, mas o boundary é horizontal:

- `src/core/messaging` contém contratos e serviços;
- `src/modules/messaging` contém a UI geral de Inbox/Chat;
- Classificados e Community mantêm agregados próprios;
- Business e futuros domínios poderão fornecer adapters próprios;
- a Inbox não pertence a Community nem a Comunicação Territorial;
- não existe obrigação de uma tabela/serviço monolítico para todos os tipos de conversa.

## Pós-MVP

Os módulos abaixo permanecem preservados, mas não integram o release atual:

- Comunidade;
- Gastronomia;
- Serviços profissionais;
- Classificados;
- Pontos Turísticos;
- Educação;
- Vagas/Oportunidades;
- Eventos;
- Comunicação territorial;
- Mensagens/Inbox horizontal;
- Mobilidade;
- Cupons;
- Gamificação;
- Analytics público;
- Alertas/Issues/Achados e Perdidos;
- Safety familiar;
- Billing.

Cada módulo volta individualmente: contrato -> dados reais -> autorização -> rotas -> navegação -> integração -> testes -> ativação no registry.

## Regra contra redirects paliativos

Redirect não é mecanismo de lifecycle. Rota antiga sem justificativa funcional deve ser removida ou isolada. Redirect só permanece quando existe uma compatibilidade deliberada e documentada que não mascara owner quebrado, entidade inválida ou módulo pausado.
