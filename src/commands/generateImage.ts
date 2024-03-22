import { SlashCommandBuilder } from 'discord.js';
import type { Execute } from '../types';
import openAI from "../openAI";
import {log} from "../utils/logger";

export const data = new SlashCommandBuilder()
    .setName('generate_image')
    .addStringOption(option => {
        return option.setName('about')
            .setDescription('The prompt to generate the image from')
            .setRequired(true);
    })
    .setDMPermission(false)
    .setDescription('Generate an image from a prompt.');

export const execute: Execute = async (interaction) => {
    await interaction.deferReply();
    const prompt = (interaction.options.data[0]!).value as string;

    log.debug('Generating image...');
    const image = await openAI.images.generate({
        prompt,
        model: 'dall-e-3',
        quality: 'hd',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        response_format: 'url',
        size: '1024x1024',
        style: 'vivid',
        user: interaction.user.id
    }).catch(async (e: Error) => {
        log.error('There was an error while summarising. ' + e.message);
        await interaction.editReply({ content: 'Something has gone wrong, I don\'t know what to say.' });
    });

    if (!image) {
        return;
    }

    await interaction.editReply({
        embeds: image.data.map(i => ({
            image: { url: i.url! },
            description: i.revised_prompt ?? prompt
        }))
    });
};
