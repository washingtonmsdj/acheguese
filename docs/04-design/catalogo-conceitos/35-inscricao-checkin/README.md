# Minha inscrição, credencial e validação de entrada
Página 35, conceito de 17/09/2026. Aplicação não alterada. Geração por image_gen integrado.

## Arquivos
- [Participante — mobile](pranchas/108-inscricao-credencial-mobile.png).
- [Equipe — desktop e resultados](pranchas/107-validacao-entrada-desktop.png).
- [Prompts](PROMPTS.md).
- [Revisão](REVISAO.md).

## Base conferida
src/modules/community-events/components/EventCheckin.tsx consulta inscrição, solicita getParticipantCheckinCode, gera QR e consulta status de check-in. O QR atual contém JSON com eventId, eventTitle, profileId, profileName, checkinCode e timestamp. Não assumir que timestamp local impõe expiração no servidor.
EventRuntimeService.ts expõe checkInEvent, checkInEventByCode e getCheckInStatus, delegando ao serviço de mutação.
O componente também contém auto check-in pelo participante e gera um “certificado” em arquivo .txt. O fluxo proposto para eventos com entrada controlada exige equipe autorizada; conciliar políticas existentes antes de substituir o auto check-in. Um evento online ou de autodeclaração pode precisar de regra diferente, explícita.
Scanner por câmera não foi validado como interface implementada nesta revisão. Contrato de validação por código existente não certifica suporte integral à câmera.

## Participante
Minhas inscrições por perfil: próximos e anteriores, estados canônicos confirmada/cancelada conforme dados reais. Favorito não é inscrição. Consulta deve refletir identidade autorizada e limpar cache ao trocar perfil.
Credencial somente para participante autorizado e evento elegível; explicar evento, data, perfil e estado. QR da prancha é propositalmente ilustrativo e sem validade. Não usar imagem gerada como QR real.
Não compartilhar credencial como ação social. QR/código é material de acesso; minimizar dados pessoais embutidos, preferindo referência opaca quando contrato permitir. Revogação, prazo e rotação só podem ser prometidos se implementados no servidor.
Mostrar entrada confirmada apenas após validação. Cancelamento/revogação não pode manter credencial aparentemente válida.
Sem conexão: oferecer nova tentativa e atendimento pela equipe; não apresentar QR antigo como prova de situação atual. Não presumir entrada offline ou sincronização posterior segura.

## Equipe de recepção
Acesso limitado ao evento e função autorizados, diferente de perfil organizador genérico ou residente. Conferir evento antes da leitura. Câmera pede permissão somente por ação; alternativa de código manual com mesmas validações.
Captura/decodificação não significa check-in aceito. Esperar retorno do servidor, bloquear duplo envio e reconciliar timeout. Validar código contra evento, participação vigente, permissões e uso anterior.
Resultados: confirmado; já registrado sem nova entrada; código não validado; evento incompatível/inscrição inelegível conforme contrato sem vazamento; erro/resultado incerto. Busca por nome pode ajudar a localizar registro autorizado, não contorna prova de acesso.
Não oferecer exceção manual irrestrita. Caso necessária, desenhar fluxo separado com autorização, justificativa e auditoria. Histórico distingue tentativa de entrada confirmada.

## Certificado
O arquivo .txt atual não é emissão formal de certificado validável. Conceito só apresenta disponibilidade quando organizador oferece e critérios são atendidos. Não inferir elegibilidade apenas por check-in: duração, participação mínima e política podem ser necessários.
PDF, número verificável, identidade emissora, emissão/revogação e acesso privado são melhorias que exigem contrato. Não usar brasão, assinatura ou selo inventado. Documento de presença não deve alegar certificação acadêmica sem base.

## Dados, estados e proteção
Somente dados mínimos na recepção; não listar endereço, telefone ou documentos por padrão. QR inválido não revela dados de pessoa. Registrar operador, evento, instante e resultado conforme política, sem logar segredo integral da credencial.
Prever câmera negada/indisponível, código ilegível, conexão perdida, status desatualizado, já usado, cancelado, sem permissão, lista vazia e erro de consulta. Estados não dependem só de cor.
Listas e histórico precisam paginação e pesquisa autorizadas. Distinguir data do evento de horário do check-in no fuso adequado.

## Validação
Testar entrada duplicada concorrente, uso em outro evento, cancelamento após geração, troca de perfil, equipe de outro evento, câmera negada e timeout após confirmação. Conservar lógica canônica dos serviços; não gerar prova local que dispense servidor.
SSOT, teclado, rótulos, anúncio acessível do resultado, foco após scan e contraste medido. Nenhuma promessa de AAA baseada na imagem.
Pranchas são momentos/cenários distintos. Nomes, horários e códigos não são reais. Textos sobre servidor/integração são explicativos e podem ser simplificados na interface sem esconder resultado pendente.

Correção importante de texto: “Não foi registrado um novo check-in” só descreve ausência de envio por esta tela. Se houve timeout de uma operação, ou tentativa por outra equipe, a situação é incerta: usar “Não conseguimos confirmar o resultado. Consulte a equipe.” Não afirmar inexistência de registro sem consulta. “Atualizar credencial” consulta/renova conforme contrato e não implica rotação de segredo. O caso de recepção ilustrado é de entrada controlada; não impõe equipe presencial a todos os eventos.
