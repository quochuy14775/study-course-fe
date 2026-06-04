import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Eye, ThumbsUp, User, Copy, Check } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import articleService from '../services/articleService';
import type { Article } from '../types/article';

// ── Detect language from class="language-xxx" ──────────────────────────────
const detectLang = (className?: string): string => {
    if (!className) return 'text';
    const m = className.match(/language-(\w+)/);
    return m ? m[1] : 'text';
};

// ── Code block with copy button ────────────────────────────────────────────
const CodeBlock: React.FC<{ code: string; lang: string }> = ({ code, lang }) => {
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const langLabel: Record<string, string> = {
        js: 'JavaScript', javascript: 'JavaScript', ts: 'TypeScript', typescript: 'TypeScript',
        jsx: 'JSX', tsx: 'TSX', py: 'Python', python: 'Python', java: 'Java',
        csharp: 'C#', cs: 'C#', cpp: 'C++', c: 'C', go: 'Go', rust: 'Rust',
        bash: 'Bash', sh: 'Shell', sql: 'SQL', html: 'HTML', css: 'CSS',
        json: 'JSON', yaml: 'YAML', xml: 'XML', md: 'Markdown', text: 'Text',
    };

    return (
        <div className="rounded-xl overflow-hidden border border-[#3c3c3c] shadow-lg my-4">
            {/* Title bar */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#1e1e1e] border-b border-[#3c3c3c]">
                <div className="flex items-center gap-2">
                    {/* Traffic lights */}
                    <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                    <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
                    <span className="w-3 h-3 rounded-full bg-[#28c840]" />
                    <span className="ml-3 text-[11px] font-mono text-[#858585] select-none">
                        {langLabel[lang.toLowerCase()] ?? lang.toUpperCase()}
                    </span>
                </div>
                <button
                    onClick={copy}
                    className="flex items-center gap-1.5 text-[11px] font-mono px-2 py-1 rounded bg-[#2d2d2d] hover:bg-[#3c3c3c] text-[#858585] hover:text-white transition-colors"
                >
                    {copied ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
                    {copied ? 'Đã sao chép' : 'Copy'}
                </button>
            </div>

            {/* Code */}
            <SyntaxHighlighter
                language={lang}
                style={vscDarkPlus}
                showLineNumbers
                wrapLines
                customStyle={{
                    margin: 0,
                    borderRadius: 0,
                    fontSize: '13px',
                    lineHeight: '1.6',
                    background: '#1e1e1e',
                    padding: '16px',
                }}
                lineNumberStyle={{ color: '#4a4a4a', minWidth: '2.5em', userSelect: 'none' }}
            >
                {code.trimEnd()}
            </SyntaxHighlighter>
        </div>
    );
};

// ── Parse HTML content → React nodes with IDE code blocks ─────────────────
const ArticleContent: React.FC<{ html: string }> = ({ html }) => {
    // Extract <pre><code class="language-xxx">...</code></pre> blocks and replace
    const parts: React.ReactNode[] = [];
    const regex = /<pre[^>]*><code([^>]*)>([\s\S]*?)<\/code><\/pre>/gi;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let key = 0;

    while ((match = regex.exec(html)) !== null) {
        // HTML before this code block
        if (match.index > lastIndex) {
            parts.push(
                <div
                    key={key++}
                    className="prose prose-sm max-w-none text-ink-800 leading-relaxed
                        prose-headings:font-bold prose-headings:text-ink-900
                        prose-a:text-primary-600 prose-a:underline
                        prose-blockquote:border-primary-300 prose-blockquote:text-ink-600
                        prose-strong:text-ink-900 prose-ul:list-disc prose-ol:list-decimal"
                    dangerouslySetInnerHTML={{ __html: html.slice(lastIndex, match.index) }}
                />
            );
        }

        // Decode HTML entities in code content
        const rawCode = match[2]
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&nbsp;/g, ' ');

        const lang = detectLang(match[1]);
        parts.push(<CodeBlock key={key++} code={rawCode} lang={lang} />);

        lastIndex = match.index + match[0].length;
    }

    // Remaining HTML
    if (lastIndex < html.length) {
        parts.push(
            <div
                key={key++}
                className="prose prose-sm max-w-none text-ink-800 leading-relaxed
                    prose-headings:font-bold prose-headings:text-ink-900
                    prose-a:text-primary-600 prose-a:underline
                    prose-blockquote:border-primary-300 prose-blockquote:text-ink-600
                    prose-strong:text-ink-900 prose-ul:list-disc prose-ol:list-decimal"
                dangerouslySetInnerHTML={{ __html: html.slice(lastIndex) }}
            />
        );
    }

    return <>{parts}</>;
};

// ── Modal ──────────────────────────────────────────────────────────────────

interface Props {
    articleId: number | null;
    onClose: () => void;
}

const ArticleDetailModal: React.FC<Props> = ({ articleId, onClose }) => {
    const [article, setArticle] = useState<Article | null>(null);
    const [loading, setLoading] = useState(false);

    const close = useCallback(() => onClose(), [onClose]);

    useEffect(() => {
        if (!articleId) return;
        setArticle(null);
        setLoading(true);
        (async () => {
            try {
                const [a] = await Promise.all([
                    articleService.getArticleById(articleId),
                    articleService.incrementView(articleId).catch(() => null),
                ]);
                setArticle(a);
            } catch {
                close();
            } finally {
                setLoading(false);
            }
        })();
    }, [articleId, close]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [close]);

    // Lock body scroll when open
    useEffect(() => {
        if (articleId !== null) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [articleId]);

    return (
        <AnimatePresence>
            {articleId !== null && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                        onClick={close}
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            key="modal"
                            initial={{ opacity: 0, scale: 0.93, y: 24 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.93, y: 24 }}
                            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
                            className="relative w-full max-w-3xl max-h-[88vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden pointer-events-auto"
                        >
                            {/* Close button */}
                            <button
                                onClick={close}
                                className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-ink-100 hover:bg-ink-200 flex items-center justify-center text-ink-500 hover:text-ink-900 transition-colors"
                            >
                                <X size={15} />
                            </button>

                            {/* Scrollable body */}
                            <div className="flex-1 overflow-y-auto">
                                {loading && (
                                    <div className="p-8 space-y-4 animate-pulse">
                                        <div className="h-6 w-3/4 bg-ink-100 rounded" />
                                        <div className="h-4 w-1/2 bg-ink-100 rounded" />
                                        <div className="h-48 bg-ink-100 rounded-xl mt-6" />
                                        {[90, 85, 70, 80].map((w, i) => (
                                            <div key={i} className="h-4 bg-ink-100 rounded" style={{ width: `${w}%` }} />
                                        ))}
                                    </div>
                                )}

                                {!loading && article && (
                                    <article>
                                        {/* Hero / Thumbnail */}
                                        {article.thumbnailUrl ? (
                                            <div className="relative h-52 sm:h-64 overflow-hidden rounded-t-3xl">
                                                <img
                                                    src={article.thumbnailUrl}
                                                    alt={article.title}
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                                                {article.category && (
                                                    <span className="absolute top-4 left-5 text-xs font-semibold px-3 py-1 rounded-full bg-white/90 text-primary-700">
                                                        {article.category}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="h-3 rounded-t-3xl bg-gradient-to-r from-primary-400 via-accent-400 to-primary-500" />
                                        )}

                                        {/* Content */}
                                        <div className="px-6 sm:px-8 py-6 space-y-5">
                                            {!article.thumbnailUrl && article.category && (
                                                <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-primary-50 text-primary-700 border border-primary-200">
                                                    {article.category}
                                                </span>
                                            )}

                                            <h1 className="text-xl sm:text-2xl font-extrabold text-ink-900 leading-snug pr-8">
                                                {article.title}
                                            </h1>

                                            {/* Meta */}
                                            <div className="flex items-center flex-wrap gap-4 text-xs text-ink-400 pb-4 border-b border-ink-100">
                                                {article.author && (
                                                    <span className="flex items-center gap-1.5">
                                                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center">
                                                            <User size={11} className="text-primary-600" />
                                                        </div>
                                                        <span className="font-semibold text-ink-700">{article.author}</span>
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1"><Clock size={11} />{article.readTimeMinutes} phút đọc</span>
                                                <span className="flex items-center gap-1"><Eye size={11} />{article.viewCount.toLocaleString()} lượt xem</span>
                                                <span className="flex items-center gap-1 text-rose-400"><ThumbsUp size={11} />{article.likeCount}</span>
                                            </div>

                                            {/* Excerpt */}
                                            {article.excerpt && (
                                                <p className="text-sm text-ink-600 leading-relaxed font-medium border-l-4 border-primary-300 pl-4 italic bg-primary-50/40 py-2 rounded-r-lg">
                                                    {article.excerpt}
                                                </p>
                                            )}

                                            {/* Body */}
                                            {article.content ? (
                                                <ArticleContent html={article.content} />
                                            ) : (
                                                <p className="text-sm text-ink-400 italic">Bài viết chưa có nội dung.</p>
                                            )}
                                        </div>
                                    </article>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ArticleDetailModal;
