// Custom hook for template state management

import { useState, useEffect } from "react";
import { ExtractionTemplate } from "@/lib/templates";
import { createTemplateStorage } from "@/lib/storage";

/**
 * Hook for managing extraction templates
 * Fully user-driven - no default templates
 */
export function useTemplates() {
  const [templates, setTemplates] = useState<ExtractionTemplate[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const storage = createTemplateStorage();

  // Load templates on mount
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [loadedTemplates, loadedActiveId] = await Promise.all([
          storage.loadTemplates(),
          storage.getActiveTemplateId()
        ]);
        
        setTemplates(loadedTemplates);
        setActiveId(loadedActiveId);
        setIsLoaded(true);
      } catch (error) {
        console.error("Failed to load templates:", error);
        setTemplates([]);
        setActiveId(null);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, []);

  const activeTemplate = activeId ? templates.find(t => t.id === activeId) : null;

  const saveTemplate = async (template: ExtractionTemplate) => {
    try {
      await storage.saveTemplate(template);
      
      // Update local state
      const updated = templates.filter(t => t.id !== template.id);
      setTemplates([...updated, template]);
      
      return true;
    } catch (error) {
      console.error("Failed to save template:", error);
      return false;
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      await storage.deleteTemplate(id);
      
      // Update local state
      setTemplates(templates.filter(t => t.id !== id));
      
      // If deleted template was active, clear active
      if (activeId === id) {
        await setActiveTemplate(null);
      }
      
      return true;
    } catch (error) {
      console.error("Failed to delete template:", error);
      return false;
    }
  };

  const setActiveTemplate = async (id: string | null) => {
    try {
      if (id) {
        await storage.setActiveTemplateId(id);
      }
      setActiveId(id);
      return true;
    } catch (error) {
      console.error("Failed to set active template:", error);
      return false;
    }
  };

  const duplicateTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return null;

    const duplicate: ExtractionTemplate = {
      ...template,
      id: `template-${Date.now()}`,
      name: `${template.name} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    return duplicate;
  };

  return {
    templates,
    activeTemplate,
    isLoaded,
    isLoading,
    saveTemplate,
    deleteTemplate,
    setActiveTemplate,
    duplicateTemplate
  };
}
