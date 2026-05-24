import React, { useState } from "react";
import { CommunityRidePost, CommunityRidePostData } from "./CommunityRidePost";
import { PostToRideModal } from "./PostToRideModal";
import { ReportPostModal } from "./ReportPostModal";
import { Button } from "@/shared/components/ui/button";
import { AlertTriangle, Lightbulb, Plus, Car, Users, RefreshCw, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { toast } from "sonner";
import {
  useCommunityPosts,
  CommunityPost,
} from "@/modules/mobility/hooks/useCommunityPosts";

type FeedFilter = "all" | "offering" | "requesting";

interface CommunityRideFeedProps {
  currentUserId?: string;
  locationId?: string;
  authorNeighborhood?: string;
  authorVerified?: boolean;
  onCreateRide?: (post: CommunityRidePostData) => void;
}

type PublishPayload = Omit<
  CommunityRidePostData,
  "id" | "authorName" | "authorAvatar" | "createdAt" | "interestedCount" | "hasJoined"
>;

export function CommunityRideFeed({
  currentUserId,
  locationId,
  authorNeighborhood,
  authorVerified = false,
  onCreateRide,
}: CommunityRideFeedProps) {
  const [filter, setFilter] = useState<FeedFilter>("all");
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [reportingPost, setReportingPost] = useState<CommunityPost | null>(
    null,
  );

  const { posts, loading, error, createPost, likePost, refetch } =
    useCommunityPosts(filter !== "all" ? { category: filter } : undefined);

  const handlePublish = async (data: PublishPayload) => {
    if (!currentUserId || !locationId) {
      toast.error("Selecione um perfil e um território antes de publicar.");
      return;
    }

    await createPost({
      author_profile_id: currentUserId,
      location_id: locationId,
      reach: 'neighborhood',
      content: data.content,
    });
  };

  const handleJoin = async (postId: string) => {
    await likePost(postId);
  };

  const handleReport = async (_reason: string, _description?: string) => {
    if (reportingPost) {
      toast.info("Denúncia registrada");
      setReportingPost(null);
    }
  };

  const handleCreateRideFromPost = (
    _postId: string,
    post: CommunityRidePostData,
  ) => {
    onCreateRide?.(post);
    toast.info("Redirecionando para criar corrida...");
  };

  // Map posts to component format with safe access
  const mappedPosts: CommunityRidePostData[] = posts.map((p) => ({
    id: p.id,
    authorName: p.author_name || "Vizinho",
    authorAvatar: p.author_avatar || "",
    authorNeighborhood: p.author_neighborhood || "",
    isVerified: p.author_verified || false,
    content: p.content,
    intent: p.intent || "offering",
    origin: p.origin || "",
    destination: p.destination || "",
    departureTime: p.departure_time || p.created_at,
    seatsAvailable: p.seats_available || 0,
    rideType: p.ride_type || "viagem",
    price: p.price || 0,
    createdAt: p.created_at,
    interestedCount: p.interested_count || p.likes_count || 0,
    hasJoined: p.has_joined || false,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-yellow-400" />
            Comunidade + Mobilidade
          </h2>
          <p className="text-[0.65rem] text-gray-500 mt-0.5">
            Postagens do bairro com oportunidades de carona
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => refetch()}
            disabled={loading}
            className="h-8 w-8 rounded-xl text-gray-400 hover:text-white hover:bg-white/10"
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5", loading && "animate-spin")}
            />
          </Button>
          <Button
            size="sm"
            onClick={() => setIsPostModalOpen(true)}
            className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl text-xs h-8 px-3 flex-shrink-0 shadow-lg shadow-teal-500/20"
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Publicar
          </Button>
        </div>
      </div>

      <div className="p-3 rounded-xl bg-gradient-to-r from-teal-500/5 to-cyan-500/5 border border-teal-500/10">
        <div className="flex items-start gap-2 text-[0.65rem] text-gray-400 leading-relaxed">
          <Lightbulb className="h-3.5 w-3.5 mt-0.5 shrink-0 text-teal-400" aria-hidden="true" />
          <p>
            <span className="text-teal-400 font-semibold">Como funciona:</span>{" "}
            Poste no feed dizendo que vai a algum lugar. Vizinhos podem solicitar
            carona.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {[
          { key: "all", label: "Todos", count: posts.length },
          { key: "offering", label: "Oferecendo", count: 0 },
          { key: "requesting", label: "Precisando", count: 0 },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as FeedFilter)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[0.65rem] font-semibold transition-all",
              filter === tab.key
                ? "bg-white/10 text-white"
                : "text-gray-500 hover:text-gray-300",
            )}
          >
            {tab.label}
            <span
              className={cn(
                "px-1.5 py-0.5 rounded-full text-[0.55rem] font-bold",
                filter === tab.key ? "bg-white/10" : "bg-white/5",
              )}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-teal-400 animate-spin mb-3" />
          <p className="text-sm text-gray-400">Carregando postagens...</p>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <p className="flex items-start gap-2 text-sm text-red-400">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
            <span>Erro ao carregar postagens: {String(error)}</span>
          </p>
          <Button
            size="sm"
            onClick={() => refetch()}
            className="mt-2 bg-red-500/20 text-red-400 hover:bg-red-500/30"
          >
            Tentar novamente
          </Button>
        </div>
      )}

      {!loading && !error && mappedPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-3">
            {filter === "offering" ? (
              <Car className="h-8 w-8 text-gray-600" />
            ) : (
              <Users className="h-8 w-8 text-gray-600" />
            )}
          </div>
          <p className="text-sm font-semibold text-white mb-1">
            Nenhuma postagem
          </p>
          <p className="text-xs text-gray-500 mb-4 max-w-xs">
            Seja o primeiro a publicar uma carona!
          </p>
          <Button
            size="sm"
            onClick={() => setIsPostModalOpen(true)}
            className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Publicar carona
          </Button>
        </div>
      ) : !loading && !error && mappedPosts.length > 0 ? (
        <div className="space-y-3">
          {mappedPosts.map((post) => (
            <CommunityRidePost
              key={post.id}
              post={post}
              currentUserId={currentUserId}
              onJoin={handleJoin}
              onCreateRide={handleCreateRideFromPost}
              onReport={(postId) => {
                const p = posts.find((x) => x.id === postId);
                if (p) setReportingPost(p);
              }}
            />
          ))}
        </div>
      ) : null}

      <PostToRideModal
        open={isPostModalOpen}
        onOpenChange={setIsPostModalOpen}
        onPublish={handlePublish}
        authorNeighborhood={authorNeighborhood}
        isVerified={authorVerified}
      />
      <ReportPostModal
        open={!!reportingPost}
        onOpenChange={(open) => !open && setReportingPost(null)}
        onReport={handleReport}
        postContent={reportingPost?.content || ""}
      />
    </div>
  );
}
