# Entregador vinculado à loja — operação e comprovante

Proposta para implementação, 13/09/2026. Complementa `ENTREGAS-TRES-MODALIDADES-CONCEITO.md`. Não altera o código da aplicação. O documento prevalece sobre detalhes ilustrativos das pranchas.

## Base verificada

`src/core/mobility/delivery/proof-of-delivery/types.ts` define `photo_url`, `code`, `observation` e `signed_at`, todos opcionais. Isso não comprova implementação de captura, armazenamento privado, validação de código ou assinatura digital.

`src/core/mobility/components/driver/MotoboyDeliveryActions.tsx` oferece ir para coleta, confirmar coleta, iniciar entrega, confirmar entrega e registrar falha. A interface atual exige observação na conclusão, aceita código opcional e envia apenas esses dois campos. O nome do destinatário do pedido não equivale ao nome de quem efetivamente recebeu.

As propostas abaixo exigem contratos, validação e permissões ponta a ponta. Não presumir que `code` já seja um código de uso único validado nem que `signed_at` represente assinatura do destinatário.

## Fluxo operacional integrado

1. Solicitação: exibir loja responsável, modalidade “Equipe da loja integrada”, identificação da entrega, coleta, região de destino, pacote/quantidade e condições comerciais. Não confundir taxa do cliente com remuneração do profissional. Exemplo: “Remuneração conforme acordo com a loja”, sem inventar valor por entrega.
2. Aceitar ou recusar serviço: aceite de vínculo não substitui aceite da entrega. Validar vínculo ativo, estado do pedido, atribuição e capacidade no servidor. Recusa devolve a solicitação para decisão da loja e não cancela o pedido do cliente.
3. Aceita: ação “Ir para coleta”. Mostrar endereço de coleta e contato da loja.
4. Na coleta: conferir identificação, quantidade de volumes e orientações; ação “Confirmar coleta”. Não exigir abrir embalagem lacrada. Pacote divergente ou danificado leva a contato com a loja/registro de problema.
5. Coleta confirmada: ação explícita “Iniciar entrega”. Não pular esta etapa ao redesenhar.
6. Em entrega: endereço, complemento, referência, destinatário, navegação externa, contato e data da última localização. Destino detalhado só para profissional autorizado. Dados ilustrativos: entrega #1043, coleta Sabores da Ana em Santa Cruz; destino Ana Oliveira no Nordeste de Amaralina, Salvador.
7. No destino: abrir “Registrar recebimento”. Preencher método e evidências conforme política do pedido. Não marcar entregue ao simplesmente abrir o formulário ou tirar foto.
8. Conclusão: só após confirmação persistida, mostrar “Entrega concluída”, horário e comprovante. Não marcar pagamento recebido, não prometer repasse e encerrar rastreamento ao vivo conforme política operacional.

## Comprovante recomendado

### Entrega em mãos ao destinatário

- Selecionar “Ao destinatário”.
- Campo “Quem recebeu?” com nome informado, suficiente para identificar o recebimento. Pode sugerir o nome do pedido, mas exige confirmação consciente; não inferir automaticamente que o titular recebeu.
- Não pedir CPF, RG, foto do documento ou reconhecimento facial como padrão.
- Código de entrega apenas se exigido pela política do pedido. Solicitar no momento da entrega, nunca antecipadamente por chat ou telefone.
- Observação continua obrigatória na primeira implementação, preservando a regra atual. Uma futura substituição por descrição estruturada deve ser decidida explicitamente e validada no contrato, não removida só do front-end.
- Foto não é obrigatória por padrão e não deve atrapalhar entrega em mãos nem expor o rosto do recebedor.

### Entrega a terceiro autorizado

- Selecionar “A pessoa autorizada”. Confirmar que existe autorização do destinatário; nome informado não é autorização.
- Registrar nome de quem recebeu e relação/função, por exemplo portaria ou pessoa indicada. Evitar documento de identidade por padrão.
- Guardar referência da autorização no pedido/conversa ou confirmação formal do destinatário, não apenas um checkbox marcado unilateralmente pelo entregador.
- Aplicar código quando o pedido exigir, sem exceção silenciosa. Caso não haja pessoa autorizada ou não seja possível cumprir a política, entrar no fluxo de problema.

### Pacote deixado em local autorizado

