import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Bell, Settings, User, Eye, ExternalLink } from "lucide-react";
import type { DashboardChannelView } from "../../types/agentDashboardViewModels";

interface DashboardHeaderProps {
  channels: DashboardChannelView[];
  selectedChannelId: string | null;
  onChannelSelect: (id: string) => void;
  isLoading: boolean;
}

/**
 * DashboardHeader
 * 
 * Header do dashboard com seletor de canal e ações principais.
 */
export function DashboardHeader({ channels, selectedChannelId, onChannelSelect, isLoading }: DashboardHeaderProps) {
  const navigate = useNavigate();
  const selectedChannel = channels.find(c => c.id === selectedChannelId);

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b shadow-sm">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
          
          {/* Left: Title + Channel Selector */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            <div className="hidden md:block flex-shrink-0">
              <h1 className="text-lg lg:text-xl font-bold text-foreground">Dashboard</h1>
              <p className="text-xs text-muted-foreground">Gestão Editorial</p>
            </div>

            {!isLoading && channels.length > 0 && (
              <div className="flex-1 max-w-[200px] sm:max-w-xs">
                <Select value={selectedChannelId ?? undefined} onValueChange={onChannelSelect}>
                  <SelectTrigger className="w-full h-9 sm:h-10 text-xs sm:text-sm">
                    <SelectValue placeholder="Selecione um canal" />
                  </SelectTrigger>
                  <SelectContent>
                    {channels.map((channel) => (
                      <SelectItem key={channel.id} value={channel.id}>
                        <div className="flex items-center gap-2">
                          <span className="truncate">{channel.public_name || channel.name}</span>
                          {channel.verification_status === "verified" && (
                            <Badge variant="secondary" className="text-xs flex-shrink-0">Verificado</Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            {selectedChannel && (
              <Button 
                variant="outline" 
                size="sm"
                className="gap-1.5 sm:gap-2 hidden lg:flex h-9 px-3 text-xs sm:text-sm"
                onClick={() => navigate(`/comunicacao/agente/${selectedChannel.slug}`)}
              >
                <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden xl:inline">Ver Página Pública</span>
                <span className="xl:hidden">Ver Página</span>
                <ExternalLink className="h-3 w-3" />
              </Button>
            )}
            
            <Button variant="ghost" size="icon" className="relative h-9 w-9 sm:h-10 sm:w-10">
              <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive"></span>
            </Button>
            
            <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10 hidden sm:flex">
              <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>

            <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10">
              <User className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>

        </div>
      </div>
    </header>
  );
}
