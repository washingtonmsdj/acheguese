import React from "react";

interface ProfileStatsProps {
  stats: {
    posts: number;
    businesses: number;
    favorites: number;
  };
  pontos: number;
}

export function ProfileStats({ stats, pontos }: ProfileStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="text-center p-3 rounded-lg bg-secondary/50">
        <div className="text-xl font-bold text-primary">{stats.posts}</div>
        <div className="text-xs text-muted-foreground">Posts</div>
      </div>
      <div className="text-center p-3 rounded-lg bg-secondary/50">
        <div className="text-xl font-bold text-primary">{stats.businesses}</div>
        <div className="text-xs text-muted-foreground">Empresas</div>
      </div>
      <div className="text-center p-3 rounded-lg bg-secondary/50">
        <div className="text-xl font-bold text-primary">{stats.favorites}</div>
        <div className="text-xs text-muted-foreground">Favoritos</div>
      </div>
      <div className="text-center p-3 rounded-lg bg-secondary/50">
        <div className="text-xl font-bold text-primary">{pontos}</div>
        <div className="text-xs text-muted-foreground">Pontos</div>
      </div>
    </div>
  );
}
