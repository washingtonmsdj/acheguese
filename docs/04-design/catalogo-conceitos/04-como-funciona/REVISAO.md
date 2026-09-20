# Revisão — Como funciona

Status: implementada e revisada em 19/09/2026.

Referências principais: `pranchas/061-como-funciona-mobile.png` e `pranchas/062-como-funciona-desktop.png`.
Branch da revisão: `codex/reformulacao-entrada-comunidade`.

| Item | Situação no código | Evidência | Decisão | Validação |
|---|---|---|---|---|
| Header institucional e menu | Implementado | `src/app/pages/ComoFuncionaPage.tsx` | Manter navegação `Como funciona`, Ajuda, Entrar, cadastro e menu móvel usando rotas reais | Menu e links conferidos em mobile e desktop |
| Primeiro trecho — conhecer | Ajustado | `ComoFuncionaPage.tsx` | Usar imagem de comércio local, título com quebra mobile da prancha, contexto do Complexo e ações reais | Conferido em `389 × 867` e desktop amplo |
| Módulos e conta | Implementado | `MODULES`, `ModuleCard`, `AccountStrip` | Renderizar somente superfícies habilitadas pelo launch scope e preservar os destinos reais | Seis módulos, faixas sem conta/com conta e links verificados |
| Perfis e participação | Implementado | `PROFILES`, `ProfileCard`, `RespectRow` | Separar perfil pessoal, negócio e profissional sem conceder permissões pela apresentação | Trecho mobile medido e cards renderizados após rolagem |
| Expansão e dúvidas | Implementado | `AccountStrip`, `FaqItem`, `/indicar-comunidade` | Manter indicação como ação separada e FAQ acessível via `details`, sem prometer novas comunidades | Ação, FAQ aberto inicial e links conferidos |
| Rodapé responsivo | Ajustado | `ComoFuncionaPage.tsx` | Centralizar marca e links no mobile; distribuir no desktop | Medido no viewport mobile e desktop |

## Decisões de implementação

- A fotografia do primeiro trecho foi alinhada para `src/assets/complexo-comercio.jpg`, que representa comércio local e se aproxima da composição da prancha sem criar um asset ilustrativo novo.
- O título mantém uma linha no desktop amplo e quebra depois de `Seu lugar,` no mobile, como no concept. A quebra é responsiva, não um texto duplicado por breakpoint.
- O conteúdo continua alimentado por `TERRITORY_CONFIG`, launch scope e rotas existentes. Os nomes de perfis e imagens usados na composição são dados demonstrativos já presentes na superfície institucional; nenhuma permissão ou disponibilidade é ativada pela página.
- A referência organiza a experiência em quatro trechos de rolagem mobile; a página preserva essa hierarquia por seções, com o conteúdo completo continuando rolável e acessível em telas menores.

## Validação

- Navegador interno: conferidos menu móvel, header desktop, primeiro trecho, módulos, faixas de conta, cards de perfis, área de respeito, indicação, FAQ e rodapé.
- Viewports: mobile equivalente à prancha `389 × 867` CSS px; desktop temporário `1440 × 867` CSS px.
- `npm run typecheck:app`.
- ESLint no componente alterado.
- `git diff --check`.

Limitação mantida: fotografias e perfis são conteúdo de apresentação da página institucional; os links continuam submetidos às rotas, flags e permissões reais do produto.
