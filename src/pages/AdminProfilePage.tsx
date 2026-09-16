import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    BookOpen, FileText, MessageSquareReply, Star, Settings, LayoutDashboard, Calendar, ShieldCheck,
    ArrowRight, FlaskConical, Inbox, MessageCircleQuestionMark, AlertTriangle, Wrench, Plus, Code2, Layers,
    Award, Users, GraduationCap, Activity, Pencil, FilePlus, Eye, EyeOff, type LucideIcon,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useAdminProfile } from '../hooks/useAdminProfile';
import { ContributionGraph, type ContributionDay } from '../components/ContributionGraph';
import { Button } from '../components/ui/Button';
import { Tooltip } from '../components/ui/Tooltip';
import {
    container, card, TONES, TiltCard, LiftCard, CardHeading, StatTile, AnimatedNumber,
    ProfileBackdrop, ProfileTitle, timeAgo,
} from '../components/profile/ProfileKit';
import { cn } from '../lib/cn';
import type { AdminRecentAction } from '../types/adminProfile';

/* ─────────────────────────────────────────────────────────────
   Bảng tra
   ───────────────────────────────────────────────────────────── */

const ACTION_META: Record<AdminRecentAction['kind'], { icon: LucideIcon; label: string; cls: string }> = {
    course_created: { icon: FilePlus,           label: 'Tạo khóa học',    cls: 'bg-primary-50 text-primary-600 dark:bg-primary-500/15 dark:text-primary-300' },
    course_updated: { icon: Pencil,             label: 'Cập nhật khóa',   cls: 'bg-primary-50 text-primary-600 dark:bg-primary-500/15 dark:text-primary-300' },
    article:        { icon: FileText,           label: 'Viết bài',        cls: 'bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300' },
    answer:         { icon: MessageSquareReply, label: 'Trả lời câu hỏi', cls: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300' },
    reply:          { icon: Star,               label: 'Phản hồi review', cls: 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300' },
};

const LEVEL_LABEL = { Beginner: 'Cơ bản', Intermediate: 'Trung cấp', Advanced: 'Nâng cao' } as const;

const fmtInt = (n: number) => n.toLocaleString('vi-VN');

/** Tooltip cho contribution graph quản trị (map: lessons = khóa, quizzes = bài viết, posts = trả lời/phản hồi). */
const describeAdmin = (d: ContributionDay): string => {
    if (d.count === 0) return 'Không có hoạt động';
    const parts: string[] = [];
    if (d.lessons) parts.push(`${d.lessons} khóa tạo/sửa`);
    if (d.quizzes) parts.push(`${d.quizzes} bài viết`);
    if (d.posts) parts.push(`${d.posts} trả lời/phản hồi`);
    if (d.enrollments) parts.push(`${d.enrollments} roadmap`);
    return parts.length ? parts.join(' · ') : `${d.count} hoạt động`;
};

/* ─────────────────────────────────────────────────────────────
   Page
   ───────────────────────────────────────────────────────────── */

const AdminProfilePage: React.FC = () => {
    const navigate = useNavigate();
    const user = useAuthStore((s) => s.user);
    const { data, loading, error, source, refresh } = useAdminProfile();

    const displayName = data?.profile.fullName || user?.name || user?.email || 'Admin';
    const displayEmail = data?.profile.email || user?.email || '';
    const avatarUrl = data?.profile.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayName)}`;

    const contributionData = useMemo<ContributionDay[]>(
        () => (data?.activity.days ?? []).map((d) => ({
            date: new Date(`${d.date}T00:00:00`),
            count: d.count, lessons: d.lessons, quizzes: d.quizzes, posts: d.posts, enrollments: d.enrollments,
        })),
        [data?.activity],
    );

    const pending = data ? data.system.pendingQuestions + data.system.pendingLowReviews + data.system.coursesWithoutTest : 0;

    return (
        <main className="min-h-screen relative overflow-hidden">
            <ProfileBackdrop />

            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="relative max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6"
            >
                <ProfileTitle
                    path={['admin', 'profile']}
                    title="Hồ sơ quản trị"
                    right={source === 'mock' && (
                        <Tooltip content="Backend không phản hồi — đang hiển thị dữ liệu mẫu (chỉ ở development)" side="bottom">
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 text-[11px] font-semibold">
                                <FlaskConical className="w-3 h-3" /> Dữ liệu mẫu
                            </span>
                        </Tooltip>
                    )}
                />

                {loading && !data && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 h-40 rounded-2xl shimmer" />
                        <div className="h-40 rounded-2xl shimmer" />
                    </div>
                )}
                {error && (
                    <div className="rounded-2xl border border-line bg-surface p-8 text-center">
                        <p className="text-sm text-fg-2">{error}</p>
                        <Button variant="secondary" size="sm" className="mt-3" onClick={refresh}>Thử lại</Button>
                    </div>
                )}

                {data && (
                    <>
                        {/* ── Hồ sơ + Cần xử lý ── */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <TiltCard className="lg:col-span-2 p-5 sm:p-6 overflow-hidden">
                                <motion.div
                                    className="pointer-events-none absolute top-0 -left-1/3 w-1/3 h-full -skew-x-12 bg-gradient-to-r from-transparent via-white/50 dark:via-white/10 to-transparent"
                                    animate={{ left: ['-40%', '140%'] }}
                                    transition={{ duration: 3.5, ease: 'easeInOut', repeat: Infinity, repeatDelay: 3 }}
                                />
                                <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
                                    <div className="relative flex-shrink-0">
                                        <motion.img
                                            src={avatarUrl}
                                            alt={displayName}
                                            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-surface-2 ring-4 ring-surface shadow-soft-lg"
                                            animate={{ y: [0, -6, 0] }}
                                            transition={{ duration: 4, ease: 'easeInOut', repeat: Infinity }}
                                            whileHover={{ scale: 1.08, rotate: 3 }}
                                        />
                                        <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 text-white flex items-center justify-center ring-2 ring-surface shadow-md">
                                            <ShieldCheck className="w-3.5 h-3.5" />
                                        </span>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2.5">
                                            <h2 className="text-xl font-bold text-fg truncate">{displayName}</h2>
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white bg-gradient-to-r from-rose-500 to-pink-600 shadow-[0_0_12px_rgb(244_63_94/0.35)]">
                                                Admin
                                            </span>
                                        </div>
                                        <p className="text-sm text-fg-muted mt-0.5 truncate">{displayEmail}</p>
                                        <p className="text-xs text-fg-subtle mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                                            <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" /> Quản trị từ {new Date(data.joinedAt).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}</span>
                                            <span className="inline-flex items-center gap-1"><Activity className="w-3 h-3" /> {data.activity.activeDays} ngày hoạt động · chuỗi {data.activity.currentStreak} ngày</span>
                                        </p>

                                        {/* Đóng góp tóm tắt */}
                                        <div className="mt-4 grid grid-cols-3 gap-2">
                                            {[
                                                { label: 'Khóa đã tạo', value: data.contribution.coursesCreated, tone: 'primary' as const },
                                                { label: 'Học viên của tôi', value: data.contribution.learnersInMyCourses, tone: 'emerald' as const },
                                                { label: 'Trả lời & phản hồi', value: data.contribution.answersGiven + data.contribution.reviewRepliesGiven, tone: 'rose' as const },
                                            ].map((s) => (
                                                <div key={s.label} className={cn('rounded-xl px-3 py-2', TONES[s.tone].soft)}>
                                                    <p className="text-lg font-bold leading-none"><AnimatedNumber value={s.value} /></p>
                                                    <p className="text-[10px] font-medium mt-1 opacity-80 truncate">{s.label}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex sm:flex-col gap-2 flex-shrink-0">
                                        <Button variant="secondary" size="sm" onClick={() => navigate('/settings')}>
                                            <Settings className="w-3.5 h-3.5" /> Chỉnh sửa
                                        </Button>
                                        <Button size="sm" onClick={() => navigate('/')}>
                                            <LayoutDashboard className="w-3.5 h-3.5" /> Tổng quan
                                        </Button>
                                    </div>
                                </div>
                            </TiltCard>

                            {/* Cần xử lý — tone hồng (việc đang chờ) */}
                            <LiftCard tone="rose" watermark={Inbox} className="p-5 sm:p-6 flex flex-col">
                                <CardHeading
                                    tone="rose"
                                    icon={Inbox}
                                    title="Cần xử lý"
                                    subtitle="Việc đang chờ bạn trên toàn hệ thống"
                                    right={<span className={cn('px-2 py-1 rounded-lg text-[11px] font-bold tabular-nums', pending > 0 ? TONES.rose.soft : TONES.emerald.soft)}>{pending}</span>}
                                    className="mb-4"
                                />
                                <ul className="space-y-2 flex-1">
                                    {[
                                        { icon: MessageCircleQuestionMark, label: 'Câu hỏi chưa trả lời', value: data.system.pendingQuestions, tone: 'rose' as const },
                                        { icon: Star,                      label: 'Review thấp chưa phản hồi', value: data.system.pendingLowReviews, tone: 'amber' as const },
                                        { icon: AlertTriangle,             label: 'Khóa chưa có bài test', value: data.system.coursesWithoutTest, tone: 'amber' as const },
                                    ].map((r) => (
                                        <li key={r.label}>
                                            <button
                                                onClick={() => navigate('/')}
                                                className="group/row w-full flex items-center gap-3 rounded-xl border border-line-2 px-3 py-2.5 text-left transition-colors hover:bg-surface-2"
                                            >
                                                <span className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', r.value > 0 ? TONES[r.tone].soft : 'bg-surface-2 text-fg-subtle')}>
                                                    <r.icon className="w-4 h-4" />
                                                </span>
                                                <span className="flex-1 text-sm font-medium text-fg-2">{r.label}</span>
                                                <span className={cn('text-sm font-bold tabular-nums', r.value > 0 ? TONES[r.tone].text : 'text-fg-subtle')}>{r.value}</span>
                                                <ArrowRight className="w-3.5 h-3.5 text-fg-subtle opacity-0 -translate-x-1 transition-all group-hover/row:opacity-100 group-hover/row:translate-x-0" />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                                {pending === 0 && <p className="mt-3 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium text-center">Mọi thứ đã xong. Tuyệt!</p>}
                            </LiftCard>
                        </div>

                        {/* ── Đóng góp · Hệ thống · Lối tắt ── */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <motion.div variants={card} className="grid grid-cols-2 gap-3 content-start">
                                <StatTile tone="primary" icon={BookOpen}           label="Khóa đã tạo"     value={data.contribution.coursesCreated} sub={`${data.contribution.lessonsInMyCourses} bài`} />
                                <StatTile tone="sky"     icon={FileText}           label="Bài viết"        value={data.contribution.articlesWritten} />
                                <StatTile tone="emerald" icon={MessageSquareReply} label="Câu trả lời"     value={data.contribution.answersGiven} />
                                <StatTile tone="rose"    icon={Star}               label="Phản hồi review" value={data.contribution.reviewRepliesGiven} />
                            </motion.div>

                            {/* Hệ thống — tone tím brand */}
                            <LiftCard tone="primary" watermark={LayoutDashboard} className="p-6">
                                <CardHeading tone="primary" icon={LayoutDashboard} title="Hệ thống" subtitle="Toàn nền tảng, tính đến hôm nay" className="mb-4" />
                                <ul className="space-y-2.5">
                                    {[
                                        { icon: Users,         label: 'Học viên',         value: data.system.learners },
                                        { icon: GraduationCap, label: 'Lượt ghi danh',    value: data.system.enrollments },
                                        { icon: BookOpen,      label: 'Khóa đang mở',     value: data.system.activeCourses, sub: `/ ${data.system.courses}` },
                                        { icon: Award,         label: 'Chứng chỉ đã cấp', value: data.system.certificatesIssued },
                                    ].map((r) => (
                                        <li key={r.label} className="flex items-center gap-3 text-sm">
                                            <span className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0', TONES.primary.soft)}><r.icon className="w-3.5 h-3.5" /></span>
                                            <span className="flex-1 text-fg-2">{r.label}</span>
                                            <span className="font-bold text-fg tabular-nums">{fmtInt(r.value)}{r.sub && <span className="text-[11px] font-medium text-fg-subtle ml-1">{r.sub}</span>}</span>
                                        </li>
                                    ))}
                                </ul>
                                <Button variant="ghost" size="sm" onClick={() => navigate('/')} className={cn('mt-4 w-full', TONES.primary.text)}>
                                    Xem dashboard đầy đủ <ArrowRight className="w-3.5 h-3.5" />
                                </Button>
                            </LiftCard>

                            {/* Lối tắt — tone hổ phách (công cụ) */}
                            <LiftCard tone="amber" watermark={Wrench} className="md:col-span-2 lg:col-span-1 p-6">
                                <CardHeading tone="amber" icon={Wrench} title="Lối tắt quản trị" subtitle="Đi thẳng tới việc hay làm" className="mb-4" />
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { icon: Plus,        label: 'Tạo khóa học',     to: '/management',              primary: true },
                                        { icon: ShieldCheck, label: 'Xác minh chứng chỉ', to: '/management/certificates' },
                                        { icon: Code2,       label: 'Ngôn ngữ',         to: '/management/languages' },
                                        { icon: Layers,      label: 'Framework',        to: '/management/frameworks' },
                                        { icon: FileText,    label: 'Bài viết',         to: '/articles' },
                                        { icon: Award,       label: 'Chứng chỉ',        to: '/management/certificates' },
                                    ].map((s) => (
                                        <button
                                            key={s.label}
                                            onClick={() => navigate(s.to)}
                                            className={cn(
                                                'group/sc flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold text-left transition-all active:scale-[0.98]',
                                                s.primary
                                                    ? 'text-white bg-gradient-to-r from-amber-500 to-orange-500 shadow-[0_8px_18px_-8px_rgb(245_158_11/0.7)] hover:brightness-110'
                                                    : 'border border-line-2 text-fg-2 hover:border-amber-300/70 hover:bg-amber-50/50 dark:hover:bg-amber-500/5',
                                            )}
                                        >
                                            <s.icon className="w-4 h-4 flex-shrink-0 transition-transform group-hover/sc:scale-110" />
                                            <span className="truncate">{s.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </LiftCard>
                        </div>

                        {/* ── Contribution graph (quản trị) ── */}
                        <motion.section variants={card} whileHover={{ y: -5, transition: { type: 'spring', stiffness: 300, damping: 20 } }}>
                            <ContributionGraph
                                contributions={contributionData}
                                title="Hoạt động quản trị — 365 ngày"
                                describe={describeAdmin}
                                subtitle={
                                    <>
                                        <span className="font-semibold text-fg-2">{fmtInt(data.activity.totalActions)}</span> hành động
                                        <span className="mx-1.5 text-fg-subtle">·</span>
                                        <span className="font-semibold text-fg-2">{data.activity.activeDays}</span> ngày làm việc
                                        <span className="mx-1.5 text-fg-subtle">·</span>
                                        chuỗi dài nhất <span className="font-semibold text-fg-2">{data.activity.longestStreak}</span> ngày
                                    </>
                                }
                            />
                        </motion.section>

                        {/* ── Khóa của tôi · Hành động gần đây ── */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <LiftCard tone="primary" watermark={BookOpen} className="p-6">
                                <CardHeading
                                    tone="primary"
                                    icon={BookOpen}
                                    title="Khóa học của tôi"
                                    subtitle="Do bạn tạo · mới nhất ở trên"
                                    right={<span className={cn('px-2 py-1 rounded-lg text-[11px] font-bold tabular-nums', TONES.primary.soft)}>{data.contribution.coursesCreated}</span>}
                                    className="mb-4"
                                />
                                {data.myCourses.length === 0 ? (
                                    <div className="py-6 text-center">
                                        <p className="text-sm text-fg-subtle">Bạn chưa tạo khóa học nào.</p>
                                        <p className="text-[11px] text-fg-subtle mt-1">Khóa tạo từ giờ sẽ được gắn với tài khoản của bạn.</p>
                                    </div>
                                ) : (
                                    <ul className="space-y-2">
                                        {data.myCourses.map((c) => (
                                            <li key={c.id}>
                                                <button
                                                    onClick={() => navigate(`/management/courses/${c.id}/lessons`)}
                                                    className="group/c w-full flex items-center gap-3 rounded-xl border border-line-2 p-3 text-left transition-colors hover:border-primary-300/70 hover:bg-primary-50/40 dark:hover:bg-primary-500/5"
                                                >
                                                    <span className={cn('w-10 h-10 rounded-xl flex items-center justify-center font-mono text-sm font-black flex-shrink-0', c.isActive ? 'bg-gradient-to-br from-primary-500 to-accent-600 text-white' : 'bg-surface-2 text-fg-subtle')}>
                                                        {c.title.charAt(0)}
                                                    </span>
                                                    <span className="min-w-0 flex-1">
                                                        <span className="flex items-center gap-2">
                                                            <span className="text-sm font-semibold text-fg truncate">{c.title}</span>
                                                            {!c.isActive && <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-fg-subtle"><EyeOff className="w-3 h-3" /> ẩn</span>}
                                                            {c.lessonCount === 0 && <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">chưa có bài</span>}
                                                        </span>
                                                        <span className="block text-[11px] text-fg-subtle mt-0.5 truncate">
                                                            {LEVEL_LABEL[c.level]} · {c.lessonCount} bài · {fmtInt(c.learners)} học viên
                                                            {c.rating > 0 && ` · ★ ${c.rating.toFixed(1)}`}
                                                            {c.updatedAt && ` · sửa ${timeAgo(c.updatedAt)}`}
                                                        </span>
                                                    </span>
                                                    <Eye className="w-4 h-4 text-fg-subtle opacity-0 transition-opacity group-hover/c:opacity-100 flex-shrink-0" />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </LiftCard>

                            <LiftCard tone="rose" watermark={Activity} className="p-6">
                                <CardHeading tone="rose" icon={Activity} title="Hành động gần đây" subtitle="Tạo/sửa khóa, bài viết, trả lời, phản hồi" className="mb-4" />
                                {data.recent.length === 0 ? (
                                    <p className="text-sm text-fg-subtle py-6 text-center">Chưa có hành động nào được ghi nhận.</p>
                                ) : (
                                    <ol>
                                        {data.recent.map((e, i) => {
                                            const m = ACTION_META[e.kind];
                                            const last = i === data.recent.length - 1;
                                            const to = e.kind === 'article' ? '/articles'
                                                : e.kind === 'answer' && e.courseId && e.lessonId ? `/courses/${e.courseId}/learn/${e.lessonId}`
                                                : e.courseId ? `/management/courses/${e.courseId}/lessons` : '/management';
                                            return (
                                                <motion.li
                                                    key={`${e.kind}-${e.at}-${i}`}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    whileInView={{ opacity: 1, x: 0 }}
                                                    viewport={{ once: true }}
                                                    transition={{ delay: i * 0.05 }}
                                                    className="relative flex gap-3 pb-3.5 last:pb-0"
                                                >
                                                    {!last && <span className="absolute left-[15px] top-8 bottom-0 w-px bg-line" aria-hidden />}
                                                    <span className={cn('relative z-10 w-8 h-8 rounded-full border border-line flex items-center justify-center flex-shrink-0', m.cls)}>
                                                        <m.icon className="w-3.5 h-3.5" />
                                                    </span>
                                                    <button onClick={() => navigate(to)} className="min-w-0 flex-1 pt-1 text-left group/r">
                                                        <p className="text-sm text-fg-2 leading-snug">
                                                            <span className="font-semibold text-fg">{m.label}</span> · <span className="group-hover/r:text-primary-600 dark:group-hover/r:text-primary-300 transition-colors">{e.title}</span>
                                                        </p>
                                                        <p className="text-[11px] text-fg-subtle mt-0.5">{timeAgo(e.at)}</p>
                                                    </button>
                                                </motion.li>
                                            );
                                        })}
                                    </ol>
                                )}
                            </LiftCard>
                        </div>
                    </>
                )}
            </motion.div>
        </main>
    );
};

export default AdminProfilePage;
