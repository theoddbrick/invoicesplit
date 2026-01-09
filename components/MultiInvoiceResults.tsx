"use client";

import { ExtractionResult, ExtractedData } from "@/lib/types";
import { ExtractionTemplate } from "@/lib/templates";
import { useState, useEffect } from "react";

interface MultiInvoiceResultsProps {
  results: ExtractionResult[];
  activeTemplate: ExtractionTemplate;
  onReset: () => void;
}

interface FieldConfig {
  key: string;
  label: string;
}

function downloadSelectedCSV(
  results: ExtractionResult[],
  fieldOrder: FieldConfig[],
  selectedIndices: Set<number>,
  includeHeaders: boolean,
  includeFilename: boolean
) {
  const selectedResults = results.filter((r, idx) => 
    selectedIndices.has(idx) && r.status === "success" && r.data
  );
  
  if (selectedResults.length === 0) {
    alert("No selected rows to download");
    return;
  }

  // Build CSV content
  const csvRows: string[][] = [];
  
  // Headers (if enabled)
  if (includeHeaders) {
    const headerRow = [
      ...(includeFilename ? ["Filename"] : []),
      ...fieldOrder.map(f => f.label)
    ];
    csvRows.push(headerRow);
  }
  
  // Data rows
  selectedResults.forEach(result => {
    const row = [
      ...(includeFilename ? [result.fileName] : []),
      ...fieldOrder.map(f => result.data![f.key] || "")
    ];
    csvRows.push(row);
  });

  const csvContent = csvRows.map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");

  // Create blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", `invoices_batch_${Date.now()}.csv`);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function copySelectedToClipboard(
  results: ExtractionResult[],
  fieldOrder: FieldConfig[],
  selectedIndices: Set<number>,
  includeHeaders: boolean,
  includeFilename: boolean
) {
  const selectedResults = results.filter((r, idx) => 
    selectedIndices.has(idx) && r.status === "success" && r.data
  );
  
  if (selectedResults.length === 0) {
    alert("No selected rows to copy");
    return;
  }

  const rows: string[] = [];
  
  // Headers (if enabled)
  if (includeHeaders) {
    const headerRow = [
      ...(includeFilename ? ["Filename"] : []),
      ...fieldOrder.map(f => f.label)
    ].join("\t");
    rows.push(headerRow);
  }
  
  // Data rows with ="value" format to prevent Excel scientific notation
  selectedResults.forEach(result => {
    const row = [
      ...(includeFilename ? [`="${result.fileName}"`] : []),
      ...fieldOrder.map(f => {
        const value = result.data![f.key] || "";
        return `="${value}"`;
      })
    ].join("\t");
    rows.push(row);
  });

  const content = rows.join("\n");
  
  navigator.clipboard.writeText(content).then(() => {
    const button = document.getElementById('copy-selected-btn');
    if (button) {
      const originalText = button.textContent;
      button.textContent = '✓ Copied!';
      setTimeout(() => {
        button.textContent = originalText || 'Copy Selected';
      }, 2000);
    }
  });
}

