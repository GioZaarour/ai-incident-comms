"use client";

import { QueueItem } from "./queue-item";
import { Skeleton } from "@/components/ui/skeleton";
import type { QueueItem as QueueItemType } from "@/lib/supabase/types";

interface QueueListProps {
  items: QueueItemType[];
  loading: boolean;
  onRefresh: () => void;
}

export function QueueList({ items, loading, onRefresh }: QueueListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        No items in queue
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <QueueItem key={item.id} item={item} onRefresh={onRefresh} />
      ))}
    </div>
  );
}
