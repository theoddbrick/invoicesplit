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

Create a `.env.local` file in the root directory with your Alibaba Cloud Model Studio API key:

```env
MODEL_STUDIO_KEY=sk-your_dashscope_api_key_here
```

Alternative environment variable name (also supported):

```env
DASHSCOPE_API_KEY=sk-your_dashscope_api_key_here
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

## Alibaba Cloud Model Studio Setup

This project uses [Alibaba Cloud Model Studio (DashScope)](https://www.alibabacloud.com/help/en/model-studio/) with the Qwen-Max model for invoice extraction.

### Get Your API Key

1. Go to [Alibaba Cloud Model Studio](https://bailian.console.aliyun.com/)
2. Sign in or create an account
3. Navigate to **API Keys** section
4. Create a new API key
5. Copy the generated key (starts with `sk-`)
6. Add it to your `.env.local` file:
   ```env
   MODEL_STUDIO_KEY=sk-your_api_key_here
   ```

### Model Configuration

The application uses **Qwen-Max** (`qwen-max`), which provides:
- Highest accuracy for document understanding
- Best performance for structured data extraction
- Optimal JSON output generation
- Superior reasoning for complex invoice formats

The model is pre-configured and connects via DashScope's OpenAI-compatible endpoint:
```
https://dashscope-intl.aliyuncs.com/compatible-mode/v1
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
