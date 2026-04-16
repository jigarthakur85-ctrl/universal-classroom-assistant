import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { createLesson, getLessonsByUser, createRefinement, getRefinementsByLesson } from "../db";
import { invokeLLM } from "../_core/llm";
import { TRPCError } from "@trpc/server";

const GenerateLessonInput = z.object({
  class: z.string(),
  subject: z.string(),
  topic: z.string(),
  toolType: z.enum(["simplify", "activity", "understanding"]),
});

const RefineLessonInput = z.object({
  lessonId: z.number(),
  refinementType: z.string(),
});

const systemPrompts = {
  simplify: `You are an Expert Learning Experience Designer specializing in CBSE/NCERT curriculum. 
Your role is to simplify complex educational concepts into clear, engaging explanations that teachers can use in their classrooms.
Create simple stories, real-life analogies, and practical examples that make the concept memorable and easy to understand.
Keep the explanation concise but comprehensive, suitable for classroom teaching.`,

  activity: `You are an Expert Learning Experience Designer specializing in CBSE/NCERT curriculum.
Your role is to suggest engaging, hands-on classroom activities that help students understand the given topic.
Suggest a 2-minute activity that is practical, requires minimal resources, and can be done in a classroom setting.
Make it interactive and fun while ensuring it reinforces the learning objective.
Include clear instructions and expected learning outcomes.`,

  understanding: `You are an Expert Learning Experience Designer specializing in CBSE/NCERT curriculum.
Your role is to generate assessment questions that test student understanding of the given topic.
Create 3 conceptual questions (not just factual recall) that help teachers assess if students truly understand the concept.
Include questions that require analysis, application, or synthesis of the concept.
Format each question clearly and provide expected answer hints.`,
};

export const lessonsRouter = router({
  generateLesson: protectedProcedure
    .input(GenerateLessonInput)
    .mutation(async ({ ctx, input }) => {
      try {
        const systemPrompt = systemPrompts[input.toolType];
        const userPrompt = `Class: ${input.class}
Subject: ${input.subject}
Topic/Chapter: ${input.topic}

Please provide content for the "${input.toolType === 'simplify' ? 'Simplify Concept' : input.toolType === 'activity' ? 'Class Activity' : 'Check Understanding'}" tool.`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        });

        const messageContent = response.choices[0]?.message?.content;
        const content = typeof messageContent === 'string' ? messageContent : '';

        if (!content) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to generate content from AI",
          });
        }

        const lessonData = {
          class: input.class,
          subject: input.subject,
          topic: input.topic,
          toolType: input.toolType,
          content,
        };
        await createLesson(ctx.user.id, lessonData);

        return {
          id: Math.random(),
          class: input.class,
          subject: input.subject,
          topic: input.topic,
          toolType: input.toolType,
          content,
          createdAt: new Date(),
        };
      } catch (error) {
        console.error("Error generating lesson:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate lesson content",
        });
      }
    }),

  refineLesson: protectedProcedure
    .input(RefineLessonInput)
    .mutation(async ({ ctx, input }) => {
      try {
        const lesson = await getLessonById(input.lessonId);

        if (!lesson) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Lesson not found",
          });
        }

        if (lesson.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Not authorized to refine this lesson",
          });
        }

        const systemPrompt = systemPrompts[lesson.toolType];
        const userPrompt = `Original content:
${lesson.content}

Please refine this content based on the following request: "${input.refinementType}"
Maintain the same format and style, but apply the requested refinement.`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        });

        const refinedMessageContent = response.choices[0]?.message?.content;
        const refinedContent = typeof refinedMessageContent === 'string' ? refinedMessageContent : '';

        if (!refinedContent) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to refine content from AI",
          });
        }

        await createRefinement(input.lessonId, {
          refinementType: input.refinementType,
          refinedContent,
        });

        return {
          id: Math.random(),
          lessonId: input.lessonId,
          refinementType: input.refinementType,
          refinedContent,
          createdAt: new Date(),
        };
      } catch (error) {
        console.error("Error refining lesson:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to refine lesson content",
        });
      }
    }),

  getLessons: protectedProcedure.query(async ({ ctx }) => {
    try {
      const lessons = await getLessonsByUser(ctx.user.id);
      return lessons;
    } catch (error) {
      console.error("Error fetching lessons:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch lessons",
      });
    }
  }),

  getRefinements: protectedProcedure
    .input(z.object({ lessonId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const lesson = await getLessonById(input.lessonId);

        if (!lesson) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Lesson not found",
          });
        }

        if (lesson.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Not authorized to view this lesson",
          });
        }

        const refinements = await getRefinementsByLesson(input.lessonId);
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

async function getLessonById(id: number) {
  const { getDb } = await import("../db");
  const { lessons } = await import("../../drizzle/schema");
  const { eq } = await import("drizzle-orm");

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(lessons).where(eq(lessons.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}
