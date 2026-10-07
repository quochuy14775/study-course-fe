import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Editor, { type Monaco, type OnMount } from '@monaco-editor/react';
import { Play, Send, RotateCcw, Check, X, Loader2, Lightbulb, FileCode2, TerminalSquare, ListChecks, ChevronRight, Maximize2, Minimize2, PanelTopOpen } from 'lucide-react';
import { MacWindow } from '../ui/MacWindow';
import { Button } from '../ui/Button';
import { SyntaxHighlighter, codeTheme } from '../../lib/syntaxHighlighter';
import { runCode } from '../../lib/codeRunner';
import { showToast } from '../CustomToast';
import type { CodeExercise, ExerciseLanguage, RunResult } from '../../types/codeExercise';
import { cn } from '../../lib/cn';

/* ─────────────────────────────────────────────────────────────
   CodeExercisePanel — cửa sổ bài tập: đề bài bên trái, Monaco +
   bảng kết quả/console bên phải. Chạy = test hiện; Nộp = cả test ẩn.
   ───────────────────────────────────────────────────────────── */

const LANG_META: Record<ExerciseLanguage, { label: string; dot: string }> = {
    typescript: { label: 'TypeScript', dot: '#3178c6' },
    javascript: { label: 'JavaScript', dot: '#f7df1e' },
    python:     { label: 'Python',     dot: '#3776ab' },
};

const EDITOR_BG = '#0c1322';

/** Theme Monaco khớp với cửa sổ editor ở trang chủ. */
const defineTheme = (monaco: Monaco) => {
    monaco.editor.defineTheme('eduhub-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [],
        colors: {
            'editor.background': EDITOR_BG,
            'editorGutter.background': EDITOR_BG,
            'editor.lineHighlightBackground': '#ffffff0a',
            'editor.lineHighlightBorder': '#00000000',
            'editorLineNumber.foreground': '#ffffff40',
            'editorLineNumber.activeForeground': '#ffffff90',
            'editor.selectionBackground': '#6366f155',
            'editorIndentGuide.background1': '#ffffff12',
            'editorIndentGuide.activeBackground1': '#ffffff28',
            'editorCursor.foreground': '#c7d2fe',
            'scrollbarSlider.background': '#ffffff18',
            'scrollbarSlider.hoverBackground': '#ffffff28',
        },
    });
};

interface CodeExercisePanelProps {
    exercise: CodeExercise;
    /** Gọi khi nộp bài và qua hết test (kể cả test ẩn) */
    onPass?: () => void;
    className?: string;
}

type Mode = 'run' | 'submit';
type Tab = 'results' | 'console';

