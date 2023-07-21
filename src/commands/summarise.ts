import { SlashCommandBuilder } from 'discord.js';
import type { Execute } from '../types';
import { log } from '../utils/logger';
import scrapeUrl from '../utils/scrapeUrl';
import ai, { getAiUsageInfo, systemMessage } from '../ai';

export const data = new SlashCommandBuilder()
    .setName('summarise')
    .addStringOption(option => {
        return option.setName('url')
            .setDescription('The url to summarise')
            .setRequired(true);
    })
    .setDMPermission(false)
    .setDescription('Summarise the content on a given url');

export const execute: Execute = async (interaction) => {
    await interaction.deferReply();
    const url = (interaction.options.data[0]!).value as string;

    const content = await scrapeUrl(url);

    if (!content) {
        await interaction.editReply('There was an error fetching the page.');
        return;
    }

    console.log(content);

    log.info('Summarising...');
    const completions = await ai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: [
            {
                role: 'system',
                content: systemMessage.content! + ' Youll be given some text and you should summarise its text ' +
                    'content as best you can.'
            },
            { role: 'user', content }
        ]
    }).catch(async (e: Error) => {
        log.error('There was an error while summarising. ' + e.message);
        await interaction.editReply({ content: 'Something has gone wrong, I don\'t know what to say.' });
        return;
    });


    if (!completions?.data.choices[0]?.message?.content) {
        log.error('There was an error with the response.');
        await interaction.editReply({ content: 'Something has gone wrong, I don\'t know what to say.' });
        return;
    }

    log.info('Sending response...');
    await interaction.editReply(completions.data.choices[0].message.content + getAiUsageInfo(completions));
};
