/**
 * Google Apps Script API Client
 * Communicates with Google Apps Script web app
 */

const APPS_SCRIPT_URL = process.env.GOOGLE_APPS_SCRIPT_URL;

if (!APPS_SCRIPT_URL) {
  console.warn("⚠️ GOOGLE_APPS_SCRIPT_URL not configured. Database operations will fail.");
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  insertId?: number;
}

/**
 * Make GET request to Apps Script
 */
async function appsScriptGet<T>(
  action: string,
  sheet: string,
  params: Record<string, string | number> = {}
): Promise<ApiResponse<T>> {
  try {
    if (!APPS_SCRIPT_URL) {
      throw new Error("GOOGLE_APPS_SCRIPT_URL not configured");
    }

    const url = new URL(APPS_SCRIPT_URL);
    url.searchParams.append("action", action);
    url.searchParams.append("sheet", sheet);

    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });

    const response = await fetch(url.toString());
    const data = await response.json();

    return data;
  } catch (error) {
    console.error("Apps Script GET error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Make POST request to Apps Script
 */
async function appsScriptPost<T>(
  action: string,
  sheet: string,
  data: Record<string, any>
): Promise<ApiResponse<T>> {
  try {
    if (!APPS_SCRIPT_URL) {
      throw new Error("GOOGLE_APPS_SCRIPT_URL not configured");
    }

    const url = new URL(APPS_SCRIPT_URL);
    url.searchParams.append("action", action);
    url.searchParams.append("sheet", sheet);

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Apps Script POST error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ============================================
// LESSONS API
// ============================================

export async function createLesson(
  userId: number,
  data: {
    class: string;
    subject: string;
    topic: string;
    toolType: "simplify" | "activity" | "understanding";
    language: string;
    content: string;
  }
) {
  const lessonData = {
    id: Date.now(),
    userId,
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const result = await appsScriptPost("add", "lessons", lessonData);
  return result;
}

export async function getLessonsByUser(userId: number) {
  const result = await appsScriptGet("getByUserId", "lessons", { userId });
  return result.data || [];
}

export async function getLessonById(id: number) {
  const result = await appsScriptGet("getById", "lessons", { id });
  return result.data || null;
}

// ============================================
// REFINEMENTS API
// ============================================

export async function createRefinement(
  lessonId: number,
  refinementType: string,
  content: string
) {
  const refinementData = {
    id: Date.now(),
    lessonId,
    refinementType,
    content,
    createdAt: new Date().toISOString(),
  };

  const result = await appsScriptPost("add", "refinements", refinementData);
  return result;
}

export async function getRefinementsByLesson(lessonId: number) {
  const result = await appsScriptGet("getByLessonId", "refinements", {
    lessonId,
  });
  return result.data || [];
}

// ============================================
// ANSWERS API
// ============================================

export async function createAnswers(
  lessonId: number,
  answersList: Array<{
    questionNumber: number;
    answer: string;
  }>
) {
  const results = [];

  for (const answer of answersList) {
    const answerData = {
      id: Date.now() + Math.random(),
      lessonId,
      ...answer,
      createdAt: new Date().toISOString(),
    };

    const result = await appsScriptPost("add", "answers", answerData);
    results.push(result);
  }

  return { success: results.every((r) => r.success), insertId: Date.now() };
}

export async function getAnswersByLesson(lessonId: number) {
  const result = await appsScriptGet("getByLessonId", "answers", { lessonId });
  return result.data || [];
}

// ============================================
// USERS API
// ============================================

export async function createUser(userData: {
  openId: string;
  email: string;
  name: string;
  role: "user" | "admin";
}) {
  const user = {
    id: Date.now(),
    ...userData,
    createdAt: new Date().toISOString(),
  };

  const result = await appsScriptPost("add", "users", user);
  return result;
}

export async function getUserByOpenId(openId: string) {
  const result = await appsScriptGet<any[]>("getAll", "users");
  const users = (result.data as any[]) || [];
  return users.find((u: any) => u.openId === openId) || null;
}
