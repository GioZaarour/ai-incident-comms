export const SEVERITY = ["sev1", "sev2", "sev3"] as const;
export type Severity = (typeof SEVERITY)[number];

export const LIFECYCLE_STATE = [
  "investigating",
  "identified",
  "monitoring",
  "resolved",
] as const;
export type LifecycleState = (typeof LIFECYCLE_STATE)[number];

export const COMPONENT_STATUS = [
  "degraded_performance",
  "partial_outage",
  "major_outage",
] as const;
export type ComponentStatus = (typeof COMPONENT_STATUS)[number];

export const UPDATE_STATUS = [
  "processing",
  "awaiting_approval",
  "changes_requested",
  "approved",
  "denied",
  "published",
  "publish_failed",
] as const;
export type UpdateStatus = (typeof UPDATE_STATUS)[number];

export const SEVERITY_COLORS: Record<Severity, string> = {
  sev1: "bg-red-500/20 text-red-400 border-red-500/30",
  sev2: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  sev3: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
};

export const STATUS_COLORS: Record<UpdateStatus, string> = {
  processing: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  awaiting_approval: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  changes_requested: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  approved: "bg-green-500/20 text-green-400 border-green-500/30",
  denied: "bg-red-500/20 text-red-400 border-red-500/30",
  published: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  publish_failed: "bg-red-500/20 text-red-400 border-red-500/30",
};

export const LIFECYCLE_COLORS: Record<LifecycleState, string> = {
  investigating: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  identified: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  monitoring: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  resolved: "bg-green-500/20 text-green-400 border-green-500/30",
};

export const SEVERITY_LABELS: Record<Severity, string> = {
  sev1: "SEV1",
  sev2: "SEV2",
  sev3: "SEV3",
};

export const STATUS_LABELS: Record<UpdateStatus, string> = {
  processing: "Processing",
  awaiting_approval: "Awaiting Approval",
  changes_requested: "Changes Requested",
  approved: "Approved",
  denied: "Denied",
  published: "Published",
  publish_failed: "Publish Failed",
};
