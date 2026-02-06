"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { ReviewerOutput } from "@/lib/shared/types";

interface ReviewedDraftProps {
  reviewed: ReviewerOutput;
}

export function ReviewedDraft({ reviewed }: ReviewedDraftProps) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-foreground">
        Reviewed Draft (Final Payload)
      </h4>
      <Card className="bg-background/50">
        <CardContent className="space-y-2 pt-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Title:
            </span>
            <span className="text-sm font-medium">{reviewed.incident_name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Status:
            </span>
            <span className="text-sm capitalize">{reviewed.status}</span>
          </div>
          <div>
            <span className="text-xs font-medium text-muted-foreground">
              Body:
            </span>
            <p className="mt-1 whitespace-pre-wrap rounded bg-muted/50 p-3 text-sm">
              {reviewed.body}
            </p>
          </div>
          {reviewed.components.length > 0 && (
            <div>
              <span className="text-xs font-medium text-muted-foreground">
                Components:
              </span>
              <div className="mt-1 flex flex-wrap gap-2">
                {reviewed.components.map((c) => (
                  <span
                    key={c.component_id}
                    className="rounded bg-muted px-2 py-1 font-mono text-xs"
                  >
                    {c.component_id}: {c.component_status}
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
