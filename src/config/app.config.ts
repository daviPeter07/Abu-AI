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
  },

  ai: {
    contextMaxCharacters: Number(
      process.env.AI_CONTEXT_MAX_CHARACTERS ?? 12_000,
    ),
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

  AI_CONTEXT_MAX_CHARACTERS: Joi.number().integer().min(2_000).default(12_000),

  DATABASE_URL: Joi.string()
    .uri({
      scheme: ['postgresql', 'postgres'],
    })
    .required(),
});
