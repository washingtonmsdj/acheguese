# Product QA - Achegue-se

Data da avaliação: 2026-07-21  
Ambiente: local, `http://127.0.0.1:5175`  
Foco: experiência do usuário, sem avaliação de qualidade interna de código.

## Escopo e método

O aplicativo foi usado como usuário comum, navegando por fluxos públicos e autenticados. A conta de teste utilizada para fluxos autenticados foi `e2e-network@test.local`.

O Browser integrado foi tentado primeiro, mas o bootstrap travou. A execução manual assistida foi concluída com Playwright local, com prints salvos em `product-qa-screenshots/`.

Observação transversal: após login, várias telas registraram falha de CORS em chamadas Supabase `session-rpc` e `profile-rpc`. Do ponto de vista do usuário, isso aparece como telas vazias, loading persistente, perda de contexto do perfil ativo ou bloqueio de ações.

## Resumo executivo

| Fluxo | Classificação | Severidade principal |
| --- | --- | --- |
| Cadastro | ⚠ Precisa melhorar | Média |
| Login | ✔ Bom | Média |
| Recuperação de senha | ✔ Bom | Baixa |
| Editar perfil | ❌ Quebrado | Alta |
| Trocar foto | ❌ Quebrado | Alta |
| Criar postagem | ⚠ Precisa melhorar | Média |
| Editar postagem | ❌ Quebrado | Alta |
| Curtir | ❌ Quebrado | Alta |
| Comentar | ❌ Quebrado | Alta |
| Compartilhar | ❌ Quebrado | Alta |
| Pesquisar | ⚠ Precisa melhorar | Média |
| Cadastrar empresa | ✔ Bom | Baixa |
| Visualizar empresa | ❌ Quebrado | Alta |
| Enviar mensagem | ❌ Quebrado | Alta |
| Receber notificação | ⚠ Precisa melhorar | Média |
| Configurações | ✔ Bom | Baixa |
| Logout | ⚠ Precisa melhorar | Média |

## Problemas transversais

### CORS e perfil ativo pós-login

Problema encontrado: chamadas para `session-rpc` e `profile-rpc` falharam repetidamente por CORS.  
Impacto no usuário: áreas dependentes de perfil ativo ficam vazias, bloqueadas ou inconsistentes.  
Severidade: Alta.  
Fluxos afetados: editar perfil, trocar foto, criar postagem, notificações, logout, possivelmente busca e feed social.  
Sugestão de melhoria: estabilizar a resolução de sessão/perfil ativo antes de avaliar publicamente os fluxos autenticados.

### Banner de cookies persistente

Problema encontrado: o banner de cookies aparece com frequência e ocupa a parte inferior direita da interface. Em algumas telas, ele atrapalha botões ou leitura de ações finais.  
Impacto no usuário: aumenta atrito e pode bloquear cliques importantes, especialmente no cadastro.  
Severidade: Média.  
Sugestão de melhoria: garantir persistência real do consentimento e posicionamento que não cubra CTAs.

### Acessibilidade dos controles sociais

Problema encontrado: na varredura dos botões do feed, os controles acessíveis encontrados foram apenas navegação principal, postagem, busca e menu. Ações como curtir, comentar, compartilhar e editar não ficaram descobríveis por nome acessível.  
Impacto no usuário: prejudica usuários de tecnologias assistivas e também dificulta automação confiável de QA.  
Severidade: Alta para fluxos sociais.  
Sugestão de melhoria: expor nomes acessíveis claros para ações de post, por exemplo "Curtir postagem", "Comentar postagem", "Compartilhar postagem".

## Fluxos avaliados

### Cadastro - ⚠ Precisa melhorar

Objetivo: criar uma nova conta e avançar pelo fluxo de dados iniciais.

Passos executados:

1. Abrir `/cadastro`.
2. Preencher nome completo, e-mail, senha e confirmação.
3. Tentar preencher nome de usuário.
4. Tentar avançar em "Próximo".

Resultado esperado: usuário consegue preencher todos os campos obrigatórios, avançar para bairro e finalizar cadastro com feedback claro.

