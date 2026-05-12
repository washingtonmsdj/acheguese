/* eslint-disable react-hooks/exhaustive-deps */
import React from "react";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Shield,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/components/ui/dialog";
import { useToast } from "@/shared/hooks/use-toast";
import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/utils/cn";
import { USER_ROLE, ALERT_STATUS, RIDE_STATUS } from "@/shared/types/constants";
import { useAuth } from "@/core/auth/hooks/useAuth";
import { logger } from "@/shared/utils/logger";
import { adminCrudService } from "@/core/admin/services/AdminCrudService";

/**
 * @deprecated
 * AdminCrudPage is deprecated. Use domain-specific admin pages instead:
 * - AdminClassificados for classifieds (uses AdminClassifiedsService)
 * - AdminEventos for events (uses AdminEventsService)
 * - AdminCupons for coupons (uses AdminCouponsService)
 * - AdminMensagens for messaging (uses AdminMessagingService)
 * 
 * This generic CRUD page violates SSOT principles by using AdminCrudService.
 * Migration to domain-specific pages is complete.
 */

export interface FieldConfig {
  key: string;
  label: string;
  type?: "text" | "number" | "boolean" | "textarea" | "select";
  options?: string[];
  required?: boolean;
  hideInTable?: boolean;
  placeholder?: string;
}

export interface QuickAction {
  key: string;
  label: string;
  icon: LucideIcon;
  activeColor?: string;
  inactiveColor?: string;
  getValue: (item: Record<string, unknown>) => boolean;
  getNextValue?: (item: Record<string, unknown>) => unknown;
}

export interface FilterConfig {
  key: string;
  label: string;
  options?: string[];
}

interface AdminCrudPageProps {
  title: string;
  description?: string;
  table: string;
  fields: FieldConfig[];
  nameField: string;
  pageSize?: number;
  quickActions?: QuickAction[];
  filters?: FilterConfig[];
  disableCreate?: boolean; // Desabilita criação de novos registros
}

