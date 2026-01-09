"use client";

import { useState } from "react";
import InvoiceUpload from "@/components/InvoiceUpload";
import MultiInvoiceResults from "@/components/MultiInvoiceResults";
import TemplateSelector from "@/components/TemplateSelector";
import TemplateEditor from "@/components/TemplateEditor";
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

  // Template editor state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ExtractionTemplate | undefined>();

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
          {/* Template Selector */}
          <TemplateSelector
            templates={templates}
            activeTemplate={activeTemplate}
            onSelectTemplate={(t) => setActiveTemplate(t.id)}
            onCreateTemplate={() => {
              setEditingTemplate(undefined);
              setIsEditorOpen(true);
            }}
            onEditTemplate={(t) => {
              setEditingTemplate(t);
              setIsEditorOpen(true);
            }}
          />

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
            <MultiInvoiceResults 
              results={invoiceResults} 
              activeTemplate={activeTemplate}
              onReset={handleReset} 
            />
          )}
        </div>

        {/* Template Editor Modal */}
        <TemplateEditor
          isOpen={isEditorOpen}
          onClose={() => {
            setIsEditorOpen(false);
            setEditingTemplate(undefined);
          }}
          onSave={async (template) => {
            await saveTemplate(template);
            setIsEditorOpen(false);
            setEditingTemplate(undefined);
            // If this was a new template, make it active
            if (!editingTemplate) {
              await setActiveTemplate(template.id);
            }
          }}
          template={editingTemplate}
        />

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
