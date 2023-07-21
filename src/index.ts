import { Client, GatewayIntentBits, Events } from 'discord.js';
import { BOT_TOKEN } from './config';
import { log } from './utils/logger';
import messageCreate from './events/messageCreate';
import deployCommands from './deployCommands';
import type { Command } from './types';
import { rateLimit } from './utils/rateLimit';

log.info('Starting Bot, this might take a while...');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMessageTyping
    ]
});

log.info('Deploying commands...');
let commands = new Map<string, Command>();

void deployCommands().then(cmds => {
    commands = cmds;
    log.info('Deployed commands.');
});

client.once(Events.ClientReady, c => log.info(`Ready! Logged in as ${c.user.tag}`))
    .on(Events.MessageCreate, messageCreate)
    .on(Events.InteractionCreate, async interaction => {
        console.log(interaction.type);
        if (!interaction.isCommand()) return;

        const command = commands.get(interaction.commandName);

        if (!command) {
            log.error(`No command matching "${interaction.commandName}" was found.`);
            return;
        }

        // if last hit was over a minute ago, reset the counter
        if (rateLimit.get(interaction.user.id.toString()).lastHit < Date.now() - 60000) {
            rateLimit.reset(interaction.user.id.toString());
        }

        if (rateLimit.get(interaction.user.id.toString()).value >= 10) {
            log.info(`User ${interaction.user.tag} is sending too many requests.`);
            await interaction.reply({ content: 'You are sending too many requests, please wait a bit.' });
            return;
        }

        rateLimit.hit(interaction.user.id.toString());

        try {
            await command.execute(interaction);
        } catch (error) {
            log.error(error);

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'There was an error while executing this command!' });
            } else {
                await interaction.reply({ content: 'There was an error while executing this command!' });
            }
        }
    });

void client.login(BOT_TOKEN);

['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach(signal => process.on(signal, () => {
    client.destroy();
}));
