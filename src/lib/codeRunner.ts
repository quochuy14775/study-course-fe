import { transform } from 'sucrase';
import type { CaseResult, ConsoleLine, ExerciseLanguage, RunResult, TestCase } from '../types/codeExercise';

/* ─────────────────────────────────────────────────────────────
   Runner tầng 1 — chạy ngay trong trình duyệt, không cần server.
   - JS/TS: mỗi lần chạy tạo một Web Worker mới từ Blob (code học viên
     ghép sau harness). Vòng lặp vô hạn → terminate() sau TIMEOUT.
   - Python: một worker Pyodide dùng lại (tải runtime ~10 MB lần đầu).
   Tầng 2 (C#, Java, Go…) sẽ là RemoteRunner gọi BE → Judge0, cùng interface.
   ───────────────────────────────────────────────────────────── */

const TIMEOUT_MS = 4000;

export interface RunOptions {
    /** Báo tiến độ nạp runtime (Python lần đầu) */
    onStatus?: (text: string) => void;
}

export async function runCode(language: ExerciseLanguage, code: string, tests: TestCase[], opts: RunOptions = {}): Promise<RunResult> {
    switch (language) {
        case 'python':
            return runPython(code, tests, opts);
        case 'typescript':
        case 'javascript':
        default:
            return runJs(language, code, tests);
    }
}

/** Tên ngôn ngữ cho Monaco */
export const monacoLanguage = (l: ExerciseLanguage) => l;

/* ── JS / TS ─────────────────────────────────────────────────── */

/** Bỏ `export`/`import` (bài tập viết theo kiểu module) để chạy như classic script trong worker. */
const toClassicScript = (code: string) =>
    code
        .replace(/^\s*import\s[^\n]*$/gm, '')
        .replace(/^\s*export\s+default\s+/gm, '')
        .replace(/^\s*export\s+/gm, '');

const JS_HARNESS = `
const __logs = [];
const __fmt = (a) => a.map((x) => {
    if (typeof x === 'string') return x;
    try { return JSON.stringify(x); } catch (e) { return String(x); }
}).join(' ');
['log', 'info', 'warn', 'error'].forEach((k) => { console[k] = (...a) => __logs.push({ level: k, text: __fmt(a) }); });
self.onmessage = (e) => {
    const t0 = performance.now();
    const cases = e.data.tests.map((t) => {
        try {
            const v = eval(t.call);
            let actual;
            try { actual = JSON.stringify(v); } catch (err) { actual = String(v); }
            if (actual === undefined) actual = 'undefined';
            return { ...t, actual, passed: actual === t.expected, error: null };
        } catch (err) {
            return { ...t, actual: null, passed: false, error: String((err && err.message) || err) };
        }
    });
    self.postMessage({ type: 'result', cases, stdout: __logs, timeMs: performance.now() - t0 });
};
`;

