import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, PenLine, Sparkles, Tag, Clock, Image, AlignLeft, Check,
    Bold, Italic, Heading2, Heading3, Code, FileCode, Quote, Link2,
    List, ListOrdered, Eye, Edit3, Copy,
} from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { showToast } from './CustomToast';
import articleService from '../services/articleService';
import type { Article, ArticleRequest } from '../types/article';

// ── helpers ───────────────────────────────────────────────────────────────────

const slugify = (text: string) =>
    text.toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');

const CATEGORIES = ['React', 'TypeScript', 'CSS', 'Performance', 'DevOps', 'Backend', 'Frontend', 'Trends', 'Khác'];

const CATEGORY_COLOR: Record<string, string> = {
    React: 'bg-blue-50 text-blue-700 border-blue-200',
    TypeScript: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    CSS: 'bg-purple-50 text-purple-700 border-purple-200',
    Performance: 'bg-amber-50 text-amber-700 border-amber-200',
    DevOps: 'bg-orange-50 text-orange-700 border-orange-200',
    Backend: 'bg-teal-50 text-teal-700 border-teal-200',
    Frontend: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    Trends: 'bg-rose-50 text-rose-700 border-rose-200',
    Khác: 'bg-ink-50 text-ink-700 border-ink-200',
};

// ── Code preview (dùng chung với ArticleDetailModal) ──────────────────────────

const detectLang = (className?: string) => {
    const m = (className ?? '').match(/language-(\w+)/);
    return m ? m[1] : 'text';
};

const LANG_LABEL: Record<string, string> = {
    js: 'JavaScript', javascript: 'JavaScript', ts: 'TypeScript', typescript: 'TypeScript',
    jsx: 'JSX', tsx: 'TSX', py: 'Python', python: 'Python', java: 'Java',
    csharp: 'C#', cs: 'C#', cpp: 'C++', c: 'C', go: 'Go', rust: 'Rust',
    bash: 'Bash', sh: 'Shell', sql: 'SQL', html: 'HTML', css: 'CSS',
    json: 'JSON', yaml: 'YAML', xml: 'XML', text: 'Text',
};

const CodeBlock: React.FC<{ code: string; lang: string }> = ({ code, lang }) => {
    const [copied, setCopied] = useState(false);
    const copy = async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <div className="rounded-xl overflow-hidden border border-[#3c3c3c] shadow-lg my-4">
            <div className="flex items-center justify-between px-4 py-2 bg-[#1e1e1e] border-b border-[#3c3c3c]">
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                    <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
                    <span className="w-3 h-3 rounded-full bg-[#28c840]" />
                    <span className="ml-3 text-[11px] font-mono text-[#858585] select-none">
                        {LANG_LABEL[lang.toLowerCase()] ?? lang.toUpperCase()}
                    </span>
                </div>
                <button onClick={copy}
                    className="flex items-center gap-1.5 text-[11px] font-mono px-2 py-1 rounded bg-[#2d2d2d] hover:bg-[#3c3c3c] text-[#858585] hover:text-white transition-colors">
                    {copied ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
                    {copied ? 'Đã sao chép' : 'Copy'}
                </button>
            </div>
            <SyntaxHighlighter language={lang} style={vscDarkPlus} showLineNumbers wrapLines
                customStyle={{ margin: 0, borderRadius: 0, fontSize: '13px', lineHeight: '1.6', background: '#1e1e1e', padding: '16px' }}
                lineNumberStyle={{ color: '#4a4a4a', minWidth: '2.5em', userSelect: 'none' }}>
                {code.trimEnd()}
            </SyntaxHighlighter>
        </div>
    );
};

