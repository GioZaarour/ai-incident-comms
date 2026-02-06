import { google } from "@ai-sdk/google";

export const MODEL_ID = "gemini-2.0-flash";

export function getModel() {
  return google(MODEL_ID);
}
