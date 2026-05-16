export type PostWithImageRow = {
  id: string;
  image_url: string;
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

export function mapPostsWithImagesRows(rows: PostWithImageRow[]): PostWithImageCard[] {
  return rows.map((post) => ({
    id: post.id,
    image_url: post.image_url,
    content: post.content ?? "",
    author_name: post.author_profile?.display_name ?? "Comunidade",
    author_avatar: post.author_profile?.avatar_url ?? null,
    created_at: post.created_at,
  }));
}
