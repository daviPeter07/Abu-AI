Você atuará como arquiteto de software sênior e desenvolvedor responsável pela evolução incremental do projeto Abu AI.

Repositório:
https://github.com/daviPeter07/Abu-AI

O projeto é um bot conversacional para Discord que recebe mensagens em um canal específico, gera respostas por meio do OpenRouter e responde diretamente no Discord.

STACK ATUAL

- Node.js
- TypeScript
- NestJS
- discord.js
- OpenRouter SDK
- Joi
- Jest
- pnpm
- PostgreSQL e Prisma serão adicionados nas próximas etapas
- Redis e BullMQ só devem ser adicionados quando o processamento assíncrono realmente for necessário

ARQUITETURA ATUAL

A aplicação utiliza um monólito modular.

Fluxo principal:

DiscordClientService
→ ConversationsService
→ ConversationContextWindowService
→ AiService
→ AiProvider
→ OpenRouterProvider

Módulos atuais:

src/
├── config/
├── generated/
├── modules/
│   ├── ai/
│   ├── conversations/
│   └── discord/
├── app.module.ts
└── main.ts

FUNCIONALIDADES JÁ IMPLEMENTADAS

- Conexão com o Discord Gateway
- Escuta de mensagens em um canal específico
- Filtro de mensagens de bots, mensagens privadas e canais incorretos
- Indicador de digitação
- Resposta no mesmo canal
- Limitação da resposta para o tamanho aceito pelo Discord
- Contrato abstrato para provedores de IA
- Integração com OpenRouter
- System prompt com a personalidade do Abu
- Identificação do nome dos usuários
- Busca de mensagens recentes no Discord
- Diferenciação entre mensagens de usuário e mensagens do Abu
- Uso das mensagens recentes como contexto temporário
- Janela de contexto limitada por caracteres
- Priorização das mensagens mais recentes
- Testes unitários do módulo de conversas

PADRÕES OBRIGATÓRIOS

- Manter um monólito modular
- Não criar microserviços
- Não criar uma pasta bootstrap
- Manter a inicialização em src/main.ts
- Manter todas as configurações em src/config/app.config.ts
- Utilizar ConfigService e getOrThrow para configurações obrigatórias
- Utilizar injeção de dependência do NestJS
- Usar import type para tipos
- Não usar any
- Não usar dynamic import
- Não acoplar regras de negócio ao discord.js
- Não acoplar regras de negócio diretamente ao Prisma
- Não acessar Prisma diretamente nos serviços de aplicação
- Criar repositories para persistência de dados
- Não tornar DatabaseModule global
- Cada módulo deve importar explicitamente suas dependências
- Utilizar nomes de classes, métodos e variáveis em inglês
- Utilizar mensagens de erro e logs em português
- Manter tratamento explícito de erros
- Não ocultar erros com catch vazio
- Não adicionar dependências sem necessidade
- Não criar abstrações sem uso real
- Não antecipar Redis, BullMQ, embeddings ou pgvector antes do PR correspondente
- Preservar compatibilidade com a configuração TypeScript atual
- Utilizar pnpm
- Utilizar Jest
- Manter os READMEs em inglês e português atualizados
- Não alterar arquivos não relacionados ao escopo do PR
- Não afirmar que comandos ou testes foram executados quando não foram

FLUXO DE TRABALHO

Implemente somente um PR por vez.

Antes de começar cada PR:

1. Leia os arquivos atuais do repositório
2. Confirme a branch atual
3. Atualize a main
4. Crie a branch especificada
5. Analise o código existente antes de modificar qualquer arquivo
6. Adapte a implementação à estrutura real encontrada no repositório
7. Não recrie funcionalidades já existentes

Ao concluir cada PR, entregue:

1. Resumo técnico da implementação
2. Lista de arquivos criados
3. Lista de arquivos modificados
4. Conteúdo completo de todos os arquivos criados ou modificados
5. Comandos necessários
6. Migrations necessárias
7. Testes unitários
8. Cenários de teste manual
9. Comandos de validação
10. Mensagem de commit
11. Título do PR
12. Descrição completa do PR em português começando com “## Resumo”
13. Possíveis riscos ou limitações
14. Próximo PR recomendado

