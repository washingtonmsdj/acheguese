# Achegue-se — três modalidades de entrega

Especificação de produto para implementação futura. Data: 13/09/2026.
Decisões consolidadas com o usuário nesta conversa. Não representa funcionalidades já implementadas nem validação jurídica. As imagens são referências visuais; este documento prevalece sobre rótulos, mapas ou números imprecisos das imagens.

## 1. Objetivo e decisões

Uma loja pode usar três modalidades, inclusive mantendo mais de uma habilitada. Cada pedido de entrega usa exatamente uma modalidade operacional por vez. Retirada e consumo no local continuam sendo formas de recebimento separadas, sem despacho de entregador.

| Modalidade | Quem organiza a entrega | Cadastro do entregador | Recursos |
|---|---|---|---|
| Própria sem integração | Loja, fora da plataforma | Não exigido | A loja atualiza o pedido manualmente. Sem mapa do entregador, atribuição a perfil, central do entregador, chat com ele ou comprovante produzido por ele no Achegue-se. |
| Equipe da loja integrada | Loja e profissional vinculado por aceite | Conta e perfil de entregador no Achegue-se | Convite, atribuição e aceite de pedido, acompanhamento autorizado, comunicação, coleta, conclusão e comprovante. Pagamento combinado com a loja. |
| Rede Achegue-se | Despacho da rede, conforme regras habilitadas | Perfil habilitado separadamente para a rede | Oferta a profissionais elegíveis, aceite, execução e acompanhamento. Não há vínculo obrigatório com a equipe da loja. |

Usar a tecnologia do Achegue-se não torna automaticamente o profissional integrante da rede. Vínculo com loja significa autorização operacional dentro do produto; não define por si só a relação contratual ou trabalhista.

## 2. Identidade, diretório e vínculo

- Uma conta pode ter perfil pessoal e perfil operacional de entregador. Reutilizar a identidade existente; não criar duplicatas por loja.
- O perfil de entregador pode estar vinculado a várias lojas, se as regras permitirem. A participação na rede é uma habilitação independente.
- O diretório profissional é opt-in. Campos propostos: apresentação, foto, veículo, experiência declarada, cidade, bairros atendidos, preferência de trabalho (fixo, turno ou entrega) e interesse em contatos.
- Não exibir CNH, anexos de documentos, endereço residencial ou localização em tempo real no diretório. Contato inicial pelo sistema; telefone apenas conforme escolha e permissão do profissional.
- Não confundir “interessado em propostas” com “online para receber entregas”. Não inventar selos de verificação ou reputação. Só mostrar verificações que existam e avaliações contextualizadas por origem.
- A loja encontra um profissional no diretório ou envia convite direto. Para quem não tem conta, o convite leva ao cadastro e depois ao aceite. A loja não cria senha nem aceita termos em nome do entregador.
- Fluxo de vínculo: convite pendente → aceito/ativo, recusado, revogado ou expirado. Prazo de expiração deve ser definido na implementação, sem número inventado no conceito.
- Convite informa loja, permissões e condições operacionais. Condições comerciais são apresentadas para ciência, sem alegar que um aceite simples substitui os instrumentos necessários à contratação.
- Encerrar vínculo impede novas atribuições, mas não apaga histórico. Entregas em curso exigem resolução explícita antes da saída definitiva; suspensão de segurança pode restringir imediatamente o acesso conforme regra auditável.
- Ocultar-se do diretório não encerra vínculos e não muda automaticamente a disponibilidade na rede.

## 3. Páginas e navegação

Na loja: página “Entregas” com acessos “Pedidos”, “Minha equipe”, “Encontrar entregadores” e “Modalidades”. O mapa pertence ao acompanhamento de pedidos integrados; não ao diretório.

No entregador: “Minhas lojas”, convites, entregas atribuídas e, somente quando habilitado, “Ofertas da rede”. Cada pedido identifica a origem: “Equipe da loja · Sabores da Ana” ou “Rede Achegue-se”.

