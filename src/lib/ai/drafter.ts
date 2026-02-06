import { generateObject } from "ai";
import { getModel } from "./client";
import { drafterOutputSchema } from "./schemas";
import { DRAFTER_SYSTEM_PROMPT } from "./prompts";
import type { BriefPayload, DrafterOutput } from "@/lib/shared/types";

export async function runDrafter(
  brief: BriefPayload,
  lastPublishedUpdate?: string | null
): Promise<DrafterOutput> {
  let prompt = `Draft a Statuspage incident update based on this incident brief:\n\n${JSON.stringify(brief, null, 2)}`;

  if (lastPublishedUpdate) {
    prompt += `\n\nLast published Statuspage update (for continuity):\n${lastPublishedUpdate}`;
  }

  const { object } = await generateObject({
    model: getModel(),
    schema: drafterOutputSchema,
    system: DRAFTER_SYSTEM_PROMPT,
    prompt,
  });

  return object as DrafterOutput;
}
