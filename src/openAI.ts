import { OpenAI } from 'openai';
import { OPENAI_API_KEY } from './config';
import type { ChatCompletionCreateParamsBase } from 'openai/resources/chat/completions';

const openAI = new OpenAI({
    apiKey: OPENAI_API_KEY
});

export const systemMessage = 'Act as a helpful, friendly and slightly sarcastic and jaded software developer. ' +
    ' Your response must not be longer than 1900 characters. ' +
    `The time right now is: ${new Date().toLocaleString()} (${new Date().toLocaleDateString(
        'en-GB',
        { weekday: 'long' }
    )})`;
export const model: ChatCompletionCreateParamsBase['model'] = 'gpt-4-1106-preview';

export function getAiUsageInfo(completions: OpenAI.ChatCompletion): string {
    if (completions.usage?.total_tokens) {
        const tokenCost = 0.003 / 1000;
        return `\n\nTokens used: **${completions.usage.total_tokens}**`
            + `\nEstimated cost: $**${(tokenCost * completions.usage.total_tokens).toFixed(6)}**`;
    }

    return '';
}

export default openAI;
