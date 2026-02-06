"use client";

import { Timestamp } from "@/components/shared/timestamp";
import type { Event } from "@/lib/supabase/types";
import {
  FileText,
  Bot,
  ShieldCheck,
  CheckCircle,
  XCircle,
  MessageSquare,
  Send,
  AlertTriangle,
} from "lucide-react";

const EVENT_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; color: string }
> = {
  brief_submitted: {
    label: "Brief Submitted",
    icon: FileText,
    color: "text-blue-400",
  },
  draft_generated: {
    label: "Draft Generated",
    icon: Bot,
    color: "text-purple-400",
  },
  review_completed: {
    label: "Review Completed",
    icon: ShieldCheck,
    color: "text-cyan-400",
  },
  approval_granted: {
    label: "Approved",
    icon: CheckCircle,
    color: "text-green-400",
  },
  approval_denied: {
    label: "Denied",
    icon: XCircle,
    color: "text-red-400",
  },
  changes_requested: {
    label: "Changes Requested",
    icon: MessageSquare,
    color: "text-amber-400",
  },
  published: {
    label: "Published to Statuspage",
    icon: Send,
    color: "text-emerald-400",
  },
  publish_failed: {
    label: "Publish Failed",
    icon: AlertTriangle,
    color: "text-red-400",
  },
};

function EventPayload({
  type,
  payload,
}: {
  type: string;
  payload: Record<string, unknown>;
}) {
  if (type === "approval_denied" && payload.reason) {
    return (
      <div className="mt-1">
        <p className="text-xs text-muted-foreground">
          Reason: {String(payload.reason)}
        </p>
      </div>
    );
  }
  if (type === "changes_requested" && payload.feedback) {
    return (
      <div className="mt-1">
        <p className="text-xs text-muted-foreground">
          Feedback: {String(payload.feedback)}
        </p>
      </div>
    );
  }
  if (type === "publish_failed" && payload.error) {
    return (
      <div className="mt-1">
        <p className="text-xs text-red-400">Error: {String(payload.error)}</p>
      </div>
    );
  }
  return null;
}

interface EventTimelineProps {
  events: Event[];
}

export function EventTimeline({ events }: EventTimelineProps) {
  return (
    <div className="relative ml-3 border-l border-border pl-6">
      {events.map((event) => {
        const config = EVENT_CONFIG[event.type] ?? {
          label: event.type,
          icon: FileText,
          color: "text-muted-foreground",
        };
        const Icon = config.icon;

        return (
          <div key={event.id} className="relative pb-4 last:pb-0">
            <div
              className={`absolute -left-[1.6rem] rounded-full bg-background p-0.5 ${config.color}`}
            >
              <Icon className="h-3.5 w-3.5" />
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${config.color}`}>
                {config.label}
              </span>
              <span className="text-xs text-muted-foreground">
                by {event.actor}
              </span>
              <Timestamp date={event.created_at} />
            </div>
            {event.payload_json && (
              <EventPayload type={event.type} payload={event.payload_json} />
            )}
          </div>
        );
      })}
    </div>
  );
}
