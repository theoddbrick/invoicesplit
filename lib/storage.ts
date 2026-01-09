// Storage abstraction layer - easy migration to Supabase later

import { ExtractionTemplate } from "./templates";

/**
 * Abstract storage interface
 * Allows easy migration from LocalStorage to Supabase
 */
export interface TemplateStorage {
  loadTemplates(): Promise<ExtractionTemplate[]>;
  saveTemplate(template: ExtractionTemplate): Promise<void>;
  deleteTemplate(id: string): Promise<void>;
  getActiveTemplateId(): Promise<string | null>;
  setActiveTemplateId(id: string): Promise<void>;
}

/**
 * LocalStorage implementation (current)
 */
export class LocalTemplateStorage implements TemplateStorage {
  private readonly STORAGE_KEY = "invoicesplit_templates";
  private readonly ACTIVE_KEY = "invoicesplit_active_template";

  async loadTemplates(): Promise<ExtractionTemplate[]> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      
      const templates = JSON.parse(stored) as ExtractionTemplate[];
      return templates;
    } catch (error) {
      console.error("Failed to load templates:", error);
      return [];
    }
  }

  async saveTemplate(template: ExtractionTemplate): Promise<void> {
    try {
      const templates = await this.loadTemplates();
      const index = templates.findIndex(t => t.id === template.id);
      
      if (index >= 0) {
        templates[index] = {
          ...template,
          updatedAt: Date.now()
        };
      } else {
        templates.push(template);
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(templates));
    } catch (error) {
      console.error("Failed to save template:", error);
      throw error;
    }
  }

  async deleteTemplate(id: string): Promise<void> {
    if (id === "default") {
      throw new Error("Cannot delete default template");
    }
    
    try {
      const templates = await this.loadTemplates();
      const filtered = templates.filter(t => t.id !== id);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error("Failed to delete template:", error);
      throw error;
    }
  }

  async getActiveTemplateId(): Promise<string | null> {
    try {
      return localStorage.getItem(this.ACTIVE_KEY);
    } catch (error) {
      return null;
    }
  }

  async setActiveTemplateId(id: string): Promise<void> {
    try {
      localStorage.setItem(this.ACTIVE_KEY, id);
    } catch (error) {
      console.error("Failed to set active template:", error);
    }
  }
}

/**
 * Supabase implementation (future)
 * Uncomment and implement when adding authentication
 */
/*
export class SupabaseTemplateStorage implements TemplateStorage {
  private supabase: SupabaseClient;
  
  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  async loadTemplates(): Promise<ExtractionTemplate[]> {
    const { data, error } = await this.supabase
      .from('templates')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async saveTemplate(template: ExtractionTemplate): Promise<void> {
    const { error } = await this.supabase
      .from('templates')
      .upsert(template);
    
    if (error) throw error;
  }

  async deleteTemplate(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('templates')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  async getActiveTemplateId(): Promise<string> {
    const { data } = await this.supabase
      .from('user_preferences')
      .select('active_template_id')
      .single();
    
    return data?.active_template_id || 'default';
  }

  async setActiveTemplateId(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('user_preferences')
      .upsert({ active_template_id: id });
    
    if (error) throw error;
  }
}
*/

/**
 * Factory function to create appropriate storage implementation
 * For now: LocalStorage
 * Future: Check if user is authenticated, return Supabase if logged in
 */
export function createTemplateStorage(): TemplateStorage {
  // TODO: When Supabase is added:
  // const session = await supabase.auth.getSession();
  // return session ? new SupabaseTemplateStorage(supabase) : new LocalTemplateStorage();
  
  return new LocalTemplateStorage();
}
