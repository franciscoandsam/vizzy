/**
 * OpenRouter API Client
 *
 * Handles communication with OpenRouter for AI-powered financial advice.
 * Uses the OpenAI-compatible API format.
 */

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || '';

export type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type ChatCompletionResponse = {
  id: string;
  choices: {
    message: Message;
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

/**
 * Send a chat completion request to OpenRouter
 */
export async function chatCompletion(
  messages: Message[],
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
): Promise<ChatCompletionResponse> {
  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
      'HTTP-Referer': 'https://vizzy.money',
      'X-Title': 'Vizzy Money',
    },
    body: JSON.stringify({
      model: options?.model || 'anthropic/claude-sonnet-4',
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 1024,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Ask Vizzy a financial question
 */
export async function askVizzy(
  question: string,
  context?: {
    riskTolerance?: string;
    investmentStyle?: string;
    portfolioSummary?: string;
  }
): Promise<string> {
  const systemPrompt = `You are Vizzy, a friendly and knowledgeable AI financial companion.
You explain complex financial concepts in simple, approachable terms.
You use analogies and real-world examples. You never give specific investment advice
or guarantee returns - instead you educate and empower users to make their own decisions.
${context ? `\nUser context: Risk tolerance: ${context.riskTolerance}, Style: ${context.investmentStyle}` : ''}`;

  const result = await chatCompletion([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: question },
  ]);

  return result.choices[0]?.message.content || 'Sorry, I couldn\'t process that. Try again?';
}
