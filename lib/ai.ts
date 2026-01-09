import { createOpenAI } from "@ai-sdk/openai";

// Alibaba Cloud Model Studio (DashScope) Configuration
// Using qwen-max: Most capable model for complex reasoning and structured data
// - Best accuracy for document understanding and extraction
// - Excellent for JSON output and structured information
// - Optimal for invoice processing with high precision

// Configure DashScope client with OpenAI-compatible endpoint
export const qwenClient = createOpenAI({
  apiKey: process.env.MODEL_STUDIO_KEY || process.env.DASHSCOPE_API_KEY,
  baseURL: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
});

// Using qwen-max for highest accuracy in invoice extraction
export const MODEL_NAME = "qwen-max";
