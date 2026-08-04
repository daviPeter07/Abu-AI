[![en](https://img.shields.io/badge/lang-en-red.svg)](CONTRIBUTING.md) [![pt-br](https://img.shields.io/badge/lang-pt--br-green.svg)](CONTRIBUTING.pt-BR.md)

# Contribuindo com o Abu AI

Obrigado pelo interesse em contribuir com o Abu AI.

O Abu AI é desenvolvido como uma aplicação modular em NestJS que se conecta ao Discord e evoluirá gradualmente com conversas geradas por inteligência artificial, memória contextual e geração aumentada por recuperação.

## Antes de contribuir

Antes de iniciar uma alteração:

1. Pesquise as issues existentes.
2. Verifique se a tarefa já está sendo desenvolvida.
3. Crie ou selecione uma issue que descreva a alteração.
4. Discuta grandes mudanças arquiteturais antes de implementá-las.

Pequenas correções e melhorias na documentação podem ser enviadas diretamente.

## Ambiente de desenvolvimento

Requisitos:

* Node.js 24
* pnpm
* Uma aplicação do Discord com um bot
* Um servidor do Discord para testes locais

Clone o repositório:

```bash
git clone https://github.com/daviPeter07/abu-ai.git
cd abu-ai
```

Instale as dependências:

```bash
pnpm install
```

Crie o arquivo de ambiente:

```bash
cp .env.example .env
```

Configure as variáveis necessárias:

```env
PORT=3000

DISCORD_BOT_TOKEN=
DISCORD_AI_CHANNEL_ID=
```

Inicie a aplicação:

```bash
pnpm start:dev
```

## Branches

Crie branches a partir da `main`.

Utilize um dos seguintes prefixos:

```text
feat/
fix/
refactor/
docs/
test/
chore/
```

Exemplos:

```text
feat/openrouter-provider
fix/discord-message-handler
refactor/discord-client
docs/contribution-guide
```

## Commits

Escreva commits objetivos que descrevam a alteração.

Exemplos:

```text
feat: create AI module
fix: prevent responses outside the configured channel
refactor: separate Discord event handling
docs: add contribution guidelines
test: add AI service tests
chore: update dependencies
```

Mantenha alterações sem relação entre si em commits separados.

## Arquitetura do projeto

A aplicação segue uma arquitetura de monólito modular.

Cada módulo deve possuir uma responsabilidade clara:

```text
discord       Conexão e eventos do Discord
ai            Provedores de IA e geração de respostas
conversations Orquestração e histórico das conversas
memory        Memória contextual e recuperação semântica
database      Persistência e acesso ao banco
```

Evite colocar regras de negócio diretamente nos listeners de eventos do Discord.

Os handlers do Discord devem delegar o processamento para serviços da aplicação.

Provedores externos devem ser isolados por interfaces ou tokens de injeção quando puderem existir múltiplas implementações.

Não introduza filas, bancos, workers ou novas infraestruturas sem uma necessidade concreta.

## Qualidade do código

Antes de abrir uma pull request, execute:

```bash
pnpm lint
pnpm test -- --passWithNoTests
pnpm build
```

O projeto deve compilar sem erros do TypeScript.

Evite:

* Dependências não utilizadas
* Refatorações sem relação com a issue
* Grandes alterações somente de formatação
* Variáveis de ambiente enviadas para o repositório
* Regras de negócio em arquivos de configuração
* Acesso direto ao `process.env` fora da camada de configuração

## Pull requests

Cada pull request deve:

* Atender a uma issue ou objetivo claro
* Explicar o que foi alterado
* Explicar como a alteração foi testada
* Referenciar a issue relacionada
* Manter o escopo limitado
* Atualizar a documentação quando o comportamento mudar

Utilize a seguinte sintaxe para fechar uma issue automaticamente:

```text
Closes #12
```

A pull request poderá receber solicitações de alteração antes do merge.

## Relatando bugs

Utilize o template de Bug Report e informe:

* Passos para reproduzir
* Comportamento esperado
* Comportamento atual
* Logs relevantes
* Versões do Node.js e pnpm
* Sistema operacional

Não inclua tokens do Discord ou outras credenciais nas issues.

## Propondo funcionalidades

Utilize o template de Feature Request.

Descreva o problema antes de propor a implementação. Uma contribuição poderá ser recusada quando introduzir complexidade que não seja necessária para os objetivos atuais do projeto.
