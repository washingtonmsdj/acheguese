# Conta e acesso — assets

Os arquivos raster deste diretório são recortes otimizados das pranchas de conceito aprovadas para o fluxo de conta e acesso. Não são ilustrações genéricas substitutas: preservam a arte do conceito fornecido para manter fidelidade visual entre mobile e desktop.

## Assets em uso

- `login-hero.webp` — arte da tela desktop **Entrar**.
- `signup-hero.webp` — arte da tela desktop **Criar conta**.
- `confirm-hero.webp` — arte da tela desktop **Confirmar e-mail**.
- `recovery-hero.webp` — arte da tela desktop **Recuperar acesso**.
- `confirm-envelope.webp` — envelope usado na confirmação mobile.

Os ícones funcionais do fluxo são desenhados pelo componente `AuthConceptIcon` em HTML/CSS, sem SVG genérico. As telas desktop usam as artes acima somente nas composições que possuem ilustração explícita na prancha aprovada; não criar arte fictícia para estados que não receberam referência visual.

> Integridade: os assets devem permanecer WebP válidos e manter as dimensões do recorte aprovado. A suíte `tests/regression/auth-concept-flow.test.ts` protege esse contrato para evitar trocas de arquivo, blobs truncados ou arte genérica.
