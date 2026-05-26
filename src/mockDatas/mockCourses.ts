import type { Course } from "../types/course";

const baseMock = (overrides: Partial<Course>): Course => ({
    id: 0,
    title: "",
    subtitle: null,
    description: "",
    imageUrl: null,
    price: 0,
    level: "Beginner",
    isFeatured: false,
    rating: 0,
    lessonCount: 0,
    chapterCount: 0,
    totalDurationSeconds: 0,
    createdAt: new Date().toISOString(),
    updatedAt: null,
    isDeleted: false,
    isActive: true,
    createdBy: "admin",
    updatedBy: null,
    ...overrides,
});

export const freeCourses: Course[] = [
    baseMock({
        id: 1,
        title: "Introduction to React",
        description: "Learn the basics of React including components, hooks, and state management.",
        imageUrl: "string",
        level: "Beginner",
        isFeatured: true,
        rating: 4.8,
        lessonCount: 12,
        chapterCount: 4,
        totalDurationSeconds: 6 * 3600,
    }),
    baseMock({
        id: 2,
        title: "JavaScript Fundamentals",
        description: "Master JavaScript core concepts, ES6+, and best practices.",
        imageUrl: "string",
        level: "Beginner",
        rating: 4.9,
        lessonCount: 18,
        chapterCount: 5,
        totalDurationSeconds: 8 * 3600,
    }),
];

export const premiumCourses: Course[] = [
    baseMock({
        id: 5,
        title: "Advanced React Patterns",
        description: "Deep dive into advanced React patterns and optimization techniques.",
        imageUrl: "string",
        price: 99.99,
        level: "Intermediate",
        isFeatured: true,
        rating: 4.9,
        lessonCount: 24,
        chapterCount: 6,
        totalDurationSeconds: 12 * 3600,
    }),
];

// Hero slides
export const slides = [
    { title: "Learn React 🚀", desc: "Build modern web apps with React" },
    { title: "Master TypeScript ⚡", desc: "Write safer and scalable code" },
    { title: "Fullstack Developer 💻", desc: "Frontend + Backend in one journey" },
];
