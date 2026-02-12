# AI Incident Comms

An AI-powered incident submission and reviewer system for engineering teams. Currently supported platforms: Atlassian Statuspage. Comes with a Web UI and Slack bot for incident management. Uses Vercel AI SDK for LLM generation/reviews.

## How It Works

1. An incident commander submits an incident brief (severity, affected components, customer impact, scope, etc.)
2. An LLM **Drafter** generates a Statuspage-ready update from the brief
3. An LLM **Reviewer** checks the draft for tone, redaction of sensitive data, scope accuracy, and under-communication — then produces a final version with a changelog
4. The reviewed draft enters an approval queue where a human approves, requests changes, or denies it
5. On approval, the update is published directly to Statuspage via API

All steps are logged to an audit trail for full traceability.

## Tech Stack

| Layer | Technology |
|---|---|
| Web App | Next.js 16 (App Router) on Vercel |
| UI | Tailwind CSS v4 + shadcn/ui (dark theme) |
| Database | Supabase (PostgreSQL) |
| LLM | Vercel AI SDK with Google Gemini |
| Statuspage | Atlassian Statuspage API |
| Slack Bot | Bolt.js (Socket Mode) |

## Pages

- **`/`** — Submit a new incident brief or update an existing incident
- **`/queue`** — Approval queue with filter chips (Processing, Awaiting Approval, Published, Failed, etc.)
- **`/history`** — Full audit timeline of all incidents and their events

## Project Structure

```
src/
  app/              # Next.js pages and API route handlers
  components/       # React components (brief form, queue, history, shared)
  lib/
    ai/             # LLM drafter, reviewer, prompts, Zod schemas
    pipeline/       # Orchestrates drafter -> reviewer flow
    supabase/       # Database client and queries
    statuspage/     # Statuspage API client
    shared/         # Types, constants, validation
slack-bot/          # Separate Node.js Slack bot (Bolt.js, Socket Mode)
supabase/
  migrations/       # SQL schema (incidents, incident_updates, events)
```

## Setup

### Prerequisites

- Node.js 18+
- A Supabase project (free tier)
- An Atlassian Statuspage page (trial)
- A Google AI API key (for Gemini)
- Slack app credentials (optional, for bot)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```
GOOGLE_GENERATIVE_AI_API_KEY=     # Google Gemini API key
NEXT_PUBLIC_SUPABASE_URL=         # Supabase project URL
SUPABASE_SERVICE_ROLE_KEY=        # Supabase service role key
STATUSPAGE_API_KEY=               # Statuspage API token
STATUSPAGE_PAGE_ID=               # Statuspage page ID

# Slack (optional, for bot only)
SLACK_BOT_TOKEN=
SLACK_APP_TOKEN=
SLACK_SIGNING_SECRET=
```

### 3. Set up the database

Run the migration in `supabase/migrations/001_initial_schema.sql` against your Supabase project. You can do this from the Supabase SQL Editor.

### 4. Run the web app

```bash
npm run dev
```

### 5. Run the Slack bot (optional)

```bash
cd slack-bot
npm install
npm run dev
```

The Slack bot uses Socket Mode and runs as a separate process. It shares the same database as the web app.

## Swapping LLM Providers

The LLM provider is configured in `src/lib/ai/client.ts`. To switch from Google Gemini to another provider:

1. Install the provider package (e.g., `@ai-sdk/anthropic`, `@ai-sdk/openai`)
2. Update the import and model initialization in `src/lib/ai/client.ts`
3. Set the corresponding API key environment variable

The rest of the pipeline (prompts, schemas, structured output) works unchanged via the Vercel AI SDK abstraction.

## Database Schema

Three tables:

- **`incidents`** — Core incident record (title, status, severity, Statuspage link)
- **`incident_updates`** — Each submission through the pipeline (brief, draft, review, approval status)
- **`events`** — Audit log of all actions (who did what, when)

## License

MIT