### Modalidades

Três cartões explicativos, configuração da modalidade padrão e habilitações permitidas. Habilitar mais de uma não duplica a entrega. Disponibilidade da rede depende de território, loja, endereço e profissional elegível. Indisponibilidade deve explicar a condição; não prometer cobertura nacional apenas porque o cadastro permite selecionar cidades.

### Minha equipe

Lista pesquisável, filtros de vínculo, convites pendentes e ações de convidar, consultar permissões e encerrar vínculo. Mostrar disponibilidade explicitamente compartilhada para essa loja. Não mostrar pedidos, ganhos, clientes ou localização de outras lojas.

### Encontrar entregadores

Busca por nome, cidade, bairro, veículo e interesse profissional. Cartões e perfil detalhado. Ações “Conversar” e “Convidar para minha equipe”. Convite existente deve aparecer como pendente, sem gerar duplicata. Busca sem resultados oferece remover filtros, sem inventar profissionais disponíveis.

### Pedido

Mostra modalidade atual, responsável operacional, status de preparo, status logístico e ações permitidas. A integração não elimina o preparo da cozinha nem transforma pedido pronto em pedido coletado.

## 4. Fluxos por modalidade

### A. Própria sem integração

Pedido em preparo → pronto → loja marca “Saiu para entrega” → loja registra “Entregue”. Registrar autor e horário das mudanças. A atualização manual é informação da loja, não prova produzida pelo entregador.

Cliente vê “Entrega realizada pela loja” e “Acompanhamento atualizado pela loja”, com botão “Falar com a loja”. Não renderizar mapa vazio, marcador simulado ou aviso “buscando entregador” nesse modo. Dados de endereço da entrega continuam disponíveis aos usuários autorizados.

### B. Equipe integrada

1. A loja seleciona profissional com vínculo ativo e permissão adequada.
2. Pedido fica “Aguardando aceite”. Vínculo aceito não equivale a aceite de cada serviço.
3. Entregador aceita ou recusa. Até o aceite, não confirmar ao cliente que ele realizará a entrega.
4. Aceito → ir para coleta → confirmar coleta → iniciar entrega → confirmar conclusão com comprovante.
5. Se recusar ou a solicitação expirar, retornar à fila para decisão da loja. Nunca despachar a rede automaticamente.
6. Atribuição exige checagem de capacidade e conflito de serviço. Começar conservadoramente sem aceitar sobreposição incompatível; múltiplas paradas e lotes exigem projeto específico.

Valor combinado com a loja não é saldo de carteira do Achegue-se. Pode haver remuneração por turno ou contrato, então não inventar preço por entrega quando não informado. Separar valor cobrado do cliente do valor destinado ao profissional.

### C. Rede Achegue-se

Loja solicita → validação de elegibilidade/cobertura/valor → busca → oferta → aceite atômico por profissional → coleta → entrega → conclusão. Após envio, impedir solicitações duplicadas. Busca sem resultado oferece tentar novamente, equipe própria ou retirada, conforme disponibilidade e acordo com o cliente. Não garantir aceite ou prazo sem evidência operacional.

Entrada na equipe da loja não ativa o profissional na rede. A política de habilitação deve distinguir requisitos comuns de identidade/segurança e requisitos específicos da rede, sem permitir contornar bloqueios aplicáveis à conta.

## 5. Mapas, contatos e permissões

- Sem integração: nenhum rastreamento do entregador.
- Equipe/rede: apenas localização autorizada do profissional atribuído ao pedido, dentro da janela operacional necessária. Cliente acompanha a própria entrega; loja acompanha seus pedidos.
- Não compartilhar localização permanente, trajetos particulares ou dados de outras operações. Mapas do diretório não podem virar radar de pessoas.
- Sem GPS/permissão, sinal atrasado ou conexão ausente: manter status textual, indicar última atualização e não simular movimento. Se uma etapa exigir localização, explicar o bloqueio e oferecer suporte.
- Ao concluir, encerrar acesso ao rastreamento ao vivo; histórico e comprovante têm acesso restrito conforme política de retenção definida.
- Profissional acessa somente pedidos atribuídos a ele. Loja não ganha acesso à conta pessoal, credenciais ou documentos privados do profissional.
- Controles de permissão precisam ser validados no servidor, não só escondidos na interface.

