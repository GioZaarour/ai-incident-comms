import { z } from "zod";

export const drafterOutputSchema = z.object({
  incident_name: z
    .string()
    .describe("Short, descriptive incident title for the Statuspage."),
  status: z
    .enum(["investigating", "identified", "monitoring", "resolved"])
    .describe("Incident lifecycle status."),
  body: z
    .string()
    .describe(
      "Customer-facing update text. Professional, empathetic, non-blameful. No internal details."
    ),
  components: z
    .array(
      z.object({
        component_id: z.string(),
        component_status: z.enum([
          "operational",
          "degraded_performance",
          "partial_outage",
          "major_outage",
        ]),
      })
    )
    .describe("Array of component ID to status mappings."),
  flags: z
    .array(z.string())
    .describe(
      "Concerns or warnings about the brief (e.g., vague scope, missing info)."
    ),
});

export const reviewerOutputSchema = z.object({
  incident_name: z.string().describe("Reviewed incident title."),
  status: z
    .enum(["investigating", "identified", "monitoring", "resolved"])
    .describe("Incident lifecycle status."),
  body: z
    .string()
    .describe(
      "Final customer-facing update text with all corrections applied."
    ),
  components: z
    .array(
      z.object({
        component_id: z.string(),
        component_status: z.enum([
          "operational",
          "degraded_performance",
          "partial_outage",
          "major_outage",
        ]),
      })
    )
    .describe("Array of component ID to status mappings."),
  changelog: z
    .array(z.string())
    .describe("List of changes made to the draft and why."),
  flags: z
    .array(z.string())
    .describe("Remaining concerns for the human approver after review."),
});
