import { Suspense, lazy } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Shield } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { Card } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { HowItWorksSteps } from "./HowItWorksSteps";

const EmergencyButton = lazy(() =>
  import("@/modules/mobility/components/EmergencyButton").then((m) => ({
    default: m.EmergencyButton,
  })),
);
const SecurityChecklist = lazy(() =>
  import("@/modules/mobility/components/EmergencyButton").then((m) => ({
    default: m.SecurityChecklist,
  })),
);

const LoadingSkeleton = () => (
  <div className="space-y-3">
    {[1, 2, 3].map((i) => (
      <Skeleton key={i} className="h-24 w-full bg-secondary/50" />
    ))}
  </div>
);

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

export const MobilidadeTabs = () => {
  return (
    <motion.section variants={itemVariants}>
      <Tabs defaultValue="comofunciona" className="w-full">
        <TabsList className="w-full bg-card border border-border rounded-xl h-11 p-1 mb-3 gap-1">
          <TabsTrigger
            value="comofunciona"
            className="flex-1 rounded-lg data-[state=active]:bg-primary/15 data-[state=active]:text-primary text-muted-foreground text-[0.65rem] md:text-xs font-semibold h-9"
          >
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
            <span className="hidden sm:inline">Como Funciona</span>
            <span className="sm:hidden">Info</span>
          </TabsTrigger>
          <TabsTrigger
            value="seguranca"
            className="flex-1 rounded-lg data-[state=active]:bg-success/15 data-[state=active]:text-success text-muted-foreground text-[0.65rem] md:text-xs font-semibold h-9"
          >
            <Shield className="h-3.5 w-3.5 mr-1.5" />
            <span className="hidden sm:inline">Segurança</span>
            <span className="sm:hidden">SOS</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="comofunciona" className="mt-0">
          <HowItWorksSteps />
        </TabsContent>

        <TabsContent value="seguranca" className="mt-0 space-y-3">
          <Suspense fallback={<LoadingSkeleton />}>
            <EmergencyButton variant="full" />
            <Card className="bg-card border-border p-4">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-4 w-4 text-success" />
                <h3 className="text-sm font-bold text-foreground">
                  Recursos de Segurança
                </h3>
              </div>
              <SecurityChecklist isVerified={true} />
            </Card>
          </Suspense>
        </TabsContent>
      </Tabs>
    </motion.section>
  );
};
