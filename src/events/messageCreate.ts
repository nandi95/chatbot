import type { Message } from 'discord.js';
import { log } from '../utils/logger';
import openAI, { getAiUsageInfo, systemMessage } from '../openAI';
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

    log.info('Message received.');

    // if last hit was over a minute ago, reset the counter
    if (rateLimit.get(message.author.id.toString()).lastHit < Date.now() - 60000) {
        rateLimit.reset(message.author.id.toString());
    }

    if (rateLimit.get(message.author.id.toString()).value >= 10) {
        log.info(`User ${message.author.tag} is sending too many requests.`);
        await message.reply({ content: 'You are sending too many requests, please wait a bit.' });
        return;
    }

    rateLimit.hit(message.author.id.toString());

    log.info(`Bot was mentioned by ${message.author.tag} in ${message.guild.name}#${String(message.channel)}`);
    await message.channel.sendTyping();

    log.info('Fetching context...');

    // const messageIsInThread = message.hasThread;
    // log.info(`Message is in thread: ${messageIsInThread}`);
    // let title = message.content.replace(/<@\d+>/g, '').trim()
    // const thread = messageIsInThread
    //     ? message.thread!
    //     : await message.startThread({
    //         autoArchiveDuration: ThreadAutoArchiveDuration.OneDay,
    //         name: '🤖🧠 ' + (title.length > 30 ? title.substring(0, 30) + '...' : title)
    //     });

    const messages = await message.channel.messages.fetch({ limit: 50, before: message.id });
    // const messages = messageIsInThread
    //     ? thread.messages
    //     : await message.channel.messages.fetch({ limit: 50, before: message.id });
    // @ts-expect-error
    const context =  messages.map(
        (m: Message<true>) => ({ sentAt: m.createdAt.toUTCString(), authorName: m.author.tag, content: m.content })
    );

    // await thread.join();
    // await thread.sendTyping();
    log.info('Generating response...');

    const completions = await openAI.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: [
            {
                role: 'system',
                content: systemMessage + ' Youll be given a question from the user to which you should reply' +
                    ' to based on your best knowledge. Youll also be given a history of the last messages that you ' +
                    'can reference if they are relevant.'
            },
            {
                role: 'user',
                content: `Previous messages:\n${JSON.stringify({ context })}\n\nQuestion: ${message.content}`
            }
        ]
    }).catch(async () => {
        log.error('There was an error while generating a response.');
        await message.reply({ content: 'Something has gone wrong, I don\'t know what to say.' });
        return { data:
                { choices: [], usage: undefined }
        } as unknown as Awaited<ReturnType<typeof openAI.createChatCompletion>>;
    });

    if (!completions.data.choices[0]?.message?.content) {
        log.error('There was an error with the response.');
        await message.reply({ content: 'Something has gone wrong, I don\'t know what to say.' });
        return;
    }

    log.info('Sending response...');
    await message.reply(
        (completions.data.choices[0].message.content.length > 1950
            ? completions.data.choices[0].message.content.substring(0, 1950) + '\n.\n.\n.'
            : completions.data.choices[0].message.content)
            + getAiUsageInfo(completions)
    );
    // await thread.send({
    //     content: completions.data.choices[0].message.content + getAiUsageInfo(completions),
    //     reply: { messageReference: message, failIfNotExists: false }
    // });
}
