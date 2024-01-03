import type { Message } from 'discord.js';
import { log } from '../utils/logger';
import openAI, { getAiUsageInfo, model, systemMessage } from '../openAI';
import { rateLimit } from '../utils/rateLimit';

export default async function messageCreate(message: Message): Promise<void> {
    if (
        // if direct message
        message.guild === null ||
        // sent by this bot
        message.author.tag === message.client.user.tag ||
        // if this bot wasn't mentioned
        !message.mentions.has(message.client.user, { ignoreRoles: true, ignoreEveryone: true }) ||
        // if the message has a reply but isn't a reply to this bot
        message.mentions.repliedUser && message.mentions.repliedUser.tag !== message.client.user.tag
    ) {
        return;
    }

    log.debug('Message received.');

    // if the last hit was over a minute ago, reset the counter
    if (rateLimit.get(message.author.id.toString()).lastHit < Date.now() - 60000) {
        rateLimit.reset(message.author.id.toString());
    }

    if (rateLimit.get(message.author.id.toString()).value >= 10) {
        log.debug(`User ${message.author.tag} is sending too many requests.`);
        await message.reply({ content: 'You are sending too many requests, please wait a bit.' });
        return;
    }

    rateLimit.hit(message.author.id.toString());

    log.debug(`Bot was mentioned by ${message.author.tag} in ${message.guild.name}#${String(message.channel)}`);

    if (message.hasThread) {
        await message.thread!.join();
        await message.thread!.sendTyping();
    } else {
        await message.channel.sendTyping();
    }

    log.debug('Fetching context...');

    const messages = message.hasThread
        ? await message.thread!.messages.fetch({ limit: 50, before: message.id })
        : await message.channel.messages.fetch({ limit: 50, before: message.id });

    log.debug('Generating response...');

    const completions = await openAI.chat.completions.create({
        model,
        messages: [
            {
                role: 'system',
                content: systemMessage + ' You\'ll be given a question from the user to which you should reply' +
                    ' to based on your best knowledge. You\'ll also be given a history of the last messages that you ' +
                    'can reference if they are relevant.'
            },
            ...messages.map(m => ({
                role: m.author.tag === 'chat-bot' ? 'assistant' : 'user' as 'assistant' | 'user',
                content: m.content,
                // replace # with _
                name: m.author.tag.replaceAll('#', '_')
            })),
            {
                role: 'user',
                content: message.content,
                name: message.author.tag
            }
        ]
    }).catch(() => undefined);

    if (!completions?.choices[0]?.message.content) {
        log.error('There was an error with the response.');
        await message.reply({ content: 'Something has gone wrong, I don\'t know what to say.' });
        return;
    }

    log.debug('Sending response...');

    const content = (completions.choices[0].message.content.length > 1950
        ? completions.choices[0].message.content.substring(0, 1950) + '\n.\n.\n.'
        : completions.choices[0].message.content)
        + getAiUsageInfo(completions);

    if (message.hasThread) {
        await message.thread!.send({
            content,
            reply: { messageReference: message, failIfNotExists: false }
        });
    } else {
        await message.reply(content);
    }
}
