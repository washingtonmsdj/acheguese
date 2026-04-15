import React from "react";
import { ArrowLeft, FileText, Shield, AlertTriangle, Scale, Users, Lock, Bell } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

const sections = [
  {
    icon: Users,
    title: "1. Aceitação dos Termos",
    content: `Ao acessar ou utilizar a plataforma Comunidade Conectada ("Plataforma"), você ("Usuário") declara ter lido, compreendido e concordado integralmente com estes Termos de Uso ("Termos"), bem como com nossa Política de Privacidade e Regras da Comunidade, que integram este instrumento por referência.

Se você não concordar com qualquer disposição destes Termos, não utilize a Plataforma. O uso continuado após alterações nos Termos constitui aceitação tácita das novas condições.

A Plataforma é destinada exclusivamente a maiores de 18 anos ou a menores de 18 anos devidamente autorizados por seus responsáveis legais.`,
  },
  {
    icon: FileText,
    title: "2. Descrição do Serviço",
    content: `A Comunidade Conectada é uma plataforma digital de comunicação comunitária que permite a usuários cadastrados publicar, compartilhar e interagir com conteúdos relacionados ao seu bairro e cidade.

Os serviços incluem, mas não se limitam a: publicação de posts e alertas comunitários, listagem de negócios e serviços locais, classificados, eventos, grupos de discussão e sistema de mensagens entre usuários.

A Plataforma atua como intermediária tecnológica (art. 19 do Marco Civil da Internet — Lei 12.965/2014), não sendo responsável pelo conteúdo gerado por terceiros, salvo nas hipóteses legais expressamente previstas.`,
  },
  {
    icon: Lock,
    title: "3. Cadastro e Conta do Usuário",
    content: `Para utilizar os recursos da Plataforma, o Usuário deve criar uma conta fornecendo informações verdadeiras, precisas e atualizadas. O Usuário é responsável por manter a confidencialidade de suas credenciais de acesso.

O Usuário compromete-se a: (a) não compartilhar sua senha com terceiros; (b) notificar imediatamente a Plataforma sobre qualquer uso não autorizado de sua conta; (c) não criar contas falsas ou em nome de terceiros sem autorização.

A Plataforma reserva-se o direito de recusar cadastros, cancelar contas ou remover conteúdos a seu exclusivo critério, especialmente em casos de violação destes Termos.

O nome de usuário (handle) escolhido no cadastro é único e público. Não são permitidos handles que imitem marcas registradas, personalidades públicas ou que contenham termos ofensivos.`,
  },
  {
    icon: Users,
    title: "4. Responsabilidade pelo Conteúdo",
    content: `O Usuário é o único e exclusivo responsável por todo conteúdo que publicar, compartilhar ou transmitir na Plataforma, incluindo textos, imagens, vídeos, links e demais materiais.

É expressamente proibido publicar conteúdo que: (a) viole direitos autorais, marcas ou propriedade intelectual de terceiros; (b) contenha informações falsas, enganosas ou que possam causar dano a pessoas ou empresas; (c) seja difamatório, calunioso, injurioso, ameaçador, obsceno, pornográfico ou que incite violência ou discriminação; (d) viole a privacidade ou exponha dados pessoais de terceiros sem consentimento; (e) promova atividades ilegais ou contrarie a legislação brasileira vigente; (f) contenha vírus, malware ou qualquer código malicioso.

Nos termos do art. 19 do Marco Civil da Internet, a Plataforma somente será responsabilizada por danos decorrentes de conteúdo gerado por terceiros se, após ordem judicial específica, não tomar as providências para tornar o conteúdo indisponível.`,
  },
  {
    icon: AlertTriangle,
    title: "5. Moderação e Penalidades",
    content: `A Plataforma mantém equipe de moderação e sistemas automatizados para identificar violações destes Termos e das Regras da Comunidade.

Ao constatar violações, a Plataforma poderá, a seu critério e de forma progressiva: (a) remover o conteúdo infrator sem aviso prévio; (b) emitir advertência formal ao Usuário; (c) suspender temporariamente o acesso à conta; (d) suspender permanentemente a conta; (e) reportar às autoridades competentes quando houver indício de prática criminosa.

O Usuário poderá contestar decisões de moderação por meio dos canais de suporte disponíveis na Plataforma. A Plataforma analisará as contestações em prazo razoável, mas não se obriga a reverter decisões de moderação.`,
  },
  {
    icon: Bell,
    title: "6. Sistema de Alertas e Segurança",
    content: `O sistema de alertas comunitários destina-se exclusivamente à comunicação de situações de risco real e imediato à segurança da comunidade.

É expressamente proibido: (a) emitir alertas falsos ou sem fundamento; (b) utilizar o sistema para causar pânico desnecessário; (c) divulgar localização de operações policiais, blitz ou ações de fiscalização; (d) usar alertas para fins comerciais ou publicitários.

O uso indevido do sistema de alertas resultará em suspensão imediata da funcionalidade e poderá ensejar responsabilidade civil e criminal nos termos da legislação aplicável, incluindo o art. 266 do Código Penal (perturbação de serviço de utilidade pública).`,
  },
  {
    icon: Lock,
    title: "7. Privacidade e Proteção de Dados",
    content: `O tratamento de dados pessoais na Plataforma é regido pela Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018) e está detalhado em nossa Política de Privacidade, que integra estes Termos.

Ao se cadastrar, o Usuário consente com a coleta e tratamento de seus dados pessoais para as finalidades descritas na Política de Privacidade. O Usuário pode exercer seus direitos de titular de dados (acesso, correção, exclusão, portabilidade, entre outros) por meio dos canais de suporte.

A Plataforma adota medidas técnicas e organizacionais adequadas para proteger os dados pessoais dos Usuários contra acesso não autorizado, perda, destruição ou divulgação indevida.`,
  },
  {
    icon: Scale,
    title: "8. Propriedade Intelectual",
    content: `Todos os direitos de propriedade intelectual relativos à Plataforma, incluindo marca, logotipo, design, código-fonte, textos e demais elementos, são de titularidade exclusiva da Plataforma ou de seus licenciantes.

Ao publicar conteúdo na Plataforma, o Usuário concede à Plataforma licença não exclusiva, gratuita, mundial e por prazo indeterminado para usar, reproduzir, modificar, adaptar, publicar e distribuir tal conteúdo exclusivamente para fins de operação e promoção dos serviços.

O Usuário declara que possui todos os direitos necessários sobre o conteúdo que publica e que tal publicação não viola direitos de terceiros.`,
  },
  {
    icon: FileText,
    title: "9. Limitação de Responsabilidade",
    content: `A Plataforma é fornecida "no estado em que se encontra" e "conforme disponível", sem garantias de qualquer natureza, expressas ou implícitas.

A Plataforma não se responsabiliza por: (a) interrupções, falhas técnicas ou indisponibilidade do serviço; (b) danos diretos, indiretos, incidentais, especiais ou consequentes decorrentes do uso ou impossibilidade de uso da Plataforma; (c) conteúdo publicado por terceiros; (d) atos praticados por usuários fora da Plataforma; (e) perda de dados decorrente de falhas técnicas.

Em nenhuma hipótese a responsabilidade total da Plataforma perante o Usuário excederá o valor pago pelo Usuário pelos serviços nos últimos 12 meses, ou R$ 100,00 (cem reais), o que for maior.`,
  },
  {
    icon: Scale,
    title: "10. Disposições Gerais",
    content: `Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da comarca de Salvador/BA para dirimir quaisquer controvérsias decorrentes destes Termos, com renúncia expressa a qualquer outro, por mais privilegiado que seja.

Se qualquer disposição destes Termos for considerada inválida ou inexequível, as demais disposições permanecerão em pleno vigor e efeito.

A omissão da Plataforma em exercer qualquer direito ou disposição destes Termos não constituirá renúncia a tal direito ou disposição.

Para dúvidas ou solicitações relacionadas a estes Termos, entre em contato pelo canal de suporte disponível na Plataforma.`,
  },
];

export default function TermosPage() {
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
          <h1 className="text-sm font-semibold font-display">Termos de Uso</h1>
        </div>
      </header>

      <div className="px-4 py-6 max-w-2xl mx-auto">
        {/* Hero */}
        <div className="flex items-center gap-4 mb-6">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <FileText className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display">Termos de Uso</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Última atualização: Março de 2026 · Versão 2.0
            </p>
          </div>
        </div>

        {/* Aviso de destaque */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-8">
          <p className="text-sm text-foreground leading-relaxed">
            Ao utilizar a Comunidade Conectada, você concorda com estes Termos de Uso. Leia com atenção antes de criar sua conta ou continuar usando a plataforma.
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
            Veja também nossa{" "}
            <Link to="/privacidade" className="text-primary hover:underline font-medium">
              Política de Privacidade
            </Link>
            {" "}e as{" "}
            <Link to="/regras" className="text-primary hover:underline font-medium">
              Regras da Comunidade
            </Link>
          </p>
          <p className="text-xs text-muted-foreground text-center">
            Dúvidas? Entre em contato pelo suporte da plataforma.
          </p>
        </div>
      </div>
    </div>
  );
}
