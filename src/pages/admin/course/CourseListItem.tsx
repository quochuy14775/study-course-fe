import React from 'react';
import { motion } from 'framer-motion';
import { Star, Globe, Lock, GitBranch, GitCommitHorizontal, Clock, Ellipsis, Pencil, Trash2, Code2, AlertCircle, FolderGit2 } from 'lucide-react';
import type { CourseUI } from '../../../types/course';
import { useCourseStats, formatDuration } from '../../../hooks/useCourseStats';
import { resolveLanguageBrand, resolveFrameworkBrand, tint, brandText } from '../../../lib/techBrand';
import { timeAgo } from '../../../components/profile/ProfileKit';
import { Tooltip } from '../../../components/ui/Tooltip';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '../../../components/ui/DropdownMenu';
import { cn } from '../../../lib/cn';
import { LEVEL_META, LevelMeter, toLevelLabel } from './levelMeta';

interface Props {
    course: CourseUI;
    onClick?: (id: number) => void;
    onDelete?: (id: number) => void;
    onEdit?: (course: CourseUI) => void;
}

/** Mã "commit" 7 ký tự hex sinh từ id — chỉ để nhận diện nhanh, không có ý nghĩa nghiệp vụ */
export const courseHash = (id: number) => id.toString(16).padStart(7, '0');

/** Chip topic kiểu GitHub: nền nhạt, chữ đậm màu, bo tròn hoàn toàn */
const Topic: React.FC<{ color: string; children: React.ReactNode; title?: string }> = ({ color, children, title }) => (
    <span
        className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[11px] font-semibold whitespace-nowrap"
        style={{ background: tint(color, 14), color: brandText(color) }}
        title={title}
    >
        {children}
    </span>
);

/**
 * Một "repo" trong danh sách: avatar vuông, tên khóa là link + badge Công khai/Ẩn + mã hash,
 * mô tả, topic chips (cấp độ có meter, công nghệ theo brand color), dòng meta kiểu repo
 * (● ngôn ngữ chính · ⑂ chương · ◉ bài · ◷ thời lượng · học phí · cập nhật), menu ⋯ Sửa/Xóa.
 */
