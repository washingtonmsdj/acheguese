# Professional

Owner canônico dos dados e fluxos de profissionais/serviços.

## Contrato atual

`professional_data` usa:

- `location_id`: território principal canônico em `locations` e obrigatório para os registros atuais;
- `address_id`: endereço físico opcional em `addresses`;
- `service_areas`: cobertura de atendimento, independente do território principal;
- colunas próprias para categoria, faixa de preço, disponibilidade e portfolio.

## Regras

1. `location_id` nunca é substituído por `service_areas`.
2. `service_areas` nunca é inferido apenas de `location_id`.
3. Endereço físico é opcional; não inventar `address_id` para profissional remoto ou sem consultório.
4. `metadata.location`, `metadata.latitude` e `metadata.longitude` não são fontes canônicas e não participam do read model.
5. Migrações one-shot históricas não são API runtime do módulo.
6. Coordenadas físicas só vêm do `Address` canônico; cobertura territorial pertence a `service_areas` e não deve ser usada como endereço implícito.

## Owners

- `ProfessionalService`: facade pública para queries/mutations canônicas;
- `professional.queries.ts`: leituras;
- `professional.mutations.ts`: mutations;
- `professional.profile-lifecycle.ts`: criação/atualização coordenada com Profile;
- `professional.mappers.ts`: projeção do read model;
- `ServiceAreasService`: cobertura territorial de atendimento.