Sempre valide com:

pnpm format
pnpm lint
pnpm test
pnpm build

Quando houver banco:

pnpm prisma:generate
pnpm prisma:migrate

Quando houver Docker:

docker compose config
docker compose ps

Pare depois de concluir cada PR. Não implemente dois PRs juntos.

ROADMAP DE IMPLEMENTAÇÃO

==================================================
PR 1: FUNDAÇÃO DO POSTGRESQL E PRISMA
==================================================

Branch:

feat/database-foundation

Título:

feat: add PostgreSQL and Prisma database foundation

Objetivo:

Adicionar a infraestrutura inicial de banco de dados sem persistir mensagens na regra de negócio ainda.

Implementar:

- PostgreSQL com Docker Compose
- Prisma ORM
- Driver adapter para PostgreSQL compatível com a versão instalada do Prisma
- prisma.config.ts
- prisma/schema.prisma
- Primeira migration
- Prisma Client gerado em src/generated/prisma
- DatabaseModule
- PrismaService
- Integração com OnModuleInit e OnModuleDestroy
- Validação de DATABASE_URL
- Scripts do Prisma no package.json
- Configuração da CI para gerar o Prisma Client
- Exclusão dos arquivos gerados do ESLint e Prettier
- Atualização dos READMEs

Modelo inicial:

ConversationMessage

Campos mínimos:

- id
- discordMessageId único
- guildId
- channelId
- authorId
- authorName
- role
- content
- discordCreatedAt
- createdAt
- updatedAt

Papéis:

- USER
- ASSISTANT

Criar índice para consultas por:

- guildId
- channelId
- discordCreatedAt

Não implementar ainda:

- Salvamento das mensagens
- Busca do contexto pelo banco
- Redis
- BullMQ
- Embeddings
- pgvector

Critérios de aceite:

- PostgreSQL inicia com Docker Compose
- Migration é aplicada
- Prisma Client é gerado
- NestJS conecta ao banco ao iniciar
- NestJS desconecta ao encerrar
- A aplicação falha claramente quando o banco está indisponível
- Lint, testes e build funcionam

==================================================
PR 2: PERSISTÊNCIA DAS MENSAGENS
==================================================

Branch:

feat/persist-conversation-messages

Título:

feat: persist Discord conversation messages

Objetivo:

Salvar no PostgreSQL a mensagem recebida do usuário e a resposta enviada pelo Abu.

Criar um repository específico para mensagens.

Estrutura sugerida:

src/modules/conversations/
├── repositories/
│   ├── conversation-message.repository.ts
│   └── prisma-conversation-message.repository.ts
├── contracts/
├── conversations.service.ts
└── conversations.module.ts

Implementar:

- Contrato ConversationMessageRepository
- Token de injeção para o repository
- Implementação com Prisma
- Método para persistir mensagem de usuário
- Método para persistir mensagem do Abu
- Idempotência baseada em discordMessageId
- Persistência do guildId e channelId
- Persistência do ID real do autor no Discord
- Persistência do nome exibido
- Persistência da data original da mensagem do Discord
- Uso do ID da mensagem enviada pelo Abu
- Testes unitários do fluxo
- Testes do repository quando aplicável
- Atualização dos READMEs

O fluxo deverá ser:

1. Receber mensagem do Discord
2. Persistir mensagem do usuário
3. Gerar resposta
4. Enviar resposta no Discord
5. Persistir mensagem enviada pelo Abu

O retorno de message.reply deve ser armazenado para obter:

- ID da mensagem do Abu
- Data da mensagem
- ID do autor
- Conteúdo efetivamente enviado

Falhas de persistência precisam ser registradas.

Não duplicar mensagens quando o mesmo evento for recebido novamente.

Decidir explicitamente o comportamento em caso de falha:

- Falha ao salvar a mensagem do usuário
- Falha ao gerar a resposta
- Falha ao enviar ao Discord
- Falha ao salvar a mensagem do Abu

Não utilizar transação para envolver chamadas ao Discord ou OpenRouter.

Critérios de aceite:

- Mensagem do usuário é salva
- Resposta do Abu é salva
- Eventos repetidos não criam duplicatas
- IDs reais do Discord são persistidos
- Mensagens permanecem no banco depois que a aplicação reinicia
- Testes cobrem o fluxo principal e duplicidades

