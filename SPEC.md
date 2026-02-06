# AI Incident Communication Platform

An AI-native workflow that assists in generating succinct, accurate, and customer-appropriate incident communications, using Atlassian Statuspage.io.

**Context**: This is a take-home assessment project. The web UI + LLM pipeline + real Statuspage integration must be deployed on Vercel (accessible via URL for reviewers). The Slack bot runs locally for a demo video. **No paid services** — all tiers must be free (Vercel free, Supabase free, Statuspage trial, Anthropic API credits).

---

## Features

1. LLM Drafter
2. LLM Guardrail Reviewer
3. Web Interface (dark mode ops console)
4. Slack Integration (local demo only)
5. Statuspage.io API Integration (real)
6. Persistence & Auditability

---

## Architecture

### Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend + API | **Next.js** on **Vercel** (free tier) | App Router, Route Handlers for API |
| UI | **Tailwind CSS** + **shadcn/ui** | Dark mode ops console aesthetic |
| Database | **Supabase** (free tier) | PostgreSQL, one free project |
| LLM | **Anthropic API** (Claude Sonnet 4.5) | Server-side calls via Vercel Route Handlers |
| Statuspage | **Atlassian Statuspage** (14-day trial) | API token in Vercel env vars |
| Slack Bot | **Bolt.js** (Socket Mode) | Separate Node.js process, runs locally |

### Process Architecture

- **Web app**: Next.js deployed on Vercel. Handles the web UI and all API routes (LLM calls, Supabase queries, Statuspage API).
- **Slack bot**: Separate standalone Node.js process using Bolt.js with Socket Mode. Shares the same Supabase database and core LLM pipeline logic with the web app via shared modules/imports. Runs locally only (not deployed).

### Authentication & Roles

- **No real auth**. The web UI is publicly accessible. Users enter their name to identify themselves.
- **Roles are mocked**. All users can both submit and approve for demo purposes. The role concept (Contributor vs. Approver) is present in the data model but not enforced.

---

## Entry Points

### Trigger 1: Web UI

A web form where the incident commander enters an incident brief. Accessible via public URL on Vercel.

### Trigger 2: Slack Bot

Slack app with Socket Mode connects to the bot's backend. Slash commands allow entering incident brief data.

---

## Incident Brief Schema

The input form collects these fields:

| Field | Type | Required | Notes |
|---|---|---|---|
| `severity` | Enum: `sev1`, `sev2`, `sev3` | Yes | |
| `lifecycle_state` | Enum: `investigating`, `identified`, `monitoring`, `resolved` | Yes | Maps to Statuspage incident status |
| `affected_components` | Multi-select (fetched dynamically from Statuspage API) | Yes | User selects from live Statuspage components |
| `component_status` | Per-component enum: `degraded_performance`, `partial_outage`, `major_outage` | Yes (per selected component) | User explicitly sets status per component |
| `customer_impact` | Free text | Yes | What users are experiencing |
| `scope` | `all` or `subset` + criterion text | Yes | Who is affected |
| `start_time` | Datetime | Yes | When the incident started |
| `detection_time` | Datetime | Yes | When it was detected |
| `mitigation_status` | Free text | Yes | What's being done (customer-safe terms) |
| `customer_action_required` | Free text | No | Usually "none" |
| `next_update_eta` | Relative time or datetime | Required except when `resolved` | |
| `internal_notes` | Free text | No | **Never externalized** — for internal context only |

For **updates to existing incidents**:
- `last_published_status_update` is auto-fetched from the Statuspage API (source of truth) and displayed to the submitter for reference.

### Web Form Behavior

- **Unified form with mode toggle**: Single page. User selects "New Incident" or picks an existing incident from a dropdown.
  - For new incidents: all fields blank.
  - For updates: form pre-populates relevant fields. The last published Statuspage update is fetched live from the API and shown as read-only reference.
- **Components dropdown**: Dynamically fetched from the Statuspage API on form load.
- **Client-side validation**: Required fields are enforced before submission. Form uses standard client-side validation (no LLM-based validation on inputs). Anthropic's `tool_use` ensures structured output conformance from LLM calls.
- **Submitter name**: Simple text input at the top of the form. No auth required.

---

## LLM Workflow

Two **separate** Anthropic API calls, both using **Claude Sonnet 4.5** with structured output (`tool_use`):

### Step 1: Drafter

**Input**: The full incident brief (all fields).

**Behavior**:
- Drafts the Statuspage API payload fields. The output JSON schema maps **directly to the Statuspage API** incident create/update payload (incident name, status, body text, component IDs, component_status per component).
- **Best-effort on ambiguity**: If brief fields are vague (e.g., "some users affected"), the Drafter still produces a draft but **annotates flagged concerns** in a separate `flags` array in the output (e.g., `"Vague scope — consider specifying affected regions"`).
- For updates: the Drafter receives the last published Statuspage update (fetched from the API) and produces a **diff-aware update** — only changing what's changed, referencing continuity with the previous update.

