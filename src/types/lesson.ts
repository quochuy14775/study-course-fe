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

/**
 * Response from POST /Lessons (bulk create within a chapter).
 * BE returns: { success, message, data: Lesson[], chapterId, chapterTitle }
 */
export interface LessonsCreateResponse {
    success: boolean;
    message: string;
    data: Lesson[];
    chapterId: number;
    chapterTitle: string;
}

/** Wrapper for single update — BE returns { success, message, data: Lesson } */
export interface LessonMutationResponse {
    success: boolean;
    message: string;
    data: Lesson;
}

/** Wrapper for bulk delete */
export interface LessonsDeleteResponse {
    success: boolean;
    deleted: number;
}

/** Wrapper for reorder */
export interface LessonsReorderResponse {
    success: boolean;
    updated: number;
}

// ────────────────────────────────────────────────────────────
// Request DTOs
// ────────────────────────────────────────────────────────────

/** Single lesson payload — must match BE LessonRequest */
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

/** Inline chapter creation when bulk-creating lessons — matches BE CreateChapterDto */
export interface NewChapterDto {
    title: string;
    description?: string | null;
    orderIndex?: number;
}

/**
 * Body for POST /api/Courses/{courseId}/Lessons — matches BE BulkCreateLessonsRequest.
 * One request = one chapter (existing or new) + its lessons.
 *
 * Rules (priority top → bottom):
 *  1. If `newChapter` provided → create new chapter, attach all lessons to it.
 *  2. Else if `chapterId` provided → use that existing chapter.
 *  3. Else → BE returns 400.
 */
export interface BulkCreateLessonsRequest {
    chapterId?: number;
    newChapter?: NewChapterDto;
    lessons: LessonRequest[];
}

/** Payload item for PUT /Lessons/reorder */
export interface LessonReorderItem {
    id: number;
    orderIndex: number;
    chapterId?: number | null;
}

// ────────────────────────────────────────────────────────────
// Chapter (returned by Course detail / chapter endpoints)
// ────────────────────────────────────────────────────────────

export interface Chapter {
    id: number;
    title: string;
    description?: string | null;
    orderIndex: number;
    courseId: number;
    lessonCount: number;
    totalDurationSeconds: number;

    // Audit
    createdAt: string;
    updatedAt?: string | null;
    isDeleted: boolean;
    isActive: boolean;
}

// ────────────────────────────────────────────────────────────
// Legacy alias
// ────────────────────────────────────────────────────────────

export type LessonResponse = Lesson;
