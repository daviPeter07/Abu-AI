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
- Extrai memórias explícitas com um prompt estruturado específico.
- Confirma memórias equivalentes e preserva o histórico substituído.
- Recupera memórias relevantes por embeddings e similaridade de cosseno.
- Permite visualizar, esquecer, limpar, desativar e ativar as próprias memórias.
- Impede que eventos repetidos do Discord criem registros ou respostas duplicadas.
- Conecta-se ao PostgreSQL durante a inicialização do NestJS e desconecta no encerramento.
- Aplica timeout e tentativas limitadas apenas para falhas temporárias do OpenRouter.
- Expõe endpoints seguros de saúde e métricas operacionais em memória.

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
│   ├── health/
│   ├── memory/
│   └── observability/
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
| `observability` | Registra em memória métricas seguras de providers, conversas e tempos |
| `health` | Informa o estado do PostgreSQL, Discord e providers de IA |

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

A extração de memórias é executada de forma síncrona depois que a resposta é entregue no Discord. O extrator valida JSON estrito, rejeita informações sensíveis, ignora evidências repetidas, aumenta a confiança em confirmações e marca contradições como `SUPERSEDED` sem apagar o histórico.

Memórias relevantes agora são injetadas no contexto da IA como dados delimitados e não confiáveis, com limites separados de itens e caracteres. O Prisma ORM 7 armazena embeddings como `Float[]`; a similaridade de cosseno é calculada na aplicação porque o Prisma estável ainda não expõe queries tipadas de pgvector.

Comandos de gestão:

- `/memorias`
- `/esquecer <memoryId>`
- `/limpar-memorias`
- `/memoria-status`
- `/memoria-status ativar`
- `/memoria-status desativar`

Usuários só podem visualizar ou alterar suas próprias memórias individuais. Alterações usam remoção lógica pelo status `REJECTED` e são registradas na tabela de auditoria.

## Resiliência e Observabilidade

As requisições de chat e embeddings ao OpenRouter usam timeout explícito e backoff exponencial limitado. Novas tentativas ocorrem apenas em falhas de conexão e respostas HTTP `408`, `429` e `5xx`. Erros permanentes de autenticação, créditos, modelo e outros não são repetidos e geram mensagens operacionais seguras, sem registrar API keys, prompts ou conteúdo das mensagens.

Cada mensagem do Discord utiliza seu ID imutável como correlation ID. Logs estruturados e métricas em memória registram chamadas e falhas dos providers, tempo de recuperação do contexto, busca de memória, geração da resposta, processamento total, caracteres enviados e quantidade de memórias recuperadas.

Endpoints operacionais:

- `GET /health` verifica o PostgreSQL pelo Prisma, a prontidão do Discord e o último estado conhecido dos providers. Falhas temporárias dos providers são informadas como degradação; o endpoint retorna HTTP `503` para dependências centrais indisponíveis ou falhas permanentes dos providers.
- `GET /metrics` retorna contadores e últimos tempos locais do processo. As métricas são reiniciadas junto com a aplicação.

## Variáveis de Ambiente

Crie um arquivo `.env` baseado no `.env.example`:

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

| Variável | Descrição |
| --- | --- |
| `PORT` | Porta utilizada pela aplicação NestJS |
| `DISCORD_BOT_TOKEN` | Token de autenticação do bot do Discord |
| `DISCORD_AI_CHANNEL_ID` | Canal em que o Abu recebe e responde mensagens |
| `OPENROUTER_API_KEY` | Chave da API do OpenRouter |
| `OPENROUTER_MODEL` | Identificador do modelo no OpenRouter |
| `EMBEDDING_MODEL` | Identificador do modelo de embeddings no OpenRouter |
| `OPENROUTER_REQUEST_TIMEOUT_MS` | Duração máxima de cada requisição ao OpenRouter em milissegundos |
| `OPENROUTER_RETRY_INITIAL_DELAY_MS` | Intervalo inicial do backoff em milissegundos |
| `OPENROUTER_RETRY_MAX_DELAY_MS` | Intervalo máximo do backoff em milissegundos |
| `OPENROUTER_RETRY_MAX_ELAPSED_TIME_MS` | Período total máximo para novas tentativas em milissegundos |
| `AI_CONTEXT_MAX_CHARACTERS` | Limite de caracteres do contexto recente |
| `AI_CONTEXT_CANDIDATE_MESSAGES_LIMIT` | Quantidade máxima de mensagens recentes do banco consideradas antes do limite por caracteres |
| `AI_MEMORY_MAX_CHARACTERS` | Limite de caracteres das memórias recuperadas |
| `AI_MEMORY_MAX_ITEMS` | Quantidade máxima de memórias adicionadas ao contexto da IA |
| `MEMORY_SIMILARITY_THRESHOLD` | Similaridade de cosseno mínima para recuperação |
| `MEMORY_SEARCH_LIMIT` | Quantidade máxima de resultados da busca semântica |
| `POSTGRES_USER` | Usuário do PostgreSQL criado pelo serviço do Compose |
| `POSTGRES_PASSWORD` | Senha obrigatória do PostgreSQL; nunca versione seu valor |
| `POSTGRES_DB` | Banco PostgreSQL criado pelo serviço do Compose |
| `DATABASE_URL` | String de conexão para comandos executados no host por `localhost:5433` |
| `DOCKER_DATABASE_URL` | String de conexão utilizada pela API no container por `postgres:5432` |

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
docker compose up -d postgres
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
docker compose up -d postgres
pnpm prisma:migrate
```

## Deploy com Docker

A imagem de produção utiliza build multi-stage, instala apenas dependências de runtime e executa com o usuário não-root `node`. O container da API aguarda o PostgreSQL ficar saudável, aplica migrations pendentes com `prisma migrate deploy` e então inicia a aplicação NestJS compilada.

Crie o `.env` a partir do `.env.example` com credenciais válidas do Discord, OpenRouter e PostgreSQL. Defina `DATABASE_URL` para comandos executados no host e a variável obrigatória `DOCKER_DATABASE_URL` com o hostname interno `postgres:5432` para o container da API. Os segredos são obrigatórios em runtime e não são copiados para a imagem. As portas `3000` da API e `5433` do PostgreSQL ficam vinculadas apenas à interface de loopback do host; utilize um proxy reverso seguro quando precisar de acesso remoto.

Construa e inicie a API com o PostgreSQL:

```bash
docker compose up --build -d
docker compose ps
```

Consulte os logs da API:

```bash
docker compose logs -f api
```

Em outro terminal, consulte a saúde e as métricas:

```bash
curl http://localhost:3000/health
curl http://localhost:3000/metrics
```

Encerre os containers sem remover os dados do PostgreSQL:

```bash
docker compose down
```

O healthcheck da imagem consulta `GET /health`. Não utilize `prisma migrate dev` em produção; o comando de inicialização do container executa `prisma migrate deploy` automaticamente.

## Comandos

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

## Configuração do Discord

Crie um bot no Discord Developer Portal e ative o `Message Content Intent`.

Conceda estas permissões no canal:

- Ver canais
- Enviar mensagens

Copie o ID do canal desejado para `DISCORD_AI_CHANNEL_ID`.

## Estado Atual

A versão atual persiste conversas, gerencia memória contextual, aplica resiliência limitada ao OpenRouter, expõe endpoints operacionais seguros e executa por uma imagem Docker orientada à produção.
