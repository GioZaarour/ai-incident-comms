import { Badge } from "@/components/ui/badge";
import { SEVERITY_COLORS, SEVERITY_LABELS, type Severity } from "@/lib/shared/constants";
import { cn } from "@/lib/utils";

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <Badge
      variant="outline"
      className={cn("font-mono text-xs", SEVERITY_COLORS[severity])}
    >
      {SEVERITY_LABELS[severity]}
    </Badge>
  );
}
