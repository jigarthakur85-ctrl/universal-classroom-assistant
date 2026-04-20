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
  language: z.enum(["english", "hindi", "gujarati", "marathi", "punjabi", "bengali", "tamil", "telugu", "kannada", "malayalam", "other"]).default("english"),
});

const RefineLessonInput = z.object({
  lessonId: z.number(),
  refinementType: z.string(),
});

const LANGUAGE_NAMES: Record<string, string> = {
  english: 'English',
  hindi: 'Hindi',
  gujarati: 'Gujarati',
  marathi: 'Marathi',
  punjabi: 'Punjabi',
  bengali: 'Bengali',
  tamil: 'Tamil',
  telugu: 'Telugu',
  kannada: 'Kannada',
  malayalam: 'Malayalam',
};

const systemPrompts = {
  simplify: (language: string) => `You are an Expert Learning Experience Designer specializing in CBSE/NCERT curriculum.
Your role is to provide DETAILED, COMPREHENSIVE explanations of complex educational concepts that teachers can use directly in their classrooms.

IMPORTANT: Provide COMPLETE, IN-DEPTH explanations with:
1. Clear definition of the concept
2. Multiple real-life analogies and examples
3. Step-by-step breakdown of how it works
4. Why it matters and its applications
5. Common misconceptions to address
6. Tips for teaching this concept effectively

Make it detailed enough that a teacher can use it directly without needing additional research.
Provide the explanation in ${LANGUAGE_NAMES[language] || 'English'} ONLY. Do not mix languages.`,

  activity: (language: string) => `You are an Expert Learning Experience Designer specializing in CBSE/NCERT curriculum.
Your role is to suggest DETAILED, COMPREHENSIVE classroom activities that help students understand the given topic.

IMPORTANT: Provide COMPLETE activity details including:
1. Activity title and learning objective
2. Time required (realistic estimate)
3. Materials needed (with quantities)
4. Step-by-step instructions (detailed and clear)
5. How to facilitate student participation
6. Expected learning outcomes
7. Assessment criteria
8. Variations or extensions for different learning levels
9. Common challenges and how to address them
10. Tips for making it engaging

Make the activity detailed enough that a teacher can implement it immediately without additional planning.
Provide the activity in ${LANGUAGE_NAMES[language] || 'English'} ONLY. Do not mix languages.`,

  understanding: (language: string) => `You are an Expert Learning Experience Designer specializing in CBSE/NCERT curriculum.
Your role is to generate COMPREHENSIVE assessment questions and DETAILED answers that test student understanding of the given topic.

IMPORTANT: Create 3 conceptual questions with DETAILED answers including:
- Questions that require analysis, application, or synthesis (not just factual recall)
- Each answer should be COMPREHENSIVE and include:
  * Direct answer to the question
  * Detailed explanation with examples
  * Common misconceptions students might have
  * How to guide students to the correct understanding
  * Real-world applications
  * Follow-up questions teachers can ask

Make answers detailed enough that teachers can use them as a complete marking rubric.
Provide the questions and answers in ${LANGUAGE_NAMES[language] || 'English'} ONLY. Do not mix languages.
For Check Understanding, format your response as:
QUESTION 1: [question text]
ANSWER 1: [detailed answer with explanation, examples, and teaching tips]
QUESTION 2: [question text]
ANSWER 2: [detailed answer with explanation, examples, and teaching tips]
QUESTION 3: [question text]
ANSWER 3: [detailed answer with explanation, examples, and teaching tips]`,
};

export const lessonsRouter = router({
  generateLesson: protectedProcedure
    .input(GenerateLessonInput)
    .mutation(async ({ ctx, input }) => {
      try {
        const promptLanguage = input.language;
        const systemPrompt = systemPrompts[input.toolType](promptLanguage);
        
        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Class: ${input.class}\nSubject: ${input.subject}\nTopic: ${input.topic}` },
          ],
        });

        const content = typeof response.choices[0]?.message?.content === 'string' ? response.choices[0].message.content : JSON.stringify(response.choices[0]?.message?.content) || "";

        const result = await createLesson(ctx.user.id, {
          class: input.class,
          subject: input.subject,
          topic: input.topic,
          toolType: input.toolType,
          language: input.language,
          content,
        });

        return {
          id: result.insertId,
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
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create lesson',
        });
      }
    }),

  refineLesson: protectedProcedure
    .input(RefineLessonInput)
    .mutation(async ({ ctx, input }) => {
      try {
        const lesson = await getLessonById(input.lessonId);
        if (!lesson) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Lesson not found' });
        }

        const refinementPrompts: Record<string, string> = {
          'Make simpler': 'Make this explanation simpler and easier to understand. Use shorter sentences and simpler vocabulary.',
          'Add examples': 'Add more real-world examples and practical applications to help teachers understand better.',
          'Shorter': 'Make this more concise while keeping the key information. Remove unnecessary details.',
        };

        const refinementPrompt = refinementPrompts[input.refinementType] || input.refinementType;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are an expert educator. Refine the following content based on the user's request." },
            { role: "user", content: `${refinementPrompt}\n\nOriginal content:\n${lesson.content}` },
          ],
        });

        const refinedContent = typeof response.choices[0]?.message?.content === 'string' ? response.choices[0].message.content : JSON.stringify(response.choices[0]?.message?.content) || "";

        const result = await createRefinement(lesson.id, {
          refinementType: input.refinementType,
          refinedContent,
        });

        return {
          id: result.insertId,
          lessonId: lesson.id,
          refinementType: input.refinementType,
          refinedContent,
          createdAt: new Date(),
        };
      } catch (error) {
        console.error("Error refining lesson:", error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to refine lesson',
        });
      }
    }),

  getLessons: protectedProcedure.query(async ({ ctx }) => {
    return await getLessonsByUser(ctx.user.id);
  }),
});
