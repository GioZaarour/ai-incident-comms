"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FILTERS = [
  { value: "", label: "All" },
  { value: "processing", label: "Processing" },
  { value: "awaiting_approval", label: "Awaiting Approval" },
  { value: "changes_requested", label: "Changes Requested" },
  { value: "published", label: "Published" },
  { value: "publish_failed", label: "Failed" },
] as const;

interface QueueFiltersProps {
  active: string;
  onChange: (value: string) => void;
}

export function QueueFilters({ active, onChange }: QueueFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {FILTERS.map(({ value, label }) => (
        <Button
          key={value}
          variant="outline"
          size="sm"
          onClick={() => onChange(value)}
          className={cn(
            "text-xs",
            active === value &&
              "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}
