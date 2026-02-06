"use client";

import { formatDistanceToNow, format } from "date-fns";

export function Timestamp({ date }: { date: string }) {
  const d = new Date(date);
  const relative = formatDistanceToNow(d, { addSuffix: true });
  const absolute = format(d, "yyyy-MM-dd HH:mm:ss z");

  return (
    <time
      dateTime={date}
      title={absolute}
      className="font-mono text-xs text-muted-foreground"
    >
      {relative}
    </time>
  );
}