const ArticlePreview: React.FC<{ html: string }> = ({ html }) => {
    const parts: React.ReactNode[] = [];
    const regex = /<pre[^>]*><code([^>]*)>([\s\S]*?)<\/code><\/pre>/gi;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let key = 0;

    while ((match = regex.exec(html)) !== null) {
        if (match.index > lastIndex) {
            parts.push(
                <div key={key++}
                    className="prose prose-sm max-w-none text-ink-800 prose-headings:font-bold prose-headings:text-ink-900 prose-a:text-primary-600 prose-blockquote:border-primary-300 prose-strong:text-ink-900"
                    dangerouslySetInnerHTML={{ __html: html.slice(lastIndex, match.index) }} />
            );
        }
        const rawCode = match[2]
            .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');
        parts.push(<CodeBlock key={key++} code={rawCode} lang={detectLang(match[1])} />);
        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < html.length) {
        parts.push(
            <div key={key++}
                className="prose prose-sm max-w-none text-ink-800 prose-headings:font-bold prose-headings:text-ink-900 prose-a:text-primary-600 prose-blockquote:border-primary-300 prose-strong:text-ink-900"
                dangerouslySetInnerHTML={{ __html: html.slice(lastIndex) }} />
        );
    }

    return <>{parts.length ? parts : <p className="text-sm text-ink-400 italic">Chưa có nội dung để xem trước.</p>}</>;
};

// ── Rich-text toolbar ─────────────────────────────────────────────────────────

interface ToolbarAction {
    icon: React.ReactNode;
    title: string;
    action: (sel: string) => { before: string; after: string; placeholder?: string };
}

const TOOLBAR: (ToolbarAction | 'sep')[] = [
    {
        icon: <Bold size={14} />, title: 'Bold',
        action: (s) => ({ before: '<strong>', after: '</strong>', placeholder: s || 'text in đậm' }),
    },
    {
        icon: <Italic size={14} />, title: 'Italic',
        action: (s) => ({ before: '<em>', after: '</em>', placeholder: s || 'text in nghiêng' }),
    },
    'sep',
    {
        icon: <Heading2 size={14} />, title: 'Heading 2',
        action: (s) => ({ before: '<h2>', after: '</h2>', placeholder: s || 'Tiêu đề 2' }),
    },
    {
        icon: <Heading3 size={14} />, title: 'Heading 3',
        action: (s) => ({ before: '<h3>', after: '</h3>', placeholder: s || 'Tiêu đề 3' }),
    },
    'sep',
    {
        icon: <Code size={14} />, title: 'Inline code',
        action: (s) => ({ before: '<code>', after: '</code>', placeholder: s || 'code' }),
    },
    {
        icon: <FileCode size={14} />, title: 'Code block (JS)',
        action: (s) => ({ before: '<pre><code class="language-javascript">', after: '</code></pre>', placeholder: s || '// code của bạn ở đây' }),
    },
    'sep',
    {
        icon: <Quote size={14} />, title: 'Blockquote',
        action: (s) => ({ before: '<blockquote>', after: '</blockquote>', placeholder: s || 'trích dẫn' }),
    },
    {
        icon: <Link2 size={14} />, title: 'Link',
        action: (s) => ({ before: '<a href="URL">', after: '</a>', placeholder: s || 'văn bản link' }),
    },
    'sep',
    {
        icon: <List size={14} />, title: 'Danh sách',
        action: (s) => ({ before: '<ul>\n  <li>', after: '</li>\n</ul>', placeholder: s || 'mục 1' }),
    },
    {
        icon: <ListOrdered size={14} />, title: 'Danh sách có số',
        action: (s) => ({ before: '<ol>\n  <li>', after: '</li>\n</ol>', placeholder: s || 'mục 1' }),
    },
];

const LANG_OPTIONS = ['javascript', 'typescript', 'python', 'java', 'csharp', 'cpp', 'go', 'rust', 'bash', 'sql', 'html', 'css', 'json', 'yaml', 'text'];

// ── Content editor component ──────────────────────────────────────────────────

