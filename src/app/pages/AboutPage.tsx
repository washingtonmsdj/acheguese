/**
 * AboutPage — Página institucional Sobre o Achegue-se
 */

import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Users, Heart, Target } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';

export default function AboutPage() {
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
      <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="space-y-8">
          {/* Título */}
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">
              Sobre o <span className="text-teal-400">Achegue-se</span>
            </h1>
            <p className="text-white/60 text-lg">
              Conectando vizinhanças, fortalecendo comunidades
            </p>
          </div>

          {/* Missão */}
          <section className="bg-white/5 rounded-xl p-6 border border-white/10">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-lg bg-teal-500/20 flex items-center justify-center flex-shrink-0">
                <Target className="h-6 w-6 text-teal-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2">Nossa Missão</h2>
                <p className="text-white/70 leading-relaxed">
                  Criar uma plataforma que aproxima vizinhos, fortalece o comércio local
                  e facilita a vida em comunidade através da tecnologia.
                </p>
              </div>
            </div>
          </section>

          {/* O que fazemos */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">O que fazemos</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                <MapPin className="h-8 w-8 text-teal-400 mb-3" />
                <h3 className="font-semibold mb-2">Conexão Local</h3>
                <p className="text-sm text-white/60">
                  Conectamos moradores do mesmo bairro para fortalecer laços comunitários
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                <Users className="h-8 w-8 text-teal-400 mb-3" />
                <h3 className="font-semibold mb-2">Comércio Local</h3>
                <p className="text-sm text-white/60">
                  Valorizamos empresas e profissionais da sua região
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                <Heart className="h-8 w-8 text-teal-400 mb-3" />
                <h3 className="font-semibold mb-2">Comunidade Ativa</h3>
                <p className="text-sm text-white/60">
                  Facilitamos eventos, alertas e colaboração entre vizinhos
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                <Target className="h-8 w-8 text-teal-400 mb-3" />
                <h3 className="font-semibold mb-2">Mobilidade</h3>
                <p className="text-sm text-white/60">
                  Soluções de transporte compartilhado para sua vizinhança
                </p>
              </div>
            </div>
          </section>

          {/* História */}
          <section className="bg-white/5 rounded-xl p-6 border border-white/10">
            <h2 className="text-xl font-semibold mb-4">Nossa História</h2>
            <p className="text-white/70 leading-relaxed mb-4">
              O Achegue-se nasceu da necessidade de criar conexões mais fortes entre
              vizinhos e valorizar o comércio local. Começamos pelo Complexo do Nordeste
              de Amaralina, em Salvador, e estamos expandindo para outros bairros.
            </p>
            <p className="text-white/70 leading-relaxed">
              Acreditamos que tecnologia pode aproximar pessoas e fortalecer comunidades,
              criando bairros mais conectados, seguros e prósperos.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full px-4 sm:px-6 py-6 text-center text-white/30 text-xs border-t border-white/10 mt-12">
        Achegue-se · Salvador, BA
      </footer>
    </div>
  );
}
