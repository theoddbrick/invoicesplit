"use client";

import { ExtractionTemplate } from "@/lib/templates";
import { TrainingSample, TrainingResults, calculateTrainingResults, findTextContext } from "@/lib/training";
import { useState } from "react";

interface TemplateTrainerProps {
  template: ExtractionTemplate;
  isOpen: boolean;
  onClose: () => void;
  onSaveImprovements: (template: ExtractionTemplate) => void;
}

type TrainingStep = "upload" | "review" | "summary";

export default function TemplateTrainer({
  template,
  isOpen,
  onClose,
  onSaveImprovements
}: TemplateTrainerProps) {
  const [step, setStep] = useState<TrainingStep>("upload");
  const [samples, setSamples] = useState<TrainingSample[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  if (!isOpen) return null;

  const handleFilesSelected = (files: FileList | null) => {
    if (!files) return;
    const pdfFiles = Array.from(files).filter(f => f.type === "application/pdf");
    setUploadedFiles(prev => [...prev, ...pdfFiles].slice(0, 10)); // Max 10 samples
  };

  const removeFile = (index: number) => {
    setUploadedFiles(files => files.filter((_, i) => i !== index));
  };

  const startTraining = async () => {
    if (uploadedFiles.length < 2) {
      alert("Please upload at least 2 sample PDFs");
      return;
    }

    setIsProcessing(true);
    const trainingSamples: TrainingSample[] = [];

    // Process each file
    for (const file of uploadedFiles) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("template", JSON.stringify(template));

        const response = await fetch("/api/extract-invoice", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();

        if (result.success) {
          // Convert flat data to FieldExtraction format
          const extractedFields: Record<string, any> = {};
          template.fields.forEach(field => {
            extractedFields[field.key] = {
              value: result.invoiceData[field.key] || "",
              confidence: result.validation?.confidence || 0,
            };
          });

          trainingSamples.push({
            id: `sample-${Date.now()}-${trainingSamples.length}`,
            fileName: file.name,
            pdfText: "", // We'll need to get this separately
            extractedFields,
            userCorrections: {},
            reviewed: false,
            overallConfidence: result.validation?.confidence || 0
          });
        }
      } catch (error) {
        console.error(`Failed to process ${file.name}:`, error);
      }
    }

    setSamples(trainingSamples);
    setCurrentIndex(0);
    setStep("review");
    setIsProcessing(false);
  };

  const currentSample = samples[currentIndex];

  const handleFieldCorrection = (fieldKey: string, correctedValue: string) => {
    const updated = [...samples];
    updated[currentIndex].userCorrections[fieldKey] = correctedValue;
    setSamples(updated);
  };

  const markSampleReviewed = () => {
    const updated = [...samples];
    updated[currentIndex].reviewed = true;
    setSamples(updated);

    if (currentIndex < samples.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // All reviewed, go to summary
      setStep("summary");
    }
  };

  const finishTraining = () => {
    // Calculate results and suggest improvements
    const results = calculateTrainingResults(samples, template);
    
    // For now, just close
    // TODO: Apply suggestions to template
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-indigo-50 dark:bg-indigo-900/20">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Improve Template: {template.name}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {step === "upload" && "Upload sample PDFs to test extraction accuracy"}
                {step === "review" && `Reviewing sample ${currentIndex + 1} of ${samples.length}`}
                {step === "summary" && "Training complete - review results"}
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(95vh-140px)]">
            {/* Step 1: Upload Samples */}
            {step === "upload" && (
              <div className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Upload 2-5 sample documents that match this template. We'll test extraction accuracy and suggest improvements.
                  </p>
                </div>

                {/* File Upload */}
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8">
                  <input
                    type="file"
                    multiple
                    accept=".pdf"
                    onChange={(e) => handleFilesSelected(e.target.files)}
                    className="hidden"
                    id="training-upload"
                  />
                  <label
                    htmlFor="training-upload"
                    className="cursor-pointer flex flex-col items-center gap-4"
                  >
                    <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-medium text-gray-700 dark:text-gray-200">
                        Drop sample PDFs here or click to browse
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Recommended: 3-5 similar documents
                      </p>
                    </div>
                  </label>
                </div>

                {/* Uploaded Files List */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Samples ({uploadedFiles.length}/10)
                    </h3>
                    {uploadedFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm text-gray-700 dark:text-gray-300">{file.name}</span>
                        </div>
                        <button
                          onClick={() => removeFile(idx)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Start Button */}
                <button
                  onClick={startTraining}
                  disabled={uploadedFiles.length < 2 || isProcessing}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                >
                  {isProcessing ? "Processing samples..." : `Start Training with ${uploadedFiles.length} Samples`}
                </button>
              </div>
            )}

            {/* Step 2: Review Samples */}
            {step === "review" && currentSample && (
              <div className="space-y-6">
                {/* Progress */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {samples.map((s, idx) => (
                      <div
                        key={s.id}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                          idx === currentIndex
                            ? "bg-indigo-600 text-white"
                            : s.reviewed
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                            : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {idx + 1}
                      </div>
                    ))}
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Sample {currentIndex + 1} of {samples.length}
                  </span>
                </div>

                {/* Sample Info */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      📄 {currentSample.fileName}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Confidence: {currentSample.overallConfidence}%
                    </span>
                  </div>
                </div>

                {/* Fields Review */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Review Extracted Fields
                  </h3>

                  {template.fields.map(field => {
                    const extracted = currentSample.extractedFields[field.key];
                    const corrected = currentSample.userCorrections[field.key];
                    const displayValue = corrected !== undefined ? corrected : extracted?.value || "";
                    const isEmpty = !displayValue || displayValue.trim() === "";

                    return (
                      <div
                        key={field.key}
                        className={`p-4 border-2 rounded-lg ${
                          isEmpty
                            ? "border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/10"
                            : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              {field.name}
                              {field.required && <span className="text-red-500 ml-1">*</span>}
                            </label>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {field.description}
                            </p>
                          </div>
                          {!isEmpty && (
                            <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Found
                            </span>
                          )}
                        </div>

                        {/* Extracted Value */}
                        <div className="flex gap-2 items-center">
                          <input
                            type="text"
                            value={displayValue}
                            onChange={(e) => handleFieldCorrection(field.key, e.target.value)}
                            placeholder={isEmpty ? "Not found - enter correct value" : ""}
                            className={`flex-1 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                              isEmpty
                                ? "border-yellow-400 dark:border-yellow-600"
                                : corrected !== undefined
                                ? "border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-900/20"
                                : "border-gray-300 dark:border-gray-600"
                            } dark:bg-gray-700 dark:text-white`}
                          />
                          {corrected !== undefined && (
                            <span className="text-xs text-green-600 dark:text-green-400 whitespace-nowrap">
                              ✓ Corrected
                            </span>
                          )}
                        </div>

                        {/* Context from PDF (if available) */}
                        {extracted?.value && extracted.confidence > 50 && (
                          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 p-2 rounded">
                            <span className="font-medium">AI found:</span> "{extracted.value}"
                            <span className="ml-2">({extracted.confidence}% confidence)</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                    disabled={currentIndex === 0}
                    className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ← Previous
                  </button>

                  <button
                    onClick={markSampleReviewed}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg"
                  >
                    {currentIndex < samples.length - 1 ? "Next Sample →" : "Finish Review →"}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Summary */}
            {step === "summary" && (
              <div className="space-y-6">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-4">
                    ✓ Training Complete!
                  </h3>
                  <p className="text-sm text-green-800 dark:text-green-200">
                    Reviewed {samples.length} sample documents. Your corrections will help improve extraction accuracy.
                  </p>
                </div>

                {/* Field Success Rates */}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                    Field Extraction Results
                  </h3>
                  <div className="space-y-3">
                    {template.fields.map(field => {
                      const successCount = samples.filter(s => {
                        const extracted = s.extractedFields[field.key];
                        const corrected = s.userCorrections[field.key];
                        return (extracted && extracted.value && !corrected) || 
                               (corrected && corrected.trim() !== "");
                      }).length;
                      const successRate = (successCount / samples.length) * 100;

                      return (
                        <div key={field.key} className="flex items-center gap-4">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {field.name}
                              </span>
                              <span className={`text-sm font-medium ${
                                successRate >= 80 ? "text-green-600 dark:text-green-400" :
                                successRate >= 50 ? "text-yellow-600 dark:text-yellow-400" :
                                "text-red-600 dark:text-red-400"
                              }`}>
                                {successRate.toFixed(0)}% ({successCount}/{samples.length})
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  successRate >= 80 ? "bg-green-600" :
                                  successRate >= 50 ? "bg-yellow-600" :
                                  "bg-red-600"
                                }`}
                                style={{ width: `${successRate}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    Close (Keep Template As-Is)
                  </button>
                  <button
                    onClick={finishTraining}
                    className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg"
                  >
                    Save Training Results
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
