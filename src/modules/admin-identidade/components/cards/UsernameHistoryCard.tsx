/**
 * UsernameHistoryCard Component
 * 
 * Card de histórico de username
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import type { UsernameHistoryCardProps } from "../../sections/types";

export function UsernameHistoryCard({ history }: UsernameHistoryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Historico de username</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="space-y-2">
          {history.length ? (
            history.map((item) => (
              <div key={item.id} className="rounded-lg border p-3">
                @{item.old_username} {"->"} @{item.new_username}
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-dashed p-4 text-muted-foreground">
              Sem historico de username.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
