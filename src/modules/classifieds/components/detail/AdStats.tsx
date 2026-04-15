import { Eye, Heart, MessageCircle, Clock } from "lucide-react";
import { motion } from "framer-motion";

interface AdStatsProps {
  views?: number;
  favorites?: number;
  messages?: number;
  postedAt?: string;
}

export function AdStats({
  views = 127,
  favorites = 8,
  messages = 3,
  postedAt,
}: AdStatsProps) {
  const stats = [
    { icon: Eye, label: "Visualizações", value: views },
    { icon: Heart, label: "Favoritos", value: favorites },
    { icon: MessageCircle, label: "Mensagens", value: messages },
  ];

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.25 }}
      className="px-4 mt-3"
    >
      <div className="flex items-center justify-between bg-secondary/50 rounded-xl p-3">
        {stats.map((stat, i) => (
          <div key={stat.label} className="flex items-center gap-1.5">
            <stat.icon className="h-3.5 w-3.5 text-muted-foreground" />
            <div>
              <p className="text-xs font-bold">{stat.value}</p>
              <p className="text-[9px] text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
