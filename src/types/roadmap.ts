// ─── Legacy mock types (kept for backward compat with old components) ────────

export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
export type CourseLevel = 'Beginner' | 'Intermediate' | 'Advanced';
export type ModalStep = 'language' | 'framework' | 'courses' | 'review';

export interface RoadmapStep {
    id: number;
    title: string;
    description: string;
    topics: string[];
    difficulty: Difficulty;
    preselect?: { langId: string; frameworkId: string };
}

/** @deprecated — use Language from types/language */
export interface Language { id: string; label: string; icon: string }
/** @deprecated — use Framework from types/framework */
export interface Framework { id: string; label: string; icon: string }
/** @deprecated — use Course from types/course */
export interface Course {
    id: string; langId: string; frameworkId: string;
    title: string; description: string; level: CourseLevel; duration: string;
}

export interface UserRoadmap {
    langId: string;
    frameworkId: string;
    selectedCourseIds: string[];
}

// ─── BE Response shapes ───────────────────────────────────────────────────

export interface RoadmapChapter {
    id: number;
    title: string;
    description?: string;
    orderIndex: number;
}

export interface RoadmapCourse {
    id: number;
    title: string;
    subtitle?: string;
    description?: string;
    imageUrl?: string;
    level: string;
    price: number;
    totalDurationSeconds: number;
    lessonCount: number;
    chapterCount: number;
    orderIndex: number;
    chapters: RoadmapChapter[];
}

export interface Roadmap {
    id: number;
    title: string;
    description?: string;
    isActive: boolean;
    courseCount: number;
    createdAt: string;
    updatedAt?: string;
    createdBy?: string;
    updatedBy?: string;
    courses: RoadmapCourse[];
}

// ─── Request ────────────────────────────────────────────────────────────────

export interface RoadmapRequest {
    title: string;
    description?: string;
    isActive: boolean;
    courseIds: number[];
}

// ─── API response wrappers ───────────────────────────────────────────────────

export interface RoadmapListResponse {
    count: number;
    value: Roadmap[];
}

export interface RoadmapMutationResponse {
    success: boolean;
    message: string;
    data: Roadmap;
}