function runJs(language: ExerciseLanguage, source: string, tests: TestCase[]): Promise<RunResult> {
    let code = source;
    if (language === 'typescript') {
        try {
            code = transform(source, { transforms: ['typescript'] }).code;
        } catch (err) {
            return Promise.resolve(failAll(tests, `Lỗi cú pháp TypeScript: ${(err as Error).message}`));
        }
    }
    code = toClassicScript(code);

    const blob = new Blob([JS_HARNESS, '\n', code], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const worker = new Worker(url);
    const started = performance.now();

    return new Promise<RunResult>((resolve) => {
        const finish = (r: RunResult) => {
            clearTimeout(timer);
            worker.terminate();
            URL.revokeObjectURL(url);
            resolve(r);
        };
        const timer = setTimeout(() => finish(failAll(tests, `Quá ${TIMEOUT_MS / 1000}s — có thể code bị lặp vô hạn.`)), TIMEOUT_MS);

        worker.onerror = (e) => {
            e.preventDefault();
            finish({ ...failAll(tests, e.message.replace(/^Uncaught\s+/, '')), timeMs: performance.now() - started });
        };
        worker.onmessage = (e) => {
            if (e.data?.type !== 'result') return;
            finish({ ok: true, cases: e.data.cases, stdout: e.data.stdout, error: null, timeMs: e.data.timeMs });
        };
        worker.postMessage({ tests });
    });
}

/* ── Python (Pyodide) ─────────────────────────────────────────── */

const PYODIDE_VERSION = '0.26.4';
const PY_WORKER = `
importScripts('https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/pyodide.js');
const ready = loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/' });
ready.then(() => self.postMessage({ type: 'ready' }), (e) => self.postMessage({ type: 'fatal', error: String(e) }));

const lastLine = (s) => { const lines = String(s).trim().split('\\n'); return lines[lines.length - 1]; };

self.onmessage = async (e) => {
    const py = await ready;
    const { code, tests } = e.data;
    const t0 = performance.now();
    py.runPython('import sys, io, json\\n_out = io.StringIO()\\nsys.stdout = _out\\nsys.stderr = _out');
    let error = null;
    try { py.runPython(code); } catch (err) { error = lastLine(err.message || err); }
    const cases = tests.map((t) => {
        if (error) return { ...t, actual: null, passed: false, error };
        try {
            const actual = py.runPython('json.dumps(' + t.call + ", separators=(',', ':'))");
            return { ...t, actual, passed: actual === t.expected, error: null };
        } catch (err) {
            return { ...t, actual: null, passed: false, error: lastLine(err.message || err) };
        }
    });
    const out = py.runPython('_out.getvalue()');
    const stdout = String(out).split('\\n').filter((l) => l.length).map((text) => ({ level: 'log', text }));
    self.postMessage({ type: 'result', cases, stdout, error, timeMs: performance.now() - t0 });
};
`;

let pyWorker: Worker | null = null;
let pyReady: Promise<void> | null = null;

function getPython(onStatus?: (t: string) => void): { worker: Worker; ready: Promise<void> } {
    if (pyWorker && pyReady) return { worker: pyWorker, ready: pyReady };
    onStatus?.('Đang tải Python runtime (~10 MB, chỉ lần đầu)…');
    const worker = new Worker(URL.createObjectURL(new Blob([PY_WORKER], { type: 'text/javascript' })));
    const ready = new Promise<void>((resolve, reject) => {
        const onMsg = (e: MessageEvent) => {
            if (e.data?.type === 'ready') { worker.removeEventListener('message', onMsg); resolve(); }
            if (e.data?.type === 'fatal') { worker.removeEventListener('message', onMsg); reject(new Error(e.data.error)); }
        };
        worker.addEventListener('message', onMsg);
        worker.addEventListener('error', (e) => reject(new Error(e.message)), { once: true });
    });
    pyWorker = worker;
    pyReady = ready;
    ready.catch(() => { pyWorker = null; pyReady = null; });
    return { worker, ready };
}

async function runPython(code: string, tests: TestCase[], opts: RunOptions): Promise<RunResult> {
    const { worker, ready } = getPython(opts.onStatus);
    try {
        await ready;
    } catch (err) {
        return failAll(tests, `Không tải được Python runtime: ${(err as Error).message}`);
    }
    opts.onStatus?.('');

    return new Promise<RunResult>((resolve) => {
        const timer = setTimeout(() => {
            // Vòng lặp vô hạn: phải bỏ worker này, lần sau nạp lại runtime
            worker.terminate();
            pyWorker = null; pyReady = null;
            resolve(failAll(tests, `Quá ${TIMEOUT_MS / 1000}s — có thể code bị lặp vô hạn.`));
        }, TIMEOUT_MS * 3);
        const onMsg = (e: MessageEvent) => {
            if (e.data?.type !== 'result') return;
            clearTimeout(timer);
            worker.removeEventListener('message', onMsg);
            resolve({ ok: !e.data.error, cases: e.data.cases, stdout: e.data.stdout, error: e.data.error, timeMs: e.data.timeMs });
        };
        worker.addEventListener('message', onMsg);
        worker.postMessage({ code, tests });
    });
}

/* ── helpers ─────────────────────────────────────────────────── */

const failAll = (tests: TestCase[], error: string): RunResult => ({
    ok: false,
    error,
    timeMs: 0,
    stdout: [] as ConsoleLine[],
    cases: tests.map<CaseResult>((t) => ({ ...t, actual: null, passed: false, error })),
});
