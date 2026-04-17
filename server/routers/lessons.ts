import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { createLesson, getLessonsByUser, createRefinement, getRefinementsByLesson, createAnswers, getAnswersByLesson, getLessonById } from "../db";
import { invokeLLM } from "../_core/llm";
import { TRPCError } from "@trpc/server";

const GenerateLessonInput = z.object({
  class: z.string(),
  subject: z.string(),
  topic: z.string(),
  toolType: z.enum(["simplify", "activity", "understanding"]),
  language: z.enum(["english", "hindi"]).default("english"),
});

const RefineLessonInput = z.object({
  lessonId: z.number(),
  refinementType: z.string(),
});

const systemPrompts = {
  simplify: (language: string) => `You are an Expert Learning Experience Designer specializing in CBSE/NCERT curriculum. 
Your role is to simplify complex educational concepts into clear, engaging explanations that teachers can use in their classrooms.
Create simple stories, real-life analogies, and practical examples that make the concept memorable and easy to understand.
Keep the explanation concise but comprehensive, suitable for classroom teaching.
${language === 'hindi' ? 'Provide the explanation in Hindi ONLY. Do not include English.' : 'Provide the explanation in English ONLY. Do not include Hindi.'}`,

  activity: (language: string) => `You are an Expert Learning Experience Designer specializing in CBSE/NCERT curriculum.
Your role is to suggest engaging, hands-on classroom activities that help students understand the given topic.
Suggest a 2-minute activity that is practical, requires minimal resources, and can be done in a classroom setting.
Make it interactive and fun while ensuring it reinforces the learning objective.
Include clear instructions and expected learning outcomes.
${language === 'hindi' ? 'Provide the activity in Hindi ONLY. Do not include English.' : 'Provide the activity in English ONLY. Do not include Hindi.'}`,

  understanding: (language: string) => `You are an Expert Learning Experience Designer specializing in CBSE/NCERT curriculum.
Your role is to generate assessment questions that test student understanding of the given topic.
Create 3 conceptual questions (not just factual recall) that help teachers assess if students truly understand the concept.
Include questions that require analysis, application, or synthesis of the concept.
Format each question clearly with a separate section for answers.
${language === 'hindi' ? 'Provide the questions and answers in Hindi ONLY. Do not include English.' : 'Provide the questions and answers in English ONLY. Do not include Hindi.'}
For Check Understanding, format your response as:
QUESTION 1: [question text]
ANSWER 1: [answer text]
QUESTION 2: [question text]
ANSWER 2: [answer text]
QUESTION 3: [question text]
ANSWER 3: [answer text]`,
};

export const lessonsRouter = router({
  generateLesson: protectedProcedure
    .input(GenerateLessonInput)
    .mutation(async ({ ctx, input }) => {
      try {
        const systemPrompt = systemPrompts[input.toolType](input.language);
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
          language: input.language,
          content,
        };
        
        const lessonResult = await createLesson(ctx.user.id, lessonData);
        const lessonId = (lessonResult as any).insertId;
        
        if (!lessonId) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create lesson",
          });
        }
        
        // Extract and store answers for Check Understanding
        if (input.toolType === 'understanding') {
          const answers = extractAnswers(content);
          if (answers.length > 0) {
            try {
              await createAnswers(lessonId, answers);
            } catch (e) {
              console.warn("Failed to store answers:", e);
            }
          }
        }

        return {
          id: lessonId,
          class: input.class,
          subject: input.subject,
          topic: input.topic,
          toolType: input.toolType,
          language: input.language,
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

        const systemPrompt = systemPrompts[lesson.toolType](lesson.language);
        const userPrompt = `Original content:
${lesson.content}

Please refine this content based on the following request: "${input.refinementType}"
Maintain the same format and style, but apply the requested refinement.
${lesson.language === 'hindi' ? 'Provide the refined content in Hindi ONLY.' : 'Provide the refined content in English ONLY.'}`;

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

        const refinementResult = await createRefinement(input.lessonId, {
          refinementType: input.refinementType,
          refinedContent,
        });

        return {
          id: (refinementResult as any).insertId || Math.floor(Math.random() * 1000000),
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

  getAnswers: protectedProcedure
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

        const answers = await getAnswersByLesson(input.lessonId);
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

function extractAnswers(content: string): Array<{ questionNumber: number; answerText: string }> {
  const answers: Array<{ questionNumber: number; answerText: string }> = [];
  
  // Pattern to match ANSWER 1: ..., ANSWER 2: ..., etc.
  const answerPattern = /ANSWER\s+(\d+):\s*(.+?)(?=QUESTION|ANSWER|$)/gi;
  let match;
  
  while ((match = answerPattern.exec(content)) !== null) {
    const questionNumber = parseInt(match[1], 10);
    const answerText = match[2].trim();
    
    if (answerText) {
      answers.push({
        questionNumber,
        answerText,
      });
    }
  }
  
  return answers;
}
