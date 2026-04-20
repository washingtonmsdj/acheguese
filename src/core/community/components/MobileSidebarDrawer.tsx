import React from "react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/components/ui/sheet";
import { Button } from "@/shared/components/ui/button";
import { Menu } from "lucide-react";
import { CommunityRightSidebar } from "./CommunityRightSidebar";
/**
 * Drawer mobile para sidebars da comunidade
 *
 * Funcionalidades:
 * - Botão flutuante no canto inferior direito
 * - Tabs para alternar entre Personalização e Contexto Local
 * - Touch target mínimo de 44px
 */

interface MobileSidebarDrawerProps {
  onRadiusChange?: (radius: number) => void;
}

export function MobileSidebarDrawer({
  onRadiusChange,
}: MobileSidebarDrawerProps) {
  return (
    <div className="lg:hidden fixed bottom-4 right-4 z-50">
      <Sheet>
        <SheetTrigger asChild>
          <Button
            size="lg"
            className="h-14 w-14 rounded-full shadow-lg min-h-[44px] min-w-[44px]"
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">Abrir menu da comunidade</span>
          </Button>
        </SheetTrigger>
        <SheetContent
          side="right"
          className="w-full sm:w-[400px] overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle>Menu da Comunidade</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
              <CommunityRightSidebar />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
