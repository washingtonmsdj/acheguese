# Residence

Owner do vínculo residencial do usuário com **Address** e **Location** canônicos.

## Contrato atual

`user_residences` opera exclusivamente com:

- `address_id`: FK obrigatória para `addresses`;
- `location_id`: FK obrigatória para `locations`;
- `country`, flags de residência/verificação e timestamps operacionais.

Rua, número, complemento, bairro, cidade, estado e CEP pertencem ao domínio de
Address. Identidade territorial pertence a Location. Residence não mantém uma
segunda representação textual desses dados.

## Responsabilidades

`ResidenceService`:

- lê e grava vínculos residenciais;
- carrega Address e Location quando a projeção precisa dessas relações;
- mantém a residência primária;
- registra pedidos de verificação;
- encaminha casos de reconciliação territorial para
  `territory_resolution_queue`.

## Regras

1. Toda residência persistida deve possuir `address_id` e `location_id`.
2. `location_id` referencia `locations`, nunca `territorial_groups`.
3. UI não recria endereço ou território a partir de campos textuais de
   `user_residences`.
4. Migração histórica não é API runtime do módulo.
5. Novos casos ambíguos de resolução territorial seguem para a fila de revisão;
   não há fallback que invente cidade, bairro ou coordenadas.
