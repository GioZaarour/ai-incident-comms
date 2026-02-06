"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface ScopeFieldProps {
  scope: "all" | "subset";
  scopeCriterion: string;
  onScopeChange: (value: "all" | "subset") => void;
  onCriterionChange: (value: string) => void;
  error?: string;
}

export function ScopeField({
  scope,
  scopeCriterion,
  onScopeChange,
  onCriterionChange,
  error,
}: ScopeFieldProps) {
  return (
    <div className="space-y-3">
      <Label>Scope *</Label>
      <div className="flex gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="scope"
            value="all"
            checked={scope === "all"}
            onChange={() => onScopeChange("all")}
            className="accent-primary"
          />
          <span className="text-sm">All customers</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="scope"
            value="subset"
            checked={scope === "subset"}
            onChange={() => onScopeChange("subset")}
            className="accent-primary"
          />
          <span className="text-sm">Subset of customers</span>
        </label>
      </div>
      {scope === "subset" && (
        <div>
          <Input
            placeholder="e.g., Users in EU region, Enterprise tier customers"
            value={scopeCriterion}
            onChange={(e) => onCriterionChange(e.target.value)}
          />
          {error && (
            <p className="text-xs text-destructive mt-1">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}
