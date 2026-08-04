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
- Prevents duplicate Discord events from creating duplicate records or replies.
- Connects to PostgreSQL during NestJS startup and disconnects during shutdown.

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
│   └── discord/
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

`DatabaseModule` is not global. Modules that need database access must import it explicitly.

## Message Flow

```text
Discord message
      ↓
DiscordClientService
      ↓
ConversationsService
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

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
PORT=3000

DISCORD_BOT_TOKEN=
DISCORD_AI_CHANNEL_ID=

OPENROUTER_API_KEY=
OPENROUTER_MODEL=

AI_CONTEXT_MAX_CHARACTERS=12000
AI_CONTEXT_CANDIDATE_MESSAGES_LIMIT=50

DATABASE_URL=postgresql://postgres:postgres@localhost:5433/abu_ai?schema=public
```

| Variable | Description |
| --- | --- |
| `PORT` | Port used by the NestJS application |
| `DISCORD_BOT_TOKEN` | Discord bot authentication token |
| `DISCORD_AI_CHANNEL_ID` | Channel where Abu receives and answers messages |
| `OPENROUTER_API_KEY` | OpenRouter API key |
| `OPENROUTER_MODEL` | OpenRouter model identifier |
| `AI_CONTEXT_MAX_CHARACTERS` | Maximum character budget for recent context |
| `AI_CONTEXT_CANDIDATE_MESSAGES_LIMIT` | Maximum number of recent database messages considered before applying the character budget |
| `DATABASE_URL` | PostgreSQL connection string used by NestJS and Prisma |

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
docker compose up -d
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
docker compose up -d
pnpm prisma:migrate
```

## Commands

```bash
pnpm prisma:generate
pnpm prisma:migrate
pnpm format
pnpm lint
pnpm test
pnpm build
pnpm start:dev
pnpm start:prod
```

## Discord Configuration

Create a bot in the Discord Developer Portal and enable `Message Content Intent`.

Grant these channel permissions:

- View Channels
- Send Messages

Copy the target channel ID to `DISCORD_AI_CHANNEL_ID`.

## Current Status

The current version persists conversation messages and loads recent context from PostgreSQL. The history remains available after application restarts and is isolated by Discord guild and channel.
