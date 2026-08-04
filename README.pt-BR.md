[![en](https://img.shields.io/badge/lang-en-red.svg)](README.md) [![pt-br](https://img.shields.io/badge/lang-pt--br-green.svg)](README.pt-BR.md)

# Abu AI

O Abu AI é um bot conversacional para Discord que utiliza o OpenRouter para responder mensagens em um canal específico do servidor. Ele persiste as conversas no PostgreSQL e utiliza esse histórico como contexto recente.

> O Abu AI está em desenvolvimento ativo.

## Funcionalidades

- Conecta-se ao Gateway do Discord e acompanha um canal configurado.
- Ignora bots, mensagens diretas, mensagens vazias e mensagens de outros canais.
- Exibe o indicador de digitação e responde diretamente à mensagem original.
- Gera respostas pelo OpenRouter com o system prompt do Abu.
- Identifica usuários pelo nome de exibição do Discord no contexto da IA.
- Carrega mensagens recentes do PostgreSQL e limita o contexto por candidatos e caracteres.
- Preserva o contexto da conversa após reinicializações da aplicação.
- Persiste mensagens dos usuários e as respostas efetivamente enviadas pelo bot.
- Mantém um perfil por ID imutável do Discord e atualiza mudanças de nome.
- Permite criar e consultar manualmente memórias de usuário e de grupo.
- Impede que eventos repetidos do Discord criem registros ou respostas duplicadas.
- Conecta-se ao PostgreSQL durante a inicialização do NestJS e desconecta no encerramento.

## Tecnologias

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

## Arquitetura

A aplicação é um monólito modular. As regras de negócio e aplicação não dependem diretamente do `discord.js` ou do Prisma.

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
│   └── memory/
├── app.module.ts
└── main.ts

prisma/
├── migrations/
└── schema.prisma
```

| Módulo | Responsabilidade |
| --- | --- |
| `config` | Carrega e valida as configurações da aplicação |
| `database` | Controla o Prisma Client e o ciclo de vida do PostgreSQL |
| `ai` | Define o contrato de IA e a implementação do OpenRouter |
| `conversations` | Orquestra persistência, janela de contexto e geração de respostas |
| `discord` | Traduz eventos e mensagens do Discord para contratos da aplicação |
| `discord-users` | Mantém perfis identificados pelo ID imutável do Discord |
| `memory` | Valida e persiste memórias contextuais de usuário e grupo |

O `DatabaseModule` não é global. Cada módulo que utiliza o banco deve importá-lo explicitamente.

## Fluxo das Mensagens

```text
Mensagem do Discord
         ↓
DiscordClientService
         ↓
ConversationsService
         ↓
Atualizar perfil do usuário do Discord
         ↓
Persistir mensagem do usuário
         ↓
Carregar contexto recente do PostgreSQL
         ↓
ConversationContextWindowService
         ↓
AiService → OpenRouterProvider
         ↓
Enviar resposta no Discord
         ↓
Persistir mensagem enviada pelo assistente
```

O repository utiliza o `discordMessageId` único e o suporte `skipDuplicates` do PostgreSQL. Um evento repetido é ignorado antes de gerar outra resposta.

O contexto recente é isolado por servidor e canal do Discord. A mensagem atual e mensagens criadas depois dela são excluídas da consulta porque a mensagem atual será adicionada separadamente à janela de contexto. O PostgreSQL seleciona primeiro os candidatos anteriores mais recentes e o repository restaura a ordem cronológica antes de enviá-los para a IA.

As falhas de persistência possuem comportamento explícito:

- Se a mensagem do usuário não puder ser salva, o erro é registrado e o processamento termina antes de gerar uma resposta. Uma nova entrega do evento poderá tentar novamente com segurança.
- Se a geração da IA falhar, a mensagem do usuário permanece salva e o Discord recebe a resposta operacional amigável já existente.
- Se o envio da resposta falhar, nenhuma mensagem conversacional do assistente é persistida.
- Se a resposta enviada não puder ser salva, o erro é registrado e a resposta já entregue no Discord é preservada.

Respostas operacionais de erro não são persistidas como histórico da conversa.

As chamadas externas ao Discord e ao OpenRouter não são envolvidas em uma transação de banco.

## Perfis de Usuários

Cada autor de mensagem é associado a um perfil `DiscordUser` pelo ID imutável do Discord. Mudanças de username ou nome de exibição atualizam o mesmo perfil em vez de criar outro usuário. As mensagens mantêm `authorName` como snapshot histórico do nome exibido no momento do envio.

A migration de perfis cria registros para autores de mensagens existentes. Usernames históricos permanecem vazios quando não podem ser reconstruídos com segurança e são atualizados quando o usuário envia outra mensagem.

## Fundação de Memória

O `MemoryModule` permite criar e consultar memórias contextuais manualmente pelo `MemoryService`:

- Memórias `USER` exigem um usuário do Discord como sujeito.
- Memórias `GROUP` exigem um servidor e podem referenciar opcionalmente um usuário.
- Os tipos incluem fatos, preferências, relacionamentos, projetos, eventos e outras informações.
- Os status incluem ativa, substituída e rejeitada.
- A confiança deve estar entre `0` e `1`.
- Uma memória pode referenciar sua mensagem de origem no Discord.

A extração de memórias e a injeção nas conversas da IA ainda não são automáticas. Redis, BullMQ, workers, embeddings e busca vetorial não fazem parte da implementação atual.

## Variáveis de Ambiente

Crie um arquivo `.env` baseado no `.env.example`:

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

| Variável | Descrição |
| --- | --- |
| `PORT` | Porta utilizada pela aplicação NestJS |
| `DISCORD_BOT_TOKEN` | Token de autenticação do bot do Discord |
| `DISCORD_AI_CHANNEL_ID` | Canal em que o Abu recebe e responde mensagens |
| `OPENROUTER_API_KEY` | Chave da API do OpenRouter |
| `OPENROUTER_MODEL` | Identificador do modelo no OpenRouter |
| `AI_CONTEXT_MAX_CHARACTERS` | Limite de caracteres do contexto recente |
| `AI_CONTEXT_CANDIDATE_MESSAGES_LIMIT` | Quantidade máxima de mensagens recentes do banco consideradas antes do limite por caracteres |
| `DATABASE_URL` | String de conexão PostgreSQL utilizada pelo NestJS e Prisma |

## Configuração Local

Requisitos:

- Node.js compatível com o Prisma 7
- pnpm 10 ou superior
- Docker com Docker Compose

Instale as dependências e gere o Prisma Client:

```bash
pnpm install
```

Inicie o PostgreSQL:

```bash
docker compose up -d
```

Aplique as migrations de desenvolvimento:

```bash
pnpm prisma:migrate
```

Inicie a aplicação:

```bash
pnpm start:dev
```

O container PostgreSQL utiliza a porta `5433` no host para evitar conflitos com instalações locais na porta `5432`.

Se o PostgreSQL tiver sido inicializado por uma versão anterior do Compose com outro nome de banco, faça backup dos dados necessários e recrie o volume de desenvolvimento antes de aplicar as migrations:

```bash
docker compose down -v
docker compose up -d
pnpm prisma:migrate
```

## Comandos

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

## Configuração do Discord

Crie um bot no Discord Developer Portal e ative o `Message Content Intent`.

Conceda estas permissões no canal:

- Ver canais
- Enviar mensagens

Copie o ID do canal desejado para `DISCORD_AI_CHANNEL_ID`.

## Estado Atual

A versão atual persiste conversas, mantém perfis de usuários do Discord, carrega contexto recente do PostgreSQL e fornece a fundação manual de memória contextual. A extração automática de memórias é o próximo incremento planejado.
