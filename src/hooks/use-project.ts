import { useState, useEffect, useCallback } from "react";
import { VFS, vfs } from "@/lib/vfs/VirtualFileSystem";
import { bundler } from "@/lib/export/bundler";
import {
  createProject,
  getProject,
  updateProject,
  saveProjectFiles,
  getProjectFiles,
  saveGameSpec,
  getLatestGameSpec,
  type Project,
} from "@/lib/db/projects";
import type { OrdaxSpec } from "@/lib/ordax/types";
import { toast } from "sonner";

export function useProject(projectId?: string) {
  const [project, setProject] = useState<Project | null>(null);
  const [spec, setSpec] = useState<OrdaxSpec | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const resetVfsToDefaults = useCallback(() => {
    const freshVfs = new VFS();
    vfs.import(freshVfs.export());
  }, []);

  const ensureFolderPath = useCallback((path: string) => {
    const parts = path.split("/").filter(Boolean);
    let currentPath = "/";

    for (const part of parts) {
      const nextPath = currentPath === "/" ? `/${part}` : `${currentPath}/${part}`;
      const existing = vfs.getNodeByPath(nextPath);
      if (!existing) {
        vfs.createFolder(part, currentPath);
      }
      currentPath = nextPath;
    }
  }, []);

  const loadFilesIntoVfs = useCallback((files: Array<{
    type: "file" | "folder";
    path: string;
    name: string;
    language?: string | null;
    content?: string | null;
  }>) => {
    const resolveLanguage = (
      path: string,
      language?: string | null
    ): "typescript" | "json" | "css" | "html" => {
      const normalized = (language ?? "").toLowerCase();
      if (normalized === "typescript" || normalized === "json" || normalized === "css" || normalized === "html") {
        return normalized;
      }
      if (path.endsWith(".json")) return "json";
      if (path.endsWith(".css")) return "css";
      if (path.endsWith(".html")) return "html";
      return "typescript";
    };

    const sorted = [...files].sort((a, b) => a.path.length - b.path.length);

    for (const node of sorted) {
      if (!node.path.startsWith("/")) continue;

      if (node.type === "folder") {
        ensureFolderPath(node.path);
        continue;
      }

      const lastSlash = node.path.lastIndexOf("/");
      const parentPath = lastSlash <= 0 ? "/" : node.path.slice(0, lastSlash);
      const fileName = node.name || node.path.slice(lastSlash + 1);
      const content = node.content ?? "";
      const existing = vfs.getNodeByPath(node.path);

      ensureFolderPath(parentPath);

      if (existing?.type === "file") {
        vfs.updateFileContent(existing.id, content);
      } else {
        const language = resolveLanguage(node.path, node.language);
        vfs.createFile(fileName, parentPath, language, content);
      }
    }
  }, [ensureFolderPath]);

  // Load project
  useEffect(() => {
    if (!projectId) return;

    setLoading(true);
    Promise.all([
      getProject(projectId),
      getProjectFiles(projectId),
      getLatestGameSpec(projectId),
    ])
      .then(([projectRes, filesRes, specRes]) => {
        if (projectRes.data) {
          setProject(projectRes.data);
        }

        if (filesRes.data) {
          resetVfsToDefaults();
          loadFilesIntoVfs(filesRes.data);
          console.log("Files loaded into VFS:", filesRes.data.length);
        }

        if (specRes.data) {
          setSpec(specRes.data);
        }
      })
      .catch((error) => {
        console.error("Error loading project:", error);
        toast.error("Erro ao carregar projeto");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [projectId, loadFilesIntoVfs, resetVfsToDefaults]);

  // Create new project
  const create = async (data: {
    name: string;
    description?: string;
    game_type?: string;
  }) => {
    setLoading(true);
    const { data: newProject, error } = await createProject(data);

    if (error) {
      toast.error("Erro ao criar projeto");
      setLoading(false);
      return null;
    }

    setProject(newProject);
    setLoading(false);
    toast.success("Projeto criado!");
    return newProject;
  };

  // Save project
  const save = async (options?: { silent?: boolean }) => {
    // No-op quando o Studio está em modo “sem projeto” (ex: usando presets canônicos).
    // Evita spam de toast durante o auto-save.
    if (!project) return;

    setSaving(true);

    try {
      // Save files
      const files = vfs.getAllFiles();
      await saveProjectFiles(project.id, files);

      // Save spec
      if (spec) {
        await saveGameSpec(project.id, spec);
      }

      // Update project metadata
      await updateProject(project.id, {
        updated_at: new Date().toISOString(),
      });

      if (!options?.silent) {
        toast.success("Projeto salvo!");
      }
    } catch (error) {
      console.error("Error saving project:", error);
      if (!options?.silent) {
        toast.error("Erro ao salvar projeto");
      }
    } finally {
      setSaving(false);
    }
  };

  // Export project
  const exportProject = async () => {
    if (!spec) {
      toast.error("Nenhum jogo para exportar");
      return;
    }

    toast.info("Exportando projeto...");

    bundler.downloadHTML(spec, {
      projectName: project?.name || "my-game",
      includeAssets: true,
      minify: false,
    });

    toast.success("Projeto exportado!");
  };

  // Update spec
  const updateSpec = (newSpec: OrdaxSpec) => {
    setSpec(newSpec);
  };

  return {
    project,
    spec,
    loading,
    saving,
    create,
    save,
    exportProject,
    updateSpec,
  };
}
