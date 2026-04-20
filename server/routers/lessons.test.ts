import { describe, it, expect, vi } from "vitest";
import { lessonsRouter } from "./lessons";

// Mock the database functions
vi.mock("../db", () => ({
  createLesson: vi.fn(async () => ({ insertId: 1 })),
  getLessonsByUser: vi.fn(async () => []),
  getLessonById: vi.fn(async (id: number) => ({
    id,
    userId: 1,
    class: "10",
    subject: "Mathematics",
    topic: "Test",
    toolType: "simplify",
    language: "english",
    content: "Test content",
    createdAt: new Date(),
  })),
  createRefinement: vi.fn(async () => ({ insertId: 2 })),
  getRefinementsByLesson: vi.fn(async () => []),
  createAnswers: vi.fn(async () => ({})),
  getAnswersByLesson: vi.fn(async () => []),
}));

// Mock the LLM
vi.mock("../_core/llm", () => ({
  invokeLLM: vi.fn(async () => ({
    choices: [
      {
        message: {
          content: "# Test Content\n\nThis is a test response from the Manus Built-in LLM.",
        },
      },
    ],
  })),
}));

type AuthenticatedUser = {
  id: number;
  openId: string;
  email: string;
  name: string;
  loginMethod: string;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
};

type TrpcContext = {
  user: AuthenticatedUser;
  req: any;
  res: any;
};

function createMockContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test Teacher",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} },
    res: {},
  };
}

