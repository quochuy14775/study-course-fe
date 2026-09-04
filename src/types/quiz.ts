// ─── Khớp với DTOs bên BE (StudyCourseAPI) ─────────────────────
// GET /lessons/{lessonId}/quiz, GET /courses/{courseId}/test,
// POST/GET /quizzes/{quizId}/attempts

export interface QuizOptionForAttempt {
    optionId: number;
    content: string;
}

export interface QuizQuestionForAttempt {
    id: number;
    content: string;
    orderIndex: number;
    options: QuizOptionForAttempt[];
}

export interface Quiz {
    id: number;
    title: string;
    passPercentage: number;
    timeLimitMinutes: number;
    questions: QuizQuestionForAttempt[];
}

export interface QuizAnswerSnapshot {
    questionId: number;
    questionContent: string;
    selectedOptionId: number | null;
    selectedOptionContent: string | null;
    correctOptionId: number;
    correctOptionContent: string;
    isCorrect: boolean;
}

export interface QuizAttemptResult {
    id: number;
    quizId: number;
    attemptNumber: number;
    correctCount: number;
    totalCount: number;
    percentageScore: number;
    isPassed: boolean;
    submittedAt: string;
    answers: QuizAnswerSnapshot[];
}

export interface CourseTest {
    id: number;
    title: string;
    questionCount: number;
    timeLimitMinutes: number;
    passPercentage: number;
    unlocked: boolean;
    lastAttempt?: QuizAttemptResult | null;
}

export interface SubmitQuizAttemptRequest {
    answers: { questionId: number; selectedOptionId: number | null }[];
}

// ─── Admin authoring ────────────────────────────────────────────
// GET/PUT/DELETE api/admin/lessons/{lessonId}/quiz và api/admin/courses/{courseId}/test

/** Admin-facing option — khác QuizOptionForAttempt ở chỗ có lộ isCorrect */
export interface QuizOptionAdmin {
    optionId: number;
    content: string;
    isCorrect: boolean;
}

export interface QuizQuestionAdmin {
    id: number;
    content: string;
    orderIndex: number;
    points: number;
    options: QuizOptionAdmin[];
}

export interface QuizAdmin {
    id: number;
    quizType: number; // 0 = Lesson, 1 = CourseTest
    lessonId: number | null;
    courseId: number;
    title: string;
    passPercentage: number;
    timeLimitMinutes: number;
    questions: QuizQuestionAdmin[];
}

export interface QuizRequest {
    title: string;
    passPercentage: number;
    timeLimitMinutes: number;
    questions: {
        content: string;
        orderIndex: number;
        points: number;
        options: { content: string; isCorrect: boolean; orderIndex: number }[];
    }[];
}