Resultado obtido: a tela carrega corretamente, a força da senha é bem comunicada e o formulário é visualmente claro. Porém, o campo de nome de usuário não foi preenchido de forma confiável por rótulo/acessibilidade, e o avanço pelo botão "Próximo" não foi concluído na rodada isolada. O banner de cookies permaneceu visível próximo à área de ação.

Prints:

- `product-qa-screenshots/03-cadastro-page.png`
- `product-qa-screenshots/06-cadastro-preenchido.png`
- `product-qa-screenshots/07-cadastro-bairro.png`

Problemas encontrados:

- Campo de nome de usuário com associação de rótulo/interação pouco confiável.
- CTA final pode ser prejudicado pelo banner de cookies.
- Avanço do formulário não ficou consistente durante o teste.

Severidade: Média.

Sugestão de melhoria: revisar associação de labels, foco e ordem de tabulação do formulário; garantir que o banner de cookies não cubra ou dispute atenção com o botão principal.

### Login - ✔ Bom

Objetivo: entrar com uma conta existente.

Passos executados:

1. Abrir `/login`.
2. Preencher e-mail/usuário.
3. Preencher senha.
4. Acionar "Entrar".

Resultado esperado: usuário autenticado é redirecionado para a experiência principal.

Resultado obtido: o login funcionou e redirecionou para `/ba/salvador`. A tela de login tem hierarquia clara e comunica bem a entrada unificada. Após o login, porém, surgiram erros de sessão/perfil que afetam fluxos seguintes.

Prints:

- `product-qa-screenshots/01-login-page.png`
- `product-qa-screenshots/08-login-auth.png`

Problemas encontrados:

- Pós-login sofre com falhas de sessão/perfil ativo por CORS.
- O estado autenticado aparece parcialmente, mas nem todos os módulos conseguem usar o perfil.

Severidade: Média.

Sugestão de melhoria: manter a experiência visual atual do login e estabilizar imediatamente o carregamento de perfil ativo após autenticação.

### Recuperação de senha - ✔ Bom

Objetivo: solicitar redefinição de senha a partir da tela de login.

Passos executados:

1. Abrir `/login`.
2. Acionar "Esqueci minha senha".
3. Informar e-mail.
4. Enviar solicitação.

Resultado esperado: usuário recebe confirmação clara sem expor se o e-mail existe.

Resultado obtido: o sistema exibiu feedback "E-mail enviado" e orientou verificar a caixa de entrada. A confirmação é clara para o usuário.

Prints:

- `product-qa-screenshots/05-password-recovery.png`
- `product-qa-screenshots/03-recupera-o-de-senha-final.png`

Problemas encontrados:

- Não foi validado o recebimento real de e-mail no provedor.

Severidade: Baixa.

Sugestão de melhoria: manter a confirmação clara e validar em ambiente integrado se o e-mail chega corretamente.

### Editar perfil - ❌ Quebrado

Objetivo: acessar e alterar dados do perfil do usuário.

Passos executados:

1. Logar com conta de teste.
2. Abrir `/conta/editar`.
3. Aguardar carregamento.
4. Verificar campos editáveis.

Resultado esperado: formulário de perfil com dados atuais, campos editáveis e ação de salvar.

Resultado obtido: a rota redirecionou para `/conta` e exibiu uma tela praticamente vazia, apenas com o banner de cookies. Não foi possível editar dados.

Prints:

- `product-qa-screenshots/09-editar-perfil.png`

Problemas encontrados:

- Tela sem conteúdo útil.
- Perfil ativo não carregou.
- Fluxo principal de conta fica indisponível.

Severidade: Alta.

Sugestão de melhoria: priorizar fallback visível para erro de perfil ativo e corrigir a chamada de sessão/perfil antes de demonstrações.

### Trocar foto - ❌ Quebrado

Objetivo: alterar a foto/avatar do perfil.

Passos executados:

1. Logar com conta de teste.
2. Abrir `/conta/editar`.
3. Procurar controle de upload de foto.
4. Tentar anexar imagem local de teste.

Resultado esperado: usuário encontra foto atual, escolhe arquivo e salva a nova imagem.

Resultado obtido: a mesma tela vazia do perfil foi exibida. Não havia controle de foto acessível para concluir o fluxo.

