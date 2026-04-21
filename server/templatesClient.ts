/**
 * Lesson Templates API Client
 * Communicates with Google Apps Script for templates management
 */

import * as appsScript from "./appsScriptClient";

export interface LessonTemplate {
  id: number;
  title: string;
  description: string;
  class: string;
  subject: string;
  topic: string;
  toolType: "simplify" | "activity" | "understanding";
  language: string;
  content: string;
  author: string;
  tags: string;
  difficulty: "easy" | "medium" | "hard";
  estimatedTime: number;
  downloads: number;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create a new template
 */
export async function createTemplate(
  userId: number,
  data: Omit<LessonTemplate, "id" | "downloads" | "rating" | "createdAt" | "updatedAt">
) {
  const templateData = {
    id: Date.now(),
    ...data,
    downloads: 0,
    rating: 0,
    author: userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    const response = await fetch(
      `${process.env.GOOGLE_APPS_SCRIPT_URL}?action=add&sheet=templates`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(templateData),
      }
    );

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error creating template:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * Get all templates
 */
export async function getAllTemplates(): Promise<LessonTemplate[]> {
  try {
    const response = await fetch(
      `${process.env.GOOGLE_APPS_SCRIPT_URL}?action=getAll&sheet=templates`
    );

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error("Error fetching templates:", error);
    return [];
  }
}

/**
 * Get templates by class
 */
export async function getTemplatesByClass(classLevel: string): Promise<LessonTemplate[]> {
  try {
    const allTemplates = await getAllTemplates();
    return allTemplates.filter((t: any) => t.class === classLevel);
  } catch (error) {
    console.error("Error fetching templates by class:", error);
    return [];
  }
}

/**
 * Get templates by subject
 */
export async function getTemplatesBySubject(subject: string): Promise<LessonTemplate[]> {
  try {
    const allTemplates = await getAllTemplates();
    return allTemplates.filter((t: any) => t.subject === subject);
  } catch (error) {
    console.error("Error fetching templates by subject:", error);
    return [];
  }
}

/**
 * Get templates by topic
 */
export async function getTemplatesByTopic(topic: string): Promise<LessonTemplate[]> {
  try {
    const allTemplates = await getAllTemplates();
    return allTemplates.filter((t: any) => t.topic.toLowerCase().includes(topic.toLowerCase()));
  } catch (error) {
    console.error("Error fetching templates by topic:", error);
    return [];
  }
}

/**
 * Search templates
 */
export async function searchTemplates(query: string): Promise<LessonTemplate[]> {
  try {
    const allTemplates = await getAllTemplates();
    const lowerQuery = query.toLowerCase();

    return allTemplates.filter(
      (t: any) =>
        t.title.toLowerCase().includes(lowerQuery) ||
        t.description.toLowerCase().includes(lowerQuery) ||
        t.topic.toLowerCase().includes(lowerQuery) ||
        (t.tags && t.tags.toLowerCase().includes(lowerQuery))
    );
  } catch (error) {
    console.error("Error searching templates:", error);
    return [];
  }
}

/**
 * Get template by ID
 */
export async function getTemplateById(id: number): Promise<LessonTemplate | null> {
  try {
    const response = await fetch(
      `${process.env.GOOGLE_APPS_SCRIPT_URL}?action=getById&sheet=templates&id=${id}`
    );

    const result = await response.json();
    return result.data || null;
  } catch (error) {
    console.error("Error fetching template:", error);
    return null;
  }
}

/**
 * Get popular templates (sorted by downloads)
 */
export async function getPopularTemplates(limit: number = 10): Promise<LessonTemplate[]> {
  try {
    const allTemplates = await getAllTemplates();
    return allTemplates
      .sort((a: any, b: any) => (b.downloads || 0) - (a.downloads || 0))
      .slice(0, limit);
  } catch (error) {
    console.error("Error fetching popular templates:", error);
    return [];
  }
}

/**
 * Get top-rated templates
 */
export async function getTopRatedTemplates(limit: number = 10): Promise<LessonTemplate[]> {
  try {
    const allTemplates = await getAllTemplates();
    return allTemplates
      .sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0))
      .slice(0, limit);
  } catch (error) {
    console.error("Error fetching top-rated templates:", error);
    return [];
  }
}

/**
 * Increment template download count
 */
export async function incrementTemplateDownloads(id: number): Promise<boolean> {
  try {
    const template = await getTemplateById(id);
    if (!template) return false;

    const updated = {
      ...template,
      downloads: (template.downloads || 0) + 1,
    };

    const response = await fetch(
      `${process.env.GOOGLE_APPS_SCRIPT_URL}?action=update&sheet=templates`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      }
    );

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error("Error incrementing downloads:", error);
    return false;
  }
}

/**
 * Update template rating
 */
export async function updateTemplateRating(id: number, newRating: number): Promise<boolean> {
  try {
    const template = await getTemplateById(id);
    if (!template) return false;

    const updated = {
      ...template,
      rating: newRating,
    };

    const response = await fetch(
      `${process.env.GOOGLE_APPS_SCRIPT_URL}?action=update&sheet=templates`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      }
    );

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error("Error updating rating:", error);
    return false;
  }
}
