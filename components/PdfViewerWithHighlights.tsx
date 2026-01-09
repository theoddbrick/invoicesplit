"use client";

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

// Configure PDF.js worker
if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
}

interface FieldHighlight {
  fieldKey: string;
  fieldName: string;
  value: string;
  enabled: boolean;
}

interface PdfViewerWithHighlightsProps {
  file: File;
  fileName: string;
  highlights: FieldHighlight[];
  activeFieldKey: string | null;
  onHighlightClick: (fieldKey: string) => void;
}

export default function PdfViewerWithHighlights({
  file,
  fileName,
  highlights,
  activeFieldKey,
  onHighlightClick
}: PdfViewerWithHighlightsProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setError(null);
  }

  function onDocumentLoadError(error: Error) {
    console.error("PDF load error:", error);
    setError("Failed to load PDF preview");
  }

  return (
    <div className="flex flex-col h-full">
      {/* PDF Navigation */}
      {numPages > 1 && (
        <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          <button
            onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
            disabled={pageNumber <= 1}
            className="px-3 py-1 text-sm bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Prev Page
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-300">
            Page {pageNumber} of {numPages}
          </span>
          <button
            onClick={() => setPageNumber(Math.min(numPages, pageNumber + 1))}
            disabled={pageNumber >= numPages}
            className="px-3 py-1 text-sm bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next Page →
          </button>
        </div>
      )}

      {/* PDF Viewer */}
      <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900 p-4">
        {error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <svg className="w-12 h-12 text-red-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-600 dark:text-red-400">{error}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Showing text preview instead
              </p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="relative inline-block shadow-2xl">
              <Document
                file={file}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={
                  <div className="flex items-center justify-center h-96 bg-white">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading PDF...</p>
                    </div>
                  </div>
                }
              >
                <Page
                  pageNumber={pageNumber}
                  width={600}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  className="border border-gray-300 dark:border-gray-600"
                />
              </Document>

              {/* Highlight Overlays - Simplified approach */}
              {/* Note: Precise PDF text positioning is complex */}
              {/* Using text layer selection as fallback */}
            </div>
          </div>
        )}
      </div>

      {/* Highlight Legend */}
      {highlights.length > 0 && (
        <div className="p-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            Extracted fields in this document:
          </p>
          <div className="flex flex-wrap gap-2">
            {highlights.filter(h => h.enabled).map((highlight) => (
              <button
                key={highlight.fieldKey}
                onClick={() => onHighlightClick(highlight.fieldKey)}
                className={`px-2 py-1 text-xs rounded-full transition-colors ${
                  activeFieldKey === highlight.fieldKey
                    ? 'bg-yellow-400 dark:bg-yellow-600 text-gray-900 dark:text-white font-semibold'
                    : 'bg-yellow-100 dark:bg-yellow-900/40 text-gray-700 dark:text-yellow-200 hover:bg-yellow-200 dark:hover:bg-yellow-800/60'
                }`}
              >
                {highlight.fieldName}: {highlight.value}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
