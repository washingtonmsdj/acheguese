import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import {
  FileText,
  MessageSquare,
  User,
  AlertTriangle,
  History,
} from "lucide-react";
import { TabType } from "@/modules/admin/hooks/useModeration";

interface ModerationTabsProps {
  currentTab: TabType;
  postReportsPending: number;
  commentReportsPending: number;
  profileReportsPending: number;
  warningsCount: number;
  onTabChange: (tab: TabType) => void;
}

export function ModerationTabs({
  currentTab,
  postReportsPending,
  commentReportsPending,
  profileReportsPending,
  warningsCount,
  onTabChange,
}: ModerationTabsProps) {
  return (
    <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
      <Button
        variant={currentTab === "posts" ? "default" : "outline"}
        size="sm"
        onClick={() => onTabChange("posts")}
        className="gap-1.5 shrink-0"
      >
        <FileText className="h-3.5 w-3.5" />
        Posts
        {postReportsPending > 0 && (
          <Badge variant="destructive" className="ml-1 text-[10px] h-4 px-1.5">
            {postReportsPending}
          </Badge>
        )}
      </Button>

      <Button
        variant={currentTab === "comments" ? "default" : "outline"}
        size="sm"
        onClick={() => onTabChange("comments")}
        className="gap-1.5 shrink-0"
      >
        <MessageSquare className="h-3.5 w-3.5" />
        Comentários
        {commentReportsPending > 0 && (
          <Badge variant="destructive" className="ml-1 text-[10px] h-4 px-1.5">
            {commentReportsPending}
          </Badge>
        )}
      </Button>

      <Button
        variant={currentTab === "profiles" ? "default" : "outline"}
        size="sm"
        onClick={() => onTabChange("profiles")}
        className="gap-1.5 shrink-0"
      >
        <User className="h-3.5 w-3.5" />
        Perfis
        {profileReportsPending > 0 && (
          <Badge variant="destructive" className="ml-1 text-[10px] h-4 px-1.5">
            {profileReportsPending}
          </Badge>
        )}
      </Button>

      <Button
        variant={currentTab === "warnings" ? "default" : "outline"}
        size="sm"
        onClick={() => onTabChange("warnings")}
        className="gap-1.5 shrink-0"
      >
        <AlertTriangle className="h-3.5 w-3.5" />
        Advertências
        <Badge variant="secondary" className="ml-1 text-[10px] h-4 px-1.5">
          {warningsCount}
        </Badge>
      </Button>

      <Button
        variant={currentTab === "history" ? "default" : "outline"}
        size="sm"
        onClick={() => onTabChange("history")}
        className="gap-1.5 shrink-0"
      >
        <History className="h-3.5 w-3.5" />
        Histórico
      </Button>
    </div>
  );
}
