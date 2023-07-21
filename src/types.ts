import type { CommandInteraction, SlashCommandBuilder } from 'discord.js';

export type Execute = (interaction: CommandInteraction) => Promise<void>;

export type Command = { data: SlashCommandBuilder; execute: Execute };
