import { describe, it, expect, vi } from "vitest";
import { lessonsRouter } from "./lessons";

// Mock the database functions
vi.mock("../db", () => ({
  createLesson: vi.fn(async () => ({ id: 1 })),
  getLessonsByUser: vi.fn(async () => []),
  createRefinement: vi.fn(async () => ({ id: 1 })),
  getRefinementsByLesson: vi.fn(async () => []),
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

describe("lessonsRouter - AI Integration with Manus Built-in LLM", () => {
  describe("generateLesson", () => {
    it("should generate a lesson with Simplify Concept tool using Manus LLM", async () => {
      const ctx = createMockContext();
      const caller = lessonsRouter.createCaller(ctx);

      const result = await caller.generateLesson({
        class: "10",
        subject: "Mathematics",
        topic: "Newton's Third Law of Motion",
        toolType: "simplify",
      });

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.content).toContain("Test Content");
      expect(result.class).toBe("10");
      expect(result.subject).toBe("Mathematics");
      expect(result.topic).toBe("Newton's Third Law of Motion");
      expect(result.toolType).toBe("simplify");
    });

    it("should generate a lesson with Class Activity tool", async () => {
      const ctx = createMockContext();
      const caller = lessonsRouter.createCaller(ctx);

      const result = await caller.generateLesson({
        class: "9",
        subject: "Science",
        topic: "Photosynthesis",
        toolType: "activity",
      });

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.toolType).toBe("activity");
      expect(result.class).toBe("9");
      expect(result.subject).toBe("Science");
    });

    it("should generate a lesson with Check Understanding tool", async () => {
      const ctx = createMockContext();
      const caller = lessonsRouter.createCaller(ctx);

      const result = await caller.generateLesson({
        class: "8",
        subject: "English",
        topic: "Shakespeare's Sonnets",
        toolType: "understanding",
      });

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.toolType).toBe("understanding");
    });

    it("should return content as string from Manus LLM", async () => {
      const ctx = createMockContext();
      const caller = lessonsRouter.createCaller(ctx);

      const result = await caller.generateLesson({
        class: "10",
        subject: "Mathematics",
        topic: "Algebra",
        toolType: "simplify",
      });

      expect(typeof result.content).toBe("string");
      expect(result.content.length).toBeGreaterThan(0);
    });

    it("should include createdAt timestamp in generated lesson", async () => {
      const ctx = createMockContext();
      const caller = lessonsRouter.createCaller(ctx);

      const result = await caller.generateLesson({
        class: "10",
        subject: "Mathematics",
        topic: "Geometry",
        toolType: "simplify",
      });

      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it("should handle different class levels", async () => {
      const ctx = createMockContext();
      const caller = lessonsRouter.createCaller(ctx);

      const classLevels = ["1", "5", "10", "12"];

      for (const classLevel of classLevels) {
        const result = await caller.generateLesson({
          class: classLevel,
          subject: "Mathematics",
          topic: "Test Topic",
          toolType: "simplify",
        });

        expect(result.class).toBe(classLevel);
        expect(result.content).toBeDefined();
      }
    });
  });

  describe("getLessons", () => {
    it("should fetch lessons for authenticated user", async () => {
      const ctx = createMockContext();
      const caller = lessonsRouter.createCaller(ctx);

      const result = await caller.getLessons();

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("Manus Built-in LLM Integration", () => {
    it("should use Manus Built-in LLM for content generation", async () => {
      const ctx = createMockContext();
      const caller = lessonsRouter.createCaller(ctx);

      const result = await caller.generateLesson({
        class: "10",
        subject: "Mathematics",
        topic: "Newton's Third Law",
        toolType: "simplify",
      });

      // Verify that the LLM was called and returned content
      expect(result.content).toContain("Manus Built-in LLM");
      expect(result.content).toBeDefined();
      expect(result.content.length > 0).toBe(true);
    });

    it("should handle all three tool types with Manus LLM", async () => {
      const ctx = createMockContext();
      const caller = lessonsRouter.createCaller(ctx);

      const toolTypes: Array<"simplify" | "activity" | "understanding"> = [
        "simplify",
        "activity",
        "understanding",
      ];

      for (const toolType of toolTypes) {
        const result = await caller.generateLesson({
          class: "10",
          subject: "Mathematics",
          topic: "Test Topic",
          toolType,
        });

        expect(result.toolType).toBe(toolType);
        expect(result.content).toBeDefined();
      }
    });
  });
});
