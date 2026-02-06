"use client";

import { useEffect, useState } from "react";
import { HistoryList } from "@/components/history/history-list";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import type { Incident, Event } from "@/lib/supabase/types";

export default function HistoryPage() {
  const [incidents, setIncidents] = useState<
    (Incident & { events: Event[] })[]
  >([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/history");
      const data = await res.json();
      if (Array.isArray(data)) setIncidents(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Incident History</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Full audit trail of all incidents and events.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchHistory}>
          <RefreshCw className="mr-1 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <HistoryList incidents={incidents} loading={loading} />
    </div>
  );
}
