# G166 — Entry arrival crossfade and timeout semantics

## Objetivo

Refinar a experiência entre o Arrival Loading e o mapa real, sem corte seco, sem tela vazia e sem mensagens incorretas quando a demora vem da geometria oficial em vez do MapLibre.

## Implementado

- Arrival permanece montado durante a entrada do mapa real e sai por crossfade curto;
- MapLibre e Arrival usam transições coordenadas, preservando continuidade visual;
- `prefers-reduced-motion` continua respeitado;
- timeout agora diferencia falha/demora do mapa e falha/demora do limite oficial;
- o fallback de limite oficial explica que o mapa não é revelado para evitar contorno incompleto;
- o fallback de mapa preserva a mensagem de que a comunidade continua acessível;
- regressões cobrem crossfade, bounded timeout e semântica distinta de mapa/boundary.

## Regras preservadas

- nenhum contorno territorial aproximado ou inventado;
- mapa só é apresentado quando MapLibre está pronto e a consulta de boundary terminou;
- experiência pública continua não bloqueante;
- mobile e desktop usam o mesmo owner visual responsivo;
- não declarar build/deploy verde sem runner real.

## Estado de certificação

Código e regressões foram publicados na `main`. A certificação de build/deploy continua dependente de execução real do provider.