**Output schema** (structured output):
```json
{
  "incident_name": "string",
  "status": "investigating | identified | monitoring | resolved",
  "body": "string (the customer-facing update text)",
  "components": { "<component_id>": "<component_status>", ... },
  "flags": ["string (concerns/warnings about the brief)", ...]
}
```

### Step 2: Reviewer

**Input**: The Drafter's output + the original incident brief.

**Behavior**:
- Implements guardrails via a custom system prompt with few-shot examples of good catches.
- **Can modify the draft text** and returns the corrected version alongside a changelog explaining each change.
- Checks performed:
  - **Redaction**: Permanently strips sensitive data (emails, internal domains, customer names). Redacted data is gone from the output — it remains only in the original brief record in the DB.
  - **Under-communication**: Flags if the message is too vague or lacks actionable information.
  - **Scope accuracy**: Ensures the message communicates the correct scope (which users/tenants are affected).
  - **Template conformance**: Ensures the payload structure is valid and complete.
  - **Tone**: Professional, empathetic, non-blameful, customer-appropriate language.

**Output schema** (structured output):
```json
{
  "incident_name": "string",
  "status": "investigating | identified | monitoring | resolved",
  "body": "string (the final customer-facing update text, with any modifications applied)",
  "components": { "<component_id>": "<component_status>", ... },
  "changelog": ["string (what was changed and why)", ...],
  "flags": ["string (remaining concerns for the human approver)", ...]
}
```

### Pipeline Flow

```
Brief submitted
  → Drafter (Claude Sonnet 4.5) → draft + flags
  → Reviewer (Claude Sonnet 4.5) → reviewed draft + changelog + remaining flags
  → Enters approval queue
```

---

## Approval + Publishing

### Web UI Approval

The **Queue page** shows all incident updates awaiting approval as a **flat list with filter chips** for status (Processing, Awaiting Approval, Approved, Published, Failed).

Each queue item shows:
- Incident name, severity badge, lifecycle state
- Who submitted it and when
- Current status badge

Clicking a queue item expands to show:
- **Reviewed draft**: The Reviewer's final output (the text that will be sent to Statuspage).
- **AI Concerns section**: A separate collapsible section listing any flags from the Drafter and Reviewer.
- **Changelog**: Bullet list of what the Reviewer changed and why (Reviewer output vs. Drafter output).
- **Internal Notes**: Clearly labeled section (visually distinct, e.g., warning-colored border with "INTERNAL ONLY" header) showing the submitter's internal notes for approver context.
- **Action buttons**: Approve & Publish, Request Changes, Deny.

### Processing State

After submitting a brief on the web form, the user is **redirected to the queue page**. The new item appears with a "Processing" badge. When the LLM pipeline completes, the badge updates to "Awaiting Approval" (on next page load/refresh — **no real-time sync**, manual refresh).

### Approval Actions

- **Approve & Publish**: Calls the Statuspage API with the final payload. On success, marks the update as "Published" in the DB.
- **Request Changes**: Approver provides text feedback. The item returns to the submitter (visible in the queue as "Changes Requested").
- **Deny**: Approver provides a reason. Item is marked as denied in the DB.

### Publish Error Handling

If the Statuspage API call fails after approval:
- **Immediate notification**: The update is marked as `publish_failed` in the queue with the error message displayed.
- **Manual retry**: A "Retry Publish" button appears on the failed item. No automatic retries.

---

## Slack Integration

### Commands

- `/incident create` — Opens a Slack modal with the incident brief form.
- `/incident update` — Opens a modal to select an existing incident, then shows the update form.

### Slash Command Timing

Slack requires a response within 3 seconds. The flow:
1. Slash command **immediately opens a modal** for brief input (within 3s deadline).
2. User fills out the brief and submits the modal.
3. Bot posts an **ephemeral "Processing..." message** to the user.
4. LLM pipeline runs asynchronously.
5. When complete, bot **posts the draft to the channel/DM** with interactive buttons.

### Approval in Slack

Bot posts a staged update message with:
- The reviewed draft text
- AI concerns (if any)
- Interactive buttons: **Approve & Publish**, **Request Changes**, **Edit Fields**