export default function AdminCrudPage({
  title,
  description,
  table,
  fields,
  nameField,
  pageSize = 15,
  quickActions,
  filters,
  disableCreate = false,
}: AdminCrudPageProps) {
  const getItemId = (item: Record<string, unknown>): string =>
    typeof item.id === "string" ? item.id : "";

  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>(
    {},
  );
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminCrudService.list(table);
      setItems(data || []);
    } catch (error: unknown) {
      logger.error("Error loading data:", error);
      const message =
        error instanceof Error ? error.message : "Falha ao carregar registros.";
      toast({
        title: "Erro ao carregar dados",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [table]);

  const tableFields = fields.filter((f) => !f.hideInTable);
  const visibleFields = tableFields.slice(0, 5);

  // Build filter options from date if not provided
  const filterOptions = useMemo(() => {
    if (!filters) return {};
    const opts: Record<string, string[]> = {};
    filters.forEach((f) => {
      if (f.options) {
        opts[f.key] = f.options;
      } else {
        const unique = [
          ...new Set(items.map((i) => String(i[f.key] ?? "")).filter(Boolean)),
        ].sort();
        opts[f.key] = unique;
      }
    });
    return opts;
  }, [filters, items]);

  const hasActiveFilters = Object.values(activeFilters).some((v) => v !== "");

  const filtered = useMemo(() => {
    let result = items;
    // Apply filters
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value) {
        result = result.filter(
          (item) =>
            String(
              Object.entries(item as Record<string, unknown>).find(
                ([entryKey]) => entryKey === key,
              )?.[1] ?? "",
            ).toLowerCase() === value.toLowerCase(),
        );
      }
    });
    // Apply search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((item) =>
        fields.some((f) =>
          String(item[f.key] ?? "")
            .toLowerCase()
            .includes(q),
        ),
      );
    }
    return result;
  }, [items, searchQuery, fields, activeFilters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);

  useEffect(() => {
    setPage(0);
  }, [searchQuery, activeFilters]);

  const openNew = () => {
    setEditing(null);
    const empty: Record<string, unknown> = {};
    fields.forEach((f) => {
      empty[f.key] =
        f.type === "boolean" ? false : f.type === "number" ? 0 : "";
    });
    setForm(empty);
    setDialogOpen(true);
  };

  const openEdit = (item: Record<string, unknown>) => {
    setEditing(item);
    const filled: Record<string, unknown> = {};
    fields.forEach((f) => {
      filled[f.key] = item[f.key] ?? (f.type === "boolean" ? false : "");
    });
    setForm(filled);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing) {
        await adminCrudService.update(table, getItemId(editing), form);
        toast({ title: "Atualizado com sucesso" });
      } else {
        await adminCrudService.create(table, form);
        toast({ title: "Criado com sucesso" });
      }
      setDialogOpen(false);
      await load();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Erro";
      toast({ title: "Erro", description: message, variant: "destructive" });
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir?")) return;
    try {
      await adminCrudService.delete(table, id);
      toast({ title: "Excluído com sucesso" });
      await load();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Erro";
      toast({ title: "Erro", description: message, variant: "destructive" });
    }
  };

  const handleQuickToggle = async (item: Record<string, unknown>, action: QuickAction) => {
    const itemId = getItemId(item);
    setTogglingId(`${itemId}-${action.key}`);
    try {
      // Use custom getNextValue if provided, otherwise toggle boolean
      const newValue = action.getNextValue
        ? action.getNextValue(item)
        : !action.getValue(item);

      await adminCrudService.update(table, itemId, { [action.key]: newValue });
      setItems((prev) =>
        prev.map((i) =>
          getItemId(i) === itemId ? { ...i, [action.key]: newValue } : i,
        ),
      );
      toast({
        title: `${action.label}: ${action.getNextValue ? String(newValue) : newValue ? "Ativado" : "Desativado"}`,
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Erro";
      toast({ title: "Erro", description: message, variant: "destructive" });
    }
    setTogglingId(null);
  };

  const renderCellValue = (item: Record<string, unknown>, f: FieldConfig) => {
    const val = item[f.key];
    if (f.type === "boolean") {
      return val ? (
        <Badge
          variant="secondary"
          className="bg-emerald-500/10 text-emerald-600 text-[10px]"
        >
          Sim
        </Badge>
      ) : (
        <Badge variant="secondary" className="text-[10px]">
          Não
        </Badge>
      );
    }
    if (f.key === "category" || f.key === "status" || f.key === "tipo") {
      return (
        <Badge variant="outline" className="text-[10px] font-normal">
          {String(val ?? "-")}
        </Badge>
      );
    }
    if (f.type === "number")
      return <span className="font-mono text-xs">{val ?? 0}</span>;
    return (
      <span className="truncate block max-w-[180px]">{String(val ?? "-")}</span>
    );
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-bold font-display">{title}</h1>
          <p className="text-sm text-muted-foreground">
            {description || `${filtered.length} de ${items.length} registros`}
          </p>
        </div>
        {!disableCreate && (
          <Button onClick={openNew} size="sm" className="shrink-0">
            <Plus className="h-4 w-4 mr-1" /> Novo
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Buscar em ${title.toLowerCase()}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        {filters &&
          filters.map((f) => (
            <select
              key={f.key}
              value={activeFilters[f.key] ?? ""}
              onChange={(e) =>
                setActiveFilters((prev) => ({
                  ...prev,
                  [f.key]: e.target.value,
                }))
              }
              className="h-9 rounded-md border bg-background px-3 text-sm text-foreground min-w-[140px]"
            >
              <option value="">{f.label}: Todos</option>
              {(filterOptions[f.key] ?? []).map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          ))}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 text-xs gap-1"
            onClick={() => setActiveFilters({})}
          >
            <X className="h-3.5 w-3.5" /> Limpar
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-muted-foreground">
            {searchQuery
              ? "Nenhum resultado encontrado."
              : "Nenhum registro encontrado."}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-card rounded-xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    {visibleFields.map((f) => (
                      <th
                        key={f.key}
                        className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider"
                      >
                        {f.label}
                      </th>
                    ))}
                    {quickActions && quickActions.length > 0 && (
                      <th className="text-center px-2 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
                        Rápidas
                      </th>
                    )}
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider w-24">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((item) => (
                    <tr
                      key={getItemId(item)}
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      {visibleFields.map((f) => (
                        <td key={f.key} className="px-4 py-3 text-sm">
                          {renderCellValue(item, f)}
                        </td>
                      ))}
                      {quickActions && quickActions.length > 0 && (
                        <td className="px-2 py-3 text-center">
                          <div className="flex items-center justify-center gap-0.5">
                            {quickActions.map((action) => {
                              const isActive = action.getValue(item);
                              const isToggling =
                                togglingId === `${getItemId(item)}-${action.key}`;
                              const Icon = action.icon;
                              return (
                                <Button
                                  key={action.key}
                                  variant="ghost"
                                  size="icon"
                                  className={cn(
                                    "h-7 w-7 transition-colors",
                                    isActive
                                      ? action.activeColor ||
                                          "text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20"
                                      : action.inactiveColor ||
                                          "text-muted-foreground hover:text-foreground",
                                  )}
                                  title={`${action.label}: ${isActive ? "Ativo" : "Inactive"}`}
                                  onClick={() =>
                                    handleQuickToggle(item, action)
                                  }
                                  disabled={isToggling}
                                >
                                  {isToggling ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Icon className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                              );
                            })}
                          </div>
                        </td>
                      )}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => openEdit(item)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(getItemId(item))}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm">
              <span className="text-muted-foreground text-xs">
                Página {page + 1} de {totalPages} · {filtered.length} registros
              </span>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= totalPages - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? `Editar` : `Novo`} {title.replace(/s$/, "")}
            </DialogTitle>
          </DialogHeader>
          <DialogDescription className="sr-only">
            Gerenciar registros do sistema
          </DialogDescription>
          <div className="space-y-3 mt-2">
            {fields.map((f) => (
              <div key={f.key}>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  {f.label}{" "}
                  {f.required && <span className="text-destructive">*</span>}
                </label>
                {f.type === "boolean" ? (
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({ ...prev, [f.key]: !prev[f.key] }))
                    }
                    className={cn(
                      "px-3 py-1.5 rounded-md text-xs font-medium border transition-colors",
                      form[f.key]
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {form[f.key] ? "Sim" : "Não"}
                  </button>
                ) : f.type === "select" && f.options ? (
                  <select
                    value={form[f.key] ?? ""}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, [f.key]: e.target.value }))
                    }
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Selecione...</option>
                    {f.options.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                ) : f.type === "textarea" ? (
                  <textarea
                    value={form[f.key] ?? ""}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, [f.key]: e.target.value }))
                    }
                    placeholder={f.placeholder}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[80px] resize-y"
                  />
                ) : (
                  <Input
                    type={f.type === "number" ? "number" : "text"}
                    value={form[f.key] ?? ""}
                    placeholder={f.placeholder}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        [f.key]:
                          f.type === "number"
                            ? Number(e.target.value)
                            : e.target.value,
                      }))
                    }
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {editing ? "Salvar" : "Criar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

