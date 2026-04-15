import { AzureOpenAI } from 'openai';

let client;

export function getAIClient() {
  if (!client) {
    client = new AzureOpenAI({
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      endpoint: process.env.AZURE_OPENAI_ENDPOINT,
      apiVersion: '2024-10-21',
      deployment: process.env.AZURE_OPENAI_DEPLOYMENT_NAME
    });
  }
  return client;
}

/**
 * Call the Azure OpenAI model with a system prompt and user message.
 * Enforces JSON output and keeps responses concise.
 * Falls back to deterministic mock data if the deployment is not ready.
 */
export async function callAI({ systemPrompt, userMessage, temperature = 0.4, maxTokens = 800, fallback = null }) {
  try {
    const ai = getAIClient();

    const response = await ai.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: typeof userMessage === 'string' ? userMessage : JSON.stringify(userMessage) }
      ],
      temperature,
      max_completion_tokens: maxTokens,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from AI model');
    }

    try {
      return JSON.parse(content);
    } catch {
      console.error('Failed to parse AI response as JSON:', content);
      throw new Error('AI response was not valid JSON');
    }
  } catch (err) {
    console.warn(`[AI FALLBACK] ${err.message}. Using fallback data.`);
    if (fallback) {
      return typeof fallback === 'function' ? fallback() : fallback;
    }
    throw err;
  }
}
