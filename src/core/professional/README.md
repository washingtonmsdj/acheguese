# Professional

Owner do domínio de profissionais e de sua projeção pública.

## Contrato canônico

`professional_data` usa:

- `profile_id` para identidade do perfil;
- `location_id` obrigatório para o território principal;
- `address_id` opcional, somente quando existe endereço físico real;
- `portfolio_items` para portfólio;
- colunas próprias para dados profissionais, disponibilidade, visibilidade e rating.

`metadata` é auxiliar e não é autoridade de localização. Endereço, cidade,
bairro, estado, CEP e coordenadas não devem ser recuperados de metadata.

## Localização

- território: `location_id -> locations.id`;
- caminho territorial: relação canônica de Location;
- endereço/coordenadas físicas: `address_id -> addresses.id`, quando houver;
- profissional remoto ou móvel pode não possuir `address_id`;
- ausência de endereço físico não autoriza criar pin ou coordenada aproximada.

## Escrita

Criação e edição passam por `professional.profile-lifecycle.ts` e pelo broker
de Profile. `location_id` é obrigatório na criação; `address_id` só é
persistido quando fornecido por um fluxo canônico de Address.

## Leitura

`professional.mappers.ts` projeta território exclusivamente da relação
Location/geographic path e coordenadas exclusivamente da relação Address.

Não existe fallback de localização por metadata, nem API de estado de migração
no runtime.

## Regras

1. Não reintroduzir migration runners ou adapters de compatibilidade no core.
2. Não usar metadata como SSOT de localização.
3. Não inferir endereço físico a partir de território ou área de atendimento.
4. Não publicar coordenadas sem uma relação Address canônica que as possua.