Prints:

- `product-qa-screenshots/10-trocar-foto.png`

Problemas encontrados:

- Fluxo depende da tela de edição de perfil, que não carregou.
- Usuário não tem caminho alternativo para trocar foto.

Severidade: Alta.

Sugestão de melhoria: corrigir a edição de perfil e adicionar estado de erro orientado quando o perfil ativo não puder ser carregado.

### Criar postagem - ⚠ Precisa melhorar

Objetivo: criar uma nova publicação territorial.

Passos executados:

1. Logar com conta de teste.
2. Abrir `/novo-post`.
3. Preencher descrição da postagem.
4. Tentar publicar.

Resultado esperado: usuário preenche conteúdo, escolhe distribuição territorial e publica.

Resultado obtido: o modal "Criar conteúdo territorial" abriu, o campo de descrição funcionou e a tela mostrou validação clara. A publicação ficou bloqueada pela mensagem "Configure sua localização no perfil antes de publicar".

Prints:

- `product-qa-screenshots/11-criar-postagem.png`

Problemas encontrados:

- Bloqueio depende de configuração de perfil que, nesta rodada, não estava acessível.
- A mensagem é clara, mas não oferece um caminho direto para resolver.

Severidade: Média.

Sugestão de melhoria: incluir ação direta para "Configurar localização" dentro do próprio bloqueio e garantir que o perfil esteja acessível.

### Editar postagem - ❌ Quebrado

Objetivo: alterar uma postagem existente do usuário.

Passos executados:

1. Logar com conta de teste.
2. Acessar feed local.
3. Procurar postagem própria ou ação de editar.
4. Tentar localizar botão "Editar".

Resultado esperado: em postagem própria, usuário encontra ação de editar e consegue alterar conteúdo.

Resultado obtido: não foi possível criar uma postagem própria antes, e o feed alternou entre conteúdo e loading persistente. A ação "Editar" não ficou descobrível por nome acessível.

Prints:

- `product-qa-screenshots/18-feed-social.png`
- `product-qa-screenshots/23-editar-postagem.png`

Problemas encontrados:

- Fluxo depende de criação de postagem, que ficou bloqueada.
- Feed ficou instável.
- Ação de edição não foi localizada.

Severidade: Alta.

Sugestão de melhoria: estabilizar feed, criação de postagem e expor ações próprias com rótulos claros.

### Curtir - ❌ Quebrado

Objetivo: curtir uma publicação no feed.

Passos executados:

1. Logar com conta de teste.
2. Abrir `/ba/salvador`.
3. Procurar ação de curtir em posts.
4. Tentar acionar botão por nome acessível.

Resultado esperado: usuário encontra um botão de curtir, aciona e vê feedback imediato.

Resultado obtido: o botão de curtir não ficou visível por nome acessível. Em parte da rodada, o feed permaneceu em loading.

Prints:

- `product-qa-screenshots/19-social-discovery.png`
- `product-qa-screenshots/20-curtir.png`

Problemas encontrados:

- Ação social não descoberta.
- Feed instável/loading.
- Sem feedback de curtir.

Severidade: Alta.

Sugestão de melhoria: garantir renderização estável do feed e nomes acessíveis para ações sociais.

### Comentar - ❌ Quebrado

Objetivo: comentar uma publicação.

Passos executados:

1. Logar com conta de teste.
2. Abrir feed local.
3. Procurar ação de comentar.
4. Tentar abrir campo ou modal de comentário.

Resultado esperado: usuário abre comentários, escreve mensagem e publica.

Resultado obtido: a ação de comentar não foi encontrada por nome acessível e o feed não manteve estado estável.

Prints:

- `product-qa-screenshots/21-comentar.png`

Problemas encontrados:

- Controle de comentário não descoberto.
- Fluxo não pôde ser concluído.

Severidade: Alta.

Sugestão de melhoria: tornar a ação de comentar visível e acessível, com estado vazio ou erro quando comentários não carregarem.

### Compartilhar - ❌ Quebrado

Objetivo: compartilhar uma publicação.

Passos executados:

1. Logar com conta de teste.
2. Abrir feed local.
3. Procurar ação de compartilhar.
4. Tentar acionar compartilhamento.

