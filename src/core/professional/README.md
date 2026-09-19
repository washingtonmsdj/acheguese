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
4. `metadata.location` não é fonte de território e não participa mais do read model.
5. Migrações one-shot históricas não são API runtime do módulo.
6. Novas escritas não devem criar coordenadas em metadata.

## Compatibilidade residual de coordenadas

O banco atual ainda possui um registro profissional com `metadata.latitude` e
`metadata.longitude`, sem `address_id`. Para evitar perda de informação,
`professional.mappers.ts` mantém temporariamente um fallback **somente de
leitura** para essas duas chaves quando não existe coordenada em Address.

Esse fallback não autoriza novas escritas nem reintroduz `metadata.location`.
Ele deve ser removido quando o último registro for reconciliado para uma fonte
canônica de coordenadas.

## Owners

- `ProfessionalService`: facade pública para queries/mutations canônicas;
- `professional.queries.ts`: leituras;
- `professional.mutations.ts`: mutations;
- `professional.profile-lifecycle.ts`: criação/atualização coordenada com Profile;
- `professional.mappers.ts`: projeção do read model;
- `ServiceAreasService`: cobertura territorial de atendimento.
