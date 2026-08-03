import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';

export const appConfig = registerAs('app', () => ({
  port: Number(process.env.PORT ?? 3000),

  discord: {
    botToken: process.env.DISCORD_BOT_TOKEN,
    aiChannelId: process.env.DISCORD_AI_CHANNEL_ID,
  },
}));

export const envValidationSchema = Joi.object({
  PORT: Joi.number().port().default(3000),

  DISCORD_BOT_TOKEN: Joi.string().trim().required(),

  DISCORD_AI_CHANNEL_ID: Joi.string().pattern(/^\d+$/).required(),
});
