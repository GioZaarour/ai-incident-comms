"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Plus } from "lucide-react";
import type { StatuspageComponent } from "@/lib/statuspage/types";
import type { AffectedComponent } from "@/lib/shared/types";
import { COMPONENT_STATUS } from "@/lib/shared/constants";

interface ComponentSelectorProps {
  value: AffectedComponent[];
  onChange: (value: AffectedComponent[]) => void;
  error?: string;
}

const statusLabels: Record<string, string> = {
  degraded_performance: "Degraded Performance",
  partial_outage: "Partial Outage",
  major_outage: "Major Outage",
};

export function ComponentSelector({
  value,
  onChange,
  error,
}: ComponentSelectorProps) {
  const [components, setComponents] = useState<StatuspageComponent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/statuspage/components")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setComponents(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const addComponent = () => {
    const available = components.filter(
      (c) => !value.some((v) => v.component_id === c.id)
    );
    if (available.length === 0) return;
    onChange([
      ...value,
      {
        component_id: available[0].id,
        component_name: available[0].name,
        component_status: "partial_outage",
      },
    ]);
  };

  const removeComponent = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  const updateComponent = (idx: number, field: string, val: string) => {
    const updated = [...value];
    if (field === "component_id") {
      const comp = components.find((c) => c.id === val);
      updated[idx] = {
        ...updated[idx],
        component_id: val,
        component_name: comp?.name ?? val,
      };
    } else {
      updated[idx] = { ...updated[idx], [field]: val };
    }
    onChange(updated);
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading components...</div>;
  }

  return (
    <div className="space-y-3">
      {value.map((comp, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <Select
            value={comp.component_id}
            onValueChange={(v) => updateComponent(idx, "component_id", v)}
          >
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {components.map((c) => (
                <SelectItem
                  key={c.id}
                  value={c.id}
                  disabled={
                    value.some((v) => v.component_id === c.id) &&
                    comp.component_id !== c.id
                  }
                >
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={comp.component_status}
            onValueChange={(v) => updateComponent(idx, "component_status", v)}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COMPONENT_STATUS.map((s) => (
                <SelectItem key={s} value={s}>
                  {statusLabels[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => removeComponent(idx)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addComponent}
        disabled={value.length >= components.length}
      >
        <Plus className="mr-1 h-4 w-4" />
        Add Component
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
