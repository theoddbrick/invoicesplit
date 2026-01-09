"use client";

import { useState } from "react";
import InvoiceUpload from "@/components/InvoiceUpload";
import InvoiceResults from "@/components/InvoiceResults";

export type InvoiceData = {
  orderId: string;
  invoiceNo: string;
  taxInvoiceDate: string;
  invoiceAmount: string;
};

export default function Home() {
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setInvoiceData(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/extract-invoice", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to extract invoice data");
      }

      const data = await response.json();
      setInvoiceData(data.invoiceData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Invoice Split
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Upload your invoice PDF and let AI extract the data
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <InvoiceUpload onFileUpload={handleFileUpload} isLoading={isLoading} />
          
          {error && (
            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
            </div>
          )}

          {isLoading && (
            <div className="mt-8 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-300">
                Analyzing invoice with AI...
              </p>
            </div>
          )}

          {invoiceData && !isLoading && (
            <InvoiceResults data={invoiceData} />
          )}
        </div>

        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Powered by Vercel AI Gateway & Qwen LLM</p>
        </div>
      </div>
    </main>
  );
}