==================================================
PR 3: CONTEXTO RECENTE VINDO DO POSTGRESQL
==================================================

Branch:

feat/database-conversation-context

Título:

feat: load recent conversation context from PostgreSQL

Objetivo:

Substituir o histórico temporário carregado diretamente do Discord por mensagens persistidas no PostgreSQL.

Implementar:

- Método findRecentByChannel no repository
- Consulta por guildId e channelId
- Ordenação por discordCreatedAt
- Limite configurável de mensagens candidatas
- Conversão das entidades persistidas para ConversationMessage
- Uso do banco no ConversationsService
- Remoção ou desativação do DiscordConversationContextService
- Manutenção do ConversationContextWindowService
- Testes unitários
- Atualização dos READMEs

Fluxo:

Mensagem atual
→ persistir mensagem
→ buscar histórico no PostgreSQL
→ montar janela de contexto
→ OpenRouter
→ enviar resposta
→ persistir resposta

Evitar incluir a mensagem atual duas vezes no contexto.

A mensagem atual pode ser:

- excluída da consulta por discordMessageId
- ou carregada separadamente

Escolha uma solução explícita e testável.

Critérios de aceite:

- O Abu mantém contexto depois de reiniciar a aplicação
- O Discord não é mais a fonte principal do histórico
- O contexto continua limitado por caracteres
- A ordem cronológica é preservada
- O histórico é isolado por guild e canal

==================================================
PR 4: DOMÍNIO DE USUÁRIOS DO DISCORD
==================================================

Branch:

feat/discord-user-profiles

Título:

feat: add Discord user profiles

Objetivo:

Separar usuários das mensagens e preparar o sistema para memória individual.

Criar modelo DiscordUser:

- id interno
- discordUserId único
- username
- displayName
- firstSeenAt
- lastSeenAt
- createdAt
- updatedAt

Relacionar ConversationMessage com DiscordUser.

Implementar:

- Migration
- DiscordUsersModule ou responsabilidade equivalente dentro de conversations
- DiscordUserRepository
- PrismaDiscordUserRepository
- Upsert do usuário ao receber uma mensagem
- Atualização do nome quando ele mudar
- Associação das mensagens ao usuário persistido
- Testes
- Atualização dos READMEs

Não criar autenticação.

Não utilizar o username como identificador.

O identificador confiável é discordUserId.

Critérios de aceite:

- Cada usuário possui um registro único
- Mudanças de nome não criam novos usuários
- Mensagens apontam para o usuário correto
- Informações antigas continuam associadas ao mesmo usuário

==================================================
PR 5: MODELO DE MEMÓRIA CONTEXTUAL
==================================================

Branch:

feat/contextual-memory-foundation

Título:

feat: add contextual memory foundation

Objetivo:

Criar a estrutura de memória sem realizar extração automática ainda.

Criar módulo:

src/modules/memory/

Estrutura sugerida:

memory/
├── contracts/
├── repositories/
├── memory.module.ts
├── memory.service.ts
└── enums/

Criar modelo Memory:

- id
- scope
- type
- content
- normalizedContent
- subjectUserId opcional
- confidence
- status
- sourceMessageId opcional
- createdAt
- updatedAt
- lastConfirmedAt opcional

Scopes iniciais:

- USER
- GROUP

Tipos iniciais:

- FACT
- PREFERENCE
- RELATIONSHIP
- PROJECT
- EVENT
- OTHER

Status:

- ACTIVE
- SUPERSEDED
- REJECTED

Implementar:

- Migration
- Contrato MemoryRepository
- PrismaMemoryRepository
- MemoryService
- Métodos create, findByUser e findByGroup
- Validação dos dados
- Testes
- Atualização dos READMEs

Não implementar embeddings ainda.

Não extrair memórias automaticamente ainda.

Critérios de aceite:

- Memórias podem ser armazenadas manualmente
- Memórias podem pertencer a um usuário ou ao grupo
- Memórias possuem origem rastreável
- Estrutura suporta substituição futura de informações desatualizadas

==================================================
PR 6: EXTRAÇÃO DE MEMÓRIAS COM IA
==================================================

