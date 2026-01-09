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

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your API key:

```env
OPENAI_API_KEY=your_api_key_here
```

If using custom AI Gateway:

```env
AI_GATEWAY_URL=https://your-gateway-url
AI_MODEL_NAME=qwen-plus
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

### Enable OIDC Token (for production)

1. Go to your Vercel project settings
2. Search for "OIDC" in settings
3. Enable "Secure Backend Access with OIDC Federation"
4. Save settings

### Local Development with OIDC

If using `vercel dev`, the OIDC token is automatically refreshed.

If running `npm run dev` directly:

```bash
# Pull environment variables (including OIDC token)
vercel env pull

# Note: OIDC token expires every 12 hours
# Re-run this command when expired
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
