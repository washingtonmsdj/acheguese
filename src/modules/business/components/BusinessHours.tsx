import React from "react";
import { Clock } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  parseBusinessHours,
  getBusinessStatus,
} from "@/shared/utils/businessHours";
import { cn } from "@/shared/utils/cn";

interface BusinessHoursProps {
  hours: string;
  className?: string;
  compact?: boolean;
}

export const BusinessHours: React.FC<BusinessHoursProps> = ({
  hours,
  className,
  compact = false,
}) => {
  if (!hours) return null;

  const parsedHours = parseBusinessHours(hours);
  const { isOpen, status } = getBusinessStatus(hours);

  if (compact) {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Badge variant={isOpen ? "default" : "secondary"} className="text-xs">
            {status}
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground space-y-1">
          {parsedHours.map((dayHours, index) => (
            <div
              key={index}
              className={cn(
                "flex justify-between items-center py-1",
                dayHours.isToday && "font-medium text-foreground",
              )}
            >
              <span className="min-w-0 flex-1">
                {dayHours.day && (
                  <span className="font-medium">{dayHours.day}:</span>
                )}
              </span>
              <span className="text-right">{dayHours.hours}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Card className={cn("border-2", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-5 w-5 text-primary" aria-hidden="true" />
          Horário de Funcionamento
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge
              variant={isOpen ? "default" : "secondary"}
              className="text-xs"
            >
              {status}
            </Badge>
          </div>

          <div className="space-y-2">
            {parsedHours.map((dayHours, index) => (
              <div
                key={index}
                className={cn(
                  "flex justify-between items-center text-sm py-1 px-2 rounded",
                  dayHours.isToday && "bg-accent font-medium",
                )}
              >
                <span className="text-muted-foreground">
                  {dayHours.day || `Linha ${index + 1}`}
                </span>
                <span
                  className={cn(
                    "text-right",
                    dayHours.isToday
                      ? "text-foreground font-medium"
                      : "text-muted-foreground",
                    !dayHours.isOpen && "text-muted-foreground/60",
                  )}
                >
                  {dayHours.hours}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BusinessHours;
