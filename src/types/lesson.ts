// ────────────────────────────────────────────────────────────
// Lesson response shape — must match BE LessonResponse
// (StudyCourseAPI/DTOs/Responses/Admin/LessonResponse.cs)
// ────────────────────────────────────────────────────────────

export interface Lesson {
    id: number;
    orderIndex: number;
    title: string;
    description?: string | null;
    videoId: string;
    /** Seconds */
    duration?: number | null;
    thumbnailUrl?: string | null;
    isPreview: boolean;

    // FK
    courseId: number;
    chapterId?: number | null;

    // Audit
    createdAt: string;
    updatedAt?: string | null;
    isDeleted: boolean;
    isActive: boolean;
}

/** Paged response — BE ODataResponse<LessonResponse> */
export interface LessonListResponse {
    count: number;
    value: Lesson[];
}

/** Wrapper for bulk create — BE returns { success, message, data: Lesson[] } */
export interface LessonsCreateResponse {
    success: boolean;
    message: string;
    data: Lesson[];
}

/** Wrapper for single update — BE returns { success, message, data: Lesson } */
export interface LessonMutationResponse {
    success: boolean;
    message: string;
    data: Lesson;
}

/** Wrapper for bulk delete — BE returns { success, deleted } */
export interface LessonsDeleteResponse {
    success: boolean;
    deleted: number;
}

/** Wrapper for reorder — BE returns { success, updated } */
export interface LessonsReorderResponse {
    success: boolean;
    updated: number;
}

// ────────────────────────────────────────────────────────────
// Request DTO — must match BE LessonRequest
// ────────────────────────────────────────────────────────────

export interface LessonRequest {
    orderIndex: number;
    title: string;
    description?: string | null;
    videoId: string;
    /** Seconds */
    duration?: number | null;
    thumbnailUrl?: string | null;
    chapterId?: number | null;
    isPreview?: boolean;
    isActive?: boolean;
}

/** Payload item for PUT /Lessons/reorder */
export interface LessonReorderItem {
    id: number;
    orderIndex: number;
    chapterId?: number | null;
}

// ────────────────────────────────────────────────────────────
// Legacy alias (kept for backward compatibility with existing imports)
// ────────────────────────────────────────────────────────────

export type LessonResponse = Lesson;
