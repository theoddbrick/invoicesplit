"use client";

import { useState } from "react";
import InvoiceUpload from "@/components/InvoiceUpload";
import MultiInvoiceResults from "@/components/MultiInvoiceResults";

export type InvoiceData = {
  orderId: string;
  invoiceNo: string;
  taxInvoiceDate: string;
  invoiceAmount: string;
};

export type InvoiceResult = {
  fileName: string;
  status: "pending" | "processing" | "success" | "error";
  data?: InvoiceData;
  error?: string;
};

export default function Home() {
  const [invoiceResults, setInvoiceResults] = useState<InvoiceResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });

  const processFilesBatch = async (files: File[]) => {
    const batchSize = 5; // Process 5 files concurrently
    const results: InvoiceResult[] = files.map(file => ({
      fileName: file.name,
      status: "pending" as const,
    }));

    setInvoiceResults(results);
    setIsProcessing(true);
    setProgress({ completed: 0, total: files.length });

    // Process in batches
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, Math.min(i + batchSize, files.length));
      
      await Promise.all(
        batch.map(async (file, batchIndex) => {
          const fileIndex = i + batchIndex;
          
          // Update status to processing
          setInvoiceResults(prev => {
            const updated = [...prev];
            updated[fileIndex] = { ...updated[fileIndex], status: "processing" };
            return updated;
          });

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
            
            // Update with success
            setInvoiceResults(prev => {
              const updated = [...prev];
              updated[fileIndex] = {
                ...updated[fileIndex],
                status: "success",
                data: data.invoiceData,
              };
              return updated;
            });
          } catch (err) {
            // Update with error
            setInvoiceResults(prev => {
              const updated = [...prev];
              updated[fileIndex] = {
                ...updated[fileIndex],
                status: "error",
                error: err instanceof Error ? err.message : "An error occurred",
              };
              return updated;
            });
          }

          // Update progress
          setProgress(prev => ({
            ...prev,
            completed: prev.completed + 1,
          }));
        })
      );
    }

    setIsProcessing(false);
  };

  const handleFilesUpload = async (files: File[]) => {
    await processFilesBatch(files);
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
          <InvoiceUpload onFilesUpload={handleFilesUpload} isLoading={isProcessing} />
          
          {isProcessing && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-600 dark:text-gray-300">
                  Processing invoices...
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {progress.completed} / {progress.total}
                </p>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(progress.completed / progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {invoiceResults.length > 0 && (
            <MultiInvoiceResults results={invoiceResults} />
          )}
        </div>

        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Powered by Alibaba Cloud Model Studio & Qwen-Max</p>
        </div>
      </div>
    </main>
  );
}
