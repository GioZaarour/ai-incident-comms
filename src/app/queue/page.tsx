"use client";

import { useCallback, useEffect, useState } from "react";
import { QueueFilters } from "@/components/queue/queue-filters";
import { QueueList } from "@/components/queue/queue-list";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import type { QueueItem } from "@/lib/supabase/types";

export default function QueuePage() {
  const [filter, setFilter] = useState("");
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const url = filter ? `/api/queue?status=${filter}` : "/api/queue";
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) {
        // Sort: sev1 first, then by created_at desc
        data.sort((a: QueueItem, b: QueueItem) => {
          const sevOrder: Record<string, number> = {
            sev1: 0,
            sev2: 1,
            sev3: 2,
          };
          const sevDiff =
            (sevOrder[a.incident.severity] ?? 3) -
            (sevOrder[b.incident.severity] ?? 3);
          if (sevDiff !== 0) return sevDiff;
          return (
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
          );
        });
        setItems(data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Approval Queue</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review and approve incident communications before publishing.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchItems}>
          <RefreshCw className="mr-1 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <QueueFilters active={filter} onChange={setFilter} />

      <QueueList items={items} loading={loading} onRefresh={fetchItems} />
    </div>
  );
}
