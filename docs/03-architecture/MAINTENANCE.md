# Manutenção e organização física do repositório

**Status:** guia operacional vivo. A precedência documental pertence a [`docs/README.md`](../README.md), e as regras arquiteturais a [`CURRENT_RULES.md`](./CURRENT_RULES.md).

## Organização física canônica

| Diretório | Responsabilidade | Regra |
| --- | --- | --- |
| `src/app/` | shell, rotas, providers e lifecycle | Não criar segundo registry ou camada de rota para um domínio pausado |
| `src/core/` | owners de domínio, serviços, tipos, contratos e capabilities | Não importar implementação interna de `src/modules/` |
| `src/modules/` | bounded contexts e apresentação de produtos | Não criar writer paralelo de banco dentro de página/hook |
| `src/shared/` | componentes, design system e utilitários comuns | Não concentrar regra particular de Empresa/Conta |
| `src/integrations/` | adapters externos de infraestrutura | Não criar segunda autoridade de negócio |
| `supabase/migrations/` | evolução versionada do schema | Não manter mudanças persistentes somente em dashboard |
| `supabase/functions/` | brokers de backend | Permissão efetiva nunca depende exclusivamente da UI |
| `tests/` e testes próximos dos owners | regressão/segurança | Testar comportamento e contratos de fronteira |
| `tools/` | verificadores e operações de engenharia | Baselines e manifestos consumidos pelo tooling devem ser preservados |
| `docs/` | documentação canônica e índice | Um documento normativo por assunto, conforme `docs/README.md` |

`src/features/` e raízes de módulo legadas estão aposentadas. Um domínio `paused` continua versionado, mas não volta ao runtime por simples presença física.

## Documentação: localização e precedência

- **Global vivo:** `README.md`, `SECURITY.md`, `docs/README.md`, `docs/FEATURE-MAP.md`, `docs/SCREEN-MAP.md`, `docs/DECISIONS.md`.
- **Arquitetura viva:** `docs/03-architecture/`, com ownership técnico registrado em `docs/architecture/SSOT_REGISTRY.md`.
- **Plano operacional atual:** `docs/08-roadmap/EXECUCAO_MAIN_ONLY.md`; `NEXT-STEPS.md` é apenas resumo.
- **Contratos de módulo:** `src/modules/<modulo>/README.md`, `src/modules/<modulo>/VALIDATION.md` ou `src/modules/<modulo>/docs/` quando necessários. Owners de domínio transversal vivem sob `src/core/<dominio>/`.
- **Evidências datadas:** `docs/08-roadmap/checkpoints/` quando vinculadas a uma execução, ou `docs/10-archive/` para estudo, sprint, handoff e auditoria concluídos.
- **Artefatos consumidos por tooling:** `docs/audits/` e `docs/architecture/` só quando referenciados por validadores/manifestos; não substituem o índice e não devem ser eliminados apenas pelo nome.

Os documentos de `docs/10-archive/` têm valor histórico, mas seus comandos, paths, estatísticas e prazos **não** são instruções executáveis vigentes. Ao mover documento histórico, atualizar toda referência ativa e os testes de governança que apontavam para o caminho anterior. Quando a rastreabilidade estiver garantida por Git e o conteúdo não tiver valor adicional, remoção definitiva exige verificar consumidores antes.

## Procedimento obrigatório para limpeza

1. Ler `main`, PRs abertas e o registry do owner; outras frentes podem modificar os mesmos arquivos.
2. Localizar **todos os consumidores ativos** antes de mover/apagar serviço, tipo, documentação ou manifest. Não confundir módulo pausado com código órfão.
3. Classificar: **canônico**, **histórico**, **futuro ainda relevante**, **gerado/consumido por ferramenta** ou **órfão comprovado**.
4. Preservar `README.md` e documentação SSOT do owner; atualizar a fonte existente antes de criar documento equivalente.
5. Para código: corrigir dependências/imports e testes de contrato na mesma PR. Para docs: atualizar índice/links e mover histórico para arquivo em vez de manter instruções obsoletas no roadmap ativo.
6. Rodar gates de documentação, taxonomia, SSOT, typecheck, segurança e build adequados ao diff. Não marcar runner pendente como sucesso.
7. Registrar diferenças e decisões na PR; verificar a `main` novamente antes de merge. Commit não equivale a deploy ou smoke do mesmo SHA.

## Validações recomendadas

```bash
npm run validate:docs-structure
npm run validate:taxonomy
npm run validate:ssot
npm run validate:architecture:governance
npm run security:validate
npm run typecheck
npm run build
```

Para reorganização ampla, executar também testes de contratos de arquitetura, links vivos e inventário, sem reduzir baselines ou esconder erros para conseguir CI verde.

## Proibições

- Renomear/mover árvores inteiras sem mapear imports, scripts, testes e deploy;
- manter dois writers ou dois owners do mesmo agregado para compatibilidade indefinida;
- apagar migrações, registros de auditoria, arquivos gerados que sejam inputs de CI ou domínios pós-MVP pausados sem prova;
- copiar documentos históricos para `docs/` como se fossem estado atual;
- manter instrução `AGORA` de estudo arquivado como item ativo no roadmap;
- inventar novo SSOT em relatório de conversa, contornando contratos executáveis.
