[![en](https://img.shields.io/badge/lang-en-red.svg)](README.md) [![pt-br](https://img.shields.io/badge/lang-pt--br-green.svg)](README.pt-BR.md)

# Abu AI

Abu AI is a conversational Discord bot that uses OpenRouter to answer messages in a dedicated server channel. It persists conversations in PostgreSQL and uses that history as recent context.

> Abu AI is under active development.

## Features

- Connects to the Discord Gateway and listens to one configured channel.
- Ignores bots, direct messages, empty messages, and messages from other channels.
- Uses a typing indicator and replies directly to the original message.
- Generates responses through OpenRouter with Abu's system prompt.
- Identifies users by their Discord display names in the AI context.
- Loads recent PostgreSQL messages and limits the context by candidates and characters.
- Preserves conversation context after application restarts.
- Persists user messages and the replies effectively sent by the bot.
- Maintains one profile per immutable Discord user ID and updates changed names.
- Supports manually creating and querying user and group memories.
- Extracts explicit memories with a dedicated structured AI prompt.
- Confirms equivalent memories and preserves superseded history.
- Retrieves relevant memories through embeddings and cosine similarity.
- Lets users view, forget, clear, disable, and enable their own memories.
- Prevents duplicate Discord events from creating duplicate records or replies.
- Connects to PostgreSQL during NestJS startup and disconnects during shutdown.
- Applies bounded OpenRouter timeouts and retries only temporary failures.
- Exposes safe health and in-memory operational metrics endpoints.

## Tech Stack

- [Node.js](https://nodejs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [NestJS](https://nestjs.com/)
- [discord.js](https://discord.js.org/)
- [OpenRouter](https://openrouter.ai/)
- [PostgreSQL](https://www.postgresql.org/)
- [Prisma ORM](https://www.prisma.io/)
- [Joi](https://joi.dev/)
- [Jest](https://jestjs.io/)
- [Docker Compose](https://docs.docker.com/compose/)
- [pnpm](https://pnpm.io/)

## Architecture

The application is a modular monolith. Business and application rules do not depend directly on `discord.js` or Prisma.

```text
src/
├── config/
│   └── app.config.ts
├── generated/
│   └── prisma/
├── modules/
│   ├── ai/
│   ├── conversations/
│   │   └── repositories/
│   ├── database/
│   ├── discord/
│   ├── discord-users/
│   ├── health/
│   ├── memory/
│   └── observability/
├── app.module.ts
└── main.ts

prisma/
├── migrations/
└── schema.prisma
```

| Module | Responsibility |
| --- | --- |
| `config` | Loads and validates application configuration |
| `database` | Owns the Prisma Client and PostgreSQL lifecycle |
| `ai` | Defines the AI provider contract and OpenRouter implementation |
| `conversations` | Orchestrates persistence, context window, and response generation |
| `discord` | Translates Discord events and messages to application contracts |
| `discord-users` | Maintains Discord profiles identified by immutable user IDs |
| `memory` | Validates and persists contextual user and group memories |
| `observability` | Tracks safe provider, conversation, and timing metrics in memory |
| `health` | Reports PostgreSQL, Discord, and AI provider status |

`DatabaseModule` is not global. Modules that need database access must import it explicitly.

## Message Flow

```text
Discord message
      ↓
DiscordClientService
      ↓
ConversationsService
      ↓
Upsert Discord user profile
      ↓
Persist user message
      ↓
Load recent PostgreSQL context
      ↓
ConversationContextWindowService
      ↓
AiService → OpenRouterProvider
      ↓
Send Discord reply
      ↓
Persist the sent assistant message
```

The repository uses the unique `discordMessageId` and PostgreSQL `skipDuplicates` support. A repeated event is ignored before generating another response.

Recent context is isolated by Discord guild and channel. The current message and messages created after it are excluded from the history query because the current message is added separately to the context window. PostgreSQL selects the newest previous candidates first, and the repository restores chronological order before sending them to the AI.

Persistence failures are handled explicitly:

- If the user message cannot be saved, the error is logged and processing stops before generating a reply. A later redelivery can safely retry.
- If AI generation fails, the user message remains saved and Discord receives the existing friendly operational error response.
- If sending the reply fails, no conversational assistant message is persisted.
- If the sent reply cannot be saved, the error is logged and the delivered Discord response is preserved.

Operational error responses are intentionally not persisted as conversation history.

External Discord and OpenRouter calls are not wrapped in a database transaction.

## User Profiles

Every message author is associated with a `DiscordUser` profile through the immutable Discord user ID. Username and display name changes update the same profile instead of creating another user. Messages keep `authorName` as a historical snapshot of the name displayed when they were sent.

The user-profile migration backfills existing message authors. Historical usernames remain empty when they cannot be reconstructed safely and are updated when the user sends another message.

## Memory Foundation

The `MemoryModule` supports manually creating and querying contextual memories through `MemoryService`:

- `USER` memories require a subject Discord user.
- `GROUP` memories require a Discord guild and may optionally reference a subject user.
- Types include facts, preferences, relationships, projects, events, and other information.
- Statuses include active, superseded, and rejected.
- Confidence must be between `0` and `1`.
- A memory can reference its source Discord message.

Memory extraction runs synchronously after the Discord reply is delivered. The extractor validates strict JSON, rejects sensitive information, ignores repeated evidence, increases confidence when information is confirmed, and marks contradicted memories as `SUPERSEDED` without deleting history.

Relevant memories are now injected into the AI context as delimited, untrusted data with separate item and character budgets. Prisma ORM 7 stores embeddings as `Float[]`; cosine similarity is calculated in the application because stable Prisma does not yet expose type-safe pgvector queries.

Memory management commands:

- `/memorias`
- `/esquecer <memoryId>`
- `/limpar-memorias`
- `/memoria-status`
- `/memoria-status ativar`
- `/memoria-status desativar`

Users can only view or change their own individual memories. Changes are soft deletions through `REJECTED` status and are recorded in the memory audit table.

## Resilience and Observability

OpenRouter chat and embedding requests use an explicit timeout and bounded exponential backoff. Retries are limited to connection failures, HTTP `408`, `429`, and `5xx` responses. Authentication, credit, model, and other permanent errors are not retried and produce safe operational messages without logging API keys, prompts, or message content.

Every Discord message uses its immutable message ID as a correlation ID. Structured logs and in-memory metrics record provider calls, failures, context retrieval time, memory search time, response generation time, total processing time, sent characters, and retrieved memory count.

Operational endpoints:

- `GET /health` checks PostgreSQL with Prisma, Discord readiness, and the latest known provider states. Temporary provider failures are reported as degraded; it returns HTTP `503` for unavailable core dependencies or permanent provider failures.
- `GET /metrics` returns process-local counters and latest timings. Metrics reset when the application restarts.

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
PORT=3000

DISCORD_BOT_TOKEN=
DISCORD_AI_CHANNEL_ID=

OPENROUTER_API_KEY=
OPENROUTER_MODEL=
EMBEDDING_MODEL=openai/text-embedding-3-small
OPENROUTER_REQUEST_TIMEOUT_MS=30000
OPENROUTER_RETRY_INITIAL_DELAY_MS=500
OPENROUTER_RETRY_MAX_DELAY_MS=2000
OPENROUTER_RETRY_MAX_ELAPSED_TIME_MS=5000

AI_CONTEXT_MAX_CHARACTERS=12000
AI_CONTEXT_CANDIDATE_MESSAGES_LIMIT=50
AI_MEMORY_MAX_CHARACTERS=3000
AI_MEMORY_MAX_ITEMS=10

MEMORY_SIMILARITY_THRESHOLD=0.7
MEMORY_SEARCH_LIMIT=10

POSTGRES_USER=abu_ai
POSTGRES_PASSWORD=
POSTGRES_DB=abu_ai

DATABASE_URL=
DOCKER_DATABASE_URL=
```

| Variable | Description |
| --- | --- |
| `PORT` | Port used by the NestJS application |
| `DISCORD_BOT_TOKEN` | Discord bot authentication token |
| `DISCORD_AI_CHANNEL_ID` | Channel where Abu receives and answers messages |
| `OPENROUTER_API_KEY` | OpenRouter API key |
| `OPENROUTER_MODEL` | OpenRouter model identifier |
| `EMBEDDING_MODEL` | OpenRouter embedding model identifier |
| `OPENROUTER_REQUEST_TIMEOUT_MS` | Maximum duration of each OpenRouter request in milliseconds |
| `OPENROUTER_RETRY_INITIAL_DELAY_MS` | Initial retry backoff delay in milliseconds |
| `OPENROUTER_RETRY_MAX_DELAY_MS` | Maximum retry backoff delay in milliseconds |
| `OPENROUTER_RETRY_MAX_ELAPSED_TIME_MS` | Maximum total retry period in milliseconds |
| `AI_CONTEXT_MAX_CHARACTERS` | Maximum character budget for recent context |
| `AI_CONTEXT_CANDIDATE_MESSAGES_LIMIT` | Maximum number of recent database messages considered before applying the character budget |
| `AI_MEMORY_MAX_CHARACTERS` | Character budget for retrieved memories |
| `AI_MEMORY_MAX_ITEMS` | Maximum retrieved memories added to the AI context |
| `MEMORY_SIMILARITY_THRESHOLD` | Minimum cosine similarity accepted during retrieval |
| `MEMORY_SEARCH_LIMIT` | Maximum semantic search results |
| `POSTGRES_USER` | PostgreSQL user created by the Compose service |
| `POSTGRES_PASSWORD` | Required PostgreSQL password; never commit its value |
| `POSTGRES_DB` | PostgreSQL database created by the Compose service |
| `DATABASE_URL` | PostgreSQL connection string for commands running on the host through `localhost:5433` |
| `DOCKER_DATABASE_URL` | PostgreSQL connection string used by the API container through `postgres:5432` |

## Local Setup

Requirements:

- Node.js compatible with Prisma 7
- pnpm 10 or newer
- Docker with Docker Compose

Install dependencies and generate Prisma Client:

```bash
pnpm install
```

Start PostgreSQL:

```bash
docker compose up -d postgres
```

Apply development migrations:

```bash
pnpm prisma:migrate
```

Start the application:

```bash
pnpm start:dev
```

The PostgreSQL container listens on host port `5433` to avoid conflicts with local installations using port `5432`.

If PostgreSQL was initialized from an older Compose file with a different database name, back up any required data and recreate the development volume before applying migrations:

```bash
docker compose down -v
docker compose up -d postgres
pnpm prisma:migrate
```

## Docker Deployment

The production image uses a multi-stage build, installs only runtime dependencies, and runs as the non-root `node` user. The API container waits for PostgreSQL to become healthy, applies pending migrations with `prisma migrate deploy`, and then starts the compiled NestJS application.

Create `.env` from `.env.example` with valid Discord, OpenRouter, and PostgreSQL credentials. Set `DATABASE_URL` for commands executed on the host and the required `DOCKER_DATABASE_URL` with the internal `postgres:5432` hostname for the API container. Secrets are required at runtime and are not copied into the image. API port `3000` and PostgreSQL port `5433` are bound only to the host loopback interface; expose the API through a secured reverse proxy when remote access is required.

Build and start the API with PostgreSQL:

```bash
docker compose up --build -d
docker compose ps
```

Inspect API logs:

```bash
docker compose logs -f api
```

Check health and metrics from another terminal:

```bash
curl http://localhost:3000/health
curl http://localhost:3000/metrics
```

Stop the containers without deleting PostgreSQL data:

```bash
docker compose down
```

The image healthcheck calls `GET /health`. Do not use `prisma migrate dev` in production; the container startup command uses `prisma migrate deploy` automatically.

## Commands

```bash
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:deploy
pnpm format
pnpm lint
pnpm test
pnpm build
pnpm start:dev
pnpm start:prod
docker compose up --build -d
docker compose ps
```

## Discord Configuration

Create a bot in the Discord Developer Portal and enable `Message Content Intent`.

Grant these channel permissions:

- View Channels
- Send Messages

Copy the target channel ID to `DISCORD_AI_CHANNEL_ID`.

## Current Status

The current version persists conversations, manages contextual memory, applies bounded OpenRouter resilience, exposes safe operational endpoints, and runs through a production-oriented Docker image.
