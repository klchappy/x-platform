import { z } from 'zod';

export type AIProvider = 'anthropic' | 'openai' | 'google';

export interface AIConfig {
  provider: AIProvider;
  model: string;
  apiKey: string;
  baseUrl?: string;
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  text: string;
  inputTokens?: number;
  outputTokens?: number;
  model: string;
}

export const DEFAULT_MODELS: Record<AIProvider, string> = {
  anthropic: 'claude-sonnet-4-6',
  openai: 'gpt-4o-mini',
  google: 'gemini-1.5-flash',
};

export async function chat(cfg: AIConfig, messages: AIMessage[]): Promise<AIResponse> {
  switch (cfg.provider) {
    case 'anthropic':
      return chatAnthropic(cfg, messages);
    case 'openai':
      return chatOpenAI(cfg, messages);
    case 'google':
      return chatGoogle(cfg, messages);
  }
}

async function chatAnthropic(cfg: AIConfig, messages: AIMessage[]): Promise<AIResponse> {
  const system = messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n\n');
  const user = messages.filter((m) => m.role !== 'system');
  const r = await fetch(`${cfg.baseUrl ?? 'https://api.anthropic.com'}/v1/messages`, {
    method: 'POST',
    headers: {
      'x-api-key': cfg.apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: cfg.model,
      max_tokens: 2048,
      system: system || undefined,
      messages: user.map((m) => ({ role: m.role, content: m.content })),
    }),
  });
  if (!r.ok) throw new Error(`anthropic: ${r.status} ${await r.text()}`);
  const j = (await r.json()) as {
    content: Array<{ text: string }>;
    usage: { input_tokens: number; output_tokens: number };
    model: string;
  };
  return {
    text: j.content.map((b) => b.text).join(''),
    inputTokens: j.usage?.input_tokens,
    outputTokens: j.usage?.output_tokens,
    model: j.model,
  };
}

async function chatOpenAI(cfg: AIConfig, messages: AIMessage[]): Promise<AIResponse> {
  const r = await fetch(`${cfg.baseUrl ?? 'https://api.openai.com'}/v1/chat/completions`, {
    method: 'POST',
    headers: { authorization: `Bearer ${cfg.apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({ model: cfg.model, messages, max_tokens: 2048 }),
  });
  if (!r.ok) throw new Error(`openai: ${r.status} ${await r.text()}`);
  const j = (await r.json()) as {
    choices: Array<{ message: { content: string } }>;
    usage?: { prompt_tokens: number; completion_tokens: number };
    model: string;
  };
  return {
    text: j.choices[0]?.message?.content ?? '',
    inputTokens: j.usage?.prompt_tokens,
    outputTokens: j.usage?.completion_tokens,
    model: j.model,
  };
}

async function chatGoogle(cfg: AIConfig, messages: AIMessage[]): Promise<AIResponse> {
  const contents = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
  const system = messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n\n');
  const r = await fetch(
    `${cfg.baseUrl ?? 'https://generativelanguage.googleapis.com'}/v1beta/models/${cfg.model}:generateContent?key=${cfg.apiKey}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction: system ? { parts: [{ text: system }] } : undefined,
      }),
    },
  );
  if (!r.ok) throw new Error(`google: ${r.status} ${await r.text()}`);
  const j = (await r.json()) as {
    candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
    usageMetadata?: { promptTokenCount: number; candidatesTokenCount: number };
  };
  return {
    text: j.candidates[0]?.content?.parts?.map((p) => p.text).join('') ?? '',
    inputTokens: j.usageMetadata?.promptTokenCount,
    outputTokens: j.usageMetadata?.candidatesTokenCount,
    model: cfg.model,
  };
}

export const ChatRequestSchema = z.object({
  provider: z.enum(['anthropic', 'openai', 'google']),
  model: z.string().optional(),
  messages: z.array(z.object({ role: z.enum(['system', 'user', 'assistant']), content: z.string() })),
});
