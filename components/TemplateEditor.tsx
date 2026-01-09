"use client";

import { ExtractionTemplate, ExtractionField, FieldType, generateFieldKey } from "@/lib/templates";
import { useState } from "react";

interface TemplateEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: ExtractionTemplate) => void;
  template?: ExtractionTemplate; // If provided, editing existing template
}

export default function TemplateEditor({
  isOpen,
  onClose,
  onSave,
  template
}: TemplateEditorProps) {
  const isEditing = !!template;
  
  const [name, setName] = useState(template?.name || "");
  const [description, setDescription] = useState(template?.description || "");
  const [documentType, setDocumentType] = useState(template?.documentType || "invoice");
  const [fields, setFields] = useState<ExtractionField[]>(
    template?.fields || []
  );

  if (!isOpen) return null;

  const addField = () => {
    const newField: ExtractionField = {
      id: `field-${Date.now()}`,
      name: "",
      key: "",
      description: "",
      required: false,
      type: "text"
    };
    setFields([...fields, newField]);
  };

  const updateField = (index: number, updates: Partial<ExtractionField>) => {
    const updated = [...fields];
    updated[index] = { ...updated[index], ...updates };
    
    // Auto-generate key if name changed
    if (updates.name !== undefined) {
      updated[index].key = generateFieldKey(updates.name);
    }
    
    setFields(updated);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    // Validation
    if (!name.trim()) {
      alert("Please enter a template name");
      return;
    }

    if (fields.length === 0) {
      alert("Please add at least one field");
      return;
    }

    const emptyFields = fields.filter(f => !f.name.trim());
    if (emptyFields.length > 0) {
      alert("Please fill in all field names");
      return;
    }

    const savedTemplate: ExtractionTemplate = {
      id: template?.id || `template-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      fields,
      documentType: documentType.toLowerCase(),
      createdAt: template?.createdAt || Date.now(),
      updatedAt: Date.now()
    };

    onSave(savedTemplate);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />

      {/* Modal */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {isEditing ? "Edit Template" : "Create New Template"}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Define custom fields to extract from your documents
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {/* Template Info */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Travel Invoices, Utility Bills"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., For Trip.com booking invoices"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Document Type *
                </label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="invoice">Invoice</option>
                  <option value="receipt">Receipt</option>
                  <option value="statement">Statement</option>
                  <option value="bill">Bill</option>
                  <option value="contract">Contract</option>
                  <option value="other">Other</option>
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Helps validate that uploaded documents match this template
                </p>
              </div>
            </div>

            {/* Fields Section */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Fields to Extract ({fields.length})
                </h3>
                <button
                  onClick={addField}
                  className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Field
                </button>
              </div>

              {fields.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p>No fields yet. Click "Add Field" to get started.</p>
                </div>
              )}

              {/* Field List */}
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Field {index + 1}
                      </span>
                      <button
                        onClick={() => removeField(index)}
                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                          Field Name *
                        </label>
                        <input
                          type="text"
                          value={field.name}
                          onChange={(e) => updateField(index, { name: e.target.value })}
                          placeholder="e.g., Invoice NO."
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                          Type
                        </label>
                        <select
                          value={field.type}
                          onChange={(e) => updateField(index, { type: e.target.value as FieldType })}
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                        >
                          <option value="text">Text</option>
                          <option value="number">Number</option>
                          <option value="date">Date</option>
                          <option value="currency">Currency</option>
                        </select>
                      </div>
                    </div>

                    <div className="mt-3">
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                        Description (helps AI understand what to extract)
                      </label>
                      <textarea
                        value={field.description}
                        onChange={(e) => updateField(index, { description: e.target.value })}
                        placeholder="e.g., The invoice number or reference ID"
                        rows={2}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div className="mt-3 flex items-center">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => updateField(index, { required: e.target.checked })}
                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Required field (warn if empty)
                        </span>
                      </label>
                    </div>

                    {field.key && (
                      <div className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                        JSON key: <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">{field.key}</code>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {fields.length} field{fields.length !== 1 ? 's' : ''} defined
            </p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
              >
                {isEditing ? "Save Changes" : "Create Template"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
