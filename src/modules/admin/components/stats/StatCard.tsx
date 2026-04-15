import React from "react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
}

export function StatCard({ label, value, icon: Icon, color }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">{label}</span>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
        <div className={`text-2xl font-bold ${color}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
