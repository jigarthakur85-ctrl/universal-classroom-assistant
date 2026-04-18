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
  language: z.enum(["english", "hindi", "other"]).default("english"),
  indianLanguage: z.string().optional(), // Specific Indian language name (e.g., "gujarati", "marathi")
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
Your role is to simplify complex educational concepts into clear, engaging explanations that teachers can use in their classrooms.
Create simple stories, real-life analogies, and practical examples that make the concept memorable and easy to understand.
Keep the explanation concise but comprehensive, suitable for classroom teaching.
Provide the explanation in ${LANGUAGE_NAMES[language] || 'English'} ONLY. Do not mix languages.`,

  activity: (language: string) => `You are an Expert Learning Experience Designer specializing in CBSE/NCERT curriculum.
Your role is to suggest engaging, hands-on classroom activities that help students understand the given topic.
Suggest a 2-minute activity that is practical, requires minimal resources, and can be done in a classroom setting.
Make it interactive and fun while ensuring it reinforces the learning objective.
Include clear instructions and expected learning outcomes.
Provide the activity in ${LANGUAGE_NAMES[language] || 'English'} ONLY. Do not mix languages.`,

  understanding: (language: string) => `You are an Expert Learning Experience Designer specializing in CBSE/NCERT curriculum.
Your role is to generate assessment questions that test student understanding of the given topic.
Create 3 conceptual questions (not just factual recall) that help teachers assess if students truly understand the concept.
Include questions that require analysis, application, or synthesis of the concept.
Format each question clearly with a separate section for answers.
Provide the questions and answers in ${LANGUAGE_NAMES[language] || 'English'} ONLY. Do not mix languages.
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
        // Use specific Indian language if selected, otherwise use main language
        const promptLanguage = input.language === 'other' && input.indianLanguage ? input.indianLanguage : input.language;
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
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create lesson",
        });
      }
    }),

  refineLesson: protectedProcedure
    .input(RefineLessonInput)
    .mutation(async ({ ctx, input }) => {
      try {
        const lesson = await getLessonById(input.lessonId);
        if (!lesson || lesson.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Lesson not found" });
        }

        const refinementPrompt = `You are helping refine educational content. The original content was about: ${lesson.topic} in ${lesson.subject} for Class ${lesson.class}.

Refinement request: ${input.refinementType}

Please apply this refinement to make the content better. Maintain the same language as the original (${LANGUAGE_NAMES[lesson.language] || 'English'}).`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are an expert educational content editor. Refine the content based on the user's request." },
            { role: "user", content: refinementPrompt },
            { role: "user", content: `Original content:\n\n${lesson.content}` },
          ],
        });

        const refinedContent = typeof response.choices[0]?.message?.content === 'string' ? response.choices[0].message.content : JSON.stringify(response.choices[0]?.message?.content) || "";

        await createRefinement(input.lessonId, {
          refinementType: input.refinementType,
          refinedContent,
        });

        return {
          lessonId: input.lessonId,
          refinementType: input.refinementType,
          refinedContent,
          createdAt: new Date(),
        };
      } catch (error) {
        console.error("Error refining lesson:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to refine lesson",
        });
      }
    }),
});
