"use client";

import { InvoiceData } from "@/app/page";

interface InvoiceResultsProps {
  data: InvoiceData;
}

function downloadCSV(data: InvoiceData) {
  // Create CSV content
  const csvHeaders = ["Field", "Value"];
  const csvRows = [
    ["Order ID", data.orderId],
    ["Invoice NO.", data.invoiceNo],
    ["Tax Invoice Date", data.taxInvoiceDate],
    ["Invoice Amount", data.invoiceAmount],
  ];

  const csvContent = [
    csvHeaders.join(","),
    ...csvRows.map(row => row.map(cell => `"${cell}"`).join(","))
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

export default function InvoiceResults({ data }: InvoiceResultsProps) {
  return (
    <div className="mt-8 space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Extracted Invoice Data
        </h2>
        <button
          onClick={() => downloadCSV(data)}
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
