import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CreatePostModal } from "@/core/community/components/composer/CreatePostModal";
import { useAppUrls } from "@/core/routing/hooks";

export default function NovoPostPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const appUrls = useAppUrls();

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

  return (
    <CreatePostModal
      open
      onClose={handleClose}
      defaultType={defaultType}
    />
  );
}
