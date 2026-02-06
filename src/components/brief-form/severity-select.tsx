"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SEVERITY } from "@/lib/shared/constants";

interface SeveritySelectProps {
  value: string;
  onChange: (value: string) => void;
}

const labels: Record<string, string> = {
  sev1: "SEV1 — Critical",
  sev2: "SEV2 — Major",
  sev3: "SEV3 — Minor",
};

export function SeveritySelect({ value, onChange }: SeveritySelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select severity" />
      </SelectTrigger>
      <SelectContent>
        {SEVERITY.map((s) => (
          <SelectItem key={s} value={s}>
            {labels[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
