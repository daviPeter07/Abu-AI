[![en](https://img.shields.io/badge/lang-en-red.svg)](README.md) [![pt-br](https://img.shields.io/badge/lang-pt--br-green.svg)](README.pt-BR.md)

# Abu AI

Abu AI é um bot conversacional para Discord que interage com usuários dentro de um canal específico do servidor.

Desenvolvido com NestJS, TypeScript e discord.js, o Abu AI conecta-se ao Gateway do Discord, recebe mensagens do canal configurado e responde diretamente na conversa.

O projeto evoluirá gradualmente para utilizar modelos de linguagem, contexto de conversas e memórias extraídas das interações de um grupo de amigos.

> O Abu AI está atualmente em desenvolvimento.

## Visão geral

O Abu AI oferece um espaço dedicado onde os usuários podem conversar naturalmente com uma inteligência artificial sem utilizar comandos ou mencionar o bot.

Quando um usuário envia uma mensagem no canal configurado, a aplicação recebe o evento por meio do Discord Gateway, processa a mensagem e envia uma resposta na mesma conversa.

A versão atual implementa a conexão com o Discord e o fluxo de mensagens. A próxima etapa integrará o OpenRouter para substituir a resposta fixa por uma resposta gerada por inteligência artificial.

## Objetivos

O Abu AI é desenvolvido tanto como uma aplicação conversacional quanto como um projeto de estudo focado em:

* Arquitetura modular com NestJS
* Integração com o Discord Gateway
* Comunicação orientada a eventos
* Provedores externos de inteligência artificial
* Contexto de conversas
* Memória contextual
* Geração aumentada por recuperação
* Processamento em segundo plano
* PostgreSQL e busca vetorial

## Funcionalidades

### Integração com o Discord

* Conectar-se ao Discord por meio do Gateway
* Receber novas mensagens
* Responder dentro de um canal dedicado
* Ignorar mensagens enviadas por outros bots
* Ignorar mensagens diretas
* Exibir o indicador de digitação antes de responder
* Encerrar a conexão quando a aplicação for desligada

### Configuração

* Carregar variáveis de ambiente com o NestJS Config
* Validar variáveis obrigatórias durante a inicialização
* Configurar o token e o canal por meio do ambiente
* Impedir a inicialização com configurações incompletas

### Integração planejada com IA

* Gerar respostas por meio do OpenRouter
* Definir a personalidade do bot por meio de um system prompt
* Utilizar mensagens recentes como contexto
* Persistir conversas no PostgreSQL
* Recuperar conversas antigas relevantes
* Construir memória contextual sobre o grupo

## Tecnologias utilizadas

* [Node.js](https://nodejs.org/)
* [TypeScript](https://www.typescriptlang.org/)
* [NestJS](https://nestjs.com/)
* [discord.js](https://discord.js.org/)
* [OpenRouter](https://openrouter.ai/)
* [Joi](https://joi.dev/)
* [pnpm](https://pnpm.io/)

## Arquitetura

O Abu AI é organizado como um monólito modular.

Cada integração e responsabilidade da aplicação permanece dentro de seu próprio módulo. Isso permite que o projeto evolua sem introduzir serviços separados antes que sejam necessários.

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

### Módulos atuais

| Módulo | Responsabilidade |
| --- | --- |
| `config` | Carregamento e validação das configurações |
| `discord` | Conexão com o Discord, recebimento de mensagens e envio de respostas |
| `app` | Composição dos módulos da aplicação |
| `main` | Inicialização da aplicação NestJS |

O projeto deverá receber novos módulos conforme as funcionalidades de inteligência artificial e memória forem implementadas:

```text
modules/
├── discord/
├── ai/
├── conversations/
└── knowledge/
```

## Fluxo das mensagens

O fluxo atual das mensagens é:

```text
Usuário do Discord
        ↓
Canal configurado
        ↓
Discord Gateway
        ↓
DiscordClientService
        ↓
Validação da mensagem
        ↓
Resposta do bot
```

Depois da integração com o OpenRouter, o fluxo será:

```text
Usuário do Discord
        ↓
DiscordClientService
        ↓
ConversationService
        ↓
AIService
        ↓
OpenRouter
        ↓
Resposta no Discord
```

## Configuração do Discord

Crie uma aplicação no Discord Developer Portal e adicione um bot a ela.

Ative a seguinte intenção privilegiada do Gateway:

```text
Intenção de conteúdo da mensagem
```

Instale o bot no servidor com as seguintes permissões:

```text
Ver canais
Enviar mensagens
Ler o histórico de mensagens
```

Ative o Modo Desenvolvedor no Discord e copie o ID do canal em que o bot deverá responder.

## Variáveis de ambiente

Crie um arquivo `.env` baseado no `.env.example`:

```env
PORT=3000

DISCORD_BOT_TOKEN=
DISCORD_AI_CHANNEL_ID=
```

| Variável | Descrição |
| --- | --- |
| `PORT` | Porta utilizada pela aplicação NestJS |
| `DISCORD_BOT_TOKEN` | Token utilizado para autenticar o bot do Discord |
| `DISCORD_AI_CHANNEL_ID` | Canal em que o bot recebe e responde mensagens |

## Instalação

Clone o repositório:

```bash
git clone https://github.com/daviPeter07/abu-ai.git
```

Entre no diretório do projeto:

```bash
cd abu-ai
```

Instale as dependências:

```bash
pnpm install
```

Crie o arquivo `.env` e configure as variáveis necessárias.

## Executando a aplicação

Inicie a aplicação em modo de desenvolvimento:

```bash
pnpm start:dev
```

Compile o projeto:

```bash
pnpm build
```

Execute a aplicação compilada:

```bash
pnpm start:prod
```

Quando a aplicação iniciar corretamente, o bot aparecerá online no Discord.

Envie uma mensagem no canal configurado por meio de `DISCORD_AI_CHANNEL_ID` e o bot responderá na mesma conversa.

## Estado atual

A primeira etapa de desenvolvimento está concluída.

Atualmente, o Abu AI consegue:

* Conectar-se ao Discord
* Receber mensagens de um canal configurado
* Validar a origem da mensagem
* Exibir o indicador de digitação
* Enviar uma resposta fixa

A próxima etapa introduzirá a integração com o OpenRouter e respostas geradas por inteligência artificial.