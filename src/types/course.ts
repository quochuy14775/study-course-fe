import { Lesson } from "./lesson";
import type { LanguageSummary } from "./language";
import type { FrameworkSummary } from "./framework";

// ────────────────────────────────────────────────────────────
// Course level — BE enum CourseLevel { Beginner=0, Intermediate=1, Advanced=2 }
// Response returns string ("Beginner"), Request sends number (0/1/2)
// ────────────────────────────────────────────────────────────

export enum Level {
    Beginner = 0,
    Intermediate = 1,
    Advanced = 2,
}

export type CourseLevelLabel = "Beginner" | "Intermediate" | "Advanced";

export const LEVEL_LABEL_TO_NUMBER: Record<CourseLevelLabel, Level> = {
    Beginner: Level.Beginner,
    Intermediate: Level.Intermediate,
    Advanced: Level.Advanced,
};

// ────────────────────────────────────────────────────────────
// Course response shape — must match BE CourseResponse
// (StudyCourseAPI/DTOs/Responses/Admin/CourseResponse.cs)
// ────────────────────────────────────────────────────────────

export interface Course {
    id: number;
    title: string;
    subtitle?: string | null;
    description: string;
    imageUrl?: string | null;
    price: number;
    /** BE returns enum name as string */
    level: CourseLevelLabel;
    isFeatured: boolean;
    rating: number;

    // Cached stats (BE auto-maintained by LessonsController)
    lessonCount: number;
    chapterCount: number;
    totalDurationSeconds: number;

    // Audit
    createdAt: string;
    updatedAt?: string | null;
    isDeleted: boolean;
    isActive: boolean;
    createdBy?: string | null;
    updatedBy?: string | null;
    languages?: LanguageSummary[];
    frameworks?: FrameworkSummary[];
}

/** Returned by GET /Courses/{id} — has extra tagIds */
export interface CourseDetail extends Course {
    tagIds: number[];
}

/** Paged response — BE ODataResponse<CourseResponse> */
export interface CourseListResponse {
    count: number;
    value: Course[];
}

/** Wrapper for create/update — BE returns { success, message, data } */
export interface CourseMutationResponse {
    success: boolean;
    message: string;
    data: Course;
}

/** Suggest endpoint result */
export interface CourseSuggestion {
    id: number;
    title: string;
    imageUrl?: string | null;
}

// ────────────────────────────────────────────────────────────
// Request DTO — must match BE CourseRequest
// ────────────────────────────────────────────────────────────

export interface CourseRequest {
    title: string;
    subtitle?: string | null;
    description: string;
    imageUrl?: string | null;
    price: number;
    /** Numeric enum value (0/1/2) — BE deserializes CourseLevel as int */
    level: Level | 0;
    isFeatured: boolean;
    isActive: boolean;
    tagIds?: number[];
    languageIds?: number[];
    frameworkIds?: number[];
}

// ────────────────────────────────────────────────────────────
// UI-only enrichment (FE convenience, not from BE)
// ────────────────────────────────────────────────────────────

export interface CourseUI extends Course {
    /** Derived from createdBy for display ("Unknown" fallback) */
    instructor: string;
    /** Optionally hydrated by detail fetch */
    lessons?: Lesson[];
}

// ────────────────────────────────────────────────────────────
// Mappers / helpers
// ────────────────────────────────────────────────────────────

export const formatDurationSeconds = (seconds: number): string => {
    if (!seconds || seconds < 60) return "0m";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

export function mapCourseToUI(course: Course): CourseUI {
    return {
        ...course,
        instructor: course.createdBy ?? "Unknown",
    };
}

/** For older code that displays "Active"/"Inactive" pills */
export interface CourseVM {
    id: number;
    title: string;
    priceText: string;
    level: string;
    status: string;
}

export function mapCourseToVM(course: Course): CourseVM {
    return {
        id: course.id,
        title: course.title,
        priceText: `${course.price.toLocaleString("vi-VN")} ₫`,
        level: course.level,
        status: course.isActive ? "Active" : "Inactive",
    };
}