const CourseListItem: React.FC<Props> = ({ course, onClick, onDelete, onEdit }) => {
    const levelKey = toLevelLabel(course.level);
    const lvl = LEVEL_META[levelKey];
    const { chapterCount, lessonCount, totalDurationSec, loading: statsLoading } = useCourseStats(course.id);
    const tech = [
        ...(course.languages ?? []).map(l => ({ ...l, kind: 'lang' as const, brand: resolveLanguageBrand(l) })),
        ...(course.frameworks ?? []).map(f => ({ ...f, kind: 'fw' as const, brand: resolveFrameworkBrand(f) })),
    ];
    const primary = tech[0];
    const initial = (course.title || '?').trim().charAt(0).toUpperCase();
    const updated = course.updatedAt ?? course.createdAt;

    return (
        <motion.li
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            onClick={() => onClick?.(course.id)}
            className={cn(
                'group relative flex gap-3 sm:gap-4 px-4 sm:px-5 py-4 cursor-pointer transition-colors',
                'hover:bg-surface-2/40',
                !course.isActive && 'opacity-75 hover:opacity-100',
            )}
        >
            {/* Avatar repo */}
            <div className={cn('relative w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 rounded-lg overflow-hidden ring-1 ring-line bg-surface-2', !course.isActive && 'grayscale')}>
                {course.imageUrl ? (
                    <img
                        src={course.imageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            img.style.display = 'none';
                            (img.nextElementSibling as HTMLElement | null)?.style.setProperty('display', 'flex');
                        }}
                    />
                ) : null}
                <div
                    className="w-full h-full items-center justify-center font-black text-base"
                    style={{ display: course.imageUrl ? 'none' : 'flex', background: `linear-gradient(145deg, ${tint(lvl.color, 30)}, ${tint(lvl.color, 8)})`, color: brandText(lvl.color) }}
                >
                    {initial}
                </div>
                {/* Vạch cấp độ đáy avatar */}
                <span className="absolute inset-x-0 bottom-0 h-[3px]" style={{ background: lvl.color }} aria-hidden />
            </div>

            <div className="flex-1 min-w-0">
                {/* Tên + badge + hash */}
                <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <h3 className="text-[15px] font-semibold text-primary-600 dark:text-primary-300 truncate max-w-full group-hover:underline underline-offset-2 decoration-primary-400/60">
                            {course.title}
                        </h3>
                        {course.isActive ? (
                            <span className="inline-flex items-center gap-1 h-5 px-1.5 rounded-full border border-line text-[10px] font-semibold text-fg-muted">
                                <Globe size={10} /> Công khai
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 h-5 px-1.5 rounded-full border border-amber-300/60 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30 text-[10px] font-semibold">
                                <Lock size={10} /> Ẩn
                            </span>
                        )}
                        {course.isFeatured && (
                            <span className="inline-flex items-center gap-1 h-5 px-1.5 rounded-full bg-amber-400/20 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                                <Star size={10} fill="currentColor" /> Nổi bật
                            </span>
                        )}
                        <span className="font-mono text-[10px] text-fg-subtle tabular-nums" title={`ID ${course.id}`}>#{courseHash(course.id)}</span>
                    </div>

                    {/* Hành động */}
                    <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => onClick?.(course.id)}
                            className="hidden sm:inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-line bg-surface text-xs font-semibold text-fg-2 hover:bg-surface-2 hover:text-fg transition-colors"
                        >
                            <Code2 size={13} /> Giáo trình
                        </button>
                        {(onEdit || onDelete) && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="w-7 h-7 rounded-md border border-line bg-surface text-fg-muted hover:text-fg hover:bg-surface-2 flex items-center justify-center transition-colors" aria-label="Thao tác">
                                        <Ellipsis size={14} />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="min-w-[10rem]">
                                    <DropdownMenuItem onSelect={() => onClick?.(course.id)} className="text-xs py-2"><Code2 size={13} /> Mở giáo trình</DropdownMenuItem>
                                    {onEdit && <DropdownMenuItem onSelect={() => onEdit(course)} className="text-xs py-2"><Pencil size={13} /> Chỉnh sửa</DropdownMenuItem>}
                                    {onDelete && (
                                        <>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem destructive onSelect={() => onDelete(course.id)} className="text-xs py-2"><Trash2 size={13} /> Xóa khóa học</DropdownMenuItem>
                                        </>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </div>

                {course.subtitle && <p className="mt-0.5 text-xs font-medium text-fg-2 truncate">{course.subtitle}</p>}
                <p className="mt-1 text-sm text-fg-muted line-clamp-2 leading-relaxed">
                    {course.description || <span className="italic text-fg-subtle">Chưa có mô tả</span>}
                </p>

                {/* Topics */}
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    <Topic color={lvl.color} title="Cấp độ"><LevelMeter level={levelKey} /> {levelKey}</Topic>
                    {tech.slice(0, 5).map((t) => (
                        <Topic key={`${t.kind}-${t.id}`} color={t.brand.color} title={t.kind === 'lang' ? 'Ngôn ngữ' : 'Framework'}>
                            {t.iconUrl
                                ? <img src={t.iconUrl} alt="" className="w-3 h-3 object-contain" loading="lazy" />
                                : <span className="w-1.5 h-1.5 rounded-full" style={{ background: t.brand.color }} />}
                            {t.name}
                        </Topic>
                    ))}
                    {tech.length > 5 && <span className="text-[11px] text-fg-subtle">+{tech.length - 5}</span>}
                </div>

                {/* Meta kiểu repo */}
                <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-fg-muted">
                    {primary && (
                        <span className="inline-flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full ring-1 ring-black/10" style={{ background: primary.brand.color }} />
                            {primary.name}
                        </span>
                    )}
                    {statsLoading ? (
                        <span className="inline-flex items-center gap-3">
                            <span className="shimmer h-3 w-16 rounded" /><span className="shimmer h-3 w-12 rounded" />
                        </span>
                    ) : lessonCount === 0 ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                            <AlertCircle size={12} /> Chưa có bài học
                        </span>
                    ) : (
                        <>
                            <Tooltip content="Chương" side="top"><span className="inline-flex items-center gap-1"><GitBranch size={12} /> <span className="font-mono tabular-nums text-fg-2">{chapterCount || 1}</span></span></Tooltip>
                            <Tooltip content="Bài học" side="top"><span className="inline-flex items-center gap-1"><GitCommitHorizontal size={12} /> <span className="font-mono tabular-nums text-fg-2">{lessonCount}</span></span></Tooltip>
                            <Tooltip content="Thời lượng" side="top"><span className="inline-flex items-center gap-1"><Clock size={12} /> <span className="font-mono tabular-nums text-fg-2">{formatDuration(totalDurationSec)}</span></span></Tooltip>
                        </>
                    )}
                    <span className={cn('font-mono font-semibold tabular-nums', course.price === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-fg-2')}>
                        {course.price === 0 ? 'FREE' : `${course.price.toLocaleString('vi-VN')} ₫`}
                    </span>
                    {course.instructor && course.instructor !== 'Unknown' && (
                        <span className="inline-flex items-center gap-1"><FolderGit2 size={12} /> <span className="font-mono">@{course.instructor}</span></span>
                    )}
                    <span className="ml-auto" title={new Date(updated).toLocaleString('vi-VN')}>Cập nhật {timeAgo(updated)}</span>
                </div>
            </div>
        </motion.li>
    );
};

export default CourseListItem;
