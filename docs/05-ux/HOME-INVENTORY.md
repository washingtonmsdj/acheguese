# HOME-INVENTORY

> **MVP atual:** **Empresas + Mapa + Perto de mim + Busca**, com **Mensagens + Notificações** como capabilities horizontais ativas da plataforma.
>
> Flags do corte: `map=true`, `nearby=true`, `business=true`, `search=true`, `messaging=true`, `notifications=true`, `billing=false`, `gastronomy=false`, `services=false`, `touristPoints=false`, `education=false`, `jobs=false`, `events=false`, `communityEventsPreview=false`, `communication=false`, `mobility=false`, `coupons=false`, `gamification=false`, `communityCommunication=false`.

## Papel da Home

Home/Território é infraestrutura de entrada e contexto, não um módulo de produto adicional.

A Home deve ser pequena e derivada do lifecycle. Ela pode:

- mostrar o território atual;
- oferecer CTA para **Empresas**;
- oferecer CTA para **Mapa**;
- oferecer CTA para **Perto de mim**;
- oferecer CTA para **Busca**;
- expor estados de loading/empty/error reais.

Mensagens e Notificações não pertencem à Home nem à vertical Empresas; podem aparecer na navegação global autenticada quando apropriado.

## Conteúdo permitido no MVP

| Bloco | Fonte | Destino |
| --- | --- | --- |
| contexto territorial | owner de localização/território | permanece na Home |
| empresas do território | Business owner | Empresas |
| visualização territorial | Maps owner | Mapa |
| proximidade | Nearby owner + localização | Perto de mim |
| busca textual | Search owner + providers habilitados | Busca |
| conversas | Messaging owner + providers ativos | Mensagens |
| avisos | Notifications owner + eventos autorizados | Notificações |

## Conteúdo proibido enquanto pausado

Não renderizar previews, contadores ou CTAs que reativem Comunidade, Gastronomia, Serviços, Classificados, Turismo, Educação, Vagas, Eventos, Mobilidade, Cupons, Analytics ou Gamificação.

Pausar uma vertical remove apenas suas próprias contribuições. Mensagens e Notificações permanecem ativas como owners horizontais da plataforma.

## Regras de dados

- nenhum mock/concept data em produção;
- vazio real é melhor que conteúdo inventado;
- escolas reais permanecem válidas dentro de Empresas mesmo com Educação pausada;
- fixtures de lojas/profissionais/usuários de teste não devem voltar a superfícies públicas;
- Perto de mim não fabrica distância: GPS real quando disponível; fallback territorial deve ser rotulado como referência territorial.

## Arquitetura

A Home não possui lógica própria para decidir quais módulos existem. Toda visibilidade deve derivar do registry/launch scope. Adicionar ou pausar um módulo ou capability não pode exigir editar arrays independentes na Home.