## 6. Pagamentos e suporte

- Origem operacional, pagamento dos produtos, taxa de entrega do cliente e remuneração do entregador são conceitos distintos.
- Pagamento dos produtos à loja não comprova recebimento pelo entregador.
- “Valor registrado”, “recebimento confirmado” e “repasse pendente” têm significados separados. Ausência de dado financeiro é “Não informado”, nunca taxa zero ou saldo recebido por suposição.
- Repasses automatizados da rede dependem de integração financeira própria. Não implementar carteira ou saque apenas porque aparecem em uma inspiração visual.
- Equipe integrada: questões de atribuição e acordo comercial direcionadas à loja; falhas técnicas do sistema ao Achegue-se. Rede: atendimento conforme operação da rede. Cliente sempre mantém acesso à loja sobre seu pedido.
- Evitar ciclos de suporte que deixem uma pessoa sem atendimento. Expor contexto e responsável pelo chamado, com encaminhamento auditável.
- Termos e divisão jurídica de responsabilidades exigem revisão própria. Não exibir “Achegue-se isento de qualquer responsabilidade”.

## 7. Troca de modalidade e exceções

- Salvar no pedido a modalidade escolhida e as condições vigentes; mudar a configuração da loja não altera pedidos existentes.
- Troca em pedido ativo é ação explícita com motivo, autor e horário. Se muda preço, prazo ou forma de recebimento, requer acordo com o cliente antes da confirmação.
- Cancelar/liberar atribuição anterior antes de criar outra. Não deixar equipe e rede disputando o mesmo pedido.
- Depois de coletado, não mudar transportador silenciosamente. Transferência, retorno e falha precisam de fluxo dedicado.
- Preservar formulários em erros; revalidar estado antes de repetir uma ação incerta. Nunca mostrar sucesso sem confirmação.
- Cobrir sem resultados, carregamento, erro, convite expirado, vínculo suspenso, profissional ocupado, recusa, rede indisponível, GPS desatualizado e encerramento com entrega em curso.

## 8. Orientação técnica para o próximo chat

Antes de editar, reler o estado atual do repositório e suas instruções. Havia alterações locais de outras atividades na inspeção; preservar esse trabalho. Esta especificação não autoriza sobrescrever mudanças nem presume verificação da main remota.

Evidência local consultada:

- `src/core/mobility/delivery/delivery/types.ts`: duas modalidades canônicas, `merchant_own_fleet` e `platform_courier_network`.
- `src/core/mobility/delivery/order/types.ts`: pedido tem `delivery_mode` e `courier_profile_id` opcional.
- `src/modules/business/gastronomy/checkout/checkoutRules.ts`: normalização de modalidades e guarda da disponibilidade da rede.
- `src/core/mobility/components/driver/MotoboyDeliveryActions.tsx`: ações de coleta, início, conclusão e falha.
- `src/core/mobility/delivery/settlement-context/SettlementContextService.ts`: execução de repasses desabilitada na versão consultada.

Não foi confirmado um fluxo completo já implementado de diretório, convite e equipe vinculada. Reutilizar capacidades reais encontradas na nova inspeção; não duplicar fontes de identidade, pedidos, logística ou pagamentos.

Modelo conceitual recomendado: manter a distinção existente de operador (loja/rede) e acrescentar uma distinção explícita de integração (manual/integrada), resultando nas três opções da interface. Nomes finais devem seguir a arquitetura existente. Não inferir “manual” só porque o entregador ainda não foi atribuído: uma entrega integrada pode estar aguardando atribuição.

Entidades/responsabilidades propostas, não tabelas já existentes:

