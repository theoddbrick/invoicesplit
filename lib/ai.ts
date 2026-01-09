// Vercel AI Gateway Configuration
// When you specify a model id as a plain string, the AI SDK automatically
// uses the Vercel AI Gateway provider to route the request.
// The AI Gateway provider looks for the API key in the AI_GATEWAY_API_KEY
// environment variable by default.

// Model format: provider/model-name
// Examples: 
// - "qwen/qwen-plus"
// - "qwen/qwen-turbo" 
// - "qwen/qwen-max"
// - "openai/gpt-4"
export const MODEL_NAME = process.env.AI_MODEL_NAME || "qwen/qwen-plus";
