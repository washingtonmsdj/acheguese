-- Migration: seed_locations_coordinates
-- Popula canonical_lat/lng nas locations com coordenadas reais dos bairros.
-- Fonte: centroides geográficos aproximados (OpenStreetMap / IBGE).
-- coordinate_source implícito: 'approximate' (centroide territorial).

-- ── Brasil / Bahia / Cidades ──────────────────────────────────────────────────

UPDATE locations SET canonical_lat = -14.2350, canonical_lng = -51.9253
WHERE id = '69d56449-0d83-468f-8f65-7339bb1c2ea2'; -- /br

UPDATE locations SET canonical_lat = -12.5797, canonical_lng = -41.7007
WHERE id = '35448ab5-6028-47a8-85d3-af2d212d1cb4'; -- /br/ba

UPDATE locations SET canonical_lat = -12.9714, canonical_lng = -38.5014
WHERE id = '63c41c29-adce-40f5-a552-e52d176123c3'; -- /br/ba/salvador

UPDATE locations SET canonical_lat = -12.8966, canonical_lng = -38.3313
WHERE id = '1d34ddb7-2c76-4eec-88b5-edda5fb5f5f8'; -- /br/ba/lauro-de-freitas

-- ── Lauro de Freitas ─────────────────────────────────────────────────────────

UPDATE locations SET canonical_lat = -12.8966, canonical_lng = -38.3313
WHERE id = 'baa8fb6a-f41e-49fc-9724-bfa649212b43'; -- lauro-de-freitas/centro

UPDATE locations SET canonical_lat = -12.9100, canonical_lng = -38.3200
WHERE id = 'c9ff803e-ac79-4e67-a504-a6063c7e69a2'; -- lauro-de-freitas/itinga

UPDATE locations SET canonical_lat = -12.8800, canonical_lng = -38.3100
WHERE id = '16db53d3-e063-45c7-8cfc-9b758412bbb8'; -- lauro-de-freitas/vilas-do-atlantico

-- ── Salvador — Bairros ───────────────────────────────────────────────────────

UPDATE locations SET canonical_lat = -13.0167, canonical_lng = -38.4833
WHERE id = 'abbc31d9-866e-41b4-ae6c-f5d789cd0acb'; -- amaralina

UPDATE locations SET canonical_lat = -13.0100, canonical_lng = -38.5300
WHERE id = '5c91b9e1-17bf-4707-9ba7-0dd82ada7eb3'; -- barra

UPDATE locations SET canonical_lat = -12.9800, canonical_lng = -38.5100
WHERE id = 'e5b61665-eec0-4170-bb83-1c249f17c665'; -- barris

UPDATE locations SET canonical_lat = -13.0050, canonical_lng = -38.4700
WHERE id = '03873acd-2ff8-4aab-8fa2-66970e697525'; -- boa-viagem

UPDATE locations SET canonical_lat = -12.9900, canonical_lng = -38.4400
WHERE id = '4379e60c-8232-4a83-b07d-d77576ee523e'; -- boca-do-rio

UPDATE locations SET canonical_lat = -12.9700, canonical_lng = -38.5200
WHERE id = 'c726a6a8-66a1-41ec-8eed-5e8cbdb46551'; -- brotas

UPDATE locations SET canonical_lat = -12.9300, canonical_lng = -38.4600
WHERE id = '603a9923-d21d-483a-9a82-961b7034f08c'; -- cabula

UPDATE locations SET canonical_lat = -12.8800, canonical_lng = -38.4200
WHERE id = '9069f03b-a70a-4aa1-a007-8416b83a30b3'; -- cajazeiras

UPDATE locations SET canonical_lat = -12.9800, canonical_lng = -38.4500
WHERE id = '7255140c-9162-42cb-a761-ba779cda6f7f'; -- caminho-das-arvores

UPDATE locations SET canonical_lat = -12.9900, canonical_lng = -38.5200
WHERE id = 'dd38f379-73aa-43d8-b353-cfd1e5b45edd'; -- campo-grande

