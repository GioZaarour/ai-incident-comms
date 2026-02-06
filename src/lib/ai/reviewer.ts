import { generateObject } from "ai";
import { getModel } from "./client";
import { reviewerOutputSchema } from "./schemas";
import { REVIEWER_SYSTEM_PROMPT } from "./prompts";
import type { BriefPayload, DrafterOutput, ReviewerOutput } from "@/lib/shared/types";

export async function runReviewer(
  brief: BriefPayload,
  draft: DrafterOutput
): Promise<ReviewerOutput> {
  const prompt = `Review this Statuspage incident draft and apply guardrails.

ORIGINAL BRIEF:
${JSON.stringify(brief, null, 2)}

DRAFTER OUTPUT:
${JSON.stringify(draft, null, 2)}

Review the draft for redaction, under-communication, scope accuracy, template conformance, and tone. Make corrections as needed.`;

  const { object } = await generateObject({
    model: getModel(),
    schema: reviewerOutputSchema,
    system: REVIEWER_SYSTEM_PROMPT,
    prompt,
  });

  return object as ReviewerOutput;
}
