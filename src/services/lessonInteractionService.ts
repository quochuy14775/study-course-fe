import api from '../lib/axios';
import type {
    Note, NoteRequest,
    Comment, CommentRequest,
    Question, QuestionRequest,
    Answer, AnswerRequest,
} from '../types/lessonInteraction';

const notesBase = (lessonId: number) => `/lessons/${lessonId}/notes`;
const commentsBase = (lessonId: number) => `/lessons/${lessonId}/comments`;
const questionsBase = (lessonId: number) => `/lessons/${lessonId}/questions`;

const lessonInteractionService = {
    // ─── Notes ──────────────────────────────────────────────
    getNotes: (lessonId: number): Promise<Note[]> =>
        api.get(notesBase(lessonId)).then(r => r.data),

    createNote: (lessonId: number, data: NoteRequest): Promise<Note> =>
        api.post(notesBase(lessonId), data).then(r => r.data),

    updateNote: (lessonId: number, noteId: number, data: NoteRequest): Promise<Note> =>
        api.put(`${notesBase(lessonId)}/${noteId}`, data).then(r => r.data),

    deleteNote: (lessonId: number, noteId: number): Promise<void> =>
        api.delete(`${notesBase(lessonId)}/${noteId}`).then(r => r.data),

    // ─── Comments ───────────────────────────────────────────
    getComments: (lessonId: number): Promise<Comment[]> =>
        api.get(commentsBase(lessonId)).then(r => r.data),

    createComment: (lessonId: number, data: CommentRequest): Promise<Comment> =>
        api.post(commentsBase(lessonId), data).then(r => r.data),

    deleteComment: (lessonId: number, commentId: number): Promise<void> =>
        api.delete(`${commentsBase(lessonId)}/${commentId}`).then(r => r.data),

    toggleCommentLike: (lessonId: number, commentId: number): Promise<{ liked: boolean; likeCount: number }> =>
        api.post(`${commentsBase(lessonId)}/${commentId}/like`).then(r => r.data),

    // ─── Questions ──────────────────────────────────────────
    getQuestions: (lessonId: number): Promise<Question[]> =>
        api.get(questionsBase(lessonId)).then(r => r.data),

    createQuestion: (lessonId: number, data: QuestionRequest): Promise<Question> =>
        api.post(questionsBase(lessonId), data).then(r => r.data),

    deleteQuestion: (lessonId: number, questionId: number): Promise<void> =>
        api.delete(`${questionsBase(lessonId)}/${questionId}`).then(r => r.data),

    resolveQuestion: (lessonId: number, questionId: number): Promise<{ isResolved: boolean }> =>
        api.post(`${questionsBase(lessonId)}/${questionId}/resolve`).then(r => r.data),

    // ─── Answers ────────────────────────────────────────────
    createAnswer: (lessonId: number, questionId: number, data: AnswerRequest): Promise<Answer> =>
        api.post(`${questionsBase(lessonId)}/${questionId}/answers`, data).then(r => r.data),

    toggleAnswerLike: (answerId: number): Promise<{ liked: boolean; likeCount: number }> =>
        api.post(`/answers/${answerId}/like`).then(r => r.data),

    acceptAnswer: (answerId: number): Promise<{ isAccepted: boolean }> =>
        api.post(`/answers/${answerId}/accept`).then(r => r.data),

    deleteAnswer: (answerId: number): Promise<void> =>
        api.delete(`/answers/${answerId}`).then(r => r.data),
};

export default lessonInteractionService;