const CodeExercisePanel: React.FC<CodeExercisePanelProps> = ({ exercise, onPass, className }) => {
    const [code, setCode] = useState(exercise.starterCode);
    const [result, setResult] = useState<RunResult | null>(null);
    const [mode, setMode] = useState<Mode>('run');
    const [running, setRunning] = useState(false);
    const [status, setStatus] = useState('');
    const [tab, setTab] = useState<Tab>('results');
    const [editorReady, setEditorReady] = useState(false);
    // Ba nút cửa sổ: đỏ = đóng (còn thanh "Mở lại"), vàng = thu nhỏ (còn title bar), xanh = toàn màn hình
    const [closed, setClosed] = useState(false);
    const [minimized, setMinimized] = useState(false);
    const [focus, setFocus] = useState(false);
    const close = () => { setFocus(false); setClosed(true); };
    const minimize = () => { setFocus(false); setMinimized((m) => !m); };
    const zoom = () => { setMinimized(false); setFocus((f) => !f); };
    useEffect(() => {
        if (!focus) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setFocus(false); };
        window.addEventListener('keydown', onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
    }, [focus]);

    // Đổi bài → về trạng thái ban đầu
    useEffect(() => {
        setCode(exercise.starterCode);
        setResult(null);
        setStatus('');
        setTab('results');
    }, [exercise]);

    const lang = LANG_META[exercise.language];
    const visibleTests = useMemo(() => exercise.tests.filter((t) => !t.hidden), [exercise.tests]);

    const execute = useCallback(async (m: Mode) => {
        if (running) return;
        setRunning(true);
        setMode(m);
        setTab('results');
        const tests = m === 'submit' ? exercise.tests : visibleTests;
        const r = await runCode(exercise.language, code, tests, { onStatus: setStatus });
        setResult(r);
        setRunning(false);
        setStatus('');
        if (m === 'submit') {
            const passed = r.cases.every((c) => c.passed);
            if (passed) { showToast.success('Chính xác! Bạn đã qua tất cả test.'); onPass?.(); }
            else showToast.error(`Chưa đạt: ${r.cases.filter((c) => !c.passed).length} test chưa qua.`);
        }
    }, [running, exercise, visibleTests, code, onPass]);

    // Ctrl+Enter trong Monaco gọi bản execute mới nhất
    const executeRef = useRef(execute);
    executeRef.current = execute;

    const onMount: OnMount = (editor, monaco) => {
        setEditorReady(true);
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => executeRef.current('run'));
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter, () => executeRef.current('submit'));
    };

    const passedCount = result ? result.cases.filter((c) => c.passed).length : 0;
    const totalCount = result ? result.cases.length : visibleTests.length;
    const allPassed = !!result && result.cases.length > 0 && passedCount === result.cases.length;

    if (closed) {
        return (
            <div className={cn('flex items-center gap-3 h-11 px-4 rounded-xl border border-dashed border-line bg-surface/70 text-[12.5px] text-fg-muted', className)}>
                <FileCode2 className="w-3.5 h-3.5 text-primary-500" />
                <span className="font-mono text-fg-2">{exercise.fileName}</span>
                <span className="truncate">— bài tập đã đóng{result && <> · {passedCount}/{totalCount} test</>}</span>
                <Button size="xs" variant="soft" className="ml-auto" onClick={() => setClosed(false)}>
                    <PanelTopOpen className="w-3 h-3" /> Mở lại
                </Button>
            </div>
        );
    }

    return (
        <div className={focus ? 'fixed inset-0 z-[70] p-3 sm:p-5 bg-ink-950/60 backdrop-blur-sm' : 'contents'}>
        <MacWindow
            className={cn(focus && 'h-full flex flex-col shadow-2xl', className)}
            onClose={close}
            onMinimize={minimize}
            minimized={minimized}
            onZoom={zoom}
            zoomed={focus}
            hintKey="code-exercise"
            title={<><FileCode2 className="w-3.5 h-3.5 text-primary-500" /> {exercise.fileName} — Bài tập{focus && <span className="text-fg-subtle"> · Esc để thoát</span>}</>}
            right={
                <span className="flex items-center gap-1.5 font-mono text-[11px] text-fg-muted">
                    <span className="w-2 h-2 rounded-[3px]" style={{ background: lang.dot }} aria-hidden />
                    {lang.label}
                </span>
            }
            footer={
                <>
                    <span className="flex items-center gap-1.5">
                        <span className={cn('w-1.5 h-1.5 rounded-full', running ? 'bg-amber-500 animate-pulse' : allPassed ? 'bg-emerald-500' : 'bg-fg-subtle')} />
                        {running ? 'đang chạy…' : result ? `${passedCount}/${totalCount} test` : `${visibleTests.length} test hiện · ${exercise.tests.length - visibleTests.length} test ẩn`}
                    </span>
                    {result && !running && <span className="tabular-nums text-fg-subtle">{Math.round(result.timeMs)} ms</span>}
                    <span className="ml-auto hidden sm:flex items-center gap-1.5 text-fg-subtle">
                        <Kbd>Ctrl</Kbd><Kbd>↵</Kbd> chạy · <Kbd>Ctrl</Kbd><Kbd>⇧</Kbd><Kbd>↵</Kbd> nộp
                    </span>
                </>
            }
        >
            <div className={cn('grid', focus ? 'flex-1 min-h-0 lg:grid-cols-[minmax(0,3fr)_minmax(0,9fr)]' : 'lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]')}>
                {/* ── Đề bài ── */}
                <aside className={cn('p-5 border-b lg:border-b-0 lg:border-r border-line', focus && 'overflow-y-auto min-h-0')}>
                    <p className="font-mono text-[11px] text-fg-muted mb-2"><span className="text-fg-subtle select-none">{'// '}</span>đề bài</p>
                    <h3 className="text-base font-bold tracking-tight text-fg leading-snug">{exercise.title}</h3>
                    <Prompt text={exercise.prompt} language={exercise.language} />

                    {exercise.hints && exercise.hints.length > 0 && (
                        <details className="group mt-4 rounded-lg border border-amber-200/70 bg-amber-50/60 dark:border-amber-500/25 dark:bg-amber-500/10">
                            <summary className="flex items-center gap-2 px-3 h-9 cursor-pointer text-[12.5px] font-medium text-amber-800 dark:text-amber-200 select-none [&::-webkit-details-marker]:hidden">
                                <Lightbulb className="w-3.5 h-3.5" /> Gợi ý
                                <ChevronRight className="w-3.5 h-3.5 ml-auto transition-transform group-open:rotate-90" />
                            </summary>
                            <ul className="px-3 pb-3 space-y-1.5 text-[12.5px] text-amber-900/80 dark:text-amber-100/80">
                                {exercise.hints.map((h, i) => <li key={i}><InlineCode text={h} /></li>)}
                            </ul>
                        </details>
                    )}

                    <div className="mt-5">
                        <p className="font-mono text-[11px] text-fg-muted mb-2"><span className="text-fg-subtle select-none">{'// '}</span>test hiện ({visibleTests.length})</p>
                        <ul className="space-y-1">
                            {visibleTests.map((t) => (
                                <li key={t.name} className="flex items-baseline gap-2 font-mono text-[11.5px]">
                                    <span className="text-fg-2 truncate">{t.call}</span>
                                    <span className="text-fg-subtle">→</span>
                                    <span className="text-emerald-600 dark:text-emerald-300 flex-shrink-0">{t.expected}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </aside>

                {/* ── Editor + kết quả ── */}
                <div className="flex flex-col min-w-0 min-h-0 text-white" style={{ background: EDITOR_BG }}>
                    {/* Tab strip */}
                    <div className="flex items-center h-9 border-b border-white/[0.08] bg-white/[0.03]">
                        <span className="flex items-center gap-2 h-full px-3.5 font-mono text-[11px] text-white bg-white/[0.06] border-r border-white/[0.06] relative">
                            <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary-400 to-accent-400" />
                            <span className="w-2 h-2 rounded-[3px]" style={{ background: lang.dot }} aria-hidden />
                            {exercise.fileName}
                            <span className="text-white/40" aria-hidden>×</span>
                        </span>
                        <div className="ml-auto flex items-center gap-1.5 pr-2">
                            <button
                                onClick={zoom}
                                title={focus ? 'Thu về (Esc)' : 'Mở rộng toàn màn hình'}
                                aria-label={focus ? 'Thu nhỏ' : 'Mở rộng'}
                                className="flex items-center justify-center w-7 h-7 rounded-md text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                            >
                                {focus ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                            </button>
                            <button
                                onClick={() => { setCode(exercise.starterCode); setResult(null); }}
                                title="Đặt lại code ban đầu"
                                className="flex items-center gap-1 h-7 px-2 rounded-md text-[11px] font-medium text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                            >
                                <RotateCcw className="w-3 h-3" /> Đặt lại
                            </button>
                            <Button size="xs" variant="onDark" onClick={() => execute('run')} disabled={running || !editorReady} className="font-mono">
                                {running && mode === 'run' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 fill-current" />} Chạy
                            </Button>
                            <Button size="xs" onClick={() => execute('submit')} disabled={running || !editorReady}>
                                {running && mode === 'submit' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />} Nộp bài
                            </Button>
                        </div>
                    </div>

                    {/* Monaco */}
                    <div className={cn('relative', focus ? 'flex-1 min-h-0' : 'h-[360px]')}>
                        <Editor
                            height="100%"
                            language={exercise.language}
                            theme="eduhub-dark"
                            value={code}
                            onChange={(v) => setCode(v ?? '')}
                            beforeMount={defineTheme}
                            onMount={onMount}
                            loading={<EditorSkeleton />}
                            options={{
                                fontSize: 13,
                                fontFamily: "'JetBrains Mono', Menlo, Consolas, monospace",
                                fontLigatures: true,
                                lineHeight: 22,
                                minimap: { enabled: false },
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                padding: { top: 12, bottom: 12 },
                                tabSize: exercise.language === 'python' ? 4 : 2,
                                renderLineHighlight: 'line',
                                smoothScrolling: true,
                                cursorBlinking: 'smooth',
                                cursorSmoothCaretAnimation: 'on',
                                overviewRulerBorder: false,
                                hideCursorInOverviewRuler: true,
                                scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
                                bracketPairColorization: { enabled: true },
                                guides: { bracketPairs: true },
                                wordWrap: 'on',
                            }}
                        />
                    </div>

                    {/* Panel dưới: Kết quả / Console */}
                    <div className="border-t border-white/[0.08]">
                        <div className="flex items-center h-8 px-3.5 gap-4 font-mono text-[10px] uppercase tracking-wider text-white/40 border-b border-white/[0.06]">
                            <PanelTab active={tab === 'results'} onClick={() => setTab('results')} icon={ListChecks}>
                                Kết quả{result && <span className={cn('ml-1.5 normal-case tracking-normal', allPassed ? 'text-emerald-300' : 'text-white/70')}>{passedCount}/{totalCount}</span>}
                            </PanelTab>
                            <PanelTab active={tab === 'console'} onClick={() => setTab('console')} icon={TerminalSquare}>
                                Console{result && result.stdout.length > 0 && <span className="ml-1.5 normal-case tracking-normal text-white/70">{result.stdout.length}</span>}
                            </PanelTab>
                            {mode === 'submit' && result && (
                                <span className="ml-auto normal-case tracking-normal text-white/40">đã chấm cả test ẩn</span>
                            )}
                        </div>

                        <div className={cn('overflow-y-auto px-3.5 py-2.5 font-mono text-[12px] leading-relaxed', focus ? 'h-56' : 'h-44')}>
                            {running ? (
                                <p className="flex items-center gap-2 text-white/60">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> {status || 'Đang chạy…'}
                                </p>
                            ) : !result ? (
                                <p className="text-white/35">
                                    <span className="text-emerald-300">➜</span> Nhấn <span className="text-white/70">Chạy</span> hoặc <span className="text-white/70">Ctrl+Enter</span> để kiểm tra với test hiện. <span className="text-white/70">Nộp bài</span> sẽ chấm cả test ẩn.
                                </p>
                            ) : tab === 'results' ? (
                                <ResultsList result={result} />
                            ) : (
                                <ConsoleView result={result} />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </MacWindow>
        </div>
    );
};

/* ─────────────────────────────────────────────────────────────
   Pieces
   ───────────────────────────────────────────────────────────── */

const Kbd: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <kbd className="inline-flex items-center px-1 h-4 rounded border border-line bg-surface font-mono text-[9.5px] font-semibold text-fg-muted">{children}</kbd>
);

const PanelTab: React.FC<{ active: boolean; onClick: () => void; icon: typeof ListChecks; children: React.ReactNode }> = ({ active, onClick, icon: Icon, children }) => (
    <button
        onClick={onClick}
        role="tab"
        aria-selected={active}
        className={cn('flex items-center gap-1.5 h-full border-b transition-colors', active ? 'text-white/85 border-primary-300' : 'border-transparent hover:text-white/70')}
    >
        <Icon className="w-3 h-3" /> {children}
    </button>
);

const rowVariants = {
    hidden: { opacity: 0, x: -6 },
    show: (i: number) => ({ opacity: 1, x: 0, transition: { delay: i * 0.05, duration: 0.2 } }),
};

const ResultsList: React.FC<{ result: RunResult }> = ({ result }) => (
    <AnimatePresence mode="wait" initial={false}>
        <motion.div key={result.timeMs + ':' + result.cases.length} initial="hidden" animate="show" className="space-y-1.5">
            {result.error && (
                <motion.div variants={rowVariants} custom={0} className="rounded-md border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-rose-200 whitespace-pre-wrap">
                    <span className="text-rose-300 font-semibold">error</span> {result.error}
                </motion.div>
            )}
            {result.cases.map((c, i) => (
                <motion.div key={c.name} variants={rowVariants} custom={i + 1} className="flex items-start gap-2">
                    <span className={cn('mt-0.5 flex w-4 h-4 flex-shrink-0 items-center justify-center rounded-full', c.passed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300')}>
                        {c.passed ? <Check className="w-3 h-3" strokeWidth={3} /> : <X className="w-3 h-3" strokeWidth={3} />}
                    </span>
                    <div className="min-w-0">
                        <p className={cn('font-medium', c.passed ? 'text-emerald-200' : 'text-rose-200')}>
                            {c.name}{c.hidden && <span className="ml-1.5 text-white/35 font-normal">(ẩn)</span>}
                        </p>
                        {!c.hidden && (
                            <p className="text-white/50 truncate">
                                {c.call} <span className="text-white/30">→</span>{' '}
                                {c.error
                                    ? <span className="text-rose-300">{c.error}</span>
                                    : <span className={c.passed ? 'text-emerald-300' : 'text-rose-300'}>{c.actual}</span>}
                                {!c.passed && !c.error && <span className="text-white/35"> · mong đợi <span className="text-white/60">{c.expected}</span></span>}
                            </p>
                        )}
                        {c.hidden && c.error && <p className="text-rose-300 truncate">{c.error}</p>}
                    </div>
                </motion.div>
            ))}
        </motion.div>
    </AnimatePresence>
);

const CONSOLE_TONE: Record<string, string> = { log: 'text-white/80', info: 'text-sky-300', warn: 'text-amber-300', error: 'text-rose-300' };

const ConsoleView: React.FC<{ result: RunResult }> = ({ result }) => (
    result.stdout.length === 0
        ? <p className="text-white/35">Không có output. Dùng {`console.log`} / {`print`} để in ra đây.</p>
        : (
            <div className="space-y-0.5">
                {result.stdout.map((l, i) => (
                    <p key={i} className={cn('whitespace-pre-wrap break-words', CONSOLE_TONE[l.level])}>
                        <span className="text-white/25 select-none mr-2">{String(i + 1).padStart(2, ' ')}</span>{l.text}
                    </p>
                ))}
            </div>
        )
);

const EditorSkeleton: React.FC = () => (
    <div className="h-full p-4 space-y-2.5" style={{ background: EDITOR_BG }}>
        {[60, 40, 75, 30, 55].map((w, i) => <div key={i} className="h-3 rounded bg-white/[0.06]" style={{ width: `${w}%` }} />)}
    </div>
);

/** Đề bài: đoạn văn + khối ``` code ``` + `inline code`. */
const Prompt: React.FC<{ text: string; language: ExerciseLanguage }> = ({ text, language }) => {
    const parts = text.split(/```(\w*)\n([\s\S]*?)```/g);
    // split với 2 group → [text, lang, code, text, lang, code, ...]
    const nodes: React.ReactNode[] = [];
    for (let i = 0; i < parts.length; i += 3) {
        const para = parts[i].trim();
        if (para) {
            para.split(/\n{2,}/).forEach((p, j) => nodes.push(
                <p key={`p-${i}-${j}`} className="text-[13px] text-fg-2 leading-relaxed"><InlineCode text={p} /></p>,
            ));
        }
        if (i + 2 < parts.length) {
            nodes.push(
                <SyntaxHighlighter
                    key={`c-${i}`}
                    language={parts[i + 1] || language}
                    style={codeTheme}
                    customStyle={{ margin: 0, borderRadius: 8, fontSize: 12, padding: '10px 12px', background: EDITOR_BG }}
                >
                    {parts[i + 2].trimEnd()}
                </SyntaxHighlighter>,
            );
        }
    }
    return <div className="mt-3 space-y-3">{nodes}</div>;
};

const InlineCode: React.FC<{ text: string }> = ({ text }) => (
    <>
        {text.split(/(`[^`]+`)/g).map((seg, i) =>
            seg.startsWith('`') && seg.endsWith('`')
                ? <code key={i} className="px-1 py-0.5 rounded bg-surface-2 border border-line font-mono text-[11.5px] text-primary-700 dark:text-primary-300">{seg.slice(1, -1)}</code>
                : <React.Fragment key={i}>{seg}</React.Fragment>,
        )}
    </>
);

export default CodeExercisePanel;
