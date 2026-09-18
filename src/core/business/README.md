# Business

Owner do domínio de empresas e de sua projeção operacional/pública.

## Contrato territorial

- `location_id` identifica o território principal da unidade;
- `brand_hub` pode não possuir `location_id`;
- `standalone` e `branch` são territoriais;
- `address_id` é opcional e representa somente endereço físico real.

## Coordenadas

Coordenada física de empresa pertence a **Address**.

Uma empresa só pode ser tratada como tendo coordenadas físicas quando a relação
`address` contém latitude e longitude finitas. O runtime não usa como
substitutos:

- centro canônico de `Location`;
- metadata;
- colunas textuais/históricas de `business_data`.

Centro territorial pode ser usado por experiências de território, mas nunca
como pin de estabelecimento.

## Runtime

`BusinessService` concentra operações do domínio. Helpers de "estado migrado"
não fazem parte da API: o código deve operar diretamente sobre o contrato
canônico e respeitar `business_role`.

A tela de endereço usa `getPhysicalBusinessCoordinates()`; quando não há
Address geocodificado, o mini mapa não inventa posição.

## Dívida de schema

O banco ainda contém colunas históricas de Business como
`business_address`, `business_city`, `business_state`, `business_zip`,
`address`, `latitude` e `longitude`. Elas não são autoridade para novos
fluxos e devem ser aposentadas somente com migration/data backfill comprovado,
sem fallback runtime.

## Regras

1. Não recriar `BusinessCanonicalAdapter` nem helper bags paralelos.
2. Não expor `isBusinessMigrated` como conceito de runtime.
3. Não usar centro de Location como coordenada física de empresa.
4. Não usar metadata como fallback de coordenadas.
5. Não inventar Address para empresas sem endereço físico.
