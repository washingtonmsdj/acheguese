import { Navigate, useParams } from "react-router-dom";
import { useSessionContext } from "@/core/session";

export default function ContaEditarPage() {
  const { profileId } = useParams<{ profileId?: string }>();
  const { activeProfile } = useSessionContext();

  const targetProfileId = profileId ?? activeProfile?.id ?? null;

  if (!targetProfileId) {
    return <Navigate to="/conta" replace />;
  }

  return <Navigate to={`/conta/editar/${targetProfileId}`} replace />;
}
