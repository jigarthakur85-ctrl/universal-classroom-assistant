/**
 * tRPC Routers - Google Sheets Version
 * Use this instead of routers.ts when using Google Sheets
 * 
 * Instructions:
 * 1. Rename routers.ts to routers-original.ts
 * 2. Rename this file to routers.ts
 * 3. Restart dev server
 */

import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import * as db from "./appsScriptClient";

// ============================================
// LESSONS ROUTER
// ============================================

const lessonsRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        class: z.string(),
        subject: z.string(),
        topic: z.string(),
        toolType: z.enum(["simplify", "activity", "understanding"]),
        language: z.string(),
        content: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await db.createLesson(ctx.user.id, input);
        return { success: true, insertId: result.insertId };
      } catch (error) {
        console.error("Error creating lesson:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create lesson",
        });
      }
    }),

  getByUser: protectedProcedure.query(async ({ ctx }) => {
    try {
      const lessons = await db.getLessonsByUser(ctx.user.id);
      return lessons;
    } catch (error) {
      console.error("Error fetching lessons:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch lessons",
      });
    }
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      try {
        const lesson = await db.getLessonById(input.id);
        return lesson;
      } catch (error) {
        console.error("Error fetching lesson:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch lesson",
        });
      }
    }),
});

// ============================================
// REFINEMENTS ROUTER
// ============================================

const refinementsRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        lessonId: z.number(),
        refinementType: z.string(),
        content: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await db.createRefinement(
          input.lessonId,
          input.refinementType,
          input.content
        );
        return { success: true, insertId: result.insertId };
      } catch (error) {
        console.error("Error creating refinement:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create refinement",
        });
      }
    }),

  getByLesson: protectedProcedure
    .input(z.object({ lessonId: z.number() }))
    .query(async ({ input }) => {
      try {
        const refinements = await db.getRefinementsByLesson(input.lessonId);
        return refinements;
      } catch (error) {
        console.error("Error fetching refinements:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch refinements",
        });
      }
    }),
});

// ============================================
// ANSWERS ROUTER
// ============================================

const answersRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        lessonId: z.number(),
        answers: z.array(
          z.object({
            questionNumber: z.number(),
            answer: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await db.createAnswers(input.lessonId, input.answers);
        return { success: true, insertId: result.insertId };
      } catch (error) {
        console.error("Error creating answers:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create answers",
        });
      }
    }),

  getByLesson: protectedProcedure
    .input(z.object({ lessonId: z.number() }))
    .query(async ({ input }) => {
      try {
        const answers = await db.getAnswersByLesson(input.lessonId);
        return answers;
      } catch (error) {
        console.error("Error fetching answers:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch answers",
        });
      }
    }),
});

// ============================================
// AI GENERATION ROUTER
// ============================================

const aiRouter = router({
  generateLesson: protectedProcedure
    .input(
      z.object({
        class: z.string(),
        subject: z.string(),
        topic: z.string(),
        toolType: z.enum(["simplify", "activity", "understanding"]),
        language: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const prompt = buildPrompt(input);
        const response = await invokeLLM({
          messages: [{ role: "user", content: prompt }],
        });

        const content =
          response.choices[0].message.content || "Failed to generate content";
        return { content };
      } catch (error) {
        console.error("Error generating lesson:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate lesson",
        });
      }
    }),

  refineContent: protectedProcedure
    .input(
      z.object({
        content: z.string(),
        refinementType: z.string(),
        language: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const prompt = buildRefinementPrompt(input);
        const response = await invokeLLM({
          messages: [{ role: "user", content: prompt }],
        });

        const content =
          response.choices[0].message.content || "Failed to refine content";
        return { content };
      } catch (error) {
        console.error("Error refining content:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to refine content",
        });
      }
    }),
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function buildPrompt(input: {
  class: string;
  subject: string;
  topic: string;
  toolType: string;
  language: string;
}): string {
  const basePrompt = `You are an expert educator specializing in CBSE/NCERT curriculum for Class ${input.class} ${input.subject}.

Your task is to create comprehensive, teacher-ready educational content for: ${input.topic}

Language: ${input.language}

${getToolSpecificPrompt(input.toolType)}

Requirements:
- Content must be detailed and comprehensive
- Include concrete examples from Indian context
- Use simple, clear language
- Format with markdown headers
- Minimum 400 words
- Make it immediately usable by teachers`;

  return basePrompt;
}

function buildRefinementPrompt(input: {
  content: string;
  refinementType: string;
  language: string;
}): string {
  return `You are an expert educator. 

Original content:
${input.content}

Task: ${input.refinementType}

Language: ${input.language}

Provide the refined content maintaining all important information while applying the requested refinement. Format with markdown headers.`;
}

function getToolSpecificPrompt(toolType: string): string {
  switch (toolType) {
    case "simplify":
      return `Generate a simplified explanation with:
1. Clear Definition (1-2 sentences)
2. Real-Life Analogies (2-3 examples)
3. Step-by-Step Breakdown (4-5 steps)
4. Why It Matters (applications)
5. Common Misconceptions (2-3 with clarifications)
6. Teaching Tips (3-4 practical tips)`;

    case "activity":
      return `Generate a classroom activity with:
1. Activity Overview (title, objective, time, grade)
2. Materials Needed (with quantities)
3. Step-by-Step Instructions (6-8 detailed steps)
4. Facilitation Tips (3+ tips)
5. Assessment Criteria (3+ criteria)
6. Variations for Different Levels
7. Common Challenges & Solutions`;

    case "understanding":
      return `Generate 3 conceptual questions with:
1. Question (conceptual, not just recall)
2. Expected Answer (detailed)
3. Common Misconceptions
4. Teaching Guidance
5. Follow-up Question`;

    default:
      return "";
  }
}

// ============================================
// MAIN ROUTER
// ============================================

export const appRouter = router({
  lessons: lessonsRouter,
  refinements: refinementsRouter,
  answers: answersRouter,
  ai: aiRouter,
  // Keep existing auth and system routers...
});

export type AppRouter = typeof appRouter;
