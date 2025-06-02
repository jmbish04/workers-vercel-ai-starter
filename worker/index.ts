import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import type { Message } from 'ai';
import { streamText } from 'ai';

// Define supported models
const models = {
  google: 'gemini-2.5-pro-latest',
  openai: 'gpt-4',
  anthropic: 'claude-2',
  cloudflare: 'env.AI',
};

type JsonBody = {
  id: string;
  messages: Message[];
  service: keyof typeof models; // Specify the AI service
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    switch (url.pathname) {
      case "/api/chat": {
        const { messages, service } = await request.json<JsonBody>();

        // Select the model based on the service
        const model = (() => {
          switch (service) {
            case 'google':
              return google(models.google, { useSearchGrounding: true });
            case 'openai':
              return openai(models.openai);
            case 'anthropic':
              return anthropic(models.anthropic);
            case 'cloudflare':
              return env.AI; // Use Cloudflare AI binding from environment
            default:
              throw new Error('Unsupported AI service');
          }
        })();

        const result = streamText({ model, messages });
        return result.toDataStreamResponse();
      }
      default: {
        return new Response(null, { status: 404 });
      }
    }
  },
} satisfies ExportedHandler<Env>;
