import { Configuration, OpenAIApi } from 'openai';
import { OPENAI_API_KEY } from './config';
import type { ChatCompletionRequestMessage } from 'openai/api';

const configuration = new Configuration({
    apiKey: OPENAI_API_KEY
});

const ai = new OpenAIApi(configuration);

export const systemMessage: ChatCompletionRequestMessage = {
    role: 'system',
    content: 'Act as a helpful, friendly and slightly sarcastic/jaded developer. Youll be given a question from the ' +
        'user to which you should reply to based on your best knowledge.'
};

export function getAiUsageInfo(completions: Awaited<ReturnType<typeof ai.createChatCompletion>>): string {
    if (completions.data.usage?.total_tokens) {
        const tokenCost = 0.003 / 1000;
        return `\n\nTokens used: **${completions.data.usage.total_tokens}**`
            + `\nEstimated cost: $**${(tokenCost * completions.data.usage.total_tokens).toFixed(6)}**`;
    }

    return '';
}

export default ai;
