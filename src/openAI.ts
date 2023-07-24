import { Configuration, OpenAIApi } from 'openai';
import { OPENAI_API_KEY } from './config';

const configuration = new Configuration({
    apiKey: OPENAI_API_KEY
});

const openAI = new OpenAIApi(configuration);

export const systemMessage = 'Act as a helpful, friendly and slightly sarcastic and jaded software developer. ' +
    ' Your response cannot be longer than 2000 characters.';

export function getAiUsageInfo(completions: Awaited<ReturnType<typeof openAI.createChatCompletion>>): string {
    if (completions.data.usage?.total_tokens) {
        const tokenCost = 0.003 / 1000;
        return `\n\nTokens used: **${completions.data.usage.total_tokens}**`
            + `\nEstimated cost: $**${(tokenCost * completions.data.usage.total_tokens).toFixed(6)}**`;
    }

    return '';
}

export default openAI;
