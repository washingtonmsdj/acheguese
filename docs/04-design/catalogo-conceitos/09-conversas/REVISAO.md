# Revisão — Conversas por perfil

Status: implementada e revisada em 20/09/2026.

Referência principal: `pranchas/014-conversas-perfis-lado-a-lado.png`.

| Item | Situação no código | Decisão | Validação |
|---|---|---|---|
| Caixa de entrada por perfil | `MensagensPage` mantém os três perfis, badges, seleção e diretório `Todos os perfis` | No preview DEV, reproduzir Pessoal, Sabores da Ana e Ana Serviços; fora dele, usar os perfis da sessão | Mobile e desktop no navegador interno |
| Lista de conversas | Fixadas, Recentes, busca, filtros e conversa selecionada usam os estados locais e contratos live existentes | Compactar a altura das linhas para o ritmo da prancha sem retirar o alvo de toque | Viewport mobile equivalente a 389 × 867 CSS px |
| Detalhe e compositor | Bolhas, assunto do anúncio, resposta como perfil ativo e envio usam `useCommunityDirectMessages` | Mock somente em DEV; envio real permanece condicionado à conversa e à sessão | Conferência de seleção, abertura mobile e painel desktop |
| Navegação responsiva | Mobile alterna lista/detalhe; desktop mantém rail, inbox e painel lado a lado | Preservar a troca de contexto sem criar uma segunda rota visual | Mobile e desktop |
| Espaçamento tipográfico | A margem global de `p` inflava bolhas, subtítulo e compositor | Regra scoped em `.messages-page p`; nenhum default global foi alterado | Inspeção de `margin-bottom` e `git diff --check` |

## Limites preservados

- `concept-mock=1` continua exclusivo do desenvolvimento e não altera autorização.
- Perfil, inbox, leitura e envio reais continuam dependentes da sessão e dos serviços de mensagens.
- Ações demonstrativas não afirmam persistência quando o contrato live não está disponível.

## Evidências técnicas

- Branch: `codex/reformulacao-entrada-comunidade`.
- Ajustes em `MensagensPage.tsx` e no CSS scoped; o SSOT de acessibilidade global permanece intacto.
- Validação: typecheck, ESLint, testes de mensagens e `git diff --check`.
