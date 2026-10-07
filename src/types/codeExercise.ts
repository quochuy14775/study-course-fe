// ────────────────────────────────────────────────────────────
// Bài tập code — hiện là mock ở FE. Khi lên BE sẽ khớp với
// CodeExercise / CodeSubmission (xem đề xuất trong PR).
// ────────────────────────────────────────────────────────────

/** Ngôn ngữ chạy được ngay trong trình duyệt (tầng 1). Tầng 2 (C#, Java, Go…) sẽ thêm khi có judge server. */
export type ExerciseLanguage = 'javascript' | 'typescript' | 'python';

/**
 * Một test = gọi một biểu thức rồi so kết quả (đã JSON hóa) với `expected`.
 * Cùng một mô hình cho mọi ngôn ngữ: JS dùng JSON.stringify, Python dùng json.dumps.
 */
export interface TestCase {
    name: string;
    /** Biểu thức để gọi, ví dụ `sum([1, 2, 3])` */
    call: string;
    /** Kết quả mong đợi dạng JSON compact, ví dụ `6`, `"abc"`, `[1,2]` */
    expected: string;
    /** Test ẩn: chỉ chạy khi nộp bài, không hiện expected cho học viên */
    hidden?: boolean;
}

export interface CodeExercise {
    id: number;
    lessonId?: number;
    title: string;
    language: ExerciseLanguage;
    /** Tên file hiện trên tab editor, ví dụ `sum.ts` */
    fileName: string;
    /** Đề bài — các đoạn văn, đoạn bắt đầu bằng "```" là code mẫu */
    prompt: string;
    starterCode: string;
    tests: TestCase[];
    hints?: string[];
}

export interface CaseResult {
    name: string;
    call: string;
    expected: string;
    actual: string | null;
    passed: boolean;
    error: string | null;
    hidden?: boolean;
}

export interface ConsoleLine {
    level: 'log' | 'info' | 'warn' | 'error';
    text: string;
}

export interface RunResult {
    /** Code chạy được (không lỗi cú pháp/runtime ở top-level) */
    ok: boolean;
    cases: CaseResult[];
    stdout: ConsoleLine[];
    /** Lỗi compile/runtime ở top-level (nếu có) */
    error: string | null;
    timeMs: number;
}
