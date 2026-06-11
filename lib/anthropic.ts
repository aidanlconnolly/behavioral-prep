import Anthropic from "@anthropic-ai/sdk";

/** Single shared client, lazily reading ANTHROPIC_API_KEY at first use. */
let _client: Anthropic | undefined;
export function anthropic(): Anthropic {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error(
        "ANTHROPIC_API_KEY is not set. Add it to .env.local (see .env.local.example).",
      );
    }
    _client = new Anthropic({ apiKey });
  }
  return _client;
}

/** Has a key been configured? Lets AI features degrade gracefully. */
export function hasAnthropicKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/** Reasoning / coaching model. */
export const MODEL_SMART = "claude-sonnet-4-6";
/** Cheap model for short structured tasks. */
export const MODEL_CHEAP = "claude-haiku-4-5";
