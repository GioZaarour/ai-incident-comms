"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { AlertTriangle, ChevronDown } from "lucide-react";
import { useState } from "react";

interface AiConcernsProps {
  drafterFlags: string[];
  reviewerFlags: string[];
}

export function AiConcerns({ drafterFlags, reviewerFlags }: AiConcernsProps) {
  const [open, setOpen] = useState(false);
  const allFlags = [
    ...drafterFlags.map((f) => ({ source: "Drafter", text: f })),
    ...reviewerFlags.map((f) => ({ source: "Reviewer", text: f })),
  ];

  if (allFlags.length === 0) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center gap-2 rounded bg-amber-500/10 px-3 py-2 text-sm text-amber-400 hover:bg-amber-500/15">
        <AlertTriangle className="h-4 w-4" />
        <span className="font-medium">
          AI Concerns ({allFlags.length})
        </span>
        <ChevronDown
          className={`ml-auto h-4 w-4 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 space-y-2 px-1">
        {allFlags.map((flag, i) => (
          <div
            key={i}
            className="flex items-start gap-2 rounded bg-muted/50 p-2 text-sm"
          >
            <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
              {flag.source}
            </span>
            <span>{flag.text}</span>
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