const ContentEditor: React.FC<{
    value: string;
    onChange: (v: string) => void;
}> = ({ value, onChange }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [tab, setTab] = useState<'edit' | 'preview'>('edit');
    const [codeBlockLang, setCodeBlockLang] = useState('javascript');

    const insertAround = useCallback((before: string, after: string, placeholder: string) => {
        const el = textareaRef.current;
        if (!el) return;
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const selected = value.slice(start, end) || placeholder;
        const newVal = value.slice(0, start) + before + selected + after + value.slice(end);
        onChange(newVal);
        requestAnimationFrame(() => {
            el.focus();
            const cursor = start + before.length + selected.length + after.length;
            el.setSelectionRange(cursor, cursor);
        });
    }, [value, onChange]);

    const insertCodeBlock = useCallback(() => {
        const el = textareaRef.current;
        if (!el) return;
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const selected = value.slice(start, end) || '// code của bạn ở đây';
        const before = `<pre><code class="language-${codeBlockLang}">`;
        const after = '</code></pre>';
        const newVal = value.slice(0, start) + before + selected + after + value.slice(end);
        onChange(newVal);
        requestAnimationFrame(() => {
            el.focus();
            const cursor = start + before.length + selected.length + after.length;
            el.setSelectionRange(cursor, cursor);
        });
    }, [value, onChange, codeBlockLang]);

    return (
        <div className="border border-ink-200 rounded-xl overflow-hidden">
            {/* Tab bar */}
            <div className="flex items-center justify-between bg-ink-50 border-b border-ink-200 px-3 py-1.5">
                <div className="flex items-center gap-1">
                    <button onClick={() => setTab('edit')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            tab === 'edit' ? 'bg-white shadow-sm text-ink-900' : 'text-ink-500 hover:text-ink-800'
                        }`}>
                        <Edit3 size={12} /> Soạn thảo
                    </button>
                    <button onClick={() => setTab('preview')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            tab === 'preview' ? 'bg-white shadow-sm text-ink-900' : 'text-ink-500 hover:text-ink-800'
                        }`}>
                        <Eye size={12} /> Xem trước
                    </button>
                </div>
                <span className="text-[10px] text-ink-400">{value.length} ký tự</span>
            </div>

            {tab === 'edit' && (
                <>
                    {/* Toolbar */}
                    <div className="flex items-center flex-wrap gap-0.5 px-2 py-1.5 bg-[#f8f8f8] border-b border-ink-100">
                        {TOOLBAR.map((item, i) => {
                            if (item === 'sep') return <span key={i} className="w-px h-5 bg-ink-200 mx-1" />;

                            // Special: code block with language picker
                            if (item.title === 'Code block (JS)') {
                                return (
                                    <div key={i} className="flex items-center">
                                        <button
                                            type="button"
                                            title={`Code block (${codeBlockLang})`}
                                            onClick={insertCodeBlock}
                                            className="flex items-center gap-1 px-2 py-1.5 rounded-md text-ink-600 hover:text-ink-900 hover:bg-white hover:shadow-sm transition-all text-[11px] font-medium"
                                        >
                                            <FileCode size={14} />
                                            <span className="hidden sm:inline">Code</span>
                                        </button>
                                        <select
                                            value={codeBlockLang}
                                            onChange={(e) => setCodeBlockLang(e.target.value)}
                                            className="text-[10px] font-mono bg-transparent border border-ink-200 rounded px-1 py-0.5 text-ink-600 cursor-pointer focus:outline-none"
                                        >
                                            {LANG_OPTIONS.map((l) => <option key={l} value={l}>{l}</option>)}
                                        </select>
                                    </div>
                                );
                            }

                            return (
                                <button key={i} type="button" title={item.title}
                                    onClick={() => {
                                        const el = textareaRef.current;
                                        const sel = el ? value.slice(el.selectionStart, el.selectionEnd) : '';
                                        const { before, after, placeholder } = item.action(sel);
                                        insertAround(before, after, placeholder ?? '');
                                    }}
                                    className="p-1.5 rounded-md text-ink-600 hover:text-ink-900 hover:bg-white hover:shadow-sm transition-all">
                                    {item.icon}
                                </button>
                            );
                        })}
                    </div>

                    {/* Textarea */}
                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder="Viết nội dung bài viết bằng HTML. Dùng toolbar bên trên để chèn định dạng nhanh..."
                        rows={14}
                        className="w-full px-4 py-3 bg-white text-sm text-ink-800 placeholder:text-ink-400 focus:outline-none resize-none font-mono leading-relaxed"
                    />
                </>
            )}

            {tab === 'preview' && (
                <div className="px-5 py-4 min-h-[14rem] bg-white overflow-y-auto">
                    <ArticlePreview html={value} />
                </div>
            )}
        </div>
    );
};

