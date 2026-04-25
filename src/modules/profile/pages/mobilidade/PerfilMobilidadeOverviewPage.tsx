import { useNavigate } from "react-router-dom";
import { Bike, Car } from "lucide-react";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { useDriverProfileIdentity } from "@/modules/mobility/hooks/useDriverProfileIdentity";
import { getMobilityServiceStatus } from "@/modules/profile/utils/mobilityServiceStatus";
import { getProfileMobilityServicePath } from "@/modules/profile/utils/profileMobilityNavigation";

export default function PerfilMobilidadeOverviewPage() {
  const navigate = useNavigate();
  const { driverData, driverProfileId } = useDriverProfileIdentity({ queryScope: "perfil-mobilidade-overview" });

  const motoristaStatus = getMobilityServiceStatus({ driverProfileId, driverData, service: "motorista" });
  const motoboyStatus = getMobilityServiceStatus({ driverProfileId, driverData, service: "motoboy" });

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Car className="h-4 w-4 text-primary" />
            Motorista
          </CardTitle>
          <CardDescription>Servico de corridas e transporte de passageiros.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Badge variant="outline">Status: {motoristaStatus}</Badge>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={() => navigate(getProfileMobilityServicePath("motorista", "home"))}>Abrir area</Button>
            <Button variant="outline" className="flex-1" onClick={() => navigate(getProfileMobilityServicePath("motorista", "cadastro"))}>Cadastro</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bike className="h-4 w-4 text-primary" />
            Motoboy
          </CardTitle>
          <CardDescription>Servico de entregas e transporte de pedidos/produtos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Badge variant="outline">Status: {motoboyStatus}</Badge>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={() => navigate(getProfileMobilityServicePath("motoboy", "home"))}>Abrir area</Button>
            <Button variant="outline" className="flex-1" onClick={() => navigate(getProfileMobilityServicePath("motoboy", "cadastro"))}>Cadastro</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
