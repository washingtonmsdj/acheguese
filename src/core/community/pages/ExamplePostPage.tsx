import React from "react";

/**
 * Página de Exemplo - Post com Recomendação
 *
 * Demonstra visualmente como funciona o sistema de menções
 * em posts de recomendação
 */

// Componente local para evitar cross-module import
function ExampleRecommendationPost() {
  return (
    <div className="bg-[#1E2529] rounded-lg p-4 border border-white/10">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white font-semibold">
          JS
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-white">João Silva</span>
            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full flex items-center gap-1">
              ⭐ Recomendação
            </span>
          </div>
          <p className="text-gray-300 text-sm mb-4">
            Pessoal, preciso recomendar o melhor encanador da região! Trabalho
            impecável e preço justo. 👇
          </p>

          {/* Card do Profissional Recomendado */}
          <div className="bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border border-teal-500/30 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                MP
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white">Mario Pereira</h3>
                <p className="text-teal-400 text-sm">Encanador</p>
                <p className="text-gray-400 text-xs">Centro, São Paulo</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-yellow-400 text-sm">
                  ⭐ 4.8
                </div>
                <p className="text-gray-400 text-xs">23 avaliações</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors">
                📞 Ligar
              </button>
              <button className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors">
                💬 Mensagem
              </button>
            </div>

            <div className="mt-2 text-center">
              <span className="inline-block px-3 py-1 bg-teal-500/20 text-teal-400 text-xs rounded-full">
                ✅ Recomendado
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ExamplePostPage() {
  return (
    <div className="bg-[#12181B]">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-white mb-2">
            📱 Exemplo de Post com Recomendação
          </h1>
          <p className="text-gray-400 text-sm">
            Veja como ficaria uma postagem recomendando um profissional
          </p>
        </div>

        {/* Post de Exemplo */}
        <ExampleRecommendationPost />

        {/* Explicação */}
        <div className="mt-8 p-6 rounded-lg bg-[#1E2529] border border-white/10">
          <h2 className="text-lg font-semibold text-white mb-4">
            ✨ Funcionalidades Demonstradas
          </h2>

          <div className="space-y-4 text-sm text-gray-300">
            <div className="flex items-start gap-3">
              <span className="text-teal-400 font-bold">1.</span>
              <div>
                <strong className="text-white">Badge de Tipo:</strong> Post
                marcado como "Recomendação" com ícone ⭐
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-teal-400 font-bold">2.</span>
              <div>
                <strong className="text-white">Profissional Mencionado:</strong>{" "}
                Card destacado com informações do profissional
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-teal-400 font-bold">3.</span>
              <div>
                <strong className="text-white">Informações Visíveis:</strong>
                <ul className="list-disc list-inside mt-1 text-gray-400">
                  <li>Nome e avatar</li>
                  <li>Profissão</li>
                  <li>Localização (neighborhood)</li>
                  <li>Avaliação (estrelas)</li>
                  <li>Número de avaliações</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-teal-400 font-bold">4.</span>
              <div>
                <strong className="text-white">Ações Rápidas:</strong>
                <ul className="list-disc list-inside mt-1 text-gray-400">
                  <li>Botão "Ligar" (abre discador)</li>
                  <li>Botão "Mensagem" (abre chat)</li>
                  <li>Click no card vai para profile completo</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-teal-400 font-bold">5.</span>
              <div>
                <strong className="text-white">Visual Destacado:</strong> Card
                com borda teal e fundo gradiente para chamar atenção
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-teal-400 font-bold">6.</span>
              <div>
                <strong className="text-white">Badge "Recomendado":</strong>{" "}
                Indica que é uma recomendação oficial
              </div>
            </div>
          </div>
        </div>

        {/* Casos de Uso */}
        <div className="mt-6 p-6 rounded-lg bg-gradient-to-r from-teal-500/5 to-cyan-500/5 border border-teal-500/20">
          <h2 className="text-lg font-semibold text-white mb-4">
            💡 Casos de Uso
          </h2>

          <div className="space-y-3 text-sm text-gray-300">
            <div>
              <strong className="text-teal-400">
                Recomendações "Quentes":
              </strong>
              <p className="text-gray-400 mt-1">
                "Preciso de um encanador urgente!" → Vizinho recomenda
                profissional com um clique
              </p>
            </div>

            <div>
              <strong className="text-teal-400">Indicações Verificadas:</strong>
              <p className="text-gray-400 mt-1">
                Recomendações de vizinhos verificados têm mais credibilidade
              </p>
            </div>

            <div>
              <strong className="text-teal-400">Networking Local:</strong>
              <p className="text-gray-400 mt-1">
                Profissionais ganham visibilidade através de recomendações da
                comunidade
              </p>
            </div>

            <div>
              <strong className="text-teal-400">Contato Direto:</strong>
              <p className="text-gray-400 mt-1">
                Botões de ação permitem contato imediato sem sair do post
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
