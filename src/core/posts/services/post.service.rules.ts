import { resolveMediaAssetSource } from "@/core/media";

export type PostWithImageRow = {
  id: string;
  images: unknown;
  content?: string | null;
  created_at: string;
  author_profile?: {
    display_name?: string | null;
    avatar_url?: string | null;
  } | null;
};

export type PostWithImageCard = {
  id: string;
  image_url: string;
  content: string;
  author_name: string;
  author_avatar: string | null;
  created_at: string;
};

export function mapPostsWithImagesRows(
  rows: PostWithImageRow[],
): PostWithImageCard[] {
  return rows.flatMap((post) => {
    const firstReference = Array.isArray(post.images)
      ? post.images.find((value): value is string => typeof value === "string")
      : undefined;
    const imageUrl = resolveMediaAssetSource(firstReference, "post_image");
    if (!imageUrl) return [];

    return [
      {
        id: post.id,
        image_url: imageUrl,
        content: post.content ?? "",
        author_name: post.author_profile?.display_name ?? "Comunidade",
        author_avatar: post.author_profile?.avatar_url ?? null,
        created_at: post.created_at,
      },
    ];
  });
}