**Edit Fields** opens a Slack modal pre-populated with the **drafted Statuspage text** (the Reviewer's output). The approver can directly edit the final text. Edited text is published as-is (does not re-run the LLM pipeline). This trades guardrail re-checking for speed during active incidents.

**Request Changes** opens a modal for the approver to type feedback. The original submitter is notified.

### Auditability

Slack provides built-in auditability — user identities are attached to all messages and interactions.

---

## Web Pages

### 1. Submit Brief (`/`)

- Unified form with mode toggle: "New Incident" vs. "Update Existing Incident" (dropdown of active incidents).
- Submitter name field (free text, required).
- All incident brief fields per the schema above.
- Client-side validation on required fields.
- On submit: redirects to the Queue page.

### 2. Approval Queue (`/queue`)

- Flat list of incident updates sorted by severity (sev1 first) then by time (newest first).
- **Filter chips**: All, Processing, Awaiting Approval, Changes Requested, Published, Failed.
- Each item is expandable inline to show: reviewed draft, changelog, AI concerns, internal notes, and action buttons.
- "Processing" items show a badge; updates to "Awaiting Approval" on manual page refresh.

### 3. History (`/history`)

- List of past incidents with expandable rows.
- Each row shows: incident name, severity, status, created by, created at, last update time.
- Expanding a row shows the **full timeline of events**: submitted → drafted → reviewed → approved/denied → published.
- Each event shows the actor (who), timestamp, and relevant details.
- Provides full auditability: who submitted, who approved, what was the original brief vs. final published text.

---

## Persistence

### Supabase Tables

```sql
-- Core incident record
incidents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text NOT NULL,
  status          text NOT NULL,  -- investigating, identified, monitoring, resolved
  severity        text NOT NULL,  -- sev1, sev2, sev3
  created_by      text NOT NULL,  -- submitter name
  created_at      timestamptz NOT NULL DEFAULT now(),
  statuspage_incident_id text     -- set after first publish
)

-- Each submission through the pipeline (brief → draft → review → approval → publish)
incident_updates (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id             uuid REFERENCES incidents(id) NOT NULL,
  brief_json              jsonb NOT NULL,        -- the original brief fields as submitted
  drafted_json            jsonb,                 -- Drafter LLM output
  reviewed_json           jsonb,                 -- Reviewer LLM output (final payload)
  status                  text NOT NULL DEFAULT 'processing',
                          -- processing, awaiting_approval, changes_requested, approved, denied, published, publish_failed
  submitted_by            text NOT NULL,
  approved_by             text,
  approved_at             timestamptz,
  denial_reason           text,
  change_feedback         text,                  -- feedback from approver when requesting changes
  published_at            timestamptz,
  statuspage_update_id    text,
  publish_error           text,                  -- error message if publish failed
  created_at              timestamptz NOT NULL DEFAULT now()
)

-- Audit log of all events
events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id     uuid REFERENCES incidents(id) NOT NULL,
  update_id       uuid REFERENCES incident_updates(id),
  type            text NOT NULL,
                  -- brief_submitted, draft_generated, review_completed,
                  -- approval_granted, approval_denied, changes_requested,
                  -- published, publish_failed
  actor           text NOT NULL,         -- human name or 'system'
  payload_json    jsonb,                 -- type-specific data
  created_at      timestamptz NOT NULL DEFAULT now()
)
```

### Event Types Stored

| Event Type | Actor | Payload |
|---|---|---|
| `brief_submitted` | submitter name | brief fields |
| `draft_generated` | `system` | Drafter output, model used |
| `review_completed` | `system` | Reviewer output, changelog, flags |
| `approval_granted` | approver name | — |
| `approval_denied` | approver name | reason |
| `changes_requested` | approver name | feedback text |
| `published` | `system` | Statuspage incident_id, update_id, final payload |
| `publish_failed` | `system` | error message |

---

## Statuspage Integration

### API Usage

- **Create Incident**: `POST /v1/pages/{page_id}/incidents`
- **Update Incident**: `PATCH /v1/pages/{page_id}/incidents/{incident_id}`
- **List Components**: `GET /v1/pages/{page_id}/components` (for dynamic component dropdown)
- **Get Incident**: `GET /v1/pages/{page_id}/incidents/{incident_id}` (to fetch last published update for diff-aware drafting)

### Configuration

Environment variables (stored in Vercel):
- `STATUSPAGE_API_KEY` — Atlassian Statuspage API token
- `STATUSPAGE_PAGE_ID` — The Statuspage page ID

### Diff-Aware Updates

When updating an existing incident, the system **fetches the last published update directly from the Statuspage API** as the source of truth (not from the local DB). This handles the case where someone manually edits Statuspage outside this tool.

---

## Environment Variables

```env
# Anthropic
ANTHROPIC_API_KEY=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# Statuspage
STATUSPAGE_API_KEY=
STATUSPAGE_PAGE_ID=

# Slack (for local bot only)
SLACK_BOT_TOKEN=
SLACK_APP_TOKEN=       # for Socket Mode
SLACK_SIGNING_SECRET=
```

---

## Visual Design

**Dark mode ops console** aesthetic:
- Dark background (near-black), muted accent colors
- Information-dense layout
- Monospace accents for technical data (incident IDs, timestamps)
- Severity badges: sev1 = red, sev2 = orange, sev3 = yellow
- Status badges with distinct colors per state
- Clean typography, subtle borders, minimal shadows
- Command-center feel — should look like something an SRE team would use

Built with **Tailwind CSS** + **shadcn/ui** components (themed dark).

---

## Out of Scope (for this demo)

- ETA reminders / countdown notifications
- Slack channel notifications on publish
- Real authentication / SSO / OAuth
- Role enforcement (mocked)
- Prompt versioning / hashing
- Real-time sync (Supabase Realtime / WebSockets) — manual refresh only
- Automatic retry on publish failure
- Multiple Statuspage pages
