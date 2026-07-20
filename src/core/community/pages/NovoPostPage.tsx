import { useEffect, useMemo } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { CreatePostModal } from "@/core/community/components/composer/CreatePostModal";
import { useAppUrls } from "@/core/routing/hooks";
import { useSessionContext } from "@/core/session/hooks/useSessionContext";
import { Loader2 } from "lucide-react";

export default function NovoPostPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const appUrls = useAppUrls();
  const { user, isLoading } = useSessionContext();

  const defaultType = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const type = params.get("type");
    if (
      type === "discussao" ||
      type === "recomendacao" ||
      type === "evento" ||
      type === "enquete"
    ) {
      return type;
    }
    return "discussao";
  }, [location.search]);

  const handleClose = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(appUrls.community.feed, { replace: true });
  };

  // Redireciona para login preservando o retorno para /novo-post
  useEffect(() => {
    if (!isLoading && !user) {
      const returnTo = `${location.pathname}${location.search}`;
      navigate(`/login?redirect=${encodeURIComponent(returnTo)}`, {
        replace: true,
      });
    }
  }, [isLoading, user, location.pathname, location.search, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    // Fallback enquanto o efeito acima navega
    return <Navigate to="/login" replace />;
  }

  return (
    <CreatePostModal
      open
      onClose={handleClose}
      defaultType={defaultType}
    />
  );
}