export default function MultiInvoiceResults({ results, activeTemplate, onReset }: MultiInvoiceResultsProps) {
  // Build field order from active template
  const [fieldOrder, setFieldOrder] = useState<FieldConfig[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [hasAutoSelected, setHasAutoSelected] = useState(false);
  
  // Export options
  const [includeHeaders, setIncludeHeaders] = useState(false);
  const [includeFilename, setIncludeFilename] = useState(false);

  // Initialize field order from template
  useEffect(() => {
    const fields = activeTemplate.fields.map(f => ({
      key: f.key,
      label: f.name
    }));
    setFieldOrder(fields);
    setHasAutoSelected(false); // Reset auto-selection when template changes
  }, [activeTemplate.id]);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === index) return;

    const newOrder = [...fieldOrder];
    const draggedItem = newOrder[draggedIndex];
    
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(index, 0, draggedItem);
    
    setFieldOrder(newOrder);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const successCount = results.filter(r => r.status === "success").length;
  const errorCount = results.filter(r => r.status === "error").length;
  const processingCount = results.filter(r => r.status === "processing").length;

  const toggleSelectAll = () => {
    if (selectedRows.size === results.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(results.map((_, idx) => idx)));
    }
  };

  const toggleRow = (index: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedRows(newSelected);
  };

  const selectedCount = selectedRows.size;
  const allSelected = selectedRows.size === results.length && results.length > 0;
  const allProcessingComplete = results.length > 0 && results.every(r => r.status !== "processing");

  // Auto-select all successful rows when processing completes
  if (allProcessingComplete && !hasAutoSelected) {
    const successIndices = results
      .map((r, idx) => (r.status === "success" ? idx : -1))
      .filter(idx => idx !== -1);
    setSelectedRows(new Set(successIndices));
    setHasAutoSelected(true);
  }

  return (
    <div className="mt-8 space-y-6">
      {/* Summary Stats */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex gap-4 text-sm">
          <span className="text-indigo-600 dark:text-indigo-400 font-medium">
            ☑ {selectedCount} Selected
          </span>
          <span className="text-green-600 dark:text-green-400 font-medium">
            ✓ {successCount} Success
          </span>
          {errorCount > 0 && (
            <span className="text-red-600 dark:text-red-400 font-medium">
              ✗ {errorCount} Failed
            </span>
          )}
          {processingCount > 0 && (
            <span className="text-yellow-600 dark:text-yellow-400 font-medium">
              ⟳ {processingCount} Processing
            </span>
          )}
        </div>

        {/* Export Options */}
        <div className="flex items-center gap-4 text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeHeaders}
              onChange={(e) => setIncludeHeaders(e.target.checked)}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <span className="text-gray-700 dark:text-gray-300">Include headers</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeFilename}
              onChange={(e) => setIncludeFilename(e.target.checked)}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <span className="text-gray-700 dark:text-gray-300">Include filename</span>
          </label>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Start New Session
          </button>
          <button
            id="copy-selected-btn"
            onClick={() => copySelectedToClipboard(results, fieldOrder, selectedRows, includeHeaders, includeFilename)}
            disabled={!allProcessingComplete || selectedCount === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors text-sm"
            title={!allProcessingComplete ? "Please wait for all files to finish processing" : ""}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            {!allProcessingComplete ? "Processing..." : "Copy Selected"}
          </button>
          <button
            onClick={() => downloadSelectedCSV(results, fieldOrder, selectedRows, includeHeaders, includeFilename)}
            disabled={!allProcessingComplete || selectedCount === 0}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors text-sm"
            title={!allProcessingComplete ? "Please wait for all files to finish processing" : ""}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {!allProcessingComplete ? "Processing..." : "Download CSV"}
          </button>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 shadow-lg">
        <div className="p-4 bg-gray-50 dark:bg-gray-700 border-b-2 border-gray-200 dark:border-gray-600">
          <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
            Drag and drop the headers to reorder fields
          </p>
        </div>
        
        <div className="relative overflow-hidden">
          <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
            <table className="w-full border-collapse">
              <thead className="bg-yellow-100 dark:bg-yellow-900/30 sticky top-0 z-20 shadow-sm"
                     style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <tr>
                <th className="px-4 py-4 text-center border-r border-gray-300 dark:border-gray-600">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 cursor-pointer"
                  />
                </th>
                <th className="px-4 py-4 text-left text-sm font-bold text-gray-900 dark:text-white border-r border-gray-300 dark:border-gray-600">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Filename
                  </div>
                </th>
                {fieldOrder.map((field, index) => (
                  <th
                    key={field.key}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`px-6 py-4 text-left text-sm font-bold text-gray-900 dark:text-white border-r border-gray-300 dark:border-gray-600 last:border-r-0 cursor-move hover:bg-yellow-200 dark:hover:bg-yellow-800/40 transition-colors ${
                      draggedIndex === index ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                      </svg>
                      {field.label}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-4 text-center text-sm font-bold text-gray-900 dark:text-white">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {results.map((result, idx) => (
                <tr
                  key={idx}
                  className={`border-b border-gray-200 dark:border-gray-700 last:border-b-0 ${
                    result.status === "success" 
                      ? "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      : result.status === "error"
                      ? "bg-red-50 dark:bg-red-900/10"
                      : "bg-gray-50 dark:bg-gray-700/30"
                  }`}
                >
                  <td className="px-4 py-3 text-center border-r border-gray-200 dark:border-gray-700">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(idx)}
                      onChange={() => toggleRow(idx)}
                      disabled={result.status !== "success"}
                      className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700 font-medium">
                    {result.fileName}
                  </td>
                  {fieldOrder.map((field) => (
                    <td
                      key={field.key}
                      className="px-6 py-3 text-sm text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700 last:border-r-0"
                    >
                      {result.status === "success" && result.data 
                        ? result.data[field.key] || "N/A"
                        : "-"}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-center">
                    {result.status === "processing" && (
                      <span className="inline-flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400">
                        <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-yellow-600"></div>
                        Processing
                      </span>
                    )}
                    {result.status === "success" && (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Success
                      </span>
                    )}
                    {result.status === "error" && (
                      <span className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400 font-medium" title={result.error}>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        Failed
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {successCount > 0 && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-green-800 dark:text-green-200 text-sm flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Successfully extracted {successCount} invoice{successCount > 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
}