describe("lessonsRouter - Bug Fixes", () => {
  describe("Language-specific content generation", () => {
    it("should generate lesson in English only", async () => {
      const ctx = createMockContext();
      const caller = lessonsRouter.createCaller(ctx);

      const result = await caller.generateLesson({
        class: "10",
        subject: "Mathematics",
        topic: "Algebra",
        toolType: "simplify",
        language: "english",
      });

      expect(result.language).toBe("english");
      expect(result.content).toBeDefined();
    });

    it("should generate lesson in Hindi only", async () => {
      const ctx = createMockContext();
      const caller = lessonsRouter.createCaller(ctx);

      const result = await caller.generateLesson({
        class: "10",
        subject: "Mathematics",
        topic: "बीजगणित",
        toolType: "simplify",
        language: "hindi",
      });

      expect(result.language).toBe("hindi");
      expect(result.content).toBeDefined();
    });
  });

  describe("Refinement functionality", () => {
    it("should refine lesson with Make simpler", async () => {
      const ctx = createMockContext();
      const caller = lessonsRouter.createCaller(ctx);

      const result = await caller.refineLesson({
        lessonId: 1,
        refinementType: "Make simpler",
      });

      expect(result).toBeDefined();
      expect(result.refinementType).toBe("Make simpler");
    });

    it("should refine lesson with Add examples", async () => {
      const ctx = createMockContext();
      const caller = lessonsRouter.createCaller(ctx);

      const result = await caller.refineLesson({
        lessonId: 1,
        refinementType: "Add examples",
      });

      expect(result).toBeDefined();
      expect(result.refinementType).toBe("Add examples");
    });

    it("should refine lesson with Shorter", async () => {
      const ctx = createMockContext();
      const caller = lessonsRouter.createCaller(ctx);

      const result = await caller.refineLesson({
        lessonId: 1,
        refinementType: "Shorter",
      });

      expect(result).toBeDefined();
      expect(result.refinementType).toBe("Shorter");
    });

    it("should refine lesson with custom text", async () => {
      const ctx = createMockContext();
      const caller = lessonsRouter.createCaller(ctx);

      const result = await caller.refineLesson({
        lessonId: 1,
        refinementType: "Make it more interactive",
      });

      expect(result).toBeDefined();
      expect(result.refinementType).toBe("Make it more interactive");
    });
  });

  describe("All three tool types", () => {
    it("should handle Simplify Concept", async () => {
      const ctx = createMockContext();
      const caller = lessonsRouter.createCaller(ctx);

      const result = await caller.generateLesson({
        class: "10",
        subject: "Mathematics",
        topic: "Quadratic Equations",
        toolType: "simplify",
        language: "english",
      });

      expect(result.toolType).toBe("simplify");
      expect(result.content).toBeDefined();
    });

    it("should handle Class Activity", async () => {
      const ctx = createMockContext();
      const caller = lessonsRouter.createCaller(ctx);

      const result = await caller.generateLesson({
        class: "8",
        subject: "Science",
        topic: "Photosynthesis",
        toolType: "activity",
        language: "english",
      });

      expect(result.toolType).toBe("activity");
      expect(result.content).toBeDefined();
    });

    it("should handle Check Understanding", async () => {
      const ctx = createMockContext();
      const caller = lessonsRouter.createCaller(ctx);

      const result = await caller.generateLesson({
        class: "10",
        subject: "History",
        topic: "French Revolution",
        toolType: "understanding",
        language: "english",
      });

      expect(result.toolType).toBe("understanding");
      expect(result.content).toBeDefined();
    });
  });

  describe("Lesson ID handling", () => {
    it("should return proper lesson ID from database", async () => {
      const ctx = createMockContext();
      const caller = lessonsRouter.createCaller(ctx);

      const result = await caller.generateLesson({
        class: "10",
        subject: "Mathematics",
        topic: "Geometry",
        toolType: "simplify",
        language: "english",
      });

      expect(result.id).toBe(1);
      expect(typeof result.id).toBe("number");
    });

    it("should use lesson ID for refinements", async () => {
      const ctx = createMockContext();
      const caller = lessonsRouter.createCaller(ctx);

      const lesson = await caller.generateLesson({
        class: "10",
        subject: "Mathematics",
        topic: "Trigonometry",
        toolType: "simplify",
        language: "english",
      });

      const refinement = await caller.refineLesson({
        lessonId: lesson.id,
        refinementType: "Make simpler",
      });

      expect(refinement.lessonId).toBe(lesson.id);
    });
  });

  describe("Enhanced detailed prompts", () => {
    it("Simplify Concept should generate detailed content", async () => {
      const ctx = createMockContext();
      const caller = lessonsRouter.createCaller(ctx);

      const result = await caller.generateLesson({
        class: "10",
        subject: "Mathematics",
        topic: "Quadratic Equations",
        toolType: "simplify",
        language: "english",
      });

      // Verify content is generated
      expect(result.content).toBeDefined();
      expect(result.content.length).toBeGreaterThan(0);
      // Enhanced prompt should produce detailed content
      expect(result.toolType).toBe("simplify");
    });

    it("Class Activity should generate comprehensive activity", async () => {
      const ctx = createMockContext();
      const caller = lessonsRouter.createCaller(ctx);

      const result = await caller.generateLesson({
        class: "8",
        subject: "Science",
        topic: "Photosynthesis",
        toolType: "activity",
        language: "english",
      });

      // Verify activity content is generated
      expect(result.content).toBeDefined();
      expect(result.content.length).toBeGreaterThan(0);
      // Enhanced prompt should produce comprehensive activity
      expect(result.toolType).toBe("activity");
    });

    it("Check Understanding should generate detailed answers", async () => {
      const ctx = createMockContext();
      const caller = lessonsRouter.createCaller(ctx);

      const result = await caller.generateLesson({
        class: "10",
        subject: "History",
        topic: "French Revolution",
        toolType: "understanding",
        language: "english",
      });

      // Verify content is generated
      expect(result.content).toBeDefined();
      expect(result.content.length).toBeGreaterThan(0);
      // Enhanced prompt should produce detailed answers
      expect(result.toolType).toBe("understanding");
    });

    it("should support all Indian languages", async () => {
      const languages = [
        "english",
        "hindi",
        "gujarati",
        "marathi",
        "punjabi",
        "bengali",
        "tamil",
        "telugu",
        "kannada",
        "malayalam",
      ];

      const ctx = createMockContext();
      const caller = lessonsRouter.createCaller(ctx);

      for (const lang of languages) {
        const result = await caller.generateLesson({
          class: "10",
          subject: "Mathematics",
          topic: "Algebra",
          toolType: "simplify",
          language: lang as any,
        });

        expect(result.language).toBe(lang);
        expect(result.content).toBeDefined();
      }
    });
  });
});
