"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LIFECYCLE_STATE } from "@/lib/shared/constants";

interface LifecycleSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export function LifecycleSelect({ value, onChange }: LifecycleSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select status" />
      </SelectTrigger>
      <SelectContent>
        {LIFECYCLE_STATE.map((s) => (
          <SelectItem key={s} value={s} className="capitalize">
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
