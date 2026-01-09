"use client";

import { InvoiceData } from "@/app/page";
import { useState } from "react";

interface InvoiceResultsProps {
  data: InvoiceData;
}

type FieldKey = keyof InvoiceData;

interface FieldConfig {
  key: FieldKey;
  label: string;
}

const DEFAULT_FIELDS: FieldConfig[] = [
  { key: "orderId", label: "Order ID" },
  { key: "invoiceNo", label: "Invoice NO." },
  { key: "taxInvoiceDate", label: "Tax Invoice Date" },
  { key: "invoiceAmount", label: "Invoice Amount" },
];

function downloadCSV(data: InvoiceData, fieldOrder: FieldConfig[]) {
  // Create CSV content based on current field order
  const csvHeaders = fieldOrder.map(f => f.label);
  const csvValues = fieldOrder.map(f => data[f.key]);

  const csvContent = [
    csvHeaders.join(","),
    csvValues.map(cell => `"${cell}"`).join(",")
  ].join("\n");

  // Create blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", `invoice_${data.invoiceNo || 'data'}_${Date.now()}.csv`);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function copyRowToClipboard(data: InvoiceData, fieldOrder: FieldConfig[]) {
  // Create tab-separated values for easy pasting into spreadsheets
  const values = fieldOrder.map(f => data[f.key]).join("\t");
  
  navigator.clipboard.writeText(values).then(() => {
    // Show success feedback
    const button = document.getElementById('copy-row-btn');
    if (button) {
      const originalText = button.textContent;
      button.textContent = '✓ Copied!';
      setTimeout(() => {
        button.textContent = originalText || 'Copy Row';
      }, 2000);
    }
  });
}

export default function InvoiceResults({ data }: InvoiceResultsProps) {
  const [fieldOrder, setFieldOrder] = useState<FieldConfig[]>(DEFAULT_FIELDS);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === index) return;

    const newOrder = [...fieldOrder];
    const draggedItem = newOrder[draggedIndex];
    
    // Remove from old position
    newOrder.splice(draggedIndex, 1);
    // Insert at new position
    newOrder.splice(index, 0, draggedItem);
    
    setFieldOrder(newOrder);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="mt-8 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Extracted Invoice Data
        </h2>
        <button
          onClick={() => downloadCSV(data, fieldOrder)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Download CSV
        </button>
      </div>

      {/* Draggable Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 bg-gray-50 dark:bg-gray-700 border-b-2 border-gray-200 dark:border-gray-600">
          <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
            Drag and drop the headers below to reorder fields
          </p>
        </div>
        
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-yellow-100 dark:bg-yellow-900/30">
              <tr>
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
              </tr>
            </thead>
            <tbody>
              <tr className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                {fieldOrder.map((field) => (
                  <td
                    key={field.key}
                    className="px-6 py-4 text-sm text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700 last:border-r-0"
                  >
                    {data[field.key] || "N/A"}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Copy Row Button */}
        <div className="p-4 bg-gray-50 dark:bg-gray-700 border-t-2 border-gray-200 dark:border-gray-600 flex justify-center">
          <button
            id="copy-row-btn"
            onClick={() => copyRowToClipboard(data, fieldOrder)}
            className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors shadow-md hover:shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy Row
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
            Order ID
          </label>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {data.orderId || "N/A"}
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
            Invoice NO.
          </label>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {data.invoiceNo || "N/A"}
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
            Tax Invoice Date
          </label>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {data.taxInvoiceDate || "N/A"}
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
            Invoice Amount
          </label>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {data.invoiceAmount || "N/A"}
          </p>
        </div>
      </div>

      {/* Card View (Original) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fieldOrder.map((field) => (
          <div key={field.key} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
              {field.label}
            </label>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {data[field.key] || "N/A"}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
        <p className="text-green-800 dark:text-green-200 text-sm flex items-center">
          <svg
            className="w-5 h-5 mr-2"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          Invoice data extracted successfully
        </p>
      </div>
    </div>
  );
}