Branch:

feat/memory-extraction

Título:

feat: extract contextual memories from conversations

Objetivo:

Usar a IA para analisar mensagens e identificar fatos que podem ser armazenados como memória.

Criar contrato separado para extração estruturada.

Não reutilizar diretamente o prompt conversacional do Abu.

Criar prompt específico de extração.

A resposta do modelo deve ser estruturada e validada.

Formato esperado:

{
  "memories": [
    {
      "scope": "USER",
      "type": "PREFERENCE",
      "subjectDiscordUserId": "123",
      "content": "Davi gosta de Minecraft",
      "confidence": 0.92
    }
  ]
}

Implementar:

- MemoryExtractorService
- Prompt específico
- Contrato de saída
- Validação rigorosa da resposta
- Limpeza de blocos markdown quando necessário
- Rejeição de JSON inválido
- Nenhuma memória criada a partir de respostas vazias
- Nenhuma memória criada quando não houver informação relevante
- Associação da memória à mensagem de origem
- Testes com provider mock
- Atualização dos READMEs

Regras de extração:

- Não armazenar cumprimentos
- Não armazenar mensagens temporárias irrelevantes
- Não inventar informações
- Não salvar suposições como fatos
- Não salvar segredos, tokens, senhas ou credenciais
- Não salvar informações claramente sensíveis sem necessidade
- Utilizar confidence
- Preferir memórias explícitas

Inicialmente, executar a extração de forma síncrona somente para validar o domínio.

Não adicionar BullMQ ainda neste PR.

==================================================
PR 7: REDIS E BULLMQ PARA PROCESSAMENTO ASSÍNCRONO
==================================================

Branch:

feat/async-memory-processing

Título:

feat: process contextual memories asynchronously

Objetivo:

Retirar a extração de memória do caminho principal da resposta.

Adicionar:

- Redis no Docker Compose
- BullMQ
- QueueModule
- Constantes das filas
- Serviço para publicar jobs
- Processor para extrair memórias
- Retry com backoff
- Limite de tentativas
- Logs de falha
- Remoção automática de jobs concluídos
- Retenção controlada de jobs com falha
- Encerramento correto do worker
- Testes
- Atualização da CI quando necessário
- Atualização dos READMEs

Fluxo:

Mensagem persistida
→ resposta enviada normalmente
→ job publicado
→ worker analisa a conversa
→ memórias são persistidas

A indisponibilidade da fila não deve impedir o Abu de responder quando for possível.

Não criar microserviço separado.

Executar worker dentro do mesmo projeto, com comando separado:

pnpm start:worker

Estrutura possível:

src/
├── main.ts
├── worker.ts
└── modules/
    ├── queue/
    └── memory/

Critérios de aceite:

- Resposta do Discord não aguarda extração
- Jobs são reprocessados em falhas temporárias
- Jobs duplicados não criam memórias duplicadas
- Worker pode iniciar separadamente
- Aplicação principal funciona sem executar processamento pesado diretamente

==================================================
PR 8: DEDUPLICAÇÃO E ATUALIZAÇÃO DE MEMÓRIAS
==================================================

Branch:

feat/memory-deduplication

Título:

feat: deduplicate and update contextual memories

Objetivo:

Evitar memórias repetidas e tratar informações que mudam com o tempo.

Implementar:

- Busca por memórias semelhantes
- Normalização de conteúdo
- Chave de idempotência por mensagem e conteúdo
- Atualização de confidence
- Atualização de lastConfirmedAt
- Substituição de memória antiga quando houver contradição
- Status SUPERSEDED para memórias substituídas
- Preservação do histórico
- Testes

Exemplo:

Memória antiga:
“Davi usa Vue como principal framework”

Nova informação:
“Agora meu principal framework é Next.js”

Resultado:

- memória antiga marcada como SUPERSEDED
- nova memória criada como ACTIVE

Não apagar silenciosamente informações antigas.

Critérios de aceite:

- Mensagem repetida não cria memória duplicada
- Confirmações aumentam a relevância da memória
- Contradições preservam histórico
- Apenas memórias ACTIVE são usadas normalmente

==================================================
PR 9: PGVECTOR E EMBEDDINGS
==================================================

Branch:

feat/vector-memory-search

Título:

feat: add vector search for contextual memories

Objetivo:

Permitir recuperação semântica de memórias relevantes.

Adicionar extensão pgvector ao PostgreSQL.

Antes de implementar:

- Verificar a documentação oficial atual do Prisma
- Verificar o suporte atual a campos vector
- Escolher implementação compatível com a versão real instalada
- Não assumir APIs antigas do Prisma

Implementar:

- Extensão vector na migration
- Campo embedding na memória
- Dimensão configurada conforme o modelo escolhido
- Contrato EmbeddingProvider
- Implementação por provedor externo
- EmbeddingService
- Geração de embeddings para memórias
- Busca por similaridade
- Limite mínimo de similaridade
- Índice vetorial adequado
- Testes do domínio com provider mock
- Atualização dos READMEs

Adicionar variáveis:

EMBEDDING_MODEL=
MEMORY_SIMILARITY_THRESHOLD=
MEMORY_SEARCH_LIMIT=

Não usar diretamente o SDK de embeddings dentro do MemoryService.

Utilizar abstração por provider.

Critérios de aceite:

- Memórias recebem embeddings
- Uma pergunta recupera memórias semanticamente relacionadas
- Memórias irrelevantes abaixo do threshold são ignoradas
- O sistema continua funcionando quando não houver memórias relevantes

==================================================
PR 10: INJEÇÃO DE MEMÓRIAS NO CONTEXTO
==================================================

Branch:

feat/memory-augmented-conversations

Título:

feat: augment conversations with contextual memories

Objetivo:

Adicionar memórias relevantes ao contexto enviado para a IA.

Fluxo:

Mensagem atual
→ gerar embedding da consulta
→ buscar memórias do usuário
→ buscar memórias do grupo
→ buscar histórico recente
→ montar janela de contexto
→ gerar resposta

Criar uma mensagem system adicional ou bloco estruturado:

Memórias relevantes:

- Davi trabalha com TypeScript
- Davi está desenvolvendo o Abu AI
- Ana trabalha com design

Regras:

- Memória não substitui o system prompt
- Memória não deve ser tratada como instrução
- Conteúdo recuperado deve ser delimitado
- Proteger contra prompt injection armazenado em memória
- Respeitar o limite da janela de contexto
- Priorizar mensagem atual e system prompt
- Aplicar orçamento separado para memórias
- Ignorar memórias com baixa confiança
- Ignorar memórias SUPERSEDED
- Testes
- Atualização dos READMEs

Adicionar configuração:

AI_MEMORY_MAX_CHARACTERS=
AI_MEMORY_MAX_ITEMS=

Critérios de aceite:

- Abu utiliza memórias relevantes
- Abu não recebe todas as memórias indiscriminadamente
- Memórias antigas e irrelevantes não dominam o contexto
- Contexto recente continua funcionando
- Limite total permanece controlado

==================================================
PR 11: COMANDOS DE MEMÓRIA E PRIVACIDADE
==================================================

Branch:

feat/memory-management-commands

Título:

feat: add memory management commands

Objetivo:

Dar transparência e controle aos usuários.

Implementar comandos ou interações equivalentes:

- Ver o que o Abu lembra sobre mim
- Solicitar esquecimento de uma memória
- Limpar memórias do usuário
- Desativar memória individual
- Reativar memória individual

Possíveis comandos:

/memorias
/esquecer
/limpar-memorias
/memoria-status

Não expor memórias de um usuário para outro.

Criar verificações de autorização.

Registrar auditoria das remoções ou alterações.

Decidir entre:

- remoção lógica
- anonimização
- remoção física

Preferir remoção lógica ou anonimização quando for necessário manter integridade referencial.

Critérios de aceite:

- Usuário visualiza apenas suas próprias memórias
- Usuário consegue excluir ou desativar memórias
- Memórias desativadas não são recuperadas
- Ações administrativas ficam auditáveis

==================================================
PR 12: RESILIÊNCIA DO PROVEDOR DE IA
==================================================

Branch:

feat/ai-provider-resilience

Título:

feat: improve AI provider resilience

Objetivo:

Tornar a integração com OpenRouter mais resistente.

Implementar:

