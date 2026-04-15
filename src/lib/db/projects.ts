import { supabase } from "@/integrations/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { VirtualNode } from "@/lib/vfs/types";

// NOTE: These types represent tables that will be created in the database.
// Until migrations are run, we use type-cast Supabase calls.

export type Project = {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  game_type?: string;
  thumbnail_url?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
};

export type ProjectFile = {
  id: string;
  project_id: string;
  user_id: string;
  name: string;
  type: "file" | "folder";
  path: string;
  parent_id?: string;
  content?: string;
  language?: string;
  created_at: string;
  updated_at: string;
};

// Helper to bypass strict typing for tables not yet in generated types.
const db = supabase as unknown as SupabaseClient;

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  const id = data.user?.id;
  if (!id) throw new Error("Usuário não autenticado");
  return id;
}

// Projects CRUD
export async function createProject(data: {
  name: string;
  description?: string;
  game_type?: string;
}): Promise<{ data: Project | null; error: unknown }> {
  const userId = await requireUserId().catch((e) => ({ error: e }));
  if (typeof userId !== "string") return { data: null, error: userId.error };

  const { data: project, error } = await db
    .from("projects")
    .insert([{ ...data, user_id: userId }])
    .select()
    .single();

  return { data: project, error };
}

export async function getProjects(): Promise<{ data: Project[] | null; error: unknown }> {
  const { data, error } = await db
    .from("projects")
    .select("*")
    .order("updated_at", { ascending: false });

  return { data, error };
}

export async function getProject(id: string): Promise<{ data: Project | null; error: unknown }> {
  const { data, error } = await db
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  return { data, error };
}

export async function updateProject(
  id: string,
  updates: Partial<Project>
): Promise<{ data: Project | null; error: unknown }> {
  const { data, error } = await db
    .from("projects")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  return { data, error };
}

export async function deleteProject(id: string): Promise<{ error: unknown }> {
  const { error } = await db.from("projects").delete().eq("id", id);
  return { error };
}

// Project Files CRUD
export async function saveProjectFiles(
  projectId: string,
  nodes: VirtualNode[]
): Promise<{ error: unknown }> {
  const userId = await requireUserId().catch((e) => ({ error: e }));
  if (typeof userId !== "string") return { error: userId.error };

  await db.from("project_files").delete().eq("project_id", projectId);

  const files = nodes.map((node) => ({
    project_id: projectId,
    user_id: userId,
    name: node.name,
    type: node.type,
    path: node.path,
    parent_id: node.parentId,
    content: node.type === "file" ? node.content : null,
    language: node.type === "file" ? node.language : null,
  }));

  const { error } = await db.from("project_files").insert(files);
  return { error };
}

export async function getProjectFiles(
  projectId: string
): Promise<{ data: ProjectFile[] | null; error: unknown }> {
  const { data, error } = await db
    .from("project_files")
    .select("id, project_id, user_id, name, type, path, parent_id, content, language, created_at, updated_at")
    .eq("project_id", projectId)
    .order("path");

  const mapped = (data ?? []).map((r) => ({
    ...r,
    type: (r.type === "folder" ? "folder" : "file") as "file" | "folder",
  }));

  return { data: mapped, error };
}

// Game Specs
export async function saveGameSpec(
  projectId: string,
  specData: unknown
): Promise<{ error: unknown }> {
  const userId = await requireUserId().catch((e) => ({ error: e }));
  if (typeof userId !== "string") return { error: userId.error };

  const { error } = await db.from("game_specs").insert([
    { project_id: projectId, user_id: userId, spec_data: specData },
  ]);

  return { error };
}

export async function getLatestGameSpec(
  projectId: string
): Promise<{ data: unknown | null; error: unknown }> {
  const { data, error } = await db
    .from("game_specs")
    .select("spec_data")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return { data: data?.spec_data ?? null, error };
}

// Chat Messages
export async function saveChatMessage(
  projectId: string,
  role: "user" | "assistant",
  content: string
): Promise<{ error: unknown }> {
  const userId = await requireUserId().catch((e) => ({ error: e }));
  if (typeof userId !== "string") return { error: userId.error };

  const { error } = await db.from("chat_messages").insert([
    { project_id: projectId, user_id: userId, role, content },
  ]);

  return { error };
}

export async function getChatHistory(
  projectId: string
): Promise<{ data: unknown[] | null; error: unknown }> {
  const { data, error } = await db
    .from("chat_messages")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at");

  return { data, error };
}

// Assets
export async function uploadAsset(
  projectId: string,
  file: File
): Promise<{ data: { url: string } | null; error: unknown }> {
  const userId = await requireUserId().catch((e) => ({ error: e }));
  if (typeof userId !== "string") return { data: null, error: userId.error };

  const fileName = `${userId}/${projectId}/${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from("project-assets")
    .upload(fileName, file);

  if (uploadError) return { data: null, error: uploadError };

  const { data: urlData } = supabase.storage
    .from("project-assets")
    .getPublicUrl(fileName);

  const { error: dbError } = await db.from("project_assets").insert([
    {
      project_id: projectId,
      user_id: userId,
      name: file.name,
      type: file.type.startsWith("image/") ? "image" : "other",
      url: urlData.publicUrl,
      size_bytes: file.size,
    },
  ]);

  if (dbError) return { data: null, error: dbError };

  return { data: { url: urlData.publicUrl }, error: null };
}

export async function getProjectAssets(
  projectId: string
): Promise<{ data: unknown[] | null; error: unknown }> {
  const { data, error } = await db
    .from("project_assets")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  return { data, error };
}
