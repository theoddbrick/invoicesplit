import { createOpenAI } from "@ai-sdk/openai";

// Configure Vercel AI Gateway
// Authentication is handled via AI_GATEWAY_API_KEY environment variable
// The AI Gateway automatically routes requests to the appropriate provider

export const aiGateway = createOpenAI({
  apiKey: process.env.AI_GATEWAY_API_KEY || "",
  baseURL: "https://gateway.vercel.com/v1",
});

// Model format: provider/model-name
// Examples: 
// - "qwen/qwen-plus"
// - "qwen/qwen-turbo" 
// - "qwen/qwen-max"
// - "openai/gpt-4"
export const MODEL_NAME = process.env.AI_MODEL_NAME || "qwen/qwen-plus";
