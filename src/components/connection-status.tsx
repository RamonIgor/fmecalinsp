"use client";

import { useOnlineStatus } from "@/lib/hooks/use-online-status";
import { Wifi, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function ConnectionStatus() {
  const isOnline = useOnlineStatus();

  return (
    <TooltipProvider>
        <Tooltip>
            <TooltipTrigger>
                <Badge variant={isOnline ? "default" : "destructive"} className="flex items-center gap-2">
                    {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                    <span className="hidden sm:inline">{isOnline ? "Online" : "Offline"}</span>
                </Badge>
            </TooltipTrigger>
            <TooltipContent>
                <p>{isOnline ? "Sua conexão está ativa." : "Você está offline. As alterações serão sincronizadas quando você se reconectar."}</p>
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>
  );
}
