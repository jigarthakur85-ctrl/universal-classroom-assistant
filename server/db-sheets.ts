/**
 * Database abstraction layer for Google Sheets
 * Provides same interface as MySQL version
 */

import { getSheetData, addSheetRow, filterSheetRows, getSheetRowById } from "./googleSheets";

// Types
export interface Lesson {
  id: number;
  userId: number;
  class: string;
  subject: string;
  topic: string;
  toolType: "simplify" | "activity" | "understanding";
  language: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Refinement {
  id: number;
  lessonId: number;
  refinementType: string;
  content: string;
  createdAt: Date;
}

export interface Answer {
  id: number;
  lessonId: number;
  questionNumber: number;
  answer: string;
  createdAt: Date;
}

// Database functions

export async function createLesson(userId: number, data: Omit<Lesson, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    const lesson = {
      id: Date.now(),
      ...data,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const success = await addSheetRow('lessons', lesson as any);
    if (success) {
      return { insertId: lesson.id };
    }
    throw new Error("Failed to create lesson");
  } catch (error) {
    console.error("Error creating lesson:", error);
    throw error;
  }
}

export async function getLessonsByUser(userId: number) {
  try {
    const rows = await getSheetData('lessons');
    return rows.filter((row: any) => row.userId === String(userId) || row.userId === userId);
  } catch (error) {
    console.error("Error getting lessons:", error);
    return [];
  }
}

export async function getLessonById(id: number) {
  try {
    const row = await getSheetRowById('lessons', id);
    return row || undefined;
  } catch (error) {
    console.error("Error getting lesson:", error);
    return undefined;
  }
}

export async function createRefinement(lessonId: number, data: Omit<Refinement, 'id' | 'createdAt'>) {
  try {
    const refinement = {
      id: Date.now(),
      ...data,
      lessonId,
      createdAt: new Date().toISOString(),
    };

    const success = await addSheetRow('refinements', refinement as any);
    if (success) {
      return { insertId: refinement.id };
    }
    throw new Error("Failed to create refinement");
  } catch (error) {
    console.error("Error creating refinement:", error);
    throw error;
  }
}

export async function getRefinementsByLesson(lessonId: number) {
  try {
    const rows = await getSheetData('refinements');
    return rows.filter((row: any) => row.lessonId === String(lessonId) || row.lessonId === lessonId);
  } catch (error) {
    console.error("Error getting refinements:", error);
    return [];
  }
}

export async function createAnswers(lessonId: number, answersList: Array<Omit<Answer, 'id' | 'lessonId' | 'createdAt'>>) {
  try {
    const answers = answersList.map((answer, index) => ({
      id: Date.now() + index,
      lessonId,
      ...answer,
      createdAt: new Date().toISOString(),
    }));

    for (const answer of answers) {
      await addSheetRow('answers', answer as any);
    }

    return { insertId: answers[0].id };
  } catch (error) {
    console.error("Error creating answers:", error);
    throw error;
  }
}

export async function getAnswersByLesson(lessonId: number) {
  try {
    const rows = await getSheetData('answers');
    return rows.filter((row: any) => row.lessonId === String(lessonId) || row.lessonId === lessonId);
  } catch (error) {
    console.error("Error getting answers:", error);
    return [];
  }
}
