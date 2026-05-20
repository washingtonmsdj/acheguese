import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Separator } from "@/shared/components/ui/separator";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Wrench,
  FileCode2,
  Lock,
} from "lucide-react";
import { useSSOTMonitoring } from "@/shared/hooks/common/useSSOTMonitoring";
import {
  USER_ROLE,
  RIDE_STATUS,
  PAYMENT_METHOD,
  DRIVER_STATUS,
  VERIFICATION_STATUS,
  ALERT_STATUS,
  POST_STATUS,
  PAYMENT_STATUS,
  REPORT_STATUS,
  SUBSCRIPTION_PLAN,
} from "@/shared/types/constants";
const SSOT_CONSTANTS = [
  {
    name: "USER_ROLE",
    values: Object.values(USER_ROLE),
    source: "global.constants.ts",
  },
  {
    name: "RIDE_STATUS",
    values: Object.values(RIDE_STATUS),
    source: "mobility.constants.ts",
  },
  {
    name: "PAYMENT_METHOD",
    values: Object.values(PAYMENT_METHOD),
    source: "global.constants.ts",
  },
  {
    name: "DRIVER_STATUS",
    values: Object.values(DRIVER_STATUS),
    source: "global.constants.ts",
  },
  {
    name: "VERIFICATION_STATUS",
    values: Object.values(VERIFICATION_STATUS),
    source: "global.constants.ts",
  },
  {
    name: "ALERT_STATUS",
    values: Object.values(ALERT_STATUS),
    source: "global.constants.ts",
  },
  {
    name: "POST_STATUS",
    values: Object.values(POST_STATUS),
    source: "global.constants.ts",
  },
  {
    name: "PAYMENT_STATUS",
    values: Object.values(PAYMENT_STATUS),
    source: "global.constants.ts",
  },
  {
    name: "REPORT_STATUS",
    values: Object.values(REPORT_STATUS),
    source: "mobility.constants.ts",
  },
  {
    name: "SUBSCRIPTION_PLAN",
    values: Object.values(SUBSCRIPTION_PLAN),
    source: "companies.generated.ts",
  },
];

const ESLINT_PLUGINS = [
  {
    name: "profile-enforcement",
    tables: ["profiles"],
    service: "ProfileService",
  },
  {
    name: "comments-ssot",
    tables: ["comments", "comment_likes"],
    service: "CommentService",
  },
  { name: "admin-ssot", tables: ["user_roles"], service: "AdminService" },
  {
    name: "favorites-ssot",
    tables: ["favorites", "business_favorites", "post_favorites"],
    service: "favorites.queries/mutations",
  },
  {
    name: "location-ssot",
    tables: ["location_history"],
    service: "LocationService",
  },
  {
    name: "posts-polls-ssot",
    tables: ["posts", "polls", "poll_options", "poll_votes"],
    service: "PostService",
  },
  {
    name: "classified-ssot",
    tables: ["classifieds", "classified_views", "classified_favorites"],
    service: "ClassifiedService",
  },
  {
    name: "messaging-ssot",
    tables: ["messages", "conversations", "conversation_participants"],
    service: "MessagingService",
  },
  {
    name: "reviews-ssot",
    tables: [
      "reviews",
      "business_reviews",
      "professional_reviews",
      "driver_reviews",
    ],
    service: "ReviewsService",
  },
  {
    name: "community-ssot",
    tables: ["community_profiles", "groups", "group_members", "group_posts"],
    service: "CommunityService",
  },
  {
    name: "moderation-ssot",
    tables: ["reports", "moderation_actions", "content_flags", "banned_users"],
    service: "ModerationService",
  },
  {
    name: "mobility-ssot",
    tables: ["ride_requests", "ride_reports"],
    service: "MobilityService",
  },
];

export default function AdminSSOT() {
  const { data: monitoringData } = useSSOTMonitoring();
  const [activeTab, setActiveTab] = useState<
    "overview" | "constants" | "enforcement"
  >("overview");

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            SSOT Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitoramento da arquitetura Single Source of Truth
          </p>
        </div>
        <Badge
          variant={
            monitoringData.complianceRate >= 95 ? "default" : "destructive"
          }
          className="text-sm px-3 py-1"
        >
          {monitoringData.complianceRate}% Compliance
        </Badge>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-2">
        {(["overview", "constants", "enforcement"] as const).map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab(tab)}
          >
            {tab === "overview" && "Visão Geral"}
            {tab === "constants" && "Constantes"}
            {tab === "enforcement" && "ESLint Guards"}
          </Button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Constantes SSOT
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{SSOT_CONSTANTS.length}</div>
              <p className="text-xs text-muted-foreground">
                Enums centralizados
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                ESLint Plugins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{ESLINT_PLUGINS.length}</div>
              <p className="text-xs text-muted-foreground">
                Tabelas protegidas
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tabelas Protegidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {ESLINT_PLUGINS.reduce((acc, p) => acc + p.tables.length, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Com acesso controlado via Service
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Constants */}
      {activeTab === "constants" && (
        <ScrollArea className="h-[500px]">
          <div className="space-y-4">
            {SSOT_CONSTANTS.map((constant) => (
              <Card key={constant.name}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-mono">
                      {constant.name}
                    </CardTitle>
                    <Badge variant="outline" className="text-xs">
                      <FileCode2 className="h-3 w-3 mr-1" />
                      {constant.source}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5">
                    {constant.values.map((val) => (
                      <Badge
                        key={val}
                        variant="secondary"
                        className="font-mono text-xs"
                      >
                        {val}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Enforcement */}
      {activeTab === "enforcement" && (
        <ScrollArea className="h-[500px]">
          <div className="space-y-3">
            {ESLINT_PLUGINS.map((plugin) => (
              <Card key={plugin.name}>
                <CardContent className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-primary" />
                      <span className="font-mono text-sm">{plugin.name}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {plugin.service}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {plugin.tables.map((table) => (
                      <Badge
                        key={table}
                        variant="destructive"
                        className="font-mono text-xs"
                      >
                        {table}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
