import { AlertCard } from "./AlertCard";
import type {
  AlertPost,
  Profile,
  AlertConfirmation,
} from "@/modules/admin/hooks/useAlertData";

interface AlertsListProps {
  alerts: AlertPost[];
  getProfile: (userId: string) => Profile | undefined;
  getPostReportCount: (postId: string) => number;
  getPostConfirmations: (postId: string) => number;
  getPostDenials: (postId: string) => number;
  isExpired: (post: AlertPost) => boolean;
  onSelectPost: (post: AlertPost) => void;
}

export function AlertsList({
  alerts,
  getProfile,
  getPostReportCount,
  getPostConfirmations,
  getPostDenials,
  isExpired,
  onSelectPost,
}: AlertsListProps) {
  if (alerts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-12">
        Nenhum alerta encontrado.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {alerts.map((post) => (
        <AlertCard
          key={post.id}
          post={post}
          author={getProfile(post.autor_id)}
          reportCount={getPostReportCount(post.id)}
          confirmCount={getPostConfirmations(post.id)}
          denyCount={getPostDenials(post.id)}
          expired={isExpired(post)}
          onViewDetails={() => onSelectPost(post)}
        />
      ))}
    </div>
  );
}
