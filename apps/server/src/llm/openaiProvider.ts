import OpenAI from "openai";
import type { LLMProvider, GenerateRequest, GenerateResult, ProviderHealth } from "@app/shared-types";

// 6장 Provider 추상화의 OpenAI 구현체. Claude/Gemini 어댑터도 이 인터페이스만 지키면 교체 가능하다.
export class OpenAiProvider implements LLMProvider {
  readonly name: string;
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string, label = `openai:${model}`) {
    this.client = new OpenAI({ apiKey });
    this.model = model;
    this.name = label;
  }

  async generate(request: GenerateRequest): Promise<GenerateResult> {
    const start = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), request.timeoutMs);

    try {
      const completion = await this.client.chat.completions.create(
        {
          model: this.model,
          response_format: { type: "json_object" },
          max_tokens: request.maxOutputTokens ?? 800,
          temperature: 0.9,
          messages: [
            { role: "system", content: request.systemPrompt },
            { role: "user", content: request.userPrompt },
          ],
        },
        { signal: controller.signal }
      );

      return {
        raw: completion.choices[0]?.message?.content ?? "",
        modelUsed: this.model,
        latencyMs: Date.now() - start,
      };
    } finally {
      clearTimeout(timer);
    }
  }

  async *stream(request: GenerateRequest): AsyncIterable<string> {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      max_tokens: request.maxOutputTokens ?? 800,
      stream: true,
      messages: [
        { role: "system", content: request.systemPrompt },
        { role: "user", content: request.userPrompt },
      ],
    });

    for await (const chunk of completion) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) yield delta;
    }
  }

  async healthCheck(): Promise<ProviderHealth> {
    const start = Date.now();
    try {
      await this.client.models.retrieve(this.model);
      return { ok: true, latencyMs: Date.now() - start };
    } catch (err) {
      return { ok: false, latencyMs: Date.now() - start, message: err instanceof Error ? err.message : String(err) };
    }
  }
}
