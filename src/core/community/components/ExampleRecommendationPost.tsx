import React from "react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import {
  ThumbsUp,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  MapPin,
} from "lucide-react";
import { MentionedProfileCard } from "./MentionedProfileCard";
import { VerifiedResidentBadge } from "@/shared/components/badges";
/**
 * Exemplo de Post com Recomendação e Menção
 *
 * Este componente demonstra como ficaria uma postagem
 * do tipo "recomendação" com um profissional mencionado
 */

export function ExampleRecommendationPost() {
  // Dados de exemplo
  const author = {
    id: "1",
    name: "Ana Silva",
    avatar_url: "https://i.pravatar.cc/150?img=1",
    neighborhood: "Nordeste de Amaralina",
    is_verified_resident: true,
  };

  const mentionedProfessional = {
    id: "2",
    name: "João Santos",
    avatar_url: "https://i.pravatar.cc/150?img=12",
    neighborhood: "Nordeste de Amaralina",
    user_type: "pessoa",
    profissao: "Encanador",
    phone: "(71) 99999-9999",
    rating: 4.8,
    total_reviews: 23,
  };

  const post = {
    id: "1",
    content:
      "Pessoal, tive um problema sério de vazamento aqui em casa ontem à noite. Chamei o João e ele resolveu tudo em menos de 2 times! Trabalho impecável, preço justo e super atencioso. Recomendo demais! 👏",
    created_at: "2024-03-11T10:30:00",
    likes_count: 15,
    comments_count: 8,
    is_liked: false,
    is_saved: false,
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTimeAgo = (date: string) => {
    return "2 times atrás";
  };

  return (
    <div className="bg-[#1E2529] rounded-lg border border-white/10 overflow-hidden">
      {/* Header do Post */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3">
            <Avatar className="w-10 h-10 ring-2 ring-teal-400/30">
              <AvatarImage src={author.avatar_url} />
              <AvatarFallback className="bg-gradient-to-br from-teal-400 to-cyan-400 text-white font-semibold">
                {getInitials(author.name)}
              </AvatarFallback>
            </Avatar>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-white">
                  {author.name}
                </h3>
                {author.is_verified_resident && (
                  <VerifiedResidentBadge size="small" />
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>{formatTimeAgo(post.created_at)}</span>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>{author.neighborhood}</span>
                </div>
              </div>
            </div>
          </div>

          <button className="p-1 hover:bg-white/5 rounded-full transition-colors">
            <MoreHorizontal className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Badge de Tipo de Post */}
        <div className="mb-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
            <span className="text-sm">⭐</span>
            <span className="text-xs font-medium text-green-400">
              Recomendação
            </span>
          </span>
        </div>

        {/* Conteúdo do Post */}
        <p className="text-sm text-gray-200 leading-relaxed mb-4">
          {post.content}
        </p>

        {/* Profissional Mencionado */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-teal-500/30 to-transparent" />
            <span className="text-xs font-medium text-teal-400">
              Profissional Recomendado
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-teal-500/30 to-transparent" />
          </div>

          <MentionedProfileCard
            profile={mentionedProfessional}
            mentionType="recommendation"
          />
        </div>

        {/* Métricas */}
        <div className="flex items-center justify-between py-3 border-t border-white/5">
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span>{post.likes_count} curtidas</span>
            <span>{post.comments_count} comentários</span>
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center justify-around pt-3 border-t border-white/5">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/5 transition-colors group">
            <ThumbsUp className="w-4 h-4 text-gray-400 group-hover:text-teal-400 transition-colors" />
            <span className="text-sm text-gray-400 group-hover:text-white transition-colors">
              Curtir
            </span>
          </button>

          <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/5 transition-colors group">
            <MessageCircle className="w-4 h-4 text-gray-400 group-hover:text-teal-400 transition-colors" />
            <span className="text-sm text-gray-400 group-hover:text-white transition-colors">
              Comentar
            </span>
          </button>

          <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/5 transition-colors group">
            <Share2 className="w-4 h-4 text-gray-400 group-hover:text-teal-400 transition-colors" />
            <span className="text-sm text-gray-400 group-hover:text-white transition-colors">
              Compartilhar
            </span>
          </button>

          <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/5 transition-colors group">
            <Bookmark className="w-4 h-4 text-gray-400 group-hover:text-teal-400 transition-colors" />
            <span className="text-sm text-gray-400 group-hover:text-white transition-colors">
              Salvar
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
