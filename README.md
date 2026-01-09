# Invoice Split - AI Invoice Extractor

An intelligent web application built with Next.js 16 and Vercel AI Gateway that extracts structured data from invoice PDFs using Qwen LLM.

## Features

- 📄 PDF invoice upload via drag-and-drop or file selection
- 🤖 AI-powered data extraction using Qwen LLM via Vercel AI Gateway
- 🎯 Extracts key fields:
  - Order ID
  - Invoice Number
  - Tax Invoice Date
  - Invoice Amount
- 🎨 Modern, responsive UI with dark mode support
- ⚡ Built with Next.js 16 and React 19

## Prerequisites

- Node.js 18+ or Bun
- Vercel account (for deployment)
- API key for AI model access (OpenAI compatible or Qwen)

## Getting Started

### 1. Install Dependencies

```bash
npm install
# or
pnpm install
# or
yarn install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory with your Vercel AI Gateway key:

```env
AI_GATEWAY_API_KEY=vck_your_vercel_gateway_key_here
```

Optional configuration:

```env
# Specify AI Model (format: provider/model-name)
AI_MODEL_NAME=qwen/qwen-plus
```

### 3. Run Development Server

For local development with Vercel CLI (recommended for OIDC token support):

```bash
npm install -g vercel
vercel dev
```

Or use standard Next.js development:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### 4. Deploy to Vercel

```bash
vercel deploy
```

Or connect your GitHub repository to Vercel for automatic deployments.

## Vercel AI Gateway Setup

This project uses the [Vercel AI Gateway](https://vercel.com/docs/ai-gateway/authentication) for AI model access. There are two authentication methods:

### Option 1: API Key Authentication (Recommended for Development)

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to the **AI Gateway** tab
3. Select **API Keys** on the left sidebar
4. Click **Create key** and generate a new API key
5. Copy the generated key (starts with `vck_`)
6. Add it to your `.env.local` file:
   ```env
   AI_GATEWAY_API_KEY=vck_your_key_here
   ```

When you specify a model id as a plain string, the AI SDK will automatically use the Vercel AI Gateway provider to route the request. The AI Gateway provider looks for the API key in the `AI_GATEWAY_API_KEY` environment variable by default.

### Option 2: OIDC Token Authentication (Automatic in Production)

For production deployments on Vercel, authentication is handled automatically via OIDC tokens.

For local development with OIDC:

1. Link to a Vercel project:
   ```bash
   vercel link
   ```

2. Pull environment variables (includes OIDC token):
   ```bash
   vercel env pull
   ```

Note: OIDC tokens are valid for 12 hours. Re-run `vercel env pull` when expired.

### Model Selection

The AI Gateway supports multiple providers. Use the format `provider/model-name`:

- **Qwen models**: `qwen/qwen-plus`, `qwen/qwen-turbo`, `qwen/qwen-max`
- **OpenAI models**: `openai/gpt-4`, `openai/gpt-3.5-turbo`
- **Anthropic models**: `anthropic/claude-3-opus`

Set your preferred model in `.env.local`:
```env
AI_MODEL_NAME=qwen/qwen-plus
```

## Project Structure

```
invoicesplit/
├── app/
│   ├── api/
│   │   └── extract-invoice/
│   │       └── route.ts          # API endpoint for invoice extraction
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Main page component
├── components/
│   ├── InvoiceUpload.tsx         # File upload component
│   └── InvoiceResults.tsx        # Results display component
├── lib/
│   └── ai.ts                     # AI SDK configuration
├── .env.example                  # Environment variables template
├── next.config.ts                # Next.js configuration
├── package.json                  # Dependencies
└── README.md                     # This file
```

## How It Works

1. **Upload**: User uploads a PDF invoice via the web interface
2. **Extract**: Server extracts text content from the PDF using PDF.js
3. **Analyze**: AI model (Qwen) analyzes the text and identifies key fields
4. **Display**: Extracted data is presented in a structured format

## Supported Invoice Formats

The application is designed to work with various invoice formats, including:
- Trip.com travel invoices
- Standard tax invoices
- Corporate billing statements

## Configuration

### Customize AI Model

Edit `lib/ai.ts` to configure different AI models or providers:

```typescript
export const MODEL_NAME = "qwen-plus"; // Change model name
```

### Adjust Extraction Fields

Modify the prompt in `app/api/extract-invoice/route.ts` to extract different fields.

## Troubleshooting

### PDF.js Worker Errors

If you encounter PDF.js worker errors, ensure the worker path is correctly configured in `app/api/extract-invoice/route.ts`.

### API Key Issues

- Verify your API key is correctly set in `.env.local`
- Check that the AI Gateway URL is accessible
- Ensure OIDC token is properly configured for Vercel AI Gateway

### Rate Limiting

If you experience rate limiting, consider:
- Implementing caching for repeated invoices
- Adding request throttling
- Upgrading your AI provider plan

## Technologies Used

- **Framework**: Next.js 16
- **UI**: React 19, Tailwind CSS
- **AI**: Vercel AI SDK, Qwen LLM
- **PDF Processing**: PDF.js
- **Deployment**: Vercel

## License

MIT

## Support

For issues or questions:
1. Check the [Vercel AI SDK documentation](https://sdk.vercel.ai/docs)
2. Review [Next.js documentation](https://nextjs.org/docs)
3. Open an issue in this repository
