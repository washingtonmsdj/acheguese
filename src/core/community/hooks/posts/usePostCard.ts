import { useState, useMemo, useCallback } from "react";
import { PostType, POST_TYPE_CONFIG } from "@/shared/constants/postTypeConfig";

interface UsePostCardProps {
  postId: string;
  postType: PostType;
  tags?: string[];
  content?: string;
  description?: string;
  images?: string[];
  imageUrl?: string;
  location?: string | { name: string; type?: string };
  authorName?: string;
  createdAt: string;
  upvotes?: number;
}

export function usePostCard({
  postType,
  tags,
  content,
  description,
  images,
  imageUrl,
  location,
  authorName,
  createdAt,
  upvotes = 0,
}: UsePostCardProps) {
  const [upvotesCount, setUpvotesCount] = useState(upvotes);

  const effectiveType = useMemo((): PostType => {
    if (postType !== "discussao" || !tags) return postType;
    const newTypeTags: PostType[] = ["achados", "favor", "evento", "desapego"];
    const foundNewType = tags.find((tag) => newTypeTags.includes(tag as PostType));
    return (foundNewType as PostType) || postType;
  }, [postType, tags]);

  const typeConfig = useMemo(
    () =>
      Object.entries(POST_TYPE_CONFIG).find(([key]) => key === effectiveType)?.[1] ??
      POST_TYPE_CONFIG["discussao"],
    [effectiveType],
  );

  const postContent = useMemo(
    () => content || description || "",
    [content, description],
  );

  const postImage = useMemo(() => {
    if (images && images.length > 0) return images[0];
    return imageUrl;
  }, [images, imageUrl]);

  // ✅ SSOT: usa location.name do JOIN — sem fallback em campos legados
  const formattedLocation = useMemo(() => {
    if (location && typeof location === 'object' && 'name' in location) {
      return location.name;
    }
    if (location && typeof location === 'string') {
      return location;
    }
    return "Localização não informada";
  }, [location]);

  const authorInitials = useMemo(() => {
    if (!authorName) return "U";
    return authorName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, [authorName]);

  const handleUpvote = useCallback(() => {
    setUpvotesCount((prev) => prev + 1);
  }, []);

  return {
    effectiveType,
    typeConfig,
    postContent,
    postImage,
    formattedLocation,
    authorInitials,
    upvotesCount,
    handleUpvote,
  };
}
