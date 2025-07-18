import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { LlmServiceI, UnifiedResponse } from './types';

export class SimpleLlmService implements LlmServiceI {
  private model: any;

  constructor() {
    this.model = anthropic('claude-3-5-sonnet-20241022');
  }

  async ask(prompt: string): Promise<UnifiedResponse> {
    try {
      const { text } = await generateText({
        model: this.model,
        prompt,
        temperature: 0.2,
      });

      // Parse the response - for now, return a simple categorization
      // In production, this would parse the actual LLM response
      return {
        type: 'existing',
        categoryId: 'default-category'
      };
    } catch (error) {
      console.error('LLM request failed:', error);
      // Return a fallback response
      return {
        type: 'existing',
        categoryId: 'default-category'
      };
    }
  }
}

export default SimpleLlmService;
export { SimpleLlmService };