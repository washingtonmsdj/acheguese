import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/shared/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { motion } from "framer-motion";
import { ShieldOff, User, Loader2, Unlock } from "lucide-react";
import { toast } from "sonner";

interface BlockedUsersListProps {
  userId: string;
  onUnblock: () => void;
}

interface BlockedUserItem {
  id: string;
  blocked_user_id: string;
  blocked_profile?: {
    avatar_url?: string | null;
    name?: string | null;
    username?: string | null;
  } | null;
}

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

export function BlockedUsersList({ userId, onUnblock }: BlockedUsersListProps) {
  const queryClient = useQueryClient();

  const { data: blockedUsers, isLoading } = useQuery({
    queryKey: ["blocked-users", userId],
    queryFn: async () => {
      const { blockService } = await import("@/core/social/services/BlockService");
      return await blockService.getBlockedUsers(userId);
    },
    enabled: !!userId,
  });

  const unblockMutation = useMutation({
    mutationFn: async (blockedUserId: string) => {
      const { blockService } = await import("@/core/social/services/BlockService");
      await blockService.unblockUser(userId, blockedUserId);
      return blockedUserId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blocked-users", userId] });
      toast.success("Usuário desbloqueado com sucesso!");
      onUnblock();
    },
    onError: () => {
      toast.error("Erro ao desbloquear usuário");
    },
  });

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <motion.div {...fadeUp} transition={{ duration: 0.3 }}>
        <h2 className="text-xl font-bold font-display tracking-tight text-foreground flex items-center gap-2">
          <ShieldOff className="h-5 w-5 text-primary" />
          Usuários Bloqueados
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie os usuários que você bloqueou
        </p>
      </motion.div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !blockedUsers || blockedUsers.length === 0 ? (
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="rounded-2xl border border-border bg-card overflow-hidden"
        >
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="h-16 w-16 rounded-2xl bg-secondary/60 flex items-center justify-center mb-4">
              <ShieldOff className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1">
              Nenhum usuário bloqueado
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-xs">
              Você não bloqueou nenhum usuário. Usuários bloqueados não podem
              interagir com você ou ver seu conteúdo.
            </p>
          </div>
        </motion.div>
      ) : (
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="rounded-2xl border border-border bg-card overflow-hidden"
        >
          <div className="divide-y divide-border">
            {(blockedUsers as BlockedUserItem[]).map((block) => (
              <div
                key={block.id}
                className="flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border border-border">
                    <AvatarImage src={block.blocked_profile?.avatar_url} />
                    <AvatarFallback className="bg-secondary">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">
                      {block.blocked_profile?.name || "Usuário"}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      @{block.blocked_profile?.username || "sem-username"}
                    </p>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => unblockMutation.mutate(block.blocked_user_id)}
                  disabled={unblockMutation.isPending}
                  className="gap-1.5 text-xs"
                >
                  <Unlock className="h-3.5 w-3.5" />
                  Desbloquear
                </Button>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-border bg-secondary/20">
            <p className="text-xs text-muted-foreground">
              <strong>Nota:</strong> Ao desbloquear um usuário, ele poderá voltar
              a ver seu perfil, posts e interagir com você normalmente.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
