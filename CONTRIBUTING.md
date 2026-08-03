[![en](https://img.shields.io/badge/lang-en-red.svg)](CONTRIBUTING.md) [![pt-br](https://img.shields.io/badge/lang-pt--br-green.svg)](CONTRIBUTING.pt-BR.md)

# Contributing to Abu AI

Thank you for your interest in contributing to Abu AI.

Abu AI is developed as a modular NestJS application that connects to Discord and will gradually introduce AI-generated conversations, contextual memory, and retrieval-augmented generation.

## Before contributing

Before starting a change:

1. Search the existing issues.
2. Check whether the task is already being developed.
3. Create or select an issue describing the change.
4. Discuss large architectural changes before implementing them.

Small corrections and documentation improvements may be submitted directly.

## Development environment

Requirements:

* Node.js 24
* pnpm
* A Discord application with a bot
* A Discord server for local testing

Clone the repository:

```bash
git clone https://github.com/daviPeter07/abu-ai.git
cd abu-ai
```

Install the dependencies:

```bash
pnpm install
```

Create the environment file:

```bash
cp .env.example .env
```

Configure the required variables:

```env
PORT=3000

DISCORD_BOT_TOKEN=
DISCORD_AI_CHANNEL_ID=
```

Start the application:

```bash
pnpm start:dev
```

## Branches

Create branches from `main`.

Use one of the following prefixes:

```text
feat/
fix/
refactor/
docs/
test/
chore/
```

Examples:

```text
feat/openrouter-provider
fix/discord-message-handler
refactor/discord-client
docs/contribution-guide
```

## Commits

Write concise commits that describe the change.

Examples:

```text
feat: create AI module
fix: prevent responses outside the configured channel
refactor: separate Discord event handling
docs: add contribution guidelines
test: add AI service tests
chore: update dependencies
```

Keep unrelated changes in separate commits.

## Project architecture

The application follows a modular monolith architecture.

Each module should own a clear responsibility:

```text
discord       Discord connection and events
ai            AI providers and response generation
conversations Conversation orchestration and history
knowledge     Contextual memory and semantic retrieval
database      Persistence and database access
```

Avoid placing business logic directly inside Discord event listeners.

Discord handlers should delegate processing to application services.

External providers should be isolated behind interfaces or injection tokens when multiple implementations may exist.

Do not introduce queues, databases, workers, or new infrastructure without a concrete requirement.

## Code quality

Before opening a pull request, run:

```bash
pnpm lint
pnpm test -- --passWithNoTests
pnpm build
```

The project must compile without TypeScript errors.

Avoid:

* Unused dependencies
* Unrelated refactoring
* Large formatting-only changes
* Environment values committed to the repository
* Business logic inside configuration files
* Direct access to `process.env` outside the configuration layer

## Pull requests

Each pull request should:

* Address one clear issue or objective
* Explain what changed
* Explain how the change was tested
* Reference the related issue
* Keep the scope limited
* Update documentation when behavior changes

Use the following syntax to close an issue automatically:

```text
Closes #12
```

Pull requests may receive requested changes before being merged.

## Reporting bugs

Use the Bug Report template and include:

* Steps to reproduce
* Expected behavior
* Actual behavior
* Relevant logs
* Node.js and pnpm versions
* Operating system

Do not include Discord tokens or other credentials in issues.

## Proposing features

Use the Feature Request template.

Describe the problem before proposing the implementation. A contribution may be declined when it introduces complexity that is not required by the current project goals.