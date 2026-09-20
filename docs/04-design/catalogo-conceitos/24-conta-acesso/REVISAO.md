# Revisão — Conta e acesso

Status: concluída em 20/09/2026.

Branch analisada: `codex/reformulacao-entrada-comunidade`.
Superfícies revisadas: `LoginPage`, `CadastroPage`, `CadastroConfirmacaoPage` e `ResetPasswordPage`.
Referências: pranchas 064, 065 e 067; as pranchas 063 e 066 permanecem históricas.

| Item | Situação no código | Evidência | Decisão | Validação |
|---|---|---|---|---|
| Entrar | Já atende | `src/app/pages/LoginPage.tsx` | Manter título mobile/desktop, Google, recuperação, cadastro, exploração sem conta e links legais | Mobile e desktop conferidos |
| Criar conta | Já atende | `src/app/features/onboarding/pages/CadastroPage.tsx` | Manter perfil pessoal primeiro, senha forte, termos/diretrizes, privacidade e Google | Mobile e desktop conferidos |
| Confirmar e-mail | Já atende com fallback | `CadastroConfirmacaoPage.tsx` | Preservar localização da inscrição, reenvio e retorno; não inventar e-mail pendente sem contexto real | Rota sem sessão conferida |
| Recuperar acesso | Já atende | `src/app/pages/ResetPasswordPage.tsx` | Manter solicitação por e-mail, confirmação, nova senha e link expirado conforme contratos reais | Solicitação mobile/desktop conferida |
| Google e segurança | Preservados | `LoginPage` / `CadastroPage` | Google permanece condicionado à habilitação; verificação continua dependente do contrato | Typecheck e fluxos |

## Decisões e limites

- Não foram necessários ajustes de código: as superfícies existentes já usam a SSOT de tipografia, tokens de cor e layout responsivo das pranchas.
- A confirmação de e-mail sem jornada de cadastro ativa exibe o fallback “Vamos localizar sua inscrição”; isso é preferível a inventar um endereço ou confirmar uma conta sem contrato.
- As telas foram auditadas com dados de demonstração apenas em desenvolvimento; senha, e-mail, Google, confirmação e redirecionamentos continuam sob Auth/Supabase.

## Verificações

- Navegador interno mantido aberto nas rotas `/login?concept-mock=1`, `/cadastro?concept-mock=1`, `/cadastro/confirmacao?concept-mock=1` e `/reset-password?mode=request&email=ana%40example.com&concept-mock=1`.
- Mobile conferido em viewport compacto: login, cadastro e recuperação preservam escala, pesos, espaçamento e ações da referência.
- Desktop conferido em `1707 × 960`: login, cadastro e recuperação mantêm composição com ilustração e formulário sem overflow do documento.
- `npm run typecheck:app` e auditoria visual executados; não houve alteração funcional necessária.

Limitação: a confirmação visual de e-mail e os estados de sucesso/expiração dependem de callback e estado Auth reais; a rota sem sessão mantém o fallback seguro.
