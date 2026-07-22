# Supabase Remote Function Lint - 2026-07-17

Status: application clean; extension residual documented

## Resultado

O baseline inicial continha 46 registros de lint em 44 nomes de funcao. A
auditoria de `pg_depend`, grants e callsites separou funcoes da aplicacao de
objetos pertencentes ao PostGIS.

As migrations `20260717140000`, `20260717141000` e `20260717142000` foram
aplicadas no remoto. Depois do corte:

- funcoes da aplicacao com erro ou warning: **0**;
- RPCs legados de cobertura: **0**;
- comandos canonicos de cobertura: **3**;
- grants de escrita de `anon/authenticated` em `service_areas`: **0**;
- funcoes extension-owned ainda reportadas: **12 nomes unicos**.

## Residual PostGIS

`st_findextent`, `populate_geometry_columns`, `addgeometrycolumn`,
`dropgeometrycolumn`, `dropgeometrytable`, `updategeometrysrid`,
`postgis_full_version`, `lockrow`, `addauth`, `enablelongtransactions`,
`longtransactionsenabled` e `st_letters` pertencem a extensoes instaladas.

Essas funcoes nao podem ser corrigidas por migration da aplicacao. Alterar seu
corpo causaria drift do owner e poderia quebrar upgrades da extensao. O
residual deve ser reavaliado quando a versao do PostGIS/Supabase for atualizada.

## Correcoes da aplicacao

- removidas funcoes sem callers que referenciavam schemas antigos;
- removida a implementacao duplicada de Coverage em `core/geospatial`;
- Coverage passou a comandos atomicos autorizados pelo banco;
- geradores agora possuem limite e falha explicita;
- delivery passou a registrar ator/motivo e casts de enums corretos;
- dispatch ganhou lote limitado, `SKIP LOCKED` e qualificacao de colunas;
- PII audit usa o contrato atual de `user_roles`;
- Trust usa tipos atuais de Orders, Ride, Driver e Profile.

## Evidencias

```bash
supabase db lint --linked --level warning --output json
supabase db query --linked -f tests/security/coverage-commands-remote-audit.sql
npm run validate:migrations
npm run security:validate
```

O comando de lint deve listar somente os 12 nomes extension-owned acima.
