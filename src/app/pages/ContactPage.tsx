/**
 * ContactPage — Página de contato do Achegue-se
 */

import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, MessageSquare, Phone } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';

export default function ContactPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-[#0f1419] text-white">
      {/* Header */}
      <header className="w-full border-b border-white/10 bg-[#0f1419]/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="text-white/70 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <span className="text-lg font-bold tracking-tight text-white">
            Achegue<span className="text-teal-400">-se</span>
          </span>
        </div>
      </header>

      {/* Conteúdo */}
      <main id="main-content" tabIndex={-1} className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-12 focus:outline-none">
        <div className="space-y-8">
          {/* Título */}
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">
              Entre em <span className="text-teal-400">Contato</span>
            </h1>
            <p className="text-white/60 text-lg">
              Estamos aqui para ajudar você
            </p>
          </div>

          {/* Canais de contato */}
          <section className="grid sm:grid-cols-2 gap-4">
            <a
              href="mailto:contato@acheguese.com.br"
              className="bg-white/5 rounded-xl p-6 border border-white/10 hover:bg-white/8 hover:border-teal-400/30 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-lg bg-teal-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-teal-500/30 transition-colors">
                  <Mail className="h-6 w-6 text-teal-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold mb-1">E-mail</h2>
                  <p className="text-sm text-white/60 mb-2">
                    Envie sua mensagem para
                  </p>
                  <p className="text-teal-400 text-sm">contato@acheguese.com.br</p>
                </div>
              </div>
            </a>

            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-lg bg-teal-500/20 flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="h-6 w-6 text-teal-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold mb-1">WhatsApp</h2>
                  <p className="text-sm text-white/60 mb-2">
                    Fale conosco pelo WhatsApp
                  </p>
                  <p className="text-white/40 text-sm">Em breve</p>
                </div>
              </div>
            </div>
          </section>

          {/* Informações adicionais */}
          <section className="bg-white/5 rounded-xl p-6 border border-white/10">
            <h2 className="text-xl font-semibold mb-4">Como podemos ajudar?</h2>
            <div className="space-y-3 text-white/70">
              <p>• Dúvidas sobre o funcionamento da plataforma</p>
              <p>• Sugestões de melhorias</p>
              <p>• Reportar problemas técnicos</p>
              <p>• Parcerias comerciais</p>
              <p>• Expansão para novos bairros</p>
            </div>
          </section>

          {/* Localização */}
          <section className="bg-white/5 rounded-xl p-6 border border-white/10">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-lg bg-teal-500/20 flex items-center justify-center flex-shrink-0">
                <Phone className="h-6 w-6 text-teal-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2">Localização</h2>
                <p className="text-white/70">
                  Salvador, Bahia<br />
                  Brasil
                </p>
              </div>
            </div>
          </section>

          {/* Tempo de resposta */}
          <div className="text-center text-sm text-white/50">
            Respondemos em até 48 horas úteis
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full px-4 sm:px-6 py-6 text-center text-white/30 text-xs border-t border-white/10 mt-12">
        Achegue-se · Salvador, BA
      </footer>
    </div>
  );
}