Resultado esperado: usuário consegue copiar link, abrir compartilhamento nativo ou ver opções claras.

Resultado obtido: a ação de compartilhar não foi encontrada por nome acessível. A tela entrou em loading persistente durante a tentativa.

Prints:

- `product-qa-screenshots/22-compartilhar.png`

Problemas encontrados:

- Controle de compartilhamento não descoberto.
- Loading persistente impede a ação.

Severidade: Alta.

Sugestão de melhoria: expor botão "Compartilhar" em cada post e fornecer fallback de copiar link.

### Pesquisar - ⚠ Precisa melhorar

Objetivo: pesquisar conteúdo por termo.

Passos executados:

1. Logar com conta de teste.
2. Abrir `/busca`.
3. Digitar "restaurante".
4. Aguardar resultados.

Resultado esperado: usuário vê resultados ou estado vazio claro para o termo pesquisado.

Resultado obtido: a tela abriu, o campo de busca recebeu o termo e as categorias ficaram visíveis. O conteúdo permaneceu em "Buscando..." no recorte coletado.

Prints:

- `product-qa-screenshots/12-pesquisar.png`

Problemas encontrados:

- Loading sem conclusão observada.
- Categorias ficam comprimidas/encostadas, dificultando leitura.

Severidade: Média.

Sugestão de melhoria: adicionar timeout com estado de erro/vazio e revisar espaçamento dos filtros.

### Cadastrar empresa - ✔ Bom

Objetivo: iniciar criação de uma empresa.

Passos executados:

1. Logar com conta de teste.
2. Abrir `/central/empresas/nova`.
3. Revisar campos da etapa inicial.

Resultado esperado: usuário vê formulário de cadastro com campos obrigatórios e progressão por etapas.

Resultado obtido: a tela carregou com boa estrutura, etapas claras e campos importantes: logo, nome, razão social, CNPJ, categoria, subcategoria, tipo societário, porte, ano, segmento e descrição.

Prints:

- `product-qa-screenshots/13-cadastrar-empresa.png`

Problemas encontrados:

- Banner de cookies permanece sobre a área inferior.
- Não foi feita submissão completa para evitar criar dados reais desnecessários durante QA.

Severidade: Baixa.

Sugestão de melhoria: manter a estrutura atual e validar, em próxima rodada, mensagens de erro dos campos obrigatórios.

### Visualizar empresa - ❌ Quebrado

Objetivo: abrir página pública de uma empresa.

Passos executados:

1. Abrir URL pública de empresa.
2. Aguardar carregamento.
3. Verificar dados, contato e conteúdo da empresa.

Resultado esperado: página pública da empresa com informações, endereço, contatos e ações.

Resultado obtido: a tela ficou em "Preparando a casa para você se achegar..." sem renderizar o perfil da empresa no tempo observado.

Prints:

- `product-qa-screenshots/14-visualizar-empresa.png`

Problemas encontrados:

- Loading persistente.
- Usuário não recebe mensagem de erro nem opção de tentar novamente.

Severidade: Alta.

Sugestão de melhoria: corrigir carregamento da empresa e adicionar estado de erro/indisponibilidade com ação de retorno.

### Enviar mensagem - ❌ Quebrado

Objetivo: enviar uma mensagem pelo módulo de mensagens.

Passos executados:

1. Logar com conta de teste.
2. Abrir `/mensagens`.
3. Procurar conversa, destinatário ou ação de nova mensagem.

Resultado esperado: usuário abre conversas ou inicia uma nova mensagem.

Resultado obtido: a tela informa que "Mensagens está separado para ajustes" e que a área não faz parte da primeira superfície pública. Não há envio de mensagem disponível.

Prints:

- `product-qa-screenshots/15-mensagens.png`

Problemas encontrados:

- Fluxo obrigatório indisponível.
- Comunicação é honesta e bem escrita, mas confirma que o recurso não está pronto para uso comum.

Severidade: Alta.

Sugestão de melhoria: se mensagens não fizerem parte da demonstração, remover entrada de navegação pública; se fizerem, liberar uma versão mínima do envio.

