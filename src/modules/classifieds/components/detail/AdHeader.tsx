import React from "react";
import { Button } from "@/shared/components/ui/button";
import {
  ArrowLeft,
  Share2,
  Heart,
  MoreVertical,
  Pencil,
  Trash2,
  Bookmark,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { cn } from "@/shared/utils/cn";

interface AdHeaderProps {
  liked: boolean;
  isOwner: boolean;
  onGoBack: () => void;
  onLike: () => void;
  onShare: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function AdHeader({
  liked,
  isOwner,
  onGoBack,
  onLike,
  onShare,
  onEdit,
  onDelete,
}: AdHeaderProps) {
  return (
    <div className="flex items-center justify-between p-3">
      <motion.div whileTap={{ scale: 0.9 }}>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full bg-card/60 backdrop-blur-sm border border-border/30"
          onClick={onGoBack}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </motion.div>

      <div className="flex items-center gap-1.5">
        <motion.div whileTap={{ scale: 0.9 }}>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full bg-card/60 backdrop-blur-sm border border-border/30"
            onClick={onShare}
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </motion.div>

        <motion.div whileTap={{ scale: 0.9 }}>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-9 w-9 rounded-full bg-card/60 backdrop-blur-sm border border-border/30",
              liked && "text-destructive"
            )}
            onClick={onLike}
          >
            <Heart className={cn("h-4 w-4", liked && "fill-current")} />
          </Button>
        </motion.div>

        {isOwner && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full bg-card/60 backdrop-blur-sm border border-border/30"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl">
              <DropdownMenuItem onClick={onEdit} className="gap-2">
                <Pencil className="h-4 w-4" />
                Editar anúncio
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onDelete}
                className="gap-2 text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Excluir anúncio
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
