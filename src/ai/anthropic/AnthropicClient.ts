import Anthropic from '@anthropic-ai/sdk';
import { Logger } from '@utils/Logger';
import { RetryUtils } from '@utils/RetryUtils';

const log = Logger.getInstance();

type ModelId = 'claude-sonnet-4-6' | 'claude-opus-4-7' | 'claude-haiku-4-5-20251001';

interface CompletionOptions {
  systemPrompt: string;
  userPrompt: string;
  model?: ModelId;
  maxTokens?: number;
}

/**
 * Singleton wrapper around the Anthropic Node.js SDK.
 * All other AI classes depend on this — they never import the SDK directly.
 * Model upgrades require changes to this file only.
 *
 * If ANTHROPIC_API_KEY is not set, every method returns null and logs a warning.
 * The full test suite runs without any degradation when AI features are absent.
 */
export class AnthropicClient {
  private static instance: AnthropicClient | null = null;
  private readonly client: Anthropic | null;

  private constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      log.warn('ANTHROPIC_API_KEY not set — AI features are disabled');
      this.client = null;
    } else {
      this.client = new Anthropic({ apiKey });
    }
  }

  static getInstance(): AnthropicClient {
    if (!AnthropicClient.instance) {
      AnthropicClient.instance = new AnthropicClient();
    }
    return AnthropicClient.instance;
  }

  get isAvailable(): boolean {
    return this.client !== null;
  }

  async complete(options: CompletionOptions): Promise<string | null> {
    if (!this.client) {
      log.warn('AI completion skipped — ANTHROPIC_API_KEY not set');
      return null;
    }

    const model: ModelId = options.model ?? 'claude-sonnet-4-6';
    const maxTokens = options.maxTokens ?? 4096;

    return RetryUtils.retry(
      async () => {
        const response = await this.client!.messages.create({
          model,
          max_tokens: maxTokens,
          system: [
            {
              type: 'text',
              text: options.systemPrompt,
              // @ts-expect-error: cache_control valid for prompt caching; SDK types updated in later versions
              cache_control: { type: 'ephemeral' },
            },
          ],
          messages: [{ role: 'user', content: options.userPrompt }],
        });

        const textBlock = response.content.find(block => block.type === 'text');
        return textBlock?.type === 'text' ? textBlock.text : null;
      },
      3,
      2000
    );
  }
}
