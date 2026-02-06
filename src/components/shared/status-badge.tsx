import { Badge } from "@/components/ui/badge";
import { STATUS_COLORS, STATUS_LABELS, type UpdateStatus } from "@/lib/shared/constants";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: UpdateStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn("text-xs", STATUS_COLORS[status])}
    >
      {STATUS_LABELS[status]}
    </Badge>
  );
}