- Perfil profissional e preferência de visibilidade no diretório.
- Convite e vínculo loja–entregador com estado, permissões e trilha de auditoria.
- Habilitação independente para a rede e disponibilidade por contexto.
- Atribuição de entrega com aceite, recusa, expiração e controle de concorrência.
- Snapshot da modalidade e condições no pedido.
- Registro financeiro separado de estado logístico.

Migração deve preservar pedidos antigos como frota própria/manual quando não houver evidência confiável de integração, com regra documentada e validação dos registros existentes. Não desativar rastreamentos legítimos por simples ausência de um novo campo. Não trocar enums ou liberar flags globais sem analisar consumidores e contratos ponta a ponta.

## 9. Critérios de aceite

1. Uma loja realiza entrega manual sem exigir perfil do entregador e sem mapa.
2. Profissional cadastrado pode aceitar convite sem criar nova conta; usuário sem cadastro retoma o convite após cadastrar-se.
3. Convite não aceito não permite atribuição nem acesso a dados privados.
4. Profissional vinculado recebe atribuição, aceita, coleta e conclui; loja/cliente veem apenas o que lhes pertence.
5. Profissional da equipe não aparece na rede por consequência do vínculo.
6. Mesmo profissional pode ter múltiplos contextos, mantendo separação e evitando aceite concorrente incompatível.
7. Diretório respeita opção de visibilidade e não expõe documentos ou GPS.
8. Rede desabilitada não gera despacho, cobrança ou promessa de entregador.
9. Configuração nova não modifica pedidos existentes; troca explícita preserva acordos e histórico.
10. Conclusão da entrega não marca pagamento automaticamente.
11. Erro de GPS ou rede tem estado honesto e recuperação sem duplicidade.
12. Mobile e desktop oferecem os mesmos recursos autorizados, com teclado, foco, rótulos, contraste e alvos de toque verificados na implementação; imagem não certifica acessibilidade.

## 10. Sequência sugerida

Primeiro consolidar as três opções e a entrega manual. Depois implementar vínculos e convites, equipe integrada e suas permissões. Em seguida diretório e descoberta. Por fim habilitar despacho da rede e evolução financeira, cada um com testes ponta a ponta e ativação controlada por região. O diretório pode ser antecipado se os fluxos de identidade, contato e consentimento já estiverem prontos.

## 11. Pranchas e instrução para continuidade

Imagens geradas com a ferramenta nativa de geração de imagens, sem alterar telas da aplicação:

- [01 — Modalidades, desktop](concepts/entregas-tres-modalidades/01-modalidades-desktop.png)
- [02 — Diretório e convite, mobile](concepts/entregas-tres-modalidades/02-diretorio-convite-mobile.png)
- [03 — Operação, mobile](concepts/entregas-tres-modalidades/03-operacao-mobile.png)

Direção utilizada na geração: mockups de alta fidelidade em português, petróleo #123E3D, solar #F3CB4C, marfim #FAFBF7, tipografia inspirada em Plus Jakarta Sans. Prancha desktop com quatro estados em grade 2×2; mobile com quatro aparelhos altos e legíveis. Estados e conteúdo foram especificados conforme os fluxos deste documento. Mapas, pessoas e estabelecimentos são ilustrativos; não extrair geometria real ou regras de negócio dos desenhos. O contador de caracteres inventado pelo gerador na prancha de convite foi removido na revisão.

Texto para enviar ao próximo chat:

> Leia docs/ENTREGAS-TRES-MODALIDADES-CONCEITO.md e suas três pranchas. Analise a implementação atual antes de modificar o projeto, preserve as alterações locais existentes e reutilize os serviços canônicos. Implemente as três modalidades de entrega e os fluxos de diretório, convite, vínculo e atribuição conforme a especificação, distinguindo explicitamente recursos existentes de novos. Não ative a rede nem repasses antes de validar contratos e testes ponta a ponta. Trate as imagens como referência visual; use o documento como regra funcional. Apresente mudanças, validações e dependências pendentes sem afirmar que recursos incompletos estão ativos.
