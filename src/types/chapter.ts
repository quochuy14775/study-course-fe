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

export interface ChapterRequest {
    title: string;
    description?: string | null;
    orderIndex: number;
    isActive: boolean;
}
