# Minha conta: configurações e segurança

Conceito de 14/09/2026. Inspeção do código local, sem teste de configuração ou operação remota. Aplicação não modificada.

## Base observada

- ProfileSettingsPage: privacidade, vínculos, membros e permissões por perfil ativo. Manter separados das configurações da conta.
- PrivacySettingsPage: consentimentos, exportação por download, solicitação de exclusão, status e cancelamento. PrivacyService também oferece requisições sobre dados.
- NotificationPreferencesPage: e-mail, push, app; categorias transacionais, sociais, sistema e marketing; horário de silêncio e salvamento explícito. PushNotificationSettings trata o dispositivo.
- useMFA: configuração, confirmação de fator, desativação e verificação; indisponibilidade não significa dispensa de MFA.
- SessionSecurityService: lista de sessões vem de fonte legada; revogação individual retorna false por não ser suportada. Revogação das outras/todas as sessões usa serviço de autoridade separado. Não construir lista confiável ou botões individuais sobre o tracker antigo.
- PasswordSection: alteração de senha já faz parte do projeto. Preservar política central.

## Melhorias propostas e limites

Reunir configurações em um hub de conta. Privacidade pública, nomes, fotos, vínculos e membros continuam associados ao perfil correto em Meus perfis. @usuário de acesso e identificadores públicos precisam respeitar as fontes existentes e não ser fundidos apenas por semelhança visual.

Alterar e-mail com confirmação e gerenciar métodos de acesso são propostas cuja implementação completa não foi verificada nesta inspeção. Mostrar Google conectado somente com evidência real. Não permitir remoção do último método utilizável; exigir autenticação recente em alterações sensíveis. Não inventar SMS, passkeys ou códigos de recuperação.

Na segurança, exibir indisponibilidade da lista de dispositivos em vez de lista vazia ou dispositivos fictícios. Oferecer saída das outras/todas as sessões somente se o serviço efetivamente suportar e confirmar o comando. Não prometer invalidação instantânea de todo token já emitido. Informar quando a sessão atual será encerrada.

MFA: inscrição pendente, QR/alternativa textual, código, validação, sucesso, código inválido/expirado, falha e desativação autenticada. Nunca ativar visualmente antes da confirmação real. QR da imagem é demonstrativo e não deve ser usado no produto. Não registrar segredo ou código em logs. Políticas que exigem MFA não podem ser desativadas por toggle local.

Notificações: manter mapeamento das categorias existentes; rótulos amigáveis não criam automaticamente segmentação por módulo. Preferência push da conta é diferente de permissão do navegador. Quando bloqueado, orientar como permitir; não desenhar switch que pareça conceder permissão sozinho. Horário deve exibir fuso real e regras para intervalos que cruzam meia-noite. Respeitar avisos obrigatórios conforme política, sem tratar marketing como obrigatório.

Consentimento de marketing e preferência de canal precisam ser coordenados: revogação impede envio mesmo com canal ligado. Não manter duas escolhas contraditórias com o mesmo rótulo. Histórico de consentimentos, gestão de métodos e apresentação consolidada são melhorias de interface, não confirmação de novos endpoints.

Exportação: explicar escopo real retornado pelo serviço, sem prometer todos os registros ou dados de terceiros. Preparando, download pronto, erro e nova tentativa são estados distintos. Na prancha, o bloco Durante a exportação é uma demonstração alternativa; durante processamento, desabilitar a ação original. Não afirmar sucesso sem resposta válida. Proteção e permissões devem ser verificadas no servidor.

Exclusão: antes de confirmar, apresentar condições reais, impacto em perfis/equipes, opção de exportar e motivo opcional. Validar obrigações e regras de titularidade sem apagar automaticamente contas de outros membros. Transferência de administração, caso necessária, exige fluxo próprio autorizado. Após envio mostrar status real; cancelar só enquanto permitido. Não inventar prazo, prometer apagar tudo imediatamente ou restringir direitos com bloqueios indefinidos. Textos finais devem refletir a política adotada.

## Estados transversais

Carregamento, erro de leitura, permissão insuficiente, alteração pendente, salvando, sucesso confirmado e falha com tentativa novamente. Preservar rascunho não sensível em falha; não mostrar sucesso otimista em operações sensíveis. Confirmação em saídas globais, troca de credenciais e exclusão. Reautenticação mantém destino seguro. Sessão expirada redireciona para acesso.

Preferências do aplicativo é ponto de navegação para opções realmente suportadas, incluindo a área offline já encontrada no projeto. Não prometer tema, idiomas ou funcionalidades offline sem verificar os respectivos fluxos. Acessibilidade depende de implementar e testar teclado, foco, rótulos, contraste, zoom e leitores de tela; conceito não certifica conformidade.

## Pranchas

Produzidas com imagegen nativo, usando prompts para quatro telas mobile de conta/acesso/segurança/notificações; quatro telas mobile de privacidade/MFA/exportação/exclusão solicitada; quatro telas desktop de segurança/notificações/privacidade/confirmação de exclusão. Paleta petróleo, solar e marfim, tipografia estilo Plus Jakarta Sans. Imagens são referências, textos e botões obedecem às regras acima.

- `concepts/minha-conta/01-mobile-conta.png`
- `concepts/minha-conta/02-mobile-privacidade.png`
- `concepts/minha-conta/03-desktop.png`