- Disponível somente quando o destinatário autorizou previamente um local adequado e a política da categoria/pedido permite. Para refeições, não habilitar por padrão; avaliar preservação, segurança e tempo de exposição.
- Registrar local e referência da autorização. Não preencher um recebedor humano fictício.
- Foto do pacote no local autorizado é a evidência recomendada e, para este método proposto, exigida antes da conclusão.
- Enquadrar pacote e contexto mínimo do local. Evitar rostos, crianças, documentos, etiquetas legíveis, interior da residência, placas de veículos ou objetos pessoais desnecessários. Não pedir uma fotografia panorâmica da casa.
- Oferecer visualizar, refazer e remover a foto antes de enviar. Não publicar no feed, diretório ou perfil do entregador.
- Foto não autoriza deixar pedido na porta e não é prova absoluta de recebimento. Se não houver autorização ou foto segura, tratar como impedimento e contatar cliente/loja.

### Campos e validações propostos

Definir dados estruturados para método de entrega, nome informado do recebedor, relação/função quando aplicável, referência da autorização, local autorizado, observação, referências privadas das imagens e resultado de verificação do código. Os nomes finais devem seguir os contratos existentes.

Registrar pedido, atribuição, profissional, autor e horário confirmado pelo servidor. Pode-se registrar horário declarado de captura separadamente; não substituir o horário de confirmação pelo relógio do dispositivo. GPS, se necessário e autorizado, tem precisão e horário próprios e não prova sozinho recebimento.

Código: implementar geração segura vinculada ao pedido, validação no servidor, limite de tentativas, uso único e acesso do destinatário. Não expor o código esperado ao entregador, em logs ou no comprovante. O comprovante mostra “Código validado” quando isso de fato ocorreu. Não derivar código de telefone/CPF. Política obrigatória não pode ser contornada por observação ou foto.

Arquivos: acesso autenticado e restrito aos participantes autorizados e suporte, referências privadas, validação de formato/tamanho e limpeza de metadados desnecessários. Definir limites reais na implementação e refletir na interface; não copiar números inventados de imagens.

Upload e conclusão precisam de consistência: anexo obrigatório só conta após confirmação de armazenamento. Falha no upload não conclui o pedido. Implementar idempotência e controle de estado na conclusão; uma repetição não cria duas entregas ou dois registros financeiros.

## Falhas e situações especiais

- Destinatário ausente: tentar contato quando possível, registrar motivo e seguir orientação da loja. Não marcar entregue nem trocar para “local autorizado” por conveniência.
- Código inválido: manter formulário e indicar erro. Permitir nova tentativa conforme limite e acesso ao suporte. Não mostrar sucesso.
- Código indisponível: fluxo de exceção autorizado e auditado, se previsto; nunca um botão genérico de pular validação.
- Sem conexão: preservar preenchimento de forma segura e temporária, mostrar “Conclusão ainda não confirmada”. Reconsultar estado antes de repetir ação de resultado incerto. Não afirmar que falhou definitivamente se o servidor pode ter concluído.
- Se foto/código obrigatório não puder ser confirmado, não concluir offline como se estivesse validado. Ao reconectar, sincronizar com idempotência e limpar o rascunho após confirmação.
- Endereço incorreto/inacessível, avaria, risco de segurança ou problema no veículo: registrar problema, preservar pedido e encaminhar à operação. Retorno e mudança de destino exigem decisão explícita.
- Comprovante é evidência contestável. Cliente pode informar “Não recebi” e abrir atendimento; foto ou código não devem encerrar disputa automaticamente.

## Ajustes nos conceitos anteriores

1. **Central do entregador da rede:** reutilizar o componente de execução e comprovante, mantendo origem da operação e suporte distintos. Políticas podem variar por pedido, com apresentação clara.
2. **Comprovante antigo:** trocar “código opcional” fixo por campo condicional. Manter observação obrigatória enquanto o contrato atual assim exigir. Acrescentar método, recebedor real e evidência fotográfica contextual.
3. **Checkout do cliente:** confirmar destinatário; propor pessoa/local autorizado somente se categoria e operação permitirem. Informar uso de evidências com clareza e sem consentimentos genéricos preselecionados.
4. **Acompanhar pedido — cliente:** exibir código só ao destinatário autorizado quando aplicável, com aviso para fornecê-lo apenas na entrega. Após confirmação, mostrar recebedor/método/horário e acesso privado ao comprovante; oferecer “Não recebi”.
5. **Pedido da loja:** mostrar recebedor real e comprovante após conclusão. Etiquetar atualização manual como “Registrado pela loja”. Não apresentar uma atualização manual como comprovante produzido pelo entregador.
6. **Entrega própria sem integração:** mantém atualização manual e não passa a exigir perfil, câmera ou código do entregador externo. As novas ferramentas são para modalidades integradas.
7. **Ganhos:** comprovante de entrega e comprovante financeiro continuam separados. Concluir não confirma recebimento de remuneração.
8. **Equipe/diretório:** não expor fotos de entrega, nomes de recebedores, endereços ou histórico de clientes nos perfis públicos.
9. **Suporte:** chamados carregam contexto do pedido, modalidade e evidências autorizadas. Não duplicar código secreto nos anexos e mensagens automáticas.
10. **Desktop/mobile:** mesmas regras; captura/upload pode variar por dispositivo. Não exigir geolocalização ou câmera de desktop para uma mera consulta. Nenhuma tela pode concluir um pedido que pertence a outro entregador.

