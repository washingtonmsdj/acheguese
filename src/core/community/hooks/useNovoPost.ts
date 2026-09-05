export * from "@/core/community-feed/hooks/useCreatePostForm";
export interface PostData {
  texto: string;
  imagePreview?: string | null;
  location?: string | null;
}