// ── Main form modal ───────────────────────────────────────────────────────────

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSaved: (article: Article) => void;
    editArticle?: Article | null;
}

const ArticleFormModal: React.FC<Props> = ({ isOpen, onClose, onSaved, editArticle }) => {
    const isEdit = !!editArticle;

    const [title, setTitle]                   = useState('');
    const [slug, setSlug]                     = useState('');
    const [slugManual, setSlugManual]         = useState(false);
    const [excerpt, setExcerpt]               = useState('');
    const [content, setContent]               = useState('');
    const [category, setCategory]             = useState('');
    const [thumbnailUrl, setThumbnailUrl]     = useState('');
    const [readTime, setReadTime]             = useState(5);
    const [submitting, setSubmitting]         = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        if (editArticle) {
            setTitle(editArticle.title);
            setSlug(editArticle.slug);
            setSlugManual(true);
            setExcerpt(editArticle.excerpt ?? '');
            setContent(editArticle.content ?? '');
            setCategory(editArticle.category ?? '');
            setThumbnailUrl(editArticle.thumbnailUrl ?? '');
            setReadTime(editArticle.readTimeMinutes);
        } else {
            setTitle(''); setSlug(''); setSlugManual(false);
            setExcerpt(''); setContent(''); setCategory('');
            setThumbnailUrl(''); setReadTime(5);
        }
    }, [isOpen, editArticle]);

    useEffect(() => {
        if (!slugManual && title) setSlug(slugify(title));
    }, [title, slugManual]);

    useEffect(() => {
        if (!isOpen) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = prev; };
    }, [isOpen]);

    const handleSubmit = async () => {
        if (!title.trim()) { showToast.error('Vui lòng nhập tiêu đề'); return; }
        if (!slug.trim())  { showToast.error('Vui lòng nhập slug');    return; }

        const payload: ArticleRequest = {
            title: title.trim(),
            slug: slug.trim(),
            excerpt: excerpt.trim() || undefined,
            content: content.trim() || undefined,
            category: category || undefined,
            thumbnailUrl: thumbnailUrl.trim() || undefined,
            readTimeMinutes: readTime,
        };

        setSubmitting(true);
        try {
            const saved = isEdit
                ? await articleService.updateArticle(editArticle!.id, payload)
                : await articleService.createArticle(payload);

            showToast.success(isEdit ? 'Đã cập nhật bài viết' : 'Đã đăng bài viết!');
            onSaved(saved);
            onClose();
        } catch {
            showToast.error('Có lỗi xảy ra, vui lòng thử lại');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-ink-900/60 backdrop-blur-sm" onClick={onClose} />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 12 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                        className="relative w-full max-w-3xl max-h-[94vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex-shrink-0 px-6 py-5 border-b border-ink-100 bg-gradient-to-r from-white to-primary-50/30">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-glow-primary">
                                        <PenLine size={16} className="text-white" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1.5 text-xs font-mono text-primary-600 mb-0.5">
                                            <Sparkles size={10} />
                                            <span>{isEdit ? 'articles / edit' : 'articles / create'}</span>
                                        </div>
                                        <h2 className="text-lg font-extrabold text-ink-900">
                                            {isEdit ? 'Chỉnh sửa bài viết' : 'Viết bài viết mới'}
                                        </h2>
                                    </div>
                                </div>
                                <button onClick={onClose}
                                    className="p-2 rounded-xl text-ink-400 hover:text-ink-900 hover:bg-ink-100 transition-colors">
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

                            {/* Title */}
                            <div>
                                <label className="block text-xs font-semibold text-ink-700 mb-1.5">
                                    Tiêu đề <span className="text-rose-500">*</span>
                                </label>
                                <input value={title} onChange={(e) => setTitle(e.target.value)}
                                    placeholder="VD: React Hooks: Hướng dẫn đầy đủ cho người mới bắt đầu"
                                    className="w-full px-4 py-3 bg-ink-50 border border-ink-200 rounded-xl text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 focus:bg-white transition-all" />
                            </div>

                            {/* Slug */}
                            <div>
                                <label className="block text-xs font-semibold text-ink-700 mb-1.5">
                                    Slug <span className="text-rose-500">*</span>
                                    <span className="ml-1.5 text-[10px] font-normal text-ink-400">(tự động từ tiêu đề)</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-ink-400 font-mono">/articles/</span>
                                    <input value={slug}
                                        onChange={(e) => { setSlug(e.target.value); setSlugManual(true); }}
                                        placeholder="react-hooks-huong-dan"
                                        className="w-full pl-[5.5rem] pr-4 py-3 bg-ink-50 border border-ink-200 rounded-xl text-sm font-mono text-ink-800 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 focus:bg-white transition-all" />
                                </div>
                            </div>

                            {/* Category + ReadTime */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="flex items-center gap-1.5 text-xs font-semibold text-ink-700 mb-1.5">
                                        <Tag size={11} /> Danh mục
                                    </label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {CATEGORIES.map((cat) => (
                                            <button key={cat} type="button"
                                                onClick={() => setCategory(cat === category ? '' : cat)}
                                                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                                                    category === cat
                                                        ? (CATEGORY_COLOR[cat] ?? 'bg-primary-50 text-primary-700 border-primary-200') + ' scale-105'
                                                        : 'bg-white border-ink-200 text-ink-500 hover:border-ink-300'
                                                }`}>
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="flex items-center gap-1.5 text-xs font-semibold text-ink-700 mb-1.5">
                                        <Clock size={11} /> Thời gian đọc (phút)
                                    </label>
                                    <input type="number" min={1} max={60}
                                        value={readTime}
                                        onChange={(e) => setReadTime(Number(e.target.value))}
                                        className="w-full px-4 py-2.5 bg-ink-50 border border-ink-200 rounded-xl text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all" />
                                </div>
                            </div>

                            {/* Thumbnail */}
                            <div>
                                <label className="flex items-center gap-1.5 text-xs font-semibold text-ink-700 mb-1.5">
                                    <Image size={11} /> URL ảnh thumbnail
                                </label>
                                <div className="flex gap-2">
                                    <input value={thumbnailUrl}
                                        onChange={(e) => setThumbnailUrl(e.target.value)}
                                        placeholder="https://example.com/image.jpg"
                                        className="flex-1 px-4 py-2.5 bg-ink-50 border border-ink-200 rounded-xl text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all" />
                                    {thumbnailUrl && (
                                        <img src={thumbnailUrl} alt="" onError={(e) => (e.currentTarget.style.display = 'none')}
                                            className="w-10 h-10 rounded-lg object-cover border border-ink-200 flex-shrink-0" />
                                    )}
                                </div>
                            </div>

                            {/* Excerpt */}
                            <div>
                                <label className="flex items-center gap-1.5 text-xs font-semibold text-ink-700 mb-1.5">
                                    <AlignLeft size={11} /> Mô tả ngắn
                                </label>
                                <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)}
                                    placeholder="Tóm tắt ngắn gọn nội dung bài viết, hiển thị ở trang danh sách..."
                                    rows={2}
                                    className="w-full px-4 py-3 bg-ink-50 border border-ink-200 rounded-xl text-sm text-ink-800 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 resize-none transition-all" />
                            </div>

                            {/* Rich content editor */}
                            <div>
                                <label className="block text-xs font-semibold text-ink-700 mb-1.5">
                                    Nội dung bài viết
                                </label>
                                <ContentEditor value={content} onChange={setContent} />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex-shrink-0 px-6 py-4 border-t border-ink-100 bg-white flex items-center justify-between gap-3">
                            <button onClick={onClose}
                                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-ink-500 hover:text-ink-900 hover:bg-ink-50 rounded-lg transition-colors">
                                <X size={14} /> Hủy
                            </button>
                            <motion.button
                                onClick={handleSubmit}
                                disabled={submitting || !title.trim() || !slug.trim()}
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-accent-600 text-white font-semibold rounded-xl shadow-glow-primary hover:brightness-105 disabled:opacity-50 disabled:hover:scale-100 transition-all text-sm"
                            >
                                <Check size={15} />
                                {submitting ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Đăng bài'}
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ArticleFormModal;
