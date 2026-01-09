import { createOpenAI } from "@ai-sdk/openai";

// Configure Vercel AI Gateway with Qwen model
// The gateway URL format: https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/{provider}
// For Vercel AI Gateway, use environment variables for configuration

export const qwen = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.QWEN_API_KEY || "",
  baseURL: process.env.AI_GATEWAY_URL || "https://api.openai.com/v1",
  compatibility: "compatible",
});

// Use Qwen model - adjust model name based on your AI Gateway configuration
export const MODEL_NAME = process.env.AI_MODEL_NAME || "qwen-plus";
