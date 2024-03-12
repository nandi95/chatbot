import { config as dotEnvConfig } from 'dotenv';

dotEnvConfig();

export const BOT_TOKEN = process.env.BOT_TOKEN ?? '';
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? '';
export const APP_ID = process.env.APP_ID ?? '';
export const GUILD_ID = process.env.GUILD_ID ?? '';
export const DEBUG = process.env.DEBUG === 'true';
export const TZ = process.env.TZ ?? 'Europe/London';
