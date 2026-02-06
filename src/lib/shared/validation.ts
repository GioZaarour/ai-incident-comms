import { z } from "zod";
import { SEVERITY, LIFECYCLE_STATE, COMPONENT_STATUS } from "./constants";

export const affectedComponentSchema = z.object({
  component_id: z.string().min(1),
  component_name: z.string().min(1),
  component_status: z.enum(COMPONENT_STATUS),
});

export const briefSchema = z
  .object({
    severity: z.enum(SEVERITY),
    lifecycle_state: z.enum(LIFECYCLE_STATE),
    affected_components: z.array(affectedComponentSchema).min(1, "At least one component required"),
    customer_impact: z.string().min(1, "Customer impact is required"),
    scope: z.enum(["all", "subset"]),
    scope_criterion: z.string().optional(),
    start_time: z.string().min(1, "Start time is required"),
    detection_time: z.string().min(1, "Detection time is required"),
    mitigation_status: z.string().min(1, "Mitigation status is required"),
    customer_action_required: z.string().optional(),
    next_update_eta: z.string().optional(),
    internal_notes: z.string().optional(),
    existing_incident_id: z.string().optional(),
    submitter_name: z.string().min(1, "Submitter name is required"),
  })
  .refine(
    (data) => {
      if (data.lifecycle_state !== "resolved" && !data.next_update_eta) {
        return false;
      }
      return true;
    },
    {
      message: "Next update ETA is required unless status is resolved",
      path: ["next_update_eta"],
    }
  )
  .refine(
    (data) => {
      if (data.scope === "subset" && !data.scope_criterion) {
        return false;
      }
      return true;
    },
    {
      message: "Scope criterion is required when scope is 'subset'",
      path: ["scope_criterion"],
    }
  );

export type BriefFormValues = z.infer<typeof briefSchema>;

export const drafterOutputSchema = z.object({
  incident_name: z.string(),
  status: z.enum(LIFECYCLE_STATE),
  body: z.string(),
  components: z.array(
    z.object({
      component_id: z.string(),
      component_status: z.string(),
    })
  ),
  flags: z.array(z.string()),
});

export const reviewerOutputSchema = z.object({
  incident_name: z.string(),
  status: z.enum(LIFECYCLE_STATE),
  body: z.string(),
  components: z.array(
    z.object({
      component_id: z.string(),
      component_status: z.string(),
    })
  ),
  changelog: z.array(z.string()),
  flags: z.array(z.string()),
});
