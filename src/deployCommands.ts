import type { APIApplicationCommand } from 'discord.js';
import { REST, Routes } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { log } from './utils/logger';
import { APP_ID, BOT_TOKEN, GUILD_ID } from './config';
import type { Command } from './types';

const foldersPath = path.join(__dirname, 'commands');

export default async function deployCommands(): Promise<Map<string, Command>> {
    const commands = new Map<string, Command>();
    const imports: Promise<any>[] = [];

    for (const file of fs.readdirSync(foldersPath).filter(f => f.endsWith('.js'))) {
        const filePath = path.join(__dirname, 'commands', file);

        imports.push(
            import(filePath).then((command: Command) => {
                if ('data' in command && 'execute' in command) {
                    commands.set(command.data.name, command);
                } else {
                    log.warn(`The command at ${filePath} is missing a required "data" or "execute" property.`);
                }
            })
        );
    }

    await Promise.all(imports);
    log.info(`Found ${commands.size} command${commands.size > 1 ? 's' : ''}.`);

    const rest = new REST().setToken(BOT_TOKEN);

    try {
        const body = [...commands.values()].map(command => command.data.toJSON());
        log.info(`Started refreshing ${body.length} application (/) command${body.length > 1 ? 's' : ''}.`);

        // The put method is used to fully refresh all commands in the guild with the current set
        const appCommands = (await rest.put(
            Routes.applicationGuildCommands(APP_ID, GUILD_ID),
            { body }
        )) as APIApplicationCommand[];

        // todo - delete commands that are no longer in the codebase

        log.info(
            `Successfully reloaded ${appCommands.length} application (/) command${appCommands.length > 1 ? 's' : ''}.`
        );
    } catch (error) {
        log.error(error);
    }

    return commands;
}
