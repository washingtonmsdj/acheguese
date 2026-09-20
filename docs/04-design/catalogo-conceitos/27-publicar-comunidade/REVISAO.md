# Revisão — Publicar na comunidade

Status: concluído em 20/09/2026.

## Referências e decisão

- Referências aprovadas: `086-publicar-consolidado-mobile.png`, `087-alertas-problemas-comunicados.png` e `088-publicar-consolidado-desktop.png`.
- O fluxo real de `NovoPostPage`/`CreatePostModal` continua preservado para produção, com suas permissões e guardas existentes.
- Para comparação visual, `DEV + concept-mock=1` usa `PublicarComunidadeConceptMockPage`; não há conteúdo demonstrativo exposto na produção.
- O concept foi recomposto como fluxo contínuo: participação/vínculo, escolha de destino, aviso, problema/alerta, revisão, comunicado autorizado e encaminhamento a módulos próprios.

## Matriz de conferência

| Item | Situação no código | Evidência | Decisão |
|---|---|---|---|
| Participação sem vínculo | Atendido | `PublicarComunidadeConceptMockPage.tsx` — `Participate` | Solicitação, acompanhamento e exploração permanecem separados. |
| Destinos comunitários | Atendido | `Types` — cards 3×3 responsivos | Discussão, pergunta, enquete, recomendação, aviso, alerta e problema têm destinos próprios. |
| Módulos específicos | Atendido | `Types` — seção `Em outros módulos` | Classificados, Serviços, Vagas e Eventos encaminham ao módulo indicado; não são simulados como publicação comunitária. |
| Aviso comunitário | Atendido | `AlertForm` | Ordem de campos, imagens opcionais, validade, aviso não oficial, rascunho e revisão seguem a prancha 086. |
| Comunicado autorizado | Atendido | `AlertForm communication` | Perfil autorizado e alcance territorial são explicitados, sem confundir comunicado da organização com mensagem da plataforma. |
| Problema/alerta | Atendido | `ProblemForm` | Categoria, local, recorrência, descrição, imagem opcional e aviso de expectativa de atendimento. |
| Revisão e publicação | Atendido | `Review` | Resumo, destino, tipo, orientação da comunidade e ações de editar/publicar. |
| Responsividade | Validado | Navegador interno | Mobile 389×867 e desktop 1707×960, sem overflow horizontal. |

## Ajustes finos

- O desktop foi reorganizado para a composição de duas colunas da prancha 088: `Na comunidade` com cards 3×3 e `Em outros módulos` em painel próprio.
- O mobile mantém o cabeçalho compacto do concept, cards centralizados, ordem vertical do formulário e ações sem barra inferior concorrente.
- A tipografia, cores, bordas, raios e espaçamentos usam classes/token SSOT do projeto; não foram adicionados estilos inline de layout.
- As transições atualizam a URL com `view` para permitir inspeção direta de cada estado sem alterar o fluxo de produção.

## Validação

- Fluxos conferidos: participação → tipos → aviso → revisão; problema; comunicado; encaminhamento de módulo.
- TypeScript da aplicação e ESLint direcionado passaram.
- `git diff --check` passou.
- Logs finais do navegador ficaram sem erros e as duas abas internas foram mantidas abertas no concept durante a conferência.

## Git

- Branch: `codex/reformulacao-entrada-comunidade`.
- Base da rodada: `d4f6c14d8`.
- Commit desta revisão será restrito ao mock, rotas auxiliares e documentação; alterações staged preexistentes ficam fora do commit.
