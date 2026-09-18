# Criar e gerenciar meus anúncios

Conceito proposto em 18/09/2026. Referência visual mobile e desktop, com análise dos arquivos locais. Não é implementação nem auditoria integral do módulo.

## O que existe e o que falta integrar

| Evidência | Situação observada |
| --- | --- |
| `src/modules/classifieds/pages/NovoClassificadoSteps.ts` | Oito etapas: Informações, Preço, Localização, Fotos, Detalhes, Contato, Visibilidade e Revisão |
| `src/modules/classifieds/pages/NovoClassificadoPage.tsx` | Estado para subcategoria, detalhes, contato, telefone visível e anúncio ativo; upload, remoção e reordenação de fotos |
| Mesmo arquivo, `handlePublish` | O payload observado envia título, descrição, preço numérico, categoria, condição, fotos e localização. Não envia subcategoria, tipo de preço, detalhes, contatos nem a opção de visibilidade/atividade do formulário |
| `src/modules/classifieds/constants/form-limits.ts` | Até 10 fotos, título 100 caracteres e descrição 2000 caracteres |
| `src/modules/classifieds/components/create/PriceStep.tsx` | Opções vindas da fonte central de tipos de preço; validação contempla fixo e negociável, e o envio distingue grátis/sob consulta apenas convertendo ambos em zero |
| `src/modules/classifieds/pages/EditarClassificadoPage.tsx` | Edição atual limitada a título, descrição, preço, categoria, condição e status |
| `src/modules/profile/components/UserClassifiedsSection.tsx` | Lista do perfil, criar/editar e agrupamento por `is_active`; não representa todos os estados de moderação |
| `src/modules/classifieds/pages/ClassificadoDetailPage.tsx` | Ações do proprietário para vendido, reativação e pausa |

**Prioridade:** conferir contratos de serviço e persistência antes de oferecer campos como efetivos. A existência de um controle visual não garante que seu valor seja salvo. Tipo de preço deve ser persistido explicitamente para diferenciar grátis de sob consulta. Não inferir que preço zero significa doação.

## Fluxo completo proposto

1. **Perfil:** mostrar por quem o anúncio será publicado. Trocar perfil exige confirmar o destino do trabalho em andamento; rascunhos não migram silenciosamente.
2. **Informações:** título, descrição, categoria, subcategoria e condição a partir das constantes existentes. Campos específicos dependem da categoria.
3. **Preço:** manter as opções da fonte central e validar sua semântica tanto no cliente quanto no servidor. Valores em moeda brasileira com conversão consistente.
4. **Localização:** escolher território permitido pelo produto, com localização válida. No MVP, respeitar a área ativa. Não confundir território explorado com residência comprovada. Exibir bairro, sem publicar endereço residencial exato.
5. **Fotos:** adicionar, remover, ordenar e definir capa; limite de 10 conforme SSOT atual. Progresso, falha por arquivo e tentativa controlada. Ordem de arquivos e prévias deve permanecer estável mesmo com leitura assíncrona.
6. **Detalhes:** campos dinâmicos de categoria, incluindo troca ou entrega somente quando houver contrato correspondente. Entrega declarada pelo anunciante não implica logística Achegue-se.
7. **Contato:** explicar precisamente quais contatos serão públicos; opção desligada não pode ser anulada pelo backend. Conversa interna depende do recurso e da permissão. Conferir leitura posterior do contato, pois o detalhe utiliza contato visível do perfil: definir se o dado é do anúncio ou do perfil, sem alterar o perfil por surpresa.
8. **Visibilidade:** refletir controles reais e política implementada. Perfil pessoal é identidade do autor, não nível de visibilidade. Pausa, rascunho, publicação e moderação são estados diferentes.
9. **Revisão:** resumo de todas as etapas com retorno ao campo correspondente. Validar novamente todos os campos ao enviar. A resposta do servidor determina publicado ou em análise; não prometer publicação imediata.
10. **Gestão:** busca e filtros por status, abrir anúncio, editar, pausar, marcar vendido e reativar quando permitido. Preservar histórico de conversas; anúncios indisponíveis saem dos resultados de disponíveis. Motivo de rejeição somente para pessoas autorizadas.

## Propostas que exigem implementação

- Rascunhos recuperáveis por perfil, com contrato explícito de armazenamento e validade. Não apresentar “salvo” sem confirmação de persistência. Fotos locais não devem parecer recuperáveis se não foram armazenadas.
- Formulário de edição com paridade de campos da criação, preservando dados desconhecidos e anexos existentes.
- Gestão com filtros por todos os estados do contrato: ativo, pausado, vendido, em análise, rejeitado, expirado e removido. Rascunho é proposta separada.
- Confirmação de vendido/remoção; mensagens claras sobre efeito da pausa e reativação. Reativar não pode contornar moderação.
- Identificador de tentativa e reconciliação do envio para evitar duplicatas em timeout. Upload concluído não significa anúncio criado. Recuperar falhas sem apagar o trabalho do usuário.

Recursos desativados devem ficar ocultos no produto real. As pranchas incluem propostas para orientar desenvolvimento futuro; flag sozinha não substitui implementação e autorização.

## Correções de leitura das pranchas

- Os contadores ilustrativos `17/70` e `37/500` do mobile estão incorretos: usar os limites **100 e 2000** das constantes, com contagem real.
- A linha “Visibilidade: Pessoal” é inadequada: mostrar a opção efetiva de disponibilidade/visibilidade. “Pessoal” pertence ao perfil autor.
- Rio Vermelho e Pituaçu que apareceram nos exemplos mobile não devem sugerir expansão ativa: usar bairros habilitados do Complexo no MVP, como Santa Cruz e Chapada.
- A navegação inferior desenhada na quarta tela não altera o padrão global: manter Início, Comunidade, Publicar, Conversas e Conta, com Meus anúncios acessível pela Conta/perfil.
- “Salvar rascunho” é proposta, não recurso comprovado. As imagens são referências; estas regras e os contratos prevalecem sobre textos inventados pelo gerador.

## Verificação para o próximo chat

Testar persistência de cada campo após recarregar; isolamento entre perfis; limites de fotos e texto; moeda; ordenação de fotos; falha de upload; timeout sem duplicação; transições autorizadas; estados de moderação; contato privado; teclado, foco e leitor de tela. Não certificar AAA por aparência. Usar tokens globais e Plus Jakarta Sans, sem cores/fontes locais hardcoded.

## Próxima página

**Perfil público do anunciante**, com anúncios disponíveis, contexto de identidade, contato permitido e denúncia.
