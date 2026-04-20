import React, { memo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { cn } from "@/shared/utils/cn";

interface FloatingActionButtonProps {
  to?: string;
  onClick?: () => void;
  icon: React.ElementType;
  tooltip: string;
  gradient: string;
  bottom: number;
}

const FloatingActionButton = memo(
  ({
    to,
    onClick,
    icon: Icon,
    tooltip,
    gradient,
    bottom,
  }: FloatingActionButtonProps) => {
    const button = (
      <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "md:hidden fixed right-4 z-50 flex items-center justify-center w-14 h-14 rounded-full shadow-2xl transition-all",
          gradient,
        )}
        style={{ bottom: `${bottom}px` }}
        aria-label={tooltip}
      >
        <Icon className="w-6 h-6 text-white" aria-hidden="true" />
      </motion.button>
    );

    if (to) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Link to={to}>{button}</Link>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="left">
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    );
  },
);

FloatingActionButton.displayName = "FloatingActionButton";

export function CommunityFloatingButtons() {
  return (
    <>
      <FloatingActionButton
        to="/mensagens"
        icon={MessageCircle}
        tooltip="Mensagens"
        gradient="bg-gradient-to-br from-teal-400 to-cyan-500"
        bottom={80}
      />
    </>
  );
}
