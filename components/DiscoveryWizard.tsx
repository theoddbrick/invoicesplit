"use client";

import { useState } from "react";
import { ExtractionTemplate, ExtractionField, FieldType } from "@/lib/templates";

interface DiscoveredField {
  suggestedName: string;
  suggestedKey: string;
  suggestedType: FieldType;
  foundInSamples: number;
  sampleValues: Array<{ fileName: string; value: string }>;
  confidence: number;
  suggestedDescription: string;
  enabled: boolean;
  extractionHint?: string;
  formatRule?: string;
}

interface DiscoveryWizardProps {
  onComplete: (template: ExtractionTemplate) => void;
  onCancel: () => void;
}

type Step = "intent" | "discovering" | "review" | "refine";

export default function DiscoveryWizard({ onComplete, onCancel }: DiscoveryWizardProps) {
  const [step, setStep] = useState<Step>("intent");
  const [userIntent, setUserIntent] = useState("");
  const [sampleFiles, setSampleFiles] = useState<File[]>([]);
  const [discoveredFields, setDiscoveredFields] = useState<DiscoveredField[]>([]);
  const [currentSampleIndex, setCurrentSampleIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingField, setEditingField] = useState<number | null>(null);

  const handleFilesSelected = (files: FileList | null) => {
    if (!files) return;
    const pdfFiles = Array.from(files).filter(f => f.type === "application/pdf");
    setSampleFiles(prev => [...prev, ...pdfFiles].slice(0, 100));
  };

  const removeFile = (index: number) => {
    setSampleFiles(files => files.filter((_, i) => i !== index));
  };

  const startDiscovery = async () => {
    if (!userIntent.trim()) {
      alert("Please describe what you want to extract");
      return;
    }

    if (sampleFiles.length < 2) {
      alert("Please upload at least 2 sample documents");
      return;
    }

    setIsProcessing(true);
    setStep("discovering");

    try {
      const formData = new FormData();
      formData.append("userIntent", userIntent);
      sampleFiles.forEach(file => formData.append("files", file));

      const response = await fetch("/api/discover-fields", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Discovery failed");
      }

      const result = await response.json();
      
      const fields: DiscoveredField[] = result.discoveredFields.map((f: any) => ({
        ...f,
        enabled: true, // All fields enabled by default
        extractionHint: "",
        formatRule: ""
      }));

      setDiscoveredFields(fields);
      setStep("review");
    } catch (error) {
      console.error("Discovery error:", error);
      alert(error instanceof Error ? error.message : "Failed to discover fields");
      setStep("intent");
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleField = (index: number) => {
    const updated = [...discoveredFields];
    updated[index].enabled = !updated[index].enabled;
    setDiscoveredFields(updated);
  };

  const updateField = (index: number, updates: Partial<DiscoveredField>) => {
    const updated = [...discoveredFields];
    updated[index] = { ...updated[index], ...updates };
    setDiscoveredFields(updated);
  };

  const saveAsTemplate = () => {
    const enabledFields = discoveredFields.filter(f => f.enabled);

    if (enabledFields.length === 0) {
      alert("Please enable at least one field");
      return;
    }

    const template: ExtractionTemplate = {
      id: `profile-${Date.now()}`,
      name: userIntent.substring(0, 50) || "Custom Extraction",
      description: `Discovered ${enabledFields.length} fields from ${sampleFiles.length} samples`,
      documentType: "document",
      fields: enabledFields.map((f, i) => ({
        id: `field-${i}`,
        name: f.suggestedName,
        key: f.suggestedKey,
        description: f.suggestedDescription + (f.extractionHint ? ` ${f.extractionHint}` : ""),
        required: f.foundInSamples === sampleFiles.length,
        type: f.suggestedType,
      })),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    onComplete(template);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <svg className="w-7 h-7 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                AI-Powered Field Discovery
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {step === "intent" && "Describe what you want to extract, upload samples"}
                {step === "discovering" && "AI is analyzing your documents..."}
                {step === "review" && `Review discovered fields (${discoveredFields.filter(f => f.enabled).length} enabled)`}
              </p>
            </div>
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(95vh-180px)]">
            {/* Step 1: User Intent + Samples */}
            {step === "intent" && (
              <div className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    AI will analyze your sample documents and automatically discover fields to extract
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    What would you like to extract? *
                  </label>
                  <textarea
                    value={userIntent}
                    onChange={(e) => setUserIntent(e.target.value)}
                    placeholder="Example: I want to extract booking details from travel invoices including passenger name, flight information, and payment amount"
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white text-sm"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Describe generally what information you need - AI will find the specific fields
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Upload Sample Documents (2-100 files) *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8">
                    <input
                      type="file"
                      multiple
                      accept=".pdf"
                      onChange={(e) => handleFilesSelected(e.target.files)}
                      className="hidden"
                      id="discovery-upload"
                    />
                    <label htmlFor="discovery-upload" className="cursor-pointer flex flex-col items-center gap-3">
                      <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                        <svg className="w-7 h-7 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-gray-700 dark:text-gray-200">
                          Drop sample PDFs or click to browse
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Recommended: 3-5 similar documents
                        </p>
                      </div>
                    </label>
                  </div>

                  {sampleFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Samples ({sampleFiles.length})
                      </p>
                      {sampleFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                            </svg>
                            {file.name}
                          </span>
                          <button onClick={() => removeFile(idx)} className="text-red-600 hover:text-red-700">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Discovering */}
            {step === "discovering" && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 mb-6"></div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Analyzing {sampleFiles.length} Documents...
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  AI is discovering fields from your samples
                </p>
              </div>
            )}

            {/* Step 3: Review Discovered Fields */}
            {step === "review" && discoveredFields.length > 0 && (
              <div className="space-y-6">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <p className="text-sm text-green-800 dark:text-green-200 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    AI discovered {discoveredFields.length} fields! Review and refine them below.
                  </p>
                </div>

                {/* Fields Table */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-100 dark:bg-gray-700">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Enable</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Field Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Type</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Success</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Example Value</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {discoveredFields.map((field, index) => (
                          <tr key={index} className={`${field.enabled ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-800/50 opacity-60'}`}>
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={field.enabled}
                                onChange={() => toggleField(index)}
                                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                              />
                            </td>
                            <td className="px-4 py-3">
                              {editingField === index ? (
                                <input
                                  type="text"
                                  value={field.suggestedName}
                                  onChange={(e) => updateField(index, { suggestedName: e.target.value })}
                                  className="w-full px-2 py-1 text-sm border border-indigo-400 rounded focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                                  autoFocus
                                />
                              ) : (
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {field.suggestedName}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <select
                                value={field.suggestedType}
                                onChange={(e) => updateField(index, { suggestedType: e.target.value as FieldType })}
                                className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 dark:bg-gray-700 dark:text-white"
                              >
                                <option value="text">Text</option>
                                <option value="number">Number</option>
                                <option value="date">Date</option>
                                <option value="currency">Currency</option>
                              </select>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-xs font-medium px-2 py-1 rounded ${
                                field.foundInSamples === sampleFiles.length
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                  : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                              }`}>
                                {field.foundInSamples}/{sampleFiles.length}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs text-gray-600 dark:text-gray-400 truncate block max-w-[150px]">
                                {field.sampleValues[0]?.value || "—"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => setEditingField(editingField === index ? null : index)}
                                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-xs font-medium"
                              >
                                {editingField === index ? "Done" : "Edit"}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Field Details Editor (when editing) */}
                {editingField !== null && discoveredFields[editingField] && (
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-300 dark:border-indigo-700 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                      Refine: {discoveredFields[editingField].suggestedName}
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Description
                        </label>
                        <input
                          type="text"
                          value={discoveredFields[editingField].suggestedDescription}
                          onChange={(e) => updateField(editingField, { suggestedDescription: e.target.value })}
                          placeholder="What this field represents"
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Extraction Hint (where to find this)
                        </label>
                        <input
                          type="text"
                          value={discoveredFields[editingField].extractionHint || ""}
                          onChange={(e) => updateField(editingField, { extractionHint: e.target.value })}
                          placeholder="e.g., 'Look in the header section' or 'Near the top of the document'"
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Format Rule
                        </label>
                        <input
                          type="text"
                          value={discoveredFields[editingField].formatRule || ""}
                          onChange={(e) => updateField(editingField, { formatRule: e.target.value })}
                          placeholder="e.g., 'Decimal format without currency symbols' or 'YYYY-MM-DD date format'"
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Summary */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    <span className="font-medium">{discoveredFields.filter(f => f.enabled).length}</span> fields enabled out of <span className="font-medium">{discoveredFields.length}</span> discovered
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              Cancel
            </button>

            {step === "intent" && (
              <button
                onClick={startDiscovery}
                disabled={!userIntent.trim() || sampleFiles.length < 2 || isProcessing}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
              >
                {isProcessing ? "Analyzing..." : `Discover Fields from ${sampleFiles.length} Samples →`}
              </button>
            )}

            {step === "review" && (
              <button
                onClick={saveAsTemplate}
                disabled={discoveredFields.filter(f => f.enabled).length === 0}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
              >
                Continue with {discoveredFields.filter(f => f.enabled).length} Fields →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
