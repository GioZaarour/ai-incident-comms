import { runDrafter } from "@/lib/ai/drafter";
import { runReviewer } from "@/lib/ai/reviewer";
import {
  updateIncidentUpdate,
  createEvent,
} from "@/lib/supabase/queries";
import type { BriefPayload } from "@/lib/shared/types";
import { MODEL_ID } from "@/lib/ai/client";

export async function runPipeline(
  updateId: string,
  incidentId: string,
  brief: BriefPayload,
  lastPublishedUpdate?: string | null
) {
  try {
    // Step 1: Run Drafter
    const draftOutput = await runDrafter(brief, lastPublishedUpdate);

    await updateIncidentUpdate(updateId, {
      drafted_json: draftOutput as unknown as Record<string, unknown>,
    });

    await createEvent({
      incident_id: incidentId,
      update_id: updateId,
      type: "draft_generated",
      actor: "system",
      payload_json: { model: MODEL_ID, output: draftOutput },
    });

    // Step 2: Run Reviewer
    const reviewOutput = await runReviewer(brief, draftOutput);

    await updateIncidentUpdate(updateId, {
      reviewed_json: reviewOutput as unknown as Record<string, unknown>,
      status: "awaiting_approval",
    });

    await createEvent({
      incident_id: incidentId,
      update_id: updateId,
      type: "review_completed",
      actor: "system",
      payload_json: {
        model: MODEL_ID,
        output: reviewOutput,
        changelog: reviewOutput.changelog,
        flags: reviewOutput.flags,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Pipeline failed";
    console.error("Pipeline error:", message);

    await updateIncidentUpdate(updateId, {
      status: "publish_failed",
      publish_error: `Pipeline error: ${message}`,
    }).catch(() => {});

    await createEvent({
      incident_id: incidentId,
      update_id: updateId,
      type: "publish_failed",
      actor: "system",
      payload_json: { error: message },
    }).catch(() => {});
  }
}
