# HOME-INVENTORY

> **MVP atual:** somente **Empresas + Mapa + Perto de mim**.
>
> Flags do corte: `map=true`, `nearby=true`, `business=true`, `search=false`, `billing=false`, `gastronomy=false`, `services=false`, `touristPoints=false`, `education=false`, `jobs=false`, `events=false`, `communityEventsPreview=false`, `communication=false`, `mobility=false`, `coupons=false`, `gamification=false`, `communityCommunication=false`.

## Papel da Home

Home/Território é infraestrutura de entrada e contexto, não um quarto módulo do MVP.

A Home deve ser pequena e derivada do lifecycle. Ela pode:

- mostrar o território atual;
- oferecer CTA para **Empresas**;
- oferecer CTA para **Mapa**;
- oferecer CTA para **Perto de mim**;
- expor estados de loading/empty/error reais.

Ela não deve consultar, contar, destacar ou anunciar módulos pausados.

## Conteúdo permitido no MVP

| Bloco | Fonte | Destino |
| --- | --- | --- |
| contexto territorial | owner de localização/território | permanece na Home |
| empresas do território | Business owner | Empresas |
| visualização territorial | Maps owner | Mapa |
| proximidade | Nearby owner + localização | Perto de mim |

## Conteúdo proibido enquanto pausado

Não renderizar previews, contadores ou CTAs de Comunidade, Gastronomia, Serviços, Classificados, Turismo, Educação, Vagas, Eventos, Mensagens, Mobilidade, Cupons, Analytics ou Gamificação.

A Busca pública também não aparece neste corte (`search=false`).

## Regras de dados

- nenhum mock/concept data em produção;
- vazio real é melhor que conteúdo inventado;
- escolas reais permanecem válidas dentro de Empresas mesmo com Educação pausada;
- fixtures de lojas/profissionais/usuários de teste não devem voltar a superfícies públicas;
- Perto de mim não fabrica distância: GPS real quando disponível; fallback territorial deve ser rotulado como referência territorial.

## Arquitetura

A Home não possui lógica própria para decidir quais módulos existem. Toda visibilidade deve derivar do registry/launch scope. Adicionar ou pausar um módulo não pode exigir editar arrays independentes na Home.
