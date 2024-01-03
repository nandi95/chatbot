import { SlashCommandBuilder } from 'discord.js';
import type { Execute } from '../types';
import { log } from '../utils/logger';
import scrapeUrl from '../utils/scrapeUrl';
import openAI, { getAiUsageInfo, model, systemMessage } from '../openAI';
import type { YoutubeTranscriptError } from 'youtube-transcript';
import { YoutubeTranscript } from 'youtube-transcript';

export const data = new SlashCommandBuilder()
    .setName('summarise')
    .addStringOption(option => {
        return option.setName('url')
            .setDescription('The url to summarise')
            .setRequired(true);
    })
    .addStringOption(option => {
        return option.setName('question')
            .setDescription('Question(s) about the content')
            .setRequired(false);
    })
    .setDMPermission(false)
    .setDescription('Summarise the content on a given url');

export const execute: Execute = async (interaction) => {
    await interaction.deferReply();
    const url = (interaction.options.data[0]!).value as string;
    const question = interaction.options.data[1]?.value as string | undefined;

    let content: string | null = null;

    if (/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/i.test(url)) {
        await YoutubeTranscript.fetchTranscript(url)
            .then(resp => {
                content = resp.reduce((acc, curr) => acc + ' ' + curr.text, '');
            })
            .catch((e: YoutubeTranscriptError) => {
                content = e.message.replace('[YoutubeTranscript] \uD83D\uDEA8 ', '');
            });
    } else {
        content = await scrapeUrl(url);
    }

    if (!content) {
        await interaction.editReply('There was an error fetching the content of the given url.');
        return;
    }

    log.debug('Summarising...');
    const completions = await openAI.chat.completions.create({
        model,
        messages: [
            {
                role: 'system',
                content: systemMessage + (question
                    ? 'Youll be given some text and you should answer the following question based on the text. ' +
                        'Question: ' + question
                    : ' Youll be given some text and you should summarise its content as best you can.')
            },
            { role: 'user', content }
        ]
    }).catch(async (e: Error) => {
        log.error('There was an error while summarising. ' + e.message);
        await interaction.editReply({ content: 'Something has gone wrong, I don\'t know what to say.' });
        return;
    });


    if (!completions?.choices[0]?.message?.content) {
        log.error('There was an error with the response.');
        await interaction.editReply({ content: 'Something has gone wrong, I don\'t know what to say.' });
        return;
    }

    log.debug('Sending response...');
    await interaction.editReply(completions.choices[0].message.content + getAiUsageInfo(completions));
};
