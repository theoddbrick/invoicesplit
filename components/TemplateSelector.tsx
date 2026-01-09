"use client";

import { ExtractionTemplate } from "@/lib/templates";
import { useState } from "react";

interface TemplateSelectorProps {
  templates: ExtractionTemplate[];
  activeTemplate: ExtractionTemplate;
  onSelectTemplate: (template: ExtractionTemplate) => void;
  onCreateTemplate: () => void;
  onEditTemplate: (template: ExtractionTemplate) => void;
}

export default function TemplateSelector({
  templates,
  activeTemplate,
  onSelectTemplate,
  onCreateTemplate,
  onEditTemplate
}: TemplateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Extraction Template
      </label>
      
      <div className="flex gap-2">
        {/* Template Dropdown */}
        <div className="relative flex-1">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors"
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div className="text-left">
                <p className="font-semibold text-gray-900 dark:text-white">
                  {activeTemplate.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {activeTemplate.fields.length} fields • {activeTemplate.description}
                </p>
              </div>
            </div>
            <svg className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {isOpen && (
            <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-96 overflow-y-auto">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => {
                    onSelectTemplate(template);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors border-b border-gray-200 dark:border-gray-600 last:border-b-0 ${
                    template.id === activeTemplate.id ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {template.name}
                        {template.id === "default" && (
                          <span className="ml-2 text-xs bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded">
                            Built-in
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {template.fields.length} fields • {template.description}
                      </p>
                    </div>
                    {template.id !== "default" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditTemplate(template);
                          setIsOpen(false);
                        }}
                        className="ml-2 p-1 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                        title="Edit template"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </button>
              ))}
              
              {/* Create New Template Option */}
              <button
                onClick={() => {
                  onCreateTemplate();
                  setIsOpen(false);
                }}
                className="w-full px-4 py-3 text-left bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors text-indigo-700 dark:text-indigo-300 font-medium"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create New Template
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Edit Current Template Button */}
        {activeTemplate.id !== "default" && (
          <button
            onClick={() => onEditTemplate(activeTemplate)}
            className="px-4 py-3 bg-gray-100 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors"
            title="Edit current template"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        )}
      </div>

      {/* Template Info */}
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        <span>
          Templates are saved in your browser. Create custom templates for different invoice types.
        </span>
      </div>
    </div>
  );
}
