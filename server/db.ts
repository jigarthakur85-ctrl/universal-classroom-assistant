import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, lessons, InsertLesson, refinements, InsertRefinement, sessions, answers, InsertAnswer } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createLesson(userId: number, data: Omit<InsertLesson, 'userId'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  try {
    const result = await db.insert(lessons).values({
      ...data,
      userId,
    });
    
    // Try to extract insertId from result
    const insertId = (result as any)?.insertId || (result as any)?.[0]?.insertId;
    
    if (insertId) {
      return { insertId };
    }
    
    // Fallback: fetch by userId and createdAt
    const inserted = await db.select().from(lessons)
      .where(eq(lessons.userId, userId))
      .orderBy(desc(lessons.createdAt))
      .limit(1);
    
    if (inserted.length > 0) {
      return { insertId: inserted[0].id };
    }
    throw new Error("Failed to retrieve inserted lesson ID");
  } catch (error) {
    console.error("[Database] Failed to create lesson:", error);
    throw error;
  }
}

export async function getLessonsByUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(lessons).where(eq(lessons.userId, userId)).orderBy(desc(lessons.createdAt));
  return result;
}

export async function getLessonById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(lessons).where(eq(lessons.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createRefinement(lessonId: number, data: Omit<InsertRefinement, 'lessonId'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(refinements).values({
    ...data,
    lessonId,
  });
  
  // Try to extract insertId from result
  const insertId = (result as any)?.insertId || (result as any)?.[0]?.insertId;
  
  if (insertId) {
    return { insertId };
  }
  
  // Fallback: fetch by lessonId and createdAt
  const inserted = await db.select().from(refinements)
    .where(eq(refinements.lessonId, lessonId))
    .orderBy(desc(refinements.createdAt))
    .limit(1);
  
  if (inserted.length > 0) {
    return { insertId: inserted[0].id };
  }
  throw new Error("Failed to retrieve inserted refinement ID");
}

export async function getRefinementsByLesson(lessonId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(refinements).where(eq(refinements.lessonId, lessonId)).orderBy(desc(refinements.createdAt));
  return result;
}

export async function createAnswers(lessonId: number, answersList: Array<Omit<InsertAnswer, 'lessonId'>>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(answers).values(
    answersList.map(answer => ({
      ...answer,
      lessonId,
    }))
  );
  
  // Try to extract insertId from result
  const insertId = (result as any)?.insertId || (result as any)?.[0]?.insertId;
  
  if (insertId) {
    return { insertId };
  }
  
  // Fallback: fetch by lessonId and createdAt
  const inserted = await db.select().from(answers)
    .where(eq(answers.lessonId, lessonId))
    .orderBy(desc(answers.createdAt))
    .limit(1);
  
  if (inserted.length > 0) {
    return { insertId: inserted[0].id };
  }
  throw new Error("Failed to retrieve inserted answer ID");
}

export async function getAnswersByLesson(lessonId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(answers).where(eq(answers.lessonId, lessonId)).orderBy(desc(answers.createdAt));
  return result;
}
