import api from '../lib/axios';
import type { Quiz, CourseTest, QuizAttemptResult, SubmitQuizAttemptRequest, QuizAdmin, QuizRequest } from '../types/quiz';

const quizService = {
    // ─── Lesson quiz ────────────────────────────────────────
    getLessonQuiz: (lessonId: number): Promise<Quiz> =>
        api.get(`/lessons/${lessonId}/quiz`).then(r => r.data),

    // ─── Course test ────────────────────────────────────────
    getCourseTest: (courseId: number): Promise<CourseTest> =>
        api.get(`/courses/${courseId}/test`).then(r => r.data),

    getCourseTestToTake: (courseId: number): Promise<Quiz> =>
        api.get(`/courses/${courseId}/test/take`).then(r => r.data),

    // ─── Attempts ───────────────────────────────────────────
    submitAttempt: (quizId: number, data: SubmitQuizAttemptRequest): Promise<QuizAttemptResult> =>
        api.post(`/quizzes/${quizId}/attempts`, data).then(r => r.data),

    getAttempts: (quizId: number): Promise<QuizAttemptResult[]> =>
        api.get(`/quizzes/${quizId}/attempts`).then(r => r.data),

    // ─── Admin authoring ────────────────────────────────────
    getLessonQuizAdmin: (lessonId: number): Promise<QuizAdmin> =>
        api.get(`/admin/lessons/${lessonId}/quiz`).then(r => r.data),

    saveLessonQuiz: (lessonId: number, data: QuizRequest): Promise<{ data: QuizAdmin }> =>
        api.put(`/admin/lessons/${lessonId}/quiz`, data).then(r => r.data),

    deleteLessonQuiz: (lessonId: number): Promise<void> =>
        api.delete(`/admin/lessons/${lessonId}/quiz`).then(r => r.data),

    getCourseTestAdmin: (courseId: number): Promise<QuizAdmin> =>
        api.get(`/admin/courses/${courseId}/test`).then(r => r.data),

    saveCourseTest: (courseId: number, data: QuizRequest): Promise<{ data: QuizAdmin }> =>
        api.put(`/admin/courses/${courseId}/test`, data).then(r => r.data),

    deleteCourseTest: (courseId: number): Promise<void> =>
        api.delete(`/admin/courses/${courseId}/test`).then(r => r.data),
};

export default quizService;
