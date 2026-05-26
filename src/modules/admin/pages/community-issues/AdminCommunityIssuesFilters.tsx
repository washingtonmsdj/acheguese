import { Search } from "lucide-react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  ISSUE_CATEGORY_LABELS,
  ISSUE_PRIORITY_LABELS,
  ISSUE_STATUS_LABELS,
  type IssueCategory,
  type IssuePriority,
  type IssueStatus,
} from "@/core/community/issues";

interface AdminCommunityIssuesFiltersProps {
  search: string;
  statusFilter: IssueStatus | "";
  categoryFilter: IssueCategory | "";
  priorityFilter: IssuePriority | "";
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: IssueStatus | "") => void;
  onCategoryFilterChange: (value: IssueCategory | "") => void;
  onPriorityFilterChange: (value: IssuePriority | "") => void;
}

export function AdminCommunityIssuesFilters({
  search,
  statusFilter,
  categoryFilter,
  priorityFilter,
  onSearchChange,
  onStatusFilterChange,
  onCategoryFilterChange,
  onPriorityFilterChange,
}: AdminCommunityIssuesFiltersProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por titulo, descricao ou bairro..."
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Select
            value={statusFilter || "all"}
            onValueChange={(value) =>
              onStatusFilterChange(value === "all" ? "" : (value as IssueStatus))
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(ISSUE_STATUS_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={categoryFilter || "all"}
            onValueChange={(value) =>
              onCategoryFilterChange(value === "all" ? "" : (value as IssueCategory))
            }
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {Object.entries(ISSUE_CATEGORY_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={priorityFilter || "all"}
            onValueChange={(value) =>
              onPriorityFilterChange(value === "all" ? "" : (value as IssuePriority))
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {Object.entries(ISSUE_PRIORITY_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
