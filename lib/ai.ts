import { createOpenAI } from "@ai-sdk/openai";

// Vercel AI Gateway Configuration
// Using qwen-plus: Best for structured data extraction tasks like invoice processing
// - Balanced performance and accuracy  
// - Excellent for JSON output and structured information
// - Cost-effective for production use

// Configure AI Gateway client
export const aiGateway = createOpenAI({
  apiKey: process.env.AI_GATEWAY_API_KEY,
  baseURL: "https://gateway.vercel.com/v1",
});

// Model name with provider prefix
export const MODEL_NAME = "qwen-plus";
