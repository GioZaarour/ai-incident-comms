import type { ReviewerOutput, DrafterOutput } from "@/lib/shared/types";

export function buildDraftMessage(
  updateId: string,
  reviewed: ReviewerOutput,
  drafterFlags: string[]
) {
  const allFlags = [
    ...drafterFlags.map((f) => `[Drafter] ${f}`),
    ...reviewed.flags.map((f) => `[Reviewer] ${f}`),
  ];

  const componentLines = reviewed.components
    .map((c) => `\`${c.component_id}\` → _${c.component_status}_`)
    .join("\n");

  const blocks: Record<string, unknown>[] = [
    {
      type: "header",
      text: { type: "plain_text", text: "Incident Draft Ready for Review" },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Title*\n${reviewed.incident_name}` },
        { type: "mrkdwn", text: `*Status*\n${reviewed.status}` },
      ],
    },
    { type: "divider" },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Customer-Facing Body*\n>>> ${reviewed.body}`,
      },
    },
  ];

  if (componentLines) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Components*\n${componentLines}`,
      },
    });
  }

  if (reviewed.changelog.length > 0) {
    const changelogText = reviewed.changelog
      .map((c) => `• ${c}`)
      .join("\n");
    blocks.push(
      { type: "divider" },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Reviewer Changelog*\n${changelogText}`,
        },
      }
    );
  }

  if (allFlags.length > 0) {
    const flagsText = allFlags.map((f) => `⚠ ${f}`).join("\n");
    blocks.push(
      { type: "divider" },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*AI Concerns*\n${flagsText}`,
        },
      }
    );
  }

  blocks.push(
    { type: "divider" },
    {
      type: "actions",
      block_id: `draft_actions_${updateId}`,
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "Approve & Publish" },
          style: "primary",
          action_id: "approve_draft",
          value: updateId,
        },
        {
          type: "button",
          text: { type: "plain_text", text: "Request Changes" },
          action_id: "request_changes_draft",
          value: updateId,
        },
        {
          type: "button",
          text: { type: "plain_text", text: "Edit Fields" },
          action_id: "edit_fields_draft",
          value: updateId,
        },
      ],
    }
  );

  return {
    text: `Draft ready: ${reviewed.incident_name}`,
    blocks,
  };
}
