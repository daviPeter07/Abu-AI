import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';

export const appConfig = registerAs('app', () => ({
  port: Number(process.env.PORT ?? 3000),

  discord: {
    botToken: process.env.DISCORD_BOT_TOKEN,
    aiChannelId: process.env.DISCORD_AI_CHANNEL_ID,
  },

  openRouter: {
    apiKey: process.env.OPENROUTER_API_KEY,
    model: process.env.OPENROUTER_MODEL,
    embeddingModel: process.env.EMBEDDING_MODEL,
  },

  ai: {
    contextMaxCharacters: Number(
      process.env.AI_CONTEXT_MAX_CHARACTERS ?? 12_000,
    ),
    contextCandidateMessagesLimit: Number(
      process.env.AI_CONTEXT_CANDIDATE_MESSAGES_LIMIT ?? 50,
    ),
    memoryMaxCharacters: Number(process.env.AI_MEMORY_MAX_CHARACTERS ?? 3_000),
    memoryMaxItems: Number(process.env.AI_MEMORY_MAX_ITEMS ?? 10),
  },

  memory: {
    similarityThreshold: Number(process.env.MEMORY_SIMILARITY_THRESHOLD ?? 0.7),
    searchLimit: Number(process.env.MEMORY_SEARCH_LIMIT ?? 10),
  },

  database: {
    url: process.env.DATABASE_URL,
  },
}));

export const envValidationSchema = Joi.object({
  PORT: Joi.number().port().default(3000),

  DISCORD_BOT_TOKEN: Joi.string().trim().required(),

  DISCORD_AI_CHANNEL_ID: Joi.string().pattern(/^\d+$/).required(),

  OPENROUTER_API_KEY: Joi.string().trim().required(),

  OPENROUTER_MODEL: Joi.string().trim().required(),

  EMBEDDING_MODEL: Joi.string().trim().required(),

  AI_CONTEXT_MAX_CHARACTERS: Joi.number().integer().min(2_000).default(12_000),

  AI_CONTEXT_CANDIDATE_MESSAGES_LIMIT: Joi.number()
    .integer()
    .min(1)
    .default(50),

  AI_MEMORY_MAX_CHARACTERS: Joi.number().integer().min(500).default(3_000),

  AI_MEMORY_MAX_ITEMS: Joi.number().integer().min(1).default(10),

  MEMORY_SIMILARITY_THRESHOLD: Joi.number().min(0).max(1).default(0.7),

  MEMORY_SEARCH_LIMIT: Joi.number().integer().min(1).default(10),

  DATABASE_URL: Joi.string()
    .uri({
      scheme: ['postgresql', 'postgres'],
    })
    .required(),
});
