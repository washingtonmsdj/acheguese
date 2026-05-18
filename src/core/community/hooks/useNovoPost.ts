export * from "./composer/useCreatePostForm";
export interface PostData {
  texto: string;
  imagePreview?: string | null;
  location?: string | null;
}
