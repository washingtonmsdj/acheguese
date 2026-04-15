import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/shared/components/ui/card";

interface EmptyStateProfileProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function EmptyStateProfile({
  icon: Icon,
  title,
  description,
}: EmptyStateProfileProps) {
  return (
    <Card>
      <CardContent className="p-12 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
            <Icon className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold">{title}</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            {description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