### Receber notificação - ⚠ Precisa melhorar

Objetivo: verificar recebimento/listagem de notificações.

Passos executados:

1. Logar com conta de teste.
2. Abrir `/notificacoes`.
3. Verificar lista, filtros e estado vazio.

Resultado esperado: usuário vê notificações recebidas ou estado vazio claro.

Resultado obtido: a tela carregou com título, filtros "Todas" e "Não lidas", botão de preferências e estado vazio "Nenhuma notificação". Não foi possível gerar uma nova notificação durante o teste.

Prints:

- `product-qa-screenshots/16-notificacoes.png`

Problemas encontrados:

- Fluxo de receber notificação não foi validado ponta a ponta.
- Texto secundário aparece sem acento em "atualizacoes".

Severidade: Média.

Sugestão de melhoria: criar cenário de QA com notificação de teste e revisar microcopy.

### Configurações - ✔ Bom

Objetivo: acessar preferências da conta.

Passos executados:

1. Logar com conta de teste.
2. Abrir `/conta/preferencias`.
3. Revisar atalhos e opções.

Resultado esperado: usuário entende onde alterar notificações, privacidade, vínculos e identidade.

Resultado obtido: a tela carrega bem, organiza atalhos principais e tem textos objetivos. É uma das experiências mais estáveis da rodada.

Prints:

- `product-qa-screenshots/17-configuracoes.png`

Problemas encontrados:

- Banner de cookies sobrepõe área inferior.
- Algumas ações levam a fluxos que dependem do perfil ativo, ainda instável.

Severidade: Baixa.

Sugestão de melhoria: manter esta organização e validar os destinos internos após correção de perfil.

### Logout - ⚠ Precisa melhorar

Objetivo: sair da conta autenticada.

Passos executados:

1. Logar com conta de teste.
2. Abrir feed local.
3. Procurar ação "Sair", "Logout" ou equivalente.
4. Tentar acionar controle de saída.

Resultado esperado: usuário encontra uma ação clara para sair e retorna ao estado não autenticado.

Resultado obtido: há um ícone de saída no topo, mas a ação não ficou descoberta por nome acessível durante a execução. A tentativa por rótulos comuns não encontrou "Sair" ou "Logout". A sessão não foi encerrada na rodada automatizada.

Prints:

- `product-qa-screenshots/24-logout.png`

Problemas encontrados:

- Controle de saída depende de ícone sem rótulo claro para automação/acessibilidade.
- A ação não foi concluída de forma confiável.

Severidade: Média.

Sugestão de melhoria: expor texto/aria-label "Sair da conta" no controle e confirmar logout com redirecionamento claro.

## Priorização de estabilização de UX

1. Corrigir CORS/session-rpc/profile-rpc para estabilizar perfil ativo.
2. Restaurar edição de perfil e troca de foto.
3. Remover loading persistente em feed, busca e página de empresa, com estados de erro/vazio.
4. Tornar ações sociais acessíveis e testáveis: curtir, comentar, compartilhar e editar.
5. Decidir publicamente se mensagens entram ou saem da navegação da demonstração.
6. Ajustar banner de cookies para não bloquear CTAs e persistir consentimento.
7. Validar cadastro ponta a ponta com foco em campos, tabulação e avanço.
8. Garantir logout explícito e acessível.
9. Criar massa de QA para notificações, posts próprios e empresa pública.

## Conclusão

O produto ainda não está pronto para demonstração pública. Existem telas fortes e bem organizadas, especialmente login, configurações e cadastro de empresa, mas fluxos centrais de usuário autenticado quebram ou ficam instáveis.

Classificação recomendada neste momento: **Pronto para demonstração privada controlada**, com roteiro limitado e aviso prévio dos fluxos fora de escopo.

Marcadores:

- [ ] Não pronto
- [x] Pronto para demonstração privada
- [ ] Pronto para demonstração pública
- [ ] Pronto para beta fechado
- [ ] Pronto para produção

Justificativa: a aplicação tem superfície visual suficiente para uma demonstração guiada, mas não sustenta uso livre por usuários externos. Perfil, foto, página de empresa, mensagens, feed social e busca precisam de estabilização antes de uma demonstração pública.