## Validação e implementação

Testar separadamente destinatário, terceiro autorizado e local autorizado; código correto/incorreto/usado; upload interrompido; conclusão concorrente; conexão perdida após resposta incerta; acesso por outra loja/entregador/cliente; tarefa já concluída; vínculo encerrado; pedido manual. Validar também teclado, foco, contraste, rótulos e leitura no celular. Não certificar acessibilidade por mockup.

Antes de editar, reler o repositório e preservar mudanças existentes. Não inferir implementação pronta de campos presentes em tipos. Entregar contrato e interface coerentes, permissões no servidor, tratamento de falhas e ativação controlada.

## Referências externas consultadas

- [Princípios da LGPD — Ministério da Saúde](https://www.gov.br/saude/pt-br/acesso-a-informacao/lgpd/principios): finalidade, adequação e necessidade orientam a proposta de coleta mínima. Base legal, retenção, acesso e informação aos titulares devem ser definidos antes de ativar coleta de evidências.
- [Perguntas frequentes — ANPD](https://www.gov.br/anpd/pt-br/acesso-a-informacao/perguntas-frequentes/perguntas-frequentes): nome, endereço e aparência podem ser dados pessoais.
- [Mercado Livre — status de pedidos e rastreamento](https://developers.mercadolivre.com.br/pt_br/status-de-pedidos-rastreamento): documentação distingue falha por pessoa não autorizada a receber. Não foi assumida uma política universal de fotos ou códigos do Mercado Livre, Shopee ou outros serviços.

As escolhas de interface e evidências deste documento são propostas para o Achegue-se, não reprodução de exigências de outra plataforma nem parecer jurídico.

## Pranchas de referência

- [Operação mobile](concepts/entregador-vinculado/01-operacao-mobile.png): solicitação, coleta, início da entrega e destino.
- [Comprovante mobile](concepts/entregador-vinculado/02-comprovante-mobile.png): entrega em mãos com código exigido, local autorizado para pacote não perecível, conexão interrompida e conclusão.
- [Desktop](concepts/entregador-vinculado/03-operacao-desktop.png): solicitação, acompanhamento, pessoa autorizada e destinatário ausente.

Geradas pela ferramenta nativa de imagens. Direção dos prompts: mockups de alta fidelidade em português, petróleo #123E3D, solar #F3CB4C, marfim #FAFBF7, tipografia inspirada em Plus Jakarta Sans, quatro celulares altos por prancha mobile e quatro telas amplas em grade 2×2 no desktop. Os estados e as evidências foram definidos conforme este documento. Mapas são ilustrativos. As situações #1043, #1044 e #1045 são exemplos distintos, não mudanças silenciosas de método no mesmo pedido.

### Instrução para o próximo chat

> Leia docs/ENTREGADOR-VINCULADO-E-COMPROVANTE.md e docs/ENTREGAS-TRES-MODALIDADES-CONCEITO.md, incluindo as pranchas. Inspecione a versão atual e preserve mudanças locais existentes. Implemente o detalhe da entrega da equipe integrada e o comprovante condicional, reaproveitando os fluxos canônicos. Corrija também as páginas listadas em “Ajustes nos conceitos anteriores”. Não trate código digitado como validado, campo photo_url como upload pronto ou signed_at como assinatura real. Garanta autorização, armazenamento privado, idempotência, falhas e testes ponta a ponta. Não habilite entrega em local sem autorização nem transforme comprovação logística em pagamento confirmado. Registre claramente o que foi concluído e as dependências que restarem.
