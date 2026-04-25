import { useNavigate } from "react-router-dom";
import { SettingsTab } from "@/core/business/components/SettingsTab";
import { useBusinessDashboardContext } from "@/modules/business/dashboard/businessDashboardContext";

export default function BusinessSettingsPage() {
  const navigate = useNavigate();
  const { businessId } = useBusinessDashboardContext();

  return (
    <SettingsTab
      businessId={businessId}
      onEditBusiness={() => navigate(`/edit-business/${businessId}`)}
    />
  );
}

