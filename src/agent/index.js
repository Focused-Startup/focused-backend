const OpenAI = require('openai');
require('dotenv').config();

class Agent {
    constructor(model = 'gpt-5-mini') {
        const apiKey = process.env.OPENAI_API_KEY;

        if (!apiKey) {
            throw new Error('OPENAI_API_KEY is not set.');
        }

        this.client = new OpenAI({
            apiKey,
        });
        this.model = model;
    }

    async generateResponse(prompt) {
        const trimmedPrompt = prompt.trim();

        if (!trimmedPrompt) {
            throw new Error('Prompt cannot be empty.');
        }

        const response = await this.client.responses.create({
            model: this.model,
            input: trimmedPrompt,
        });

        const outputText = response.output_text.trim();

        if (!outputText) {
            throw new Error('OpenAI returned an empty response.');
        }

        return outputText;
    }
}

module.exports = { Agent };
