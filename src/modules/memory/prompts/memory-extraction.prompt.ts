import type { ExtractMemoriesInput } from '../contracts/memory-extraction.contract';

export function buildMemoryExtractionPrompt(
  input: ExtractMemoriesInput,
): string {
  return `Analise somente a mensagem do usuário e extraia memórias explícitas e duradouras.

Regras:
- Não armazene cumprimentos, conversa casual ou informações temporárias irrelevantes.
- Não invente, não faça suposições e não transforme dúvidas em fatos.
- Não armazene senhas, tokens, chaves de API, credenciais ou segredos.
- Use USER para fatos sobre o autor e GROUP para fatos relevantes ao servidor.
- USER deve usar subjectDiscordUserId igual ao ID do autor.
- Se a nova informação contradizer uma memória ativa, informe supersedesMemoryId.
- Retorne somente JSON no formato solicitado.

Formato:
{"memories":[{"scope":"USER","type":"PREFERENCE","subjectDiscordUserId":"123","content":"Davi gosta de Minecraft","confidence":0.92,"supersedesMemoryId":"opcional"}]}

Autor:
${JSON.stringify({
  discordUserId: input.authorDiscordUserId,
  name: input.authorName,
  guildId: input.guildId,
})}

Memórias ativas disponíveis para confirmação ou substituição:
${JSON.stringify(
  input.activeCandidates.map((memory) => ({
    id: memory.id,
    scope: memory.scope,
    type: memory.type,
    content: memory.content,
    subjectDiscordUserId: memory.subjectDiscordUserId,
    guildId: memory.guildId,
  })),
)}

Mensagem:
${input.content}`;
}
