// Custom hook for template state management

import { useState, useEffect } from "react";
import { ExtractionTemplate, DEFAULT_TEMPLATE } from "@/lib/templates";
import { createTemplateStorage } from "@/lib/storage";

/**
 * Hook for managing extraction templates
 * Handles loading, saving, and active template selection
 */
export function useTemplates() {
  const [templates, setTemplates] = useState<ExtractionTemplate[]>([DEFAULT_TEMPLATE]);
  const [activeId, setActiveId] = useState<string>("default");
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
        
        // Always include default template
        const allTemplates = [DEFAULT_TEMPLATE, ...loadedTemplates.filter(t => t.id !== "default")];
        
        setTemplates(allTemplates);
        setActiveId(loadedActiveId);
        setIsLoaded(true);
      } catch (error) {
        console.error("Failed to load templates:", error);
        // Fall back to defaults
        setTemplates([DEFAULT_TEMPLATE]);
        setActiveId("default");
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, []);

  const activeTemplate = templates.find(t => t.id === activeId) || DEFAULT_TEMPLATE;

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
    if (id === "default") {
      throw new Error("Cannot delete default template");
    }
    
    try {
      await storage.deleteTemplate(id);
      
      // Update local state
      setTemplates(templates.filter(t => t.id !== id));
      
      // If deleted template was active, switch to default
      if (activeId === id) {
        await setActiveTemplate("default");
      }
      
      return true;
    } catch (error) {
      console.error("Failed to delete template:", error);
      return false;
    }
  };

  const setActiveTemplate = async (id: string) => {
    try {
      await storage.setActiveTemplateId(id);
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