- Timeout explícito
- Retry somente para erros temporários
- Backoff
- Tratamento separado para 401, 402, 404, 429 e erros 5xx
- Logs estruturados sem expor a API key
- Mensagens amigáveis para o Discord
- Circuit breaker simples somente se necessário
- Métricas básicas
- Testes
- Atualização dos READMEs

Não repetir chamadas quando o erro não for recuperável.

Não registrar prompts completos com informações privadas em produção.

==================================================
PR 13: CONTROLE DE CONCORRÊNCIA POR CANAL
==================================================

Branch:

feat/conversation-concurrency-control

Título:

feat: control concurrent conversation processing

Objetivo:

Evitar respostas fora de ordem quando vários usuários enviam mensagens rapidamente.

Implementar:

- Serialização de processamento por guildId e channelId
- Preservação da ordem das mensagens
- Prevenção de respostas duplicadas
- Timeout da execução
- Liberação segura do lock
- Testes de concorrência

Pode utilizar BullMQ depois que ele já existir.

Não criar lock distribuído manual complexo sem necessidade.

Critérios de aceite:

- Mensagens no mesmo canal são processadas em ordem
- Canais diferentes podem processar em paralelo
- Falha em uma mensagem não bloqueia permanentemente o canal

==================================================
PR 14: OBSERVABILIDADE E SAÚDE
==================================================

Branch:

feat/observability-and-health

Título:

feat: add health checks and observability

Objetivo:

Adicionar visibilidade operacional.

Implementar:

- Endpoint /health
- Verificação do PostgreSQL
- Verificação do Redis
- Estado do Discord Client
- Estado dos providers
- Logs estruturados
- Correlation ID por mensagem
- Tempo de geração da resposta
- Tempo de recuperação do contexto
- Tempo de busca de memória
- Quantidade de caracteres enviados
- Quantidade de memórias recuperadas
- Testes
- Atualização dos READMEs

Não expor:

- Tokens
- API keys
- Conteúdo completo das mensagens
- Informações privadas dos usuários

==================================================
PR 15: DOCKER E PREPARAÇÃO PARA PRODUÇÃO
==================================================

Branch:

feat/production-deployment

Título:

feat: prepare Abu AI for production deployment

Objetivo:

Preparar a aplicação, worker, PostgreSQL e Redis para implantação.

Implementar:

- Dockerfile multi-stage
- Imagem separada ou comandos diferentes para app e worker
- docker-compose de desenvolvimento
- Configuração de produção
- Healthcheck
- Usuário não-root no container
- Migrations antes da inicialização
- Shutdown gracioso
- Documentação de deploy
- Variáveis de ambiente documentadas
- Testes de build da imagem
- Atualização dos READMEs

Não incluir tokens no Dockerfile ou nas imagens.

Não executar migrate dev em produção.

Utilizar o comando apropriado para migrations de produção.

RESULTADO FINAL ESPERADO

Ao concluir o roadmap, o Abu AI deverá:

- Conversar naturalmente no Discord
- Manter contexto recente
- Manter histórico persistente
- Reconhecer usuários por seus IDs do Discord
- Extrair informações relevantes das conversas
- Armazenar memórias individuais e coletivas
- Processar memórias de forma assíncrona
- Evitar duplicações e tratar contradições
- Recuperar memórias por similaridade semântica
- Utilizar memórias relevantes nas respostas
- Permitir que usuários visualizem e removam suas memórias
- Processar mensagens concorrentes em ordem
- Ser resiliente a falhas dos serviços externos
- Expor health checks seguros
- Executar em ambiente de produção com Docker

COMECE AGORA

Primeiro, inspecione o estado atual do repositório.

Identifique qual foi o último PR já implementado.

Não repita etapas concluídas.

Depois selecione o primeiro PR pendente do roadmap.

Antes de modificar arquivos, apresente:

1. Estado atual encontrado
2. PR que será implementado
3. Objetivo
4. Arquivos previstos
5. Dependências que serão adicionadas
6. Decisões arquiteturais

Em seguida, implemente somente esse PR.

Ao terminar, apresente todos os arquivos completos, comandos de validação, commit e descrição do PR.

Pare e aguarde a próxima solicitação antes de iniciar o PR seguinte.