UPDATE locations SET canonical_lat = -12.9850, canonical_lng = -38.5150
WHERE id = 'b5e22578-ad4b-4a08-91c9-f501d7f53b4c'; -- canela

UPDATE locations SET canonical_lat = -12.9600, canonical_lng = -38.4800
WHERE id = 'd573f388-dac1-4767-b41e-34e8631d1a9a'; -- castelo-branco

UPDATE locations SET canonical_lat = -13.0050, canonical_lng = -38.4900
WHERE id = '54261f4a-03ba-47f8-8733-c031163e7535'; -- chapada-do-rio-vermelho

UPDATE locations SET canonical_lat = -12.9500, canonical_lng = -38.4700
WHERE id = '018ade73-2aaf-4ce9-82bf-c4a1de0a6481'; -- cidade-nova

UPDATE locations SET canonical_lat = -12.9400, canonical_lng = -38.4900
WHERE id = '023dc3a8-4c84-46c6-9ad5-24c5ba76eb59'; -- cosme-de-farias

UPDATE locations SET canonical_lat = -12.9950, canonical_lng = -38.4600
WHERE id = '0489fb43-ad11-4426-b9fb-029bd895775f'; -- costa-azul

UPDATE locations SET canonical_lat = -12.9750, canonical_lng = -38.5050
WHERE id = '8d20181a-038a-41f9-9a6e-68099cb86781'; -- federacao

UPDATE locations SET canonical_lat = -12.9800, canonical_lng = -38.5100
WHERE id = 'dd8d3de1-63bf-4161-b219-56750fcd8341'; -- garcia

UPDATE locations SET canonical_lat = -13.0000, canonical_lng = -38.5200
WHERE id = '280ee556-b3f1-4339-bef1-3341157ea3d8'; -- graca

UPDATE locations SET canonical_lat = -12.9700, canonical_lng = -38.4600
WHERE id = '75d3dea2-7599-4164-8ee9-493fa673fb6d'; -- imbui

UPDATE locations SET canonical_lat = -12.9850, canonical_lng = -38.4700
WHERE id = '6502f90b-59e8-4f29-bf70-fb7ac4f19452'; -- itaigara

UPDATE locations SET canonical_lat = -12.9600, canonical_lng = -38.3800
WHERE id = '2fd26bd3-390c-40e9-90ce-619577d13f6d'; -- itapua

UPDATE locations SET canonical_lat = -12.9200, canonical_lng = -38.5100
WHERE id = 'ba391786-6560-421e-a617-d248fc1e9985'; -- liberdade

UPDATE locations SET canonical_lat = -12.9400, canonical_lng = -38.5000
WHERE id = 'db0024b9-c502-4713-8a54-57d3295fc692'; -- matatu

UPDATE locations SET canonical_lat = -12.8700, canonical_lng = -38.4000
WHERE id = 'b2f3fef1-efe7-4e78-bd28-ba35b6caf6aa'; -- mussurunga

UPDATE locations SET canonical_lat = -12.9600, canonical_lng = -38.4700
WHERE id = '51484db9-3842-4af8-b676-45f822247250'; -- narandiba

UPDATE locations SET canonical_lat = -13.0100, canonical_lng = -38.4800
WHERE id = 'efda7873-3450-4c8a-97a1-cc4b4f3f72db'; -- nordeste-de-amaralina

UPDATE locations SET canonical_lat = -13.0050, canonical_lng = -38.5200
WHERE id = '016306a2-d3dc-4408-a72f-fd181c085890'; -- ondina

UPDATE locations SET canonical_lat = -12.9200, canonical_lng = -38.4200
WHERE id = '97e69f48-f476-4aa0-ad98-b0f9ecf36749'; -- paralela

UPDATE locations SET canonical_lat = -12.8300, canonical_lng = -38.4900
WHERE id = '18e5a8a2-7664-4dec-a040-da005ba8b0f9'; -- paripe

