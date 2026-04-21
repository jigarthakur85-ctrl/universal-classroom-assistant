/**
 * Templates Router - tRPC procedures for lesson templates
 */

import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as templatesClient from "../templatesClient";

export const templatesRouter = router({
  /**
   * Get all templates (public)
   */
  getAll: publicProcedure.query(async () => {
    try {
      const templates = await templatesClient.getAllTemplates();
      return templates;
    } catch (error) {
      console.error("Error fetching templates:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch templates",
      });
    }
  }),

  /**
   * Search templates by query
   */
  search: publicProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ input }) => {
      try {
        const templates = await templatesClient.searchTemplates(input.query);
        return templates;
      } catch (error) {
        console.error("Error searching templates:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to search templates",
        });
      }
    }),

  /**
   * Get templates by class
   */
  getByClass: publicProcedure
    .input(z.object({ class: z.string() }))
    .query(async ({ input }) => {
      try {
        const templates = await templatesClient.getTemplatesByClass(input.class);
        return templates;
      } catch (error) {
        console.error("Error fetching templates by class:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch templates",
        });
      }
    }),

  /**
   * Get templates by subject
   */
  getBySubject: publicProcedure
    .input(z.object({ subject: z.string() }))
    .query(async ({ input }) => {
      try {
        const templates = await templatesClient.getTemplatesBySubject(input.subject);
        return templates;
      } catch (error) {
        console.error("Error fetching templates by subject:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch templates",
        });
      }
    }),

  /**
   * Get templates by topic
   */
  getByTopic: publicProcedure
    .input(z.object({ topic: z.string() }))
    .query(async ({ input }) => {
      try {
        const templates = await templatesClient.getTemplatesByTopic(input.topic);
        return templates;
      } catch (error) {
        console.error("Error fetching templates by topic:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch templates",
        });
      }
    }),

  /**
   * Get template by ID
   */
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      try {
        const template = await templatesClient.getTemplateById(input.id);
        if (!template) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Template not found",
          });
        }
        return template;
      } catch (error) {
        console.error("Error fetching template:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch template",
        });
      }
    }),

  /**
   * Get popular templates
   */
  getPopular: publicProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ input }) => {
      try {
        const templates = await templatesClient.getPopularTemplates(input.limit || 10);
        return templates;
      } catch (error) {
        console.error("Error fetching popular templates:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch popular templates",
        });
      }
    }),

  /**
   * Get top-rated templates
   */
  getTopRated: publicProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ input }) => {
      try {
        const templates = await templatesClient.getTopRatedTemplates(input.limit || 10);
        return templates;
      } catch (error) {
        console.error("Error fetching top-rated templates:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch top-rated templates",
        });
      }
    }),

  /**
   * Use a template (create lesson from template)
   */
  useTemplate: protectedProcedure
    .input(z.object({ templateId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const template = await templatesClient.getTemplateById(input.templateId);
        if (!template) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Template not found",
          });
        }

        // Increment download count
        await templatesClient.incrementTemplateDownloads(input.templateId);

        // Create lesson from template
        const lessonData = {
          userId: ctx.user.id,
          class: template.class,
          subject: template.subject,
          topic: template.topic,
          toolType: template.toolType,
          language: template.language,
          content: template.content,
        };

        // Import db client dynamically to avoid circular dependency
        const db = await import("../appsScriptClient");
        const result = await db.createLesson(ctx.user.id, lessonData);

        return {
          success: true,
          lessonId: result.insertId,
          message: "Lesson created from template",
        };
      } catch (error) {
        console.error("Error using template:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to use template",
        });
      }
    }),

  /**
   * Create a new template (admin only)
   */
  create: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string(),
        class: z.string(),
        subject: z.string(),
        topic: z.string(),
        toolType: z.enum(["simplify", "activity", "understanding"]),
        language: z.string(),
        content: z.string(),
        tags: z.string().optional(),
        difficulty: z.enum(["easy", "medium", "hard"]),
        estimatedTime: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if user is admin (optional - remove if not needed)
        // if (ctx.user.role !== 'admin') {
        //   throw new TRPCError({
        //     code: 'FORBIDDEN',
        //     message: 'Only admins can create templates',
        //   });
        // }

        const result = await templatesClient.createTemplate(ctx.user.id, {
          ...input,
          author: ctx.user.id.toString(),
          tags: input.tags || '',
        });

        return result;
      } catch (error) {
        console.error("Error creating template:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create template",
        });
      }
    }),

  /**
   * Rate a template
   */
  rate: protectedProcedure
    .input(z.object({ templateId: z.number(), rating: z.number().min(1).max(5) }))
    .mutation(async ({ input }) => {
      try {
        const success = await templatesClient.updateTemplateRating(
          input.templateId,
          input.rating
        );

        if (!success) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to update rating",
          });
        }

        return { success: true, message: "Rating updated" };
      } catch (error) {
        console.error("Error rating template:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to rate template",
        });
      }
    }),
});
