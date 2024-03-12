import type OpenAI from 'openai';

export default function capResponse(completions: OpenAI.ChatCompletion): string | null {
    if (!completions?.choices[0]?.message.content) {
        return null;
    }

    return completions.choices[0].message.content.length > 1950
        ? completions.choices[0].message.content.substring(0, 1950) + '\n.\n.\n.'
        : completions.choices[0].message.content;
}