UPDATE locations SET canonical_lat = -12.9700, canonical_lng = -38.5100
WHERE id = '40000000-0000-0000-0000-000000000003'; -- pelourinho

UPDATE locations SET canonical_lat = -12.9100, canonical_lng = -38.4700
WHERE id = '2503d0df-0ad7-4afc-840d-93e05f088524'; -- pernambues

UPDATE locations SET canonical_lat = -12.9700, canonical_lng = -38.3900
WHERE id = '125bf0d3-413b-48df-b55e-fc5e7cbffac7'; -- piata

UPDATE locations SET canonical_lat = -12.9877, canonical_lng = -38.4573
WHERE id = '384add59-4e53-489d-a7b5-97dea2b3f442'; -- pituba

UPDATE locations SET canonical_lat = -12.8500, canonical_lng = -38.5000
WHERE id = 'ea03f86e-e9bc-466f-8149-692bee36f355'; -- plataforma

UPDATE locations SET canonical_lat = -12.9200, canonical_lng = -38.5200
WHERE id = 'b9a9d3a3-6b2d-4cfc-911c-277a980f3f37'; -- ribeira

UPDATE locations SET canonical_lat = -13.0050, canonical_lng = -38.4950
WHERE id = '879a1f40-5376-4472-845a-2b9af680cddc'; -- rio-vermelho

UPDATE locations SET canonical_lat = -12.9600, canonical_lng = -38.5100
WHERE id = 'ddd48436-13e1-43ba-a1da-134602ec0af0'; -- roma

UPDATE locations SET canonical_lat = -12.9100, canonical_lng = -38.5100
WHERE id = '8931da2e-33c7-44dd-a406-bed44d3db1fc'; -- santa-cruz

UPDATE locations SET canonical_lat = -12.9700, canonical_lng = -38.5100
WHERE id = '4b4f1372-d576-4d41-984c-51161ac35023'; -- santo-antonio

UPDATE locations SET canonical_lat = -12.9300, canonical_lng = -38.4500
WHERE id = '06e59f5e-67bf-4c34-8d29-cb266022dc60'; -- sao-marcos

UPDATE locations SET canonical_lat = -12.9600, canonical_lng = -38.3900
WHERE id = 'b149075c-9d61-441c-b380-a90f3bbe55de'; -- stella-maris

UPDATE locations SET canonical_lat = -12.9800, canonical_lng = -38.4600
WHERE id = '816aca7c-27d6-42e6-b9ea-febfe9b185b1'; -- stiep

UPDATE locations SET canonical_lat = -12.9000, canonical_lng = -38.4600
WHERE id = 'f250c5b0-fec9-405e-b967-c0f44433f9aa'; -- sussuarana

UPDATE locations SET canonical_lat = -12.8900, canonical_lng = -38.4500
WHERE id = '396f6a77-4777-4c29-8b20-6aecd0e10d07'; -- tancredo-neves

UPDATE locations SET canonical_lat = -12.9200, canonical_lng = -38.4300
WHERE id = '518e9c6a-8348-4550-9e55-8662fdcd16c2'; -- trobogy

UPDATE locations SET canonical_lat = -12.9400, canonical_lng = -38.5000
WHERE id = '329d6f99-3dd7-44fe-81e5-a0900453fa16'; -- uruguai

UPDATE locations SET canonical_lat = -13.0100, canonical_lng = -38.4800
WHERE id = 'c7ebd92b-6e35-448e-9b3c-49801e8f3990'; -- vale-das-pedrinhas

UPDATE locations SET canonical_lat = -12.8800, canonical_lng = -38.4300
WHERE id = 'cedfacfb-c680-405f-826d-a5f53c7ec36c'; -- valeria

UPDATE locations SET canonical_lat = -12.9900, canonical_lng = -38.5100
WHERE id = '56b131ba-0213-406d-8134-1d41167b2235'; -- vitoria
