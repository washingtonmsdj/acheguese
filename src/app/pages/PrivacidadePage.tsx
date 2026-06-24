import React from "react";
import { ArrowLeft, Shield, Database, Eye, Lock, UserCheck, Bell, Globe, Mail } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

const sections = [
  {
    icon: Shield,
    title: "1. Introdução e Controlador dos Dados",
    content: `Esta Política de Privacidade ("Política") descreve como o Achegue-se ("Plataforma", "nós") coleta, usa, armazena, compartilha e protege os dados pessoais dos usuários ("Usuário", "você"), em conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD — Lei nº 13.709/2018) e demais normas aplicáveis.

A Plataforma atua como Controladora dos dados pessoais coletados, sendo responsável pelas decisões referentes ao tratamento de tais dados.

Esta Política integra os Termos de Uso da Plataforma. Ao criar uma conta ou utilizar nossos serviços, você declara ter lido e concordado com esta Política.`,
  },
  {
    icon: Database,
    title: "2. Dados Coletados",
    content: `Coletamos os seguintes dados pessoais:

Dados fornecidos pelo Usuário no cadastro: nome completo, nome de usuário (handle), endereço de e-mail, senha (armazenada de forma criptografada), estado, cidade e bairro de residência.

Dados de uso e navegação: endereço IP, tipo e versão do navegador, sistema operacional, páginas acessadas, data e hora de acesso, tempo de permanência e interações com a Plataforma.

Conteúdo gerado pelo Usuário: publicações, comentários, imagens, classificados e demais conteúdos inseridos na Plataforma.

Dados de localização: informações de localização geográfica fornecidas voluntariamente pelo Usuário para personalização do conteúdo comunitário.

Dados de comunicação: solicitações, respostas de suporte e demais contatos enviados pelo Usuário por meio dos canais da Plataforma.`,
  },
  {
    icon: Eye,
    title: "3. Finalidades do Tratamento",
    content: `Tratamos seus dados pessoais para as seguintes finalidades:

Execução do contrato: criação e gerenciamento de conta, autenticação, prestação dos serviços contratados e comunicações relacionadas ao serviço.

Legítimo interesse: personalização da experiência do usuário, exibição de conteúdo relevante com base na localização, segurança da plataforma, prevenção a fraudes e moderação de conteúdo.

Cumprimento de obrigação legal: atendimento a requisições de autoridades competentes, cumprimento de ordens judiciais e obrigações regulatórias.

Consentimento: envio de comunicações de marketing, notificações sobre novidades e funcionalidades, quando o Usuário optar por recebê-las.

Proteção ao crédito: análise de risco em transações realizadas na Plataforma, quando aplicável.`,
  },
  {
    icon: UserCheck,
    title: "4. Compartilhamento de Dados",
    content: `Não vendemos, alugamos ou comercializamos seus dados pessoais com terceiros para fins de marketing.

Podemos compartilhar seus dados nas seguintes hipóteses:

Prestadores de serviço: compartilhamos dados com fornecedores que nos auxiliam na operação da Plataforma (hospedagem, autenticação, análise de dados, suporte), sempre mediante contratos que garantam proteção adequada aos dados.

Cumprimento legal: podemos divulgar dados em resposta a ordens judiciais, requisições de autoridades competentes ou quando necessário para cumprir obrigações legais.

Proteção de direitos: podemos compartilhar dados quando necessário para proteger os direitos, propriedade ou segurança da Plataforma, de seus usuários ou de terceiros.

Operações societárias: em caso de fusão, aquisição ou venda de ativos, seus dados poderão ser transferidos ao sucessor, que ficará vinculado a esta Política.

Conteúdo público: informações que você tornar públicas em seu perfil ou publicações poderão ser visualizadas por outros usuários da Plataforma.`,
  },
  {
    icon: Lock,
    title: "5. Segurança dos Dados",
    content: `Adotamos medidas técnicas e organizacionais adequadas para proteger seus dados pessoais contra acesso não autorizado, perda acidental, destruição, alteração ou divulgação indevida, incluindo:

Criptografia de dados em trânsito (TLS/HTTPS) e em repouso para informações sensíveis como senhas. As senhas são armazenadas exclusivamente em formato hash irreversível — nunca em texto simples.

Verificação de senhas comprometidas: utilizamos a API Have I Been Pwned (HIBP) com modelo k-Anonymity para verificar se senhas escolhidas pelos usuários foram expostas em vazamentos conhecidos. Nenhuma senha é transmitida integralmente — apenas os primeiros 5 caracteres do hash SHA-1 são enviados.

Controle de acesso baseado em funções (RBAC) para sistemas internos. Autenticação multifator disponível para contas administrativas. Monitoramento contínuo de atividades suspeitas e tentativas de acesso não autorizado.

Em caso de incidente de segurança que possa acarretar risco ou dano relevante aos titulares, notificaremos a Autoridade Nacional de Proteção de Dados (ANPD) e os usuários afetados nos prazos legais.`,
  },
  {
    icon: UserCheck,
    title: "6. Direitos do Titular",
    content: `Nos termos da LGPD, você possui os seguintes direitos em relação aos seus dados pessoais:

Confirmação e acesso: confirmar a existência de tratamento e acessar seus dados pessoais.

Correção: solicitar a correção de dados incompletos, inexatos ou desatualizados.

Anonimização, bloqueio ou eliminação: solicitar a anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados em desconformidade com a LGPD.

Portabilidade: solicitar a portabilidade dos seus dados a outro fornecedor de serviço.

Eliminação: solicitar a eliminação dos dados tratados com base no seu consentimento.

Informação: obter informações sobre entidades públicas e privadas com as quais compartilhamos seus dados.

Revogação do consentimento: revogar o consentimento a qualquer momento, sem prejuízo da licitude do tratamento realizado anteriormente.

Oposição: opor-se ao tratamento realizado com fundamento em outras bases legais, em caso de descumprimento da LGPD.

Para exercer seus direitos, entre em contato pelo canal de suporte da Plataforma. Responderemos em até 15 (quinze) dias úteis.`,
  },
  {
    icon: Bell,
    title: "7. Cookies e Tecnologias Similares",
    content: `Utilizamos cookies e tecnologias similares para melhorar sua experiência na Plataforma.

Cookies essenciais: necessários para o funcionamento básico da Plataforma, como manutenção da sessão autenticada. Não podem ser desativados.

Cookies de desempenho: coletam informações sobre como os usuários utilizam a Plataforma para melhorarmos nossos serviços. Os dados são agregados e anônimos.

Cookies de funcionalidade: permitem que a Plataforma lembre suas preferências, como idioma e configurações de exibição.

Você pode gerenciar as preferências de cookies nas configurações do seu navegador. A desativação de cookies essenciais pode comprometer o funcionamento da Plataforma.`,
  },
  {
    icon: Globe,
    title: "8. Transferência Internacional de Dados",
    content: `Seus dados pessoais podem ser transferidos e processados em servidores localizados fora do Brasil, incluindo nos Estados Unidos, onde nossos provedores de infraestrutura (como serviços de nuvem) podem estar sediados.

Quando realizamos transferências internacionais, adotamos salvaguardas adequadas para garantir que seus dados recebam nível de proteção equivalente ao exigido pela LGPD, incluindo cláusulas contratuais padrão e verificação de adequação do país receptor.`,
  },
  {
    icon: Database,
    title: "9. Retenção de Dados",
    content: `Mantemos seus dados pessoais pelo tempo necessário para cumprir as finalidades descritas nesta Política, observados os seguintes critérios:

Dados de conta: mantidos enquanto a conta estiver ativa. Após o encerramento da conta, os dados são anonimizados ou excluídos em até 90 (noventa) dias, salvo obrigação legal de retenção.

Logs de acesso: mantidos por 6 (seis) meses, conforme exigido pelo art. 15 do Marco Civil da Internet.

Dados para cumprimento de obrigações legais: mantidos pelo prazo exigido pela legislação aplicável, que pode ser de até 5 (cinco) anos para fins fiscais e tributários.

Conteúdo publicado: após exclusão pelo usuário, o conteúdo é removido da visualização pública imediatamente, podendo permanecer em backups por até 30 (trinta) dias.`,
  },
  {
    icon: Mail,
    title: "10. Contato e Encarregado de Dados (DPO)",
    content: `Para exercer seus direitos, esclarecer dúvidas sobre esta Política ou reportar incidentes de segurança, entre em contato pelo canal de suporte disponível na Plataforma.

Nos comprometemos a responder todas as solicitações relacionadas a dados pessoais em até 15 (quinze) dias úteis.

Esta Política pode ser atualizada periodicamente. Notificaremos os usuários sobre alterações relevantes por meio de aviso na Plataforma ou por e-mail. A data da última atualização está indicada no topo deste documento.

Ao continuar utilizando a Plataforma após a publicação de alterações, você confirma sua aceitação da Política atualizada.`,
  },
];

