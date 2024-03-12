import type OpenAI from 'openai';

export default function capResponse(completions: OpenAI.ChatCompletion): string | null {
    if (!completions?.choices[0]?.message.content) {
        return null;
    }

    return completions.choices[0].message.content.length > 1900
        ? completions.choices[0].message.content.substring(0, 1900) + '... \n*(response truncated)*'
        : completions.choices[0].message.content;
}
