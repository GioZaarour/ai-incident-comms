"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ChevronDown } from "lucide-react";
import { SeverityBadge } from "@/components/shared/severity-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { Timestamp } from "@/components/shared/timestamp";
import { ReviewedDraft } from "./reviewed-draft";
import { AiConcerns } from "./ai-concerns";
import { ChangelogView } from "./changelog-view";
import { QueueActions } from "./queue-actions";
import type { QueueItem as QueueItemType } from "@/lib/supabase/types";
import type { DrafterOutput, ReviewerOutput, BriefPayload } from "@/lib/shared/types";
import type { Severity, UpdateStatus } from "@/lib/shared/constants";
import { cn } from "@/lib/utils";

interface QueueItemProps {
  item: QueueItemType;
  onRefresh: () => void;
}

export function QueueItem({ item, onRefresh }: QueueItemProps) {
  const [expanded, setExpanded] = useState(false);

  const brief = item.brief_json as unknown as BriefPayload | null;
  const drafted = item.drafted_json as unknown as DrafterOutput | null;
  const reviewed = item.reviewed_json as unknown as ReviewerOutput | null;

  return (
    <Card className="overflow-hidden">
      <button
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <SeverityBadge severity={item.incident.severity as Severity} />
        <StatusBadge status={item.status as UpdateStatus} />
        <span className="min-w-0 flex-1 truncate text-sm font-medium">
          {item.incident.title}
        </span>
        <span className="shrink-0 text-xs text-muted-foreground">
          by {item.submitted_by}
        </span>
        <Timestamp date={item.created_at} />
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            expanded && "rotate-180"
          )}
        />
      </button>

      {expanded && (
        <CardContent className="space-y-4 border-t pt-4">
          {/* Reviewed Draft */}
          {reviewed && <ReviewedDraft reviewed={reviewed} />}

          {/* AI Concerns */}
          <AiConcerns
            drafterFlags={drafted?.flags ?? []}
            reviewerFlags={reviewed?.flags ?? []}
          />

          {/* Changelog */}
          {reviewed?.changelog && (
            <ChangelogView changelog={reviewed.changelog} />
          )}

          {/* Internal Notes */}
          {brief?.internal_notes && (
            <div className="rounded border border-amber-500/30 bg-amber-500/5 p-3">
              <p className="mb-1 text-xs font-bold uppercase text-amber-400">
                Internal Only
              </p>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {brief.internal_notes}
              </p>
            </div>
          )}

          {/* Change Feedback */}
          {item.change_feedback && (
            <div className="rounded border border-blue-500/30 bg-blue-500/5 p-3">
              <p className="mb-1 text-xs font-bold uppercase text-blue-400">
                Change Feedback
              </p>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {item.change_feedback}
              </p>
            </div>
          )}

          {/* Denial Reason */}
          {item.denial_reason && (
            <div className="rounded border border-red-500/30 bg-red-500/5 p-3">
              <p className="mb-1 text-xs font-bold uppercase text-red-400">
                Denial Reason
              </p>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {item.denial_reason}
              </p>
            </div>
          )}

          {/* Publish Error */}
          {item.publish_error && (
            <div className="rounded border border-red-500/30 bg-red-500/5 p-3">
              <p className="mb-1 text-xs font-bold uppercase text-red-400">
                Publish Error
              </p>
              <p className="whitespace-pre-wrap font-mono text-xs text-muted-foreground">
                {item.publish_error}
              </p>
            </div>
          )}

          <Separator />

          {/* Actions */}
          <QueueActions
            updateId={item.id}
            status={item.status as UpdateStatus}
            onAction={onRefresh}
          />
        </CardContent>
      )}
    </Card>
  );
}