export default function PrivacidadePage() {
  const navigate = useNavigate();

  return (
    <div className="bg-background min-h-screen">
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b">
        <div className="flex items-center gap-3 px-4 py-3 max-w-2xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-sm font-semibold font-display">Política de Privacidade</h1>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="px-4 py-6 max-w-2xl mx-auto focus:outline-none">
        {/* Hero */}
        <div className="flex items-center gap-4 mb-6">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <Shield className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display">Política de Privacidade</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Última atualização: Março de 2026 · Versão 1.0
            </p>
          </div>
        </div>

        {/* Aviso LGPD */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-8">
          <p className="text-sm text-foreground leading-relaxed">
            Esta Política está em conformidade com a{" "}
            <strong>Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018)</strong>{" "}
            e o Marco Civil da Internet (Lei nº 12.965/2014). Seus dados são tratados com transparência e segurança.
          </p>
        </div>

        {/* Seções */}
        <div className="space-y-6">
          {sections.map((section, i) => {
            const Icon = section.icon;
            return (
              <div key={i} className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">{section.title}</h3>
                </div>
                <div className="space-y-3">
                  {section.content.split("\n\n").map((paragraph, j) => (
                    <p key={j} className="text-sm text-muted-foreground leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer links */}
        <div className="mt-8 pt-6 border-t border-border flex flex-col items-center gap-2">
          <p className="text-xs text-muted-foreground text-center">
            Veja também nossos{" "}
            <Link to="/termos" className="text-primary hover:underline font-medium">
              Termos de Uso
            </Link>
            {" "}e as{" "}
            <Link to="/regras" className="text-primary hover:underline font-medium">
              Regras da Comunidade
            </Link>
          </p>
          <p className="text-xs text-muted-foreground text-center">
            Dúvidas sobre seus dados? Entre em contato pelo suporte da plataforma.
          </p>
        </div>
      </main>
    </div>
  );
}
