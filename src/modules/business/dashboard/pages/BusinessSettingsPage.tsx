import { useNavigate } from "react-router-dom";
import { SettingsTab } from "@/core/business/components/SettingsTab";
import { businessManagementRoutes } from "@/core/business/utils/businessManagementRoutes";
import { ProfileMembersManagerImproved } from "@/core/profiles/components/ProfileMembersManagerImproved";
import { useBusinessDashboardContext } from "@/modules/business/dashboard/businessDashboardContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Users } from "lucide-react";

export default function BusinessSettingsPage() {
  const navigate = useNavigate();
  const { businessId, business } = useBusinessDashboardContext();

  return (
    <div className="space-y-5">
      <SettingsTab
        businessId={businessId}
        onEditBusiness={() => navigate(businessManagementRoutes.edit(businessId))}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Pessoas e acesso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileMembersManagerImproved
            profileId={business.profile_id}
            profileType="business"
          />
        </CardContent>
      </Card>
    </div>
  );
}
