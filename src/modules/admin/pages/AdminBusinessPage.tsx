/* eslint-disable react-hooks/exhaustive-deps */
import { logger } from '@/shared/utils/logger';
import React from "react";
/**
 * 🏆 ADMIN BUSINESS PAGE - SSOT COMPLIANT
 *
 * ✅ Usa exclusivamente BusinessService
 * ✅ Campos mapeados para business_data
 * ✅ Cache invalidation correto
 * ✅ Tipagem completa
 * ✅ Validação centralizada
 *
 * @version 1.0.0 - SSOT Migration
 */
import { useState, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Shield,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/components/ui/dialog";
import { Badge } from "@/shared/components/ui/badge";
import { useToast } from "@/shared/hooks/use-toast";
import { useAdminGuard } from "@/modules/admin/hooks/useAdminGuard";
import { useSessionContext } from "@/core/session";
import { cn } from "@/shared/utils/cn";
import { adminBusinessService } from "@/core/admin"; // ✅ MIGRADO - Usa AdminBusinessService do core
import { BusinessService } from "@/core/business/services/BusinessService";
import type {
  Business,
  CreateBusinessInput,
  UpdateBusinessInput,
} from "@/core/business/types"; // ✅ MIGRADO - Tipos movidos para core
import { ADMIN_BUSINESS_FIELDS } from "@/modules/admin/config/adminBusinessFields";
import { ADMIN_BUSINESS_ACTIONS } from "@/modules/admin/config/adminBusinessActions";
import { ADMIN_BUSINESS_FILTERS } from "@/modules/admin/config/adminBusinessFilters";
interface FieldConfig {
  key: string;
  label: string;
  type?: "text" | "number" | "boolean" | "textarea" | "select";
  options?: string[];
  required?: boolean;
  hideInTable?: boolean;
  placeholder?: string;
}

interface QuickAction {
  key: string;
  label: string;
  icon: any;
  activeColor?: string;
  inactiveColor?: string;
  getValue: (item: Business) => boolean;
  getNextValue?: (item: Business) => any;
}

interface FilterConfig {
  key: string;
  label: string;
  options?: string[];
}

export default function AdminBusinessPage() {
  const { canModerate, isChecking } = useAdminGuard();
  const { activeProfile } = useSessionContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [totalLoaded, setTotalLoaded] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Business | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>(
    {},
  );

  const pageSize = 50; // Aumentado para admin
  const fields = ADMIN_BUSINESS_FIELDS;
  const quickActions = ADMIN_BUSINESS_ACTIONS;
  const filters = ADMIN_BUSINESS_FILTERS;

  // 🎯 LOAD DATA usando BusinessService com PAGINAÇÃO
  const loadBusinesses = async (pageParam = 0, append = false) => {
    if (!append) setLoading(true);

    try {
      const result = await BusinessService.getBusinessesList({
        pageParam,
        pageSize,
        category: activeFilters.category,
        searchQuery: searchQuery.trim() || undefined,
      });

      if (append) {
        setBusinesses((prev) => [...prev, ...result.businesses]);
      } else {
        setBusinesses(result.businesses);
      }

      setHasNextPage(!!result.nextPage);
      setCurrentPage(pageParam);
      setTotalLoaded(
        append
          ? totalLoaded + result.businesses.length
          : result.businesses.length,
      );
    } catch (error) {
      logger.error("Erro ao carregar empresas:", error);
      toast({
        title: "Erro ao carregar empresas",
        description:
          error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load inicial
  useEffect(() => {
    if (!isChecking && canModerate) {
      loadBusinesses(0, false);
    }
  }, [searchQuery, activeFilters, canModerate, isChecking]);

  // 🎯 LOAD MORE para paginação
  const loadMore = () => {
    if (hasNextPage && !loading) {
      loadBusinesses(currentPage + 1, true);
    }
  };

  // 🎯 COMPUTED VALUES
  const tableFields = fields.filter((f) => !f.hideInTable);
  const visibleFields = tableFields.slice(0, 5);

  // Build filter options from data if not provided
  const filterOptions = useMemo(() => {
    if (!filters) return {};
    const opts: Record<string, string[]> = {};
    filters.forEach((f) => {
      if (f.options) {
        opts[f.key] = f.options;
      } else {
        const unique = [
          ...new Set(
            businesses
              .map((b) => String((b as any)[f.key] ?? ""))
              .filter(Boolean),
          ),
        ].sort();
        opts[f.key] = unique;
      }
    });
    return opts;
  }, [filters, businesses]);

  const hasActiveFilters = Object.values(activeFilters).some((v) => v !== "");

  const filtered = useMemo(() => {
    let result = businesses;
    // Apply filters
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value) {
        result = result.filter(
          (business) =>
            String(
              Object.entries(business as Record<string, unknown>).find(
                ([entryKey]) => entryKey === key,
              )?.[1] ?? "",
            ).toLowerCase() ===
            value.toLowerCase(),
        );
      }
    });
    // Apply search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((business) =>
        fields.some((f) =>
          String((business as any)[f.key] ?? "")
            .toLowerCase()
            .includes(q),
        ),
      );
    }
    return result;
  }, [businesses, searchQuery, fields, activeFilters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice(0, pageSize); // Mostrar apenas primeira página localmente

  useEffect(() => {
    // Reset quando filtros mudam
    setCurrentPage(0);
  }, [searchQuery, activeFilters]);

  // 🎯 FORM HANDLERS - SEM MAPPER (BusinessService faz tudo)
  const openNew = () => {
    setEditing(null);
    const empty: Record<string, any> = {};
    fields.forEach((f) => {
      empty[f.key] =
        f.type === "boolean" ? false : f.type === "number" ? 0 : "";
    });
    setForm(empty);
    setDialogOpen(true);
  };

  const openEdit = (business: Business) => {
    setEditing(business);
    const filled: Record<string, any> = {};
    fields.forEach((f) => {
      filled[f.key] =
        (business as any)[f.key] ?? (f.type === "boolean" ? false : "");
    });
    setForm(filled);
    setDialogOpen(true);
  };

  // 🎯 SAVE usando BusinessService (sem mapper frontend)
  const handleSave = async () => {
    setSaving(true);
    try {
      // BusinessService faz sanitização + validação + transformação
      if (editing) {
        // Update
        const updated = await BusinessService.updateBusiness(
          editing.id,
          form as UpdateBusinessInput,
        );

        // 🔄 CACHE INVALIDATION
        queryClient.invalidateQueries({ queryKey: ["businesses"] });
        queryClient.setQueryData(["business", editing.id], updated);

        toast({ title: "Empresa atualizada com sucesso" });
      } else {
        // Create - precisa de userId (usar admin atual)
        const created = await BusinessService.createBusiness(
          form as CreateBusinessInput,
          activeProfile?.id || "",
        );

        // 🔄 CACHE INVALIDATION
        queryClient.invalidateQueries({ queryKey: ["businesses"] });

        toast({ title: "Empresa criada com sucesso" });
      }

      setDialogOpen(false);
      await loadBusinesses(0, false); // Reload data
    } catch (error) {
      logger.error("Erro ao salvar empresa:", error);
      toast({
        title: "Erro ao salvar empresa",
        description:
          error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // 🎯 DELETE usando BusinessService
  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta empresa?")) return;

    try {
      await BusinessService.deleteBusiness(id);

      // 🔄 CACHE INVALIDATION
      queryClient.invalidateQueries({ queryKey: ["businesses"] });
      queryClient.removeQueries({ queryKey: ["business", id] });

      toast({ title: "Empresa excluída com sucesso" });
      await loadBusinesses(0, false); // Reload data
    } catch (error) {
      logger.error("Erro ao excluir empresa:", error);
      toast({
        title: "Erro ao excluir empresa",
        description:
          error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  // 🎯 QUICK TOGGLE usando BusinessService
  const handleQuickToggle = async (business: Business, action: QuickAction) => {
    setTogglingId(`${business.id}-${action.key}`);
    try {
      // Use custom getNextValue if provided, otherwise toggle boolean
      const newValue = action.getNextValue
        ? action.getNextValue(business)
        : !action.getValue(business);

      // Create update input with only the changed field
      const updateInput: UpdateBusinessInput = {
        [action.key]: newValue,
      } as any;

      const updated = await BusinessService.updateBusiness(
        business.id,
        updateInput,
      );

      // Update local state
      setBusinesses((prev) =>
        prev.map((b) => (b.id === business.id ? updated : b)),
      );

      // 🔄 CACHE INVALIDATION
      queryClient.invalidateQueries({ queryKey: ["businesses"] });
      queryClient.setQueryData(["business", business.id], updated);

      toast({
        title: `${action.label}: ${action.getNextValue ? String(newValue) : newValue ? "Ativado" : "Desativado"}`,
      });
    } catch (error) {
      logger.error("Erro ao atualizar empresa:", error);
      toast({
        title: "Erro ao atualizar empresa",
        description:
          error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setTogglingId(null);
    }
  };

  // 🎯 RENDER CELL VALUE
  const renderCellValue = (business: Business, f: FieldConfig) => {
    const val = (business as any)[f.key];
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
          <h1 className="text-2xl font-bold font-display">Empresas</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie todas as empresas cadastradas na plataforma · {totalLoaded}{" "}
            registros carregados
            {hasNextPage && " (mais disponíveis)"}
          </p>
        </div>
        <Button onClick={openNew} size="sm" className="shrink-0">
          <Plus className="h-4 w-4 mr-1" /> Nova Empresa
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar empresas..."
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
              : "Nenhuma empresa encontrada."}
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
                  {paged.map((business) => (
                    <tr
                      key={business.id}
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      {visibleFields.map((f) => (
                        <td key={f.key} className="px-4 py-3 text-sm">
                          {renderCellValue(business, f)}
                        </td>
                      ))}
                      {quickActions && quickActions.length > 0 && (
                        <td className="px-2 py-3 text-center">
                          <div className="flex items-center justify-center gap-0.5">
                            {quickActions.map((action) => {
                              const isActive = action.getValue(business);
                              const isToggling =
                                togglingId === `${business.id}-${action.key}`;
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
                                  title={`${action.label}: ${isActive ? "Ativo" : "Inativo"}`}
                                  onClick={() =>
                                    handleQuickToggle(business, action)
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
                            onClick={() => openEdit(business)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(business.id)}
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
                {totalLoaded} registros carregados
                {hasNextPage && " · Mais disponíveis"}
              </span>
              <div className="flex gap-2">
                {hasNextPage && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadMore}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : null}
                    Carregar Mais
                  </Button>
                )}
              </div>
            </div>
          )}
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar" : "Nova"} Empresa</DialogTitle>
          </DialogHeader>
          <DialogDescription className="sr-only">
            Gerenciar empresas do sistema
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

// Validação de admin - renderizar no final
function AdminBusinessPageWrapper() {
  const { canModerate, isChecking } = useAdminGuard();

  if (!isChecking && !canModerate) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <Shield className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Acesso Negado</h1>
          <p className="text-muted-foreground">
            Apenas administradores podem acessar esta página.
          </p>
        </div>
      </div>
    );
  }

  return <AdminBusinessPage />;
}

