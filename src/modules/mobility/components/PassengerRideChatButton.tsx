import React, { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { MessageCircle } from "lucide-react";
import { RideChatDialog } from "./RideChatDialog";
import { useSessionContext } from "@/core/session";
import type { RideRequest } from "@/modules/mobility/types";

interface PassengerRideChatButtonProps {
  ride: RideRequest;
  className?: string;
}

export function PassengerRideChatButton({
  ride,
  className,
}: PassengerRideChatButtonProps) {
  const { activeProfile } = useSessionContext();
  const [chatOpen, setChatOpen] = useState(false);

  if (!activeProfile || !ride.driver) return null;

  return (
    <>
      <Button size="sm" onClick={() => setChatOpen(true)} className={className}>
        <MessageCircle className="h-3.5 w-3.5 mr-1.5" /> Chat
      </Button>

      <RideChatDialog
        open={chatOpen}
        onOpenChange={setChatOpen}
        rideId={ride.id}
        userId={activeProfile.id}
        otherUserName={ride.driver.name || "Motorista"}
        isDriver={false}
      />
    </>
  );
}
