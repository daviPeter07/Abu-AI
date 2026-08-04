export const EMBEDDING_PROVIDER = Symbol('EMBEDDING_PROVIDER');

export interface EmbeddingProvider {
  generate(text: string, correlationId?: string): Promise<number[]>;
}
