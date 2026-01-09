"use client";

import { useState } from "react";
import InvoiceUpload from "@/components/InvoiceUpload";
import MultiInvoiceResults from "@/components/MultiInvoiceResults";
import DiscoveryWizard from "@/components/DiscoveryWizard";
import { useTemplates } from "@/hooks/useTemplates";
import { ExtractionTemplate } from "@/lib/templates";
import { extractDataFromPDF } from "@/lib/api-client";
import { ExtractionResult, BatchProgress } from "@/lib/types";

export default function Home() {
  // Template management via custom hook
  const {
    templates,
    activeTemplate,
    isLoaded,
    saveTemplate,
    deleteTemplate,
    setActiveTemplate
  } = useTemplates();

  // File processing state
  const [invoiceResults, setInvoiceResults] = useState<ExtractionResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<BatchProgress>({ completed: 0, total: 0 });

  // Discovery wizard state
  const [showDiscoveryWizard, setShowDiscoveryWizard] = useState(false);
  const [hasActiveProfile, setHasActiveProfile] = useState(false);

  if (!isLoaded) {
    // Show loading while templates load from storage
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading templates...</p>
        </div>
      </div>
    );
  }

  const processFilesBatch = async (files: File[]) => {
    const batchSize = 5; // Process 5 files concurrently
    const results: ExtractionResult[] = files.map(file => ({
      fileName: file.name,
      status: "pending" as const,
    }));

    setInvoiceResults(results);
    setIsProcessing(true);
    setProgress({ completed: 0, total: files.length });

    // Process in batches using centralized API client
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
            // Use centralized API client with current template
            const result = await extractDataFromPDF(file, activeTemplate);
            
            // Update with success
            setInvoiceResults(prev => {
              const updated = [...prev];
              updated[fileIndex] = {
                ...updated[fileIndex],
                status: "success",
                data: result.invoiceData,
                validation: result.validation
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

  const handleReset = () => {
    setInvoiceResults([]);
    setIsProcessing(false);
    setProgress({ completed: 0, total: 0 });
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
          {/* Show discovery wizard if no active profile */}
          {!hasActiveProfile ? (
            <div className="text-center py-12">
              <div className="mx-auto w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                Let AI Discover What to Extract
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
                Upload sample documents and tell us what information you need. 
                AI will automatically discover and extract the relevant fields.
              </p>
              <button
                onClick={() => setShowDiscoveryWizard(true)}
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors shadow-lg hover:shadow-xl"
              >
                Start Field Discovery →
              </button>
            </div>
          ) : (
            <>
              {/* Profile Info Bar */}
              <div className="mb-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {activeTemplate.name}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {activeTemplate.fields.length} fields configured
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setHasActiveProfile(false);
                    handleReset();
                  }}
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
                >
                  Start New Discovery →
                </button>
              </div>

              <InvoiceUpload onFilesUpload={handleFilesUpload} isLoading={isProcessing} />
            </>
          )}
          
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
            <MultiInvoiceResults 
              results={invoiceResults} 
              activeTemplate={activeTemplate}
              onReset={handleReset} 
            />
          )}
        </div>

        {/* Discovery Wizard */}
        {showDiscoveryWizard && (
          <DiscoveryWizard
            onComplete={async (template) => {
              await saveTemplate(template);
              await setActiveTemplate(template.id);
              setShowDiscoveryWizard(false);
              setHasActiveProfile(true);
            }}
            onCancel={() => setShowDiscoveryWizard(false)}
          />
        )}

        <div className="mt-8 space-y-2">
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            <p>Powered by Alibaba Cloud Model Studio & Qwen-Max</p>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-gray-400 dark:text-gray-500">
            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Your files are never saved - processed in memory only</span>
            <a 
              href="/privacy" 
              className="text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 underline"
            >
              Learn more
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
