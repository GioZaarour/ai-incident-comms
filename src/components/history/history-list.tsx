"use client";

import { HistoryItem } from "./history-item";
import { Skeleton } from "@/components/ui/skeleton";
import type { Incident, Event } from "@/lib/supabase/types";

interface HistoryListProps {
  incidents: (Incident & { events: Event[] })[];
  loading: boolean;
}

export function HistoryList({ incidents, loading }: HistoryListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (incidents.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        No incidents yet
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {incidents.map((incident) => (
        <HistoryItem key={incident.id} incident={incident} />
      ))}
    </div>
  );
}
