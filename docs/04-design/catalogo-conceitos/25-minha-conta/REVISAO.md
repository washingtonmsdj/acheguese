# Revisão — Minha conta, segurança e privacidade

Status: concluída em 20/09/2026.

Branch auditada: `codex/reformulacao-entrada-comunidade`
Commit-base: `ca88e968d`
Referências comparadas: `068-minha-conta-mobile.png`, `070-privacidade-mobile.png` e `071-minha-conta-desktop.png`.

| Item | Situação no código | Evidência | Decisão | Validação |
|---|---|---|---|---|
| Hub Minha conta | Precisava ajustar | `src/modules/profile/pages/ContaHubPage.tsx` renderizava a prancha antiga de Meus perfis quando `concept-mock=1` | Criar superfície de conceito dedicada, sem alterar o fluxo autenticado | Mobile/desktop conferidos no navegador interno |
| Dados de acesso | Não disponível no fluxo de conceito | Rotas protegidas redirecionavam para login sem sessão demonstrativa | Incluir rota visual de desenvolvimento em `ContaConceptMockPage.tsx`, com e-mail confirmado, usuário, senha, Google e alerta de método único | Mobile/desktop sem overflow |
| Senha e segurança | Parcial no código real; inacessível sem sessão | `ContaSegurancaPage.tsx` possui contrato real, mas a prancha não podia ser revisada sem autenticação | Reproduzir estados demonstrativos de MFA não ativada, acesso indisponível, encerramento de sessões e ajuda | Mobile/desktop e navegação para MFA conferidos |
| Notificações | Parcial no código real; inacessível sem sessão | `NotificationPreferencesPage.tsx` depende de preferências persistidas | Reproduzir canais, dispositivo bloqueado, tipos de aviso, horário de silêncio e CTA solar em desenvolvimento | Títulos mobile/desktop, switches e largura conferidos |
| Privacidade, exportação e exclusão | Parcial no código real; inacessível sem sessão | `PrivacySettingsPage.tsx` depende de serviços e status de conta | Reproduzir escolhas, exportação, modal de confirmação e estado de solicitação sem acionar serviço real | Fluxo modal → solicitação, viewport e sem overflow conferidos |
| Regras de produção | Atendidas | Rotas reais continuam usando `ProtectedRoute` e serviços existentes | O mock é selecionado apenas por `import.meta.env.DEV` e `concept-mock=1` | Sem mudança no fluxo de produção |

## Implementação

- Adicionado `src/modules/profile/pages/ContaConceptMockPage.tsx` com shell responsivo próprio do concept: rail teal no desktop, cabeçalho mobile, navegação inferior, hierarquia, tipografia e espaçamento baseados na SSOT do tema.
- A entrada `/conta?concept-mock=1` agora abre “Minha conta”, não a prancha antiga de “Meus perfis”. As rotas `/conta/seguranca`, `/conta/notificacoes` e `/conta/privacidade` também recebem a superfície de desenvolvimento; hashes `#acesso`, `#mfa`, `#exportar` e `#exclusao` abrem os estados correspondentes.
- Os dados são explicitamente demonstrativos e não alteram credenciais, consentimentos, sessões, exportação ou exclusão. O caminho autenticado real não foi substituído.

## Validação

- Navegador interno mantido aberto nas abas mobile (`389 × 867`) e desktop (`1707 × 960`) durante a conferência lado a lado.
- Conferidos: Minha conta, Dados de acesso, Segurança, MFA, Notificações, Privacidade, modal de exclusão, estado de exclusão solicitada e exportação.
- `document.documentElement.scrollWidth` permaneceu igual ou menor que `innerWidth` em todos os viewports conferidos; não houve erro de runtime nos logs do navegador.
- Executados com sucesso: `npx eslint src/modules/profile/pages/ContaConceptMockPage.tsx src/app/routes/sections/AppLayoutRoutes.tsx src/app/routes/lazyImports.ts`, `npx tsc -b tsconfig.app.json tsconfig.node.json --pretty false --force` e `git diff --check`.

## Limitações preservadas

- Alteração de e-mail, troca de senha, vínculo Google, MFA real, lista de dispositivos, exportação e exclusão permanecem dependentes dos serviços e contratos existentes. A prancha visual não autoriza simular persistência nem bypass de permissão.
