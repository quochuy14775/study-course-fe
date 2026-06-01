// ─── Note ───────────────────────────────────────────────────
export interface Note {
    id: number;
    lessonId: number;
    videoTimestamp: number;
    content: string;
    createdAt: string;
    updatedAt?: string;
}

export interface NoteRequest {
    content: string;
    videoTimestamp: number;
}

// ─── Comment ─────────────────────────────────────────────────
export interface Comment {
    id: number;
    lessonId: number;
    userId: number;
    author: string;
    avatarUrl?: string;
    parentCommentId?: number;
    content: string;
    likeCount: number;
    liked: boolean;
    createdAt: string;
    replies: Comment[];
}

export interface CommentRequest {
    content: string;
    parentCommentId?: number;
}

// ─── Question / Answer ────────────────────────────────────────
export interface Answer {
    id: number;
    questionId: number;
    userId: number;
    author: string;
    avatarUrl?: string;
    content: string;
    isAcceptedAnswer: boolean;
    likeCount: number;
    liked: boolean;
    createdAt: string;
}

export interface Question {
    id: number;
    lessonId: number;
    userId: number;
    author: string;
    avatarUrl?: string;
    content: string;
    isResolved: boolean;
    answerCount: number;
    createdAt: string;
    answers: Answer[];
}

export interface QuestionRequest {
    content: string;
}

export interface AnswerRequest {
    content: string;
}
