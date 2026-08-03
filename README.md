[![en](https://img.shields.io/badge/lang-en-red.svg)](README.md) [![pt-br](https://img.shields.io/badge/lang-pt--br-green.svg)](README.pt-BR.md)

# Abu AI

Abu AI is a conversational Discord bot that interacts with users inside a dedicated server channel.

Built with NestJS, TypeScript, and discord.js, Abu AI connects to the Discord Gateway, listens for messages in a configured channel, and responds directly to the conversation.

The project will gradually evolve to use language models, conversation context, and memories extracted from the interactions of a group of friends.

> Abu AI is currently under development.

## Overview

Abu AI provides a dedicated space where users can communicate naturally with an artificial intelligence without using commands or mentioning the bot.

When a user sends a message in the configured Discord channel, the application receives the event through the Discord Gateway, processes the message, and sends a response in the same conversation.

The current version implements the Discord connection and message flow. The next stage will integrate OpenRouter to replace the fixed response with an AI-generated response.

## Goals

Abu AI is being developed as both a conversational application and a study project focused on:

* NestJS modular architecture
* Discord Gateway integration
* Event-driven communication
* External AI providers
* Conversation context
* Contextual memory
* Retrieval-augmented generation
* Background processing
* PostgreSQL and vector search

## Features

### Discord integration

* Connect to Discord through the Gateway
* Listen for new messages
* Respond inside a dedicated channel
* Ignore messages from other bots
* Ignore direct messages
* Display the typing indicator before responding
* Close the Discord connection when the application stops

### Configuration

* Load environment variables through NestJS Config
* Validate required variables during startup
* Configure the bot token and channel through the environment
* Prevent the application from starting with incomplete configuration

### Planned AI integration

* Generate responses through OpenRouter
* Define the bot personality through a system prompt
* Send recent messages as conversation context
* Persist conversations in PostgreSQL
* Retrieve relevant previous conversations
* Build contextual memory about the group

## Tech Stack

* [Node.js](https://nodejs.org/)
* [TypeScript](https://www.typescriptlang.org/)
* [NestJS](https://nestjs.com/)
* [discord.js](https://discord.js.org/)
* [OpenRouter](https://openrouter.ai/)
* [Joi](https://joi.dev/)
* [pnpm](https://pnpm.io/)

## Architecture

Abu AI is organized as a modular monolith.

Each integration and application responsibility is kept inside its own module. This allows the project to evolve without introducing separate services before they are necessary.

```text
abu-ai/
├── src/
│   ├── config/
│   │   └── app.config.ts
│   │
│   ├── modules/
│   │   └── discord/
│   │       ├── discord.module.ts
│   │       └── discord-client.service.ts
│   │
│   ├── app.module.ts
│   └── main.ts
│
├── test/
├── .env.example
├── nest-cli.json
├── package.json
├── pnpm-lock.yaml
├── tsconfig.build.json
├── tsconfig.json
└── README.md
```

### Current modules

| Module | Responsibility |
| --- | --- |
| `config` | Load and validate application configuration |
| `discord` | Connect to Discord, receive messages, and send responses |
| `app` | Compose the application modules |
| `main` | Start the NestJS application |

The project is expected to gain additional modules as its AI and memory features are implemented:

```text
modules/
├── discord/
├── ai/
├── conversations/
└── knowledge/
```

## Message flow

The current message flow is:

```text
Discord user
     ↓
Configured channel
     ↓
Discord Gateway
     ↓
DiscordClientService
     ↓
Message validation
     ↓
Bot response
```

After the OpenRouter integration, the flow will become:

```text
Discord user
     ↓
DiscordClientService
     ↓
ConversationService
     ↓
AIService
     ↓
OpenRouter
     ↓
Discord response
```

## Discord configuration

Create an application in the Discord Developer Portal and add a bot to it.

Enable the following privileged Gateway Intent:

```text
Message Content Intent
```

Install the bot in the Discord server with the following permissions:

```text
View Channels
Send Messages
Read Message History
```

Enable Developer Mode in Discord and copy the ID of the channel where the bot should respond.

## Environment variables

Create a `.env` file based on `.env.example`:

```env
PORT=3000

DISCORD_BOT_TOKEN=
DISCORD_AI_CHANNEL_ID=
```

| Variable | Description |
| --- | --- |
| `PORT` | Port used by the NestJS application |
| `DISCORD_BOT_TOKEN` | Token used to authenticate the Discord bot |
| `DISCORD_AI_CHANNEL_ID` | Channel where the bot receives and responds to messages |

## Installation

Clone the repository:

```bash
git clone https://github.com/daviPeter07/abu-ai.git
```

Enter the project directory:

```bash
cd abu-ai
```

Install the dependencies:

```bash
pnpm install
```

Create the `.env` file and configure the required variables.

## Running the application

Start the application in development mode:

```bash
pnpm start:dev
```

Build the project:

```bash
pnpm build
```

Run the compiled application:

```bash
pnpm start:prod
```

When the application starts successfully, the bot will appear online in Discord.

Send a message in the channel configured through `DISCORD_AI_CHANNEL_ID` and the bot will respond in the same conversation.

## Current status

The first development stage is complete.

Abu AI can currently:

* Connect to Discord
* Receive messages from a configured channel
* Validate the message source
* Display the typing indicator
* Send a fixed response

The next stage will introduce the OpenRouter integration and AI-generated responses.