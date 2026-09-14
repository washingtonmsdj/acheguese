# G168 — Progressive entry map loading

## Objetivo

Reduzir o tempo percebido para o mapa da `/` aparecer sem inventar geometria territorial.

## Contrato atual

- o runtime do mapa começa a carregar mesmo enquanto cidade/grupo territorial ainda resolvem;
- o chunk do runtime e a engine/worker do MapLibre são aquecidos após a primeira pintura;
- o style JSON do OpenFreeMap é pré-carregado;
- o mapa base é revelado assim que o MapLibre fica pronto;
- a busca do limite oficial ocorre em paralelo e não bloqueia mais o basemap;
- o limite só é desenhado quando todos os membros do grupo oficial estiverem representados;
- limite parcial, aproximado ou fallback inventado continua proibido;
- enquanto a geometria oficial chega, o mapa mostra um status discreto e não-bloqueante;
- `mapReady` não é mais zerado quando os dados territoriais chegam depois do basemap;
- `BoundaryService` deixou de ser importado estaticamente pelo hook de polígonos.

## Performance

A cascata anterior era aproximadamente:

`resolver território → montar runtime → baixar MapLibre → carregar mapa → buscar limite → revelar`

Agora é:

`primeira pintura → runtime/MapLibre/style em paralelo + resolução territorial → revelar basemap → aplicar limite oficial quando pronto`

## Verificação

Foram atualizadas regressões de carregamento progressivo e de entrada community-first. Os testes estão versionados, mas não foram executados por um runner nesta conversa.

## Release

Não considerar este SHA certificado enquanto build/test/deploy do mesmo SHA não estiverem verdes. Rate-limit do Vercel continua sendo falha do provider, não aprovação nem reprovação do source.
