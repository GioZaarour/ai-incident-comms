"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { ChevronDown } from "lucide-react";
import { SeverityBadge } from "@/components/shared/severity-badge";
import { Badge } from "@/components/ui/badge";
import { Timestamp } from "@/components/shared/timestamp";
import { EventTimeline } from "./event-timeline";
import type { Incident, Event } from "@/lib/supabase/types";
import type { Severity } from "@/lib/shared/constants";
import { LIFECYCLE_COLORS } from "@/lib/shared/constants";
import { cn } from "@/lib/utils";

interface HistoryItemProps {
  incident: Incident & { events: Event[] };
}

export function HistoryItem({ incident }: HistoryItemProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="overflow-hidden">
      <button
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <SeverityBadge severity={incident.severity as Severity} />
        <Badge
          variant="outline"
          className={cn(
            "text-xs capitalize",
            LIFECYCLE_COLORS[
              incident.status as keyof typeof LIFECYCLE_COLORS
            ]
          )}
        >
          {incident.status}
        </Badge>
        <span className="min-w-0 flex-1 truncate text-sm font-medium">
          {incident.title}
        </span>
        <span className="shrink-0 text-xs text-muted-foreground">
          by {incident.created_by}
        </span>
        <Timestamp date={incident.created_at} />
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            expanded && "rotate-180"
          )}
        />
      </button>

      {expanded && (
        <div className="border-t px-4 py-4">
          {incident.events.length > 0 ? (
            <EventTimeline events={incident.events} />
          ) : (
            <p className="text-sm text-muted-foreground">No events recorded</p>
          )}
        </div>
      )}
    </Card>
  );
}
