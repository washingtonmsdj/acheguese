# Locations no Admin — visão de manutenção

Este documento existia como uma descrição promocional de um “sistema 100% escalável”. Essa formulação foi aposentada porque documentação técnica viva deve registrar contratos verificáveis, não garantias absolutas de escala ou funcionalidades futuras.

## Autoridades atuais

Use estas fontes, nesta ordem:

1. `./ADMIN_LOCATIONS_INTERFACE.md` — contrato atual da interface `/admin/locations`;
2. `../../../core/location/README.md` — fronteira do domínio Location;
3. `../../../core/location/services/LocationAdminService.ts` — owner do CRUD estrutural;
4. `../../../../docs/08-roadmap/EXECUCAO_MAIN_ONLY.md` — estado operacional e escopo do MVP;
5. `../../../../docs/README.md` — índice documental canônico.

## Princípios

- A hierarquia de locations é persistida no banco e administrada por um serviço canônico.
- A interface Admin pode evoluir sem criar uma segunda implementação de Location.
- Geocoding é um mecanismo auxiliar; coordenada obtida externamente precisa ser tratada como dado sujeito a validação.
- Visibilidade territorial (`is_selector_active`, `is_landing_enabled`, `is_navigable`) pertence à autoridade de Território e não ao CRUD estrutural de Location.
- Capacidade ou escalabilidade só deve ser afirmada quando houver evidência mensurável; não usar expressões como “sem limite”, “100% escalável” ou “integração automática” como contrato técnico.

Para comportamento funcional e limitações atuais, consulte `ADMIN_LOCATIONS_INTERFACE.md` em vez de duplicar a mesma especificação aqui.
