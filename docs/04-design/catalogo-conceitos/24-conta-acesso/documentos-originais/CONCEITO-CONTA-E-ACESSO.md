# Conceito: conta e acesso

Proposta visual de 14/09/2026. Inspeção do código local; configuração remota e funcionamento em produção não foram verificados. Não é alteração da aplicação.

## Evidências consultadas

- `src/app/pages/LoginPage.tsx`: e-mail ou @usuário e senha; Google condicionado a disponibilidade; retorno por caminho interno seguro; mensagens de confirmação e senha redefinida; recuperação somente por e-mail; desafio anti-bot.
- `src/app/features/onboarding/pages/CadastroPage.tsx`: nome, usuário, e-mail, senha; etapas Dados/Bairro/Confirmar; cascata territorial; aceite de Termos e Diretrizes; verificação anti-bot.
- `src/app/features/onboarding/pages/CadastroConfirmacaoPage.tsx`: confirmação por link, reenvio e intervalo entre solicitações.
- `src/app/pages/ResetPasswordPage.tsx`: nova senha e confirmação, link expirado, reenvio, verificação de senha comprometida e sucesso.
- `src/shared/validation/passwordPolicy.ts`: mínimo de 12 caracteres, maiúscula, minúscula, número e símbolo. Usar a política central, sem duplicar regras em componentes.
- `src/app/pages/OnboardingPage.tsx`: seleção de bairro para exploração. Não confundir escolha de navegação com declaração de residência.

## Direção proposta

Cadastro inicial com nome, @usuário, e-mail, senha e aceite obrigatório já existente. Manter informação territorial disponível, mas propor coleta opcional posterior. Isso exige revisar schemas, persistência, contratos e consumidores que hoje dependem do território; não basta esconder campos. Não preencher residência fictícia com a comunidade visitada.

Uma conta começa com perfil pessoal. Negócio, profissional e entregador são fluxos posteriores em Meus perfis, com suas próprias exigências. Cadastro fora do Complexo não ativa atendimento no local informado. Exploração pública continua disponível sem conta.

Preservar destino interno seguro através de login, cadastro, confirmação e Google. A infraestrutura de retorno foi observada no login; a continuidade completa dos demais fluxos precisa ser implementada ou validada. Sem destino válido, abrir a comunidade disponível. Não obrigar onboarding opcional antes de retomar uma conversa.

Google aparece somente quando habilitado. Não incluir SMS, WhatsApp, passkey ou outros provedores sem implementação. Não vincular contas automaticamente apenas por correspondência de e-mail. Preservar desafios adicionais de autenticação aplicáveis; MFA não foi auditado nesta proposta.

## Estados e regras para implementação

- Entrada: vazio, preenchido, enviando, credenciais inválidas, e-mail não confirmado, limite de tentativas, sessão expirada, Google cancelado/indisponível e falha de rede. Não revelar existência de contas em erro de credenciais.
- Cadastro: erros próximos aos campos, usuário indisponível, requisitos da senha, senha comprometida, termos não aceitos, desafio pendente/expirado, envio em andamento e resposta incerta. Evitar criação duplicada ao tentar novamente; confirmar o estado real antes de apresentar sucesso.
- Confirmação: aguardando, reenviando, reenvio permitido somente após intervalo real do servidor, link válido, inválido, expirado ou utilizado. Confirmar pelo servidor, nunca apenas por parâmetro visual na URL.
- E-mail informado errado: oferecer fluxo seguro de correção ou reinício da inscrição pendente; não alterar endereço arbitrariamente. Esta ação é uma melhoria a implementar, não foi confirmada na tela atual.
- Recuperação: aceita somente e-mail. Após solicitação processada, usar mensagem neutra independentemente de a conta existir. Falha de transporte deve ser tratada como falha, sem fingir envio. Sucesso de redefinição somente após resposta confirmada.
- Sem acesso ao e-mail: encaminhar a ajuda sem prometer recuperação nem permitir contornar verificação de identidade.
- Campos: rótulos persistentes, autocomplete apropriado, colagem e gerenciadores de senha permitidos; mostrar/ocultar senha acessível; não persistir senha em armazenamento local nem registrar em logs.
- Teclado, foco, leitura por leitor de tela, zoom, contraste, redução de movimento, teclado virtual e conexão lenta precisam de validação na implementação. Uma imagem não certifica acessibilidade.
- Atualizações de expansão e marketing são opções separadas, desmarcadas. Não condicionar conta a esses consentimentos.

## Observações sobre as imagens

As três pranchas são referências de composição, não contratos literais de texto ou comportamento. As imagens podem conter pequenas grafias geradas: usar "Esqueci minha senha" no produto. Na recuperação, o título deve ser "Esqueceu sua senha?" e o campo "E-mail cadastrado".

Na prancha mobile de recuperação, o bloco "Após salvar" é uma representação do estado seguinte: deve substituir o formulário após sucesso, não aparecer simultaneamente. O rodapé deve conter links Termos e Privacidade, sem novo aceite implícito ao redefinir a senha.

O desafio anti-bot é condicional e deve ficar antes do envio no formulário correspondente; o desenho de um ícone ou checkbox não substitui o componente real. Aceite de termos ausente deve impedir envio. Não copiar estados de botão habilitado da imagem sem respeitar validação.

Imagens produzidas com a ferramenta nativa imagegen. Prompts: prancha mobile de entrada/cadastro/confirmação/primeiro acesso; prancha mobile de recuperação/reenvio/nova senha/link expirado; prancha desktop dos quatro fluxos principais. Direção comum: petróleo, amarelo solar, marfim, tipografia Plus Jakarta Sans, campos legíveis e ações com espaço confortável para toque.

Pranchas canônicas: `../pranchas/064-acesso-mobile.png`, `../pranchas/065-recuperacao-mobile.png`, `../pranchas/067-acesso-desktop.png`.
