import React from 'react';
import { FolderTree, BookOpen, Clock, AlertCircle } from 'lucide-react';
import { useCourseStats, formatDuration } from '../../../../hooks/useCourseStats';

interface Props {
    courseId: number | string;
    /** Compact mode for inline list display */
    compact?: boolean;
}

const LessonSummary: React.FC<Props> = ({ courseId, compact = false }) => {
    const { chapterCount, lessonCount, totalDurationSec, loading } = useCourseStats(courseId);

    if (loading) {
        return (
            <div className={`flex items-center gap-2 ${compact ? 'text-xs' : 'text-sm'}`}>
                <div className="shimmer h-4 w-20 rounded-md" />
                <div className="shimmer h-4 w-20 rounded-md" />
                <div className="shimmer h-4 w-20 rounded-md" />
            </div>
        );
    }

    const isEmpty = lessonCount === 0;

    // Compact mode — single line of pills (used inside course list cards)
    if (compact) {
        return (
            <div className="flex items-center gap-1.5 flex-wrap">
                {isEmpty ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[11px] font-semibold ring-1 ring-amber-200">
                        <AlertCircle size={10} /> Chưa có bài học
                    </span>
                ) : (
                    <>
                        <StatPill
                            icon={<FolderTree size={10} />}
                            value={chapterCount || 1}
                            label="chương"
                            tone="violet"
                        />
                        <StatPill
                            icon={<BookOpen size={10} />}
                            value={lessonCount}
                            label="bài"
                            tone="primary"
                        />
                        <StatPill
                            icon={<Clock size={10} />}
                            value={formatDuration(totalDurationSec)}
                            tone="ink"
                        />
                    </>
                )}
            </div>
        );
    }

    // Full mode — 3 stat blocks (used in course detail / standalone)
    return (
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <StatBlock
                icon={<FolderTree size={14} />}
                label="Chương"
                value={String(chapterCount || (lessonCount > 0 ? 1 : 0))}
                tone="violet"
            />
            <StatBlock
                icon={<BookOpen size={14} />}
                label="Bài học"
                value={String(lessonCount)}
                tone="primary"
                warn={isEmpty}
            />
            <StatBlock
                icon={<Clock size={14} />}
                label="Thời lượng"
                value={formatDuration(totalDurationSec)}
                tone="ink"
            />
        </div>
    );
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

type Tone = 'primary' | 'violet' | 'ink';

const TONE_PILL: Record<Tone, string> = {
    primary: 'bg-primary-50 text-primary-700',
    violet:  'bg-accent-50 text-accent-700',
    ink:     'bg-ink-100 text-ink-700',
};

const StatPill: React.FC<{ icon: React.ReactNode; value: number | string; label?: string; tone: Tone }> = ({
    icon, value, label, tone,
}) => (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${TONE_PILL[tone]}`}>
        {icon}
        <span className="font-mono">{value}</span>
        {label && <span className="opacity-80">{label}</span>}
    </span>
);

const TONE_BLOCK: Record<Tone, { bg: string; icon: string }> = {
    primary: { bg: 'from-primary-50 to-primary-100/40', icon: 'text-primary-600' },
    violet:  { bg: 'from-accent-50 to-accent-100/40',   icon: 'text-accent-600' },
    ink:     { bg: 'from-ink-100 to-ink-200/40',        icon: 'text-ink-600' },
};

const StatBlock: React.FC<{
    icon: React.ReactNode;
    label: string;
    value: string;
    tone: Tone;
    warn?: boolean;
}> = ({ icon, label, value, tone, warn }) => {
    const t = TONE_BLOCK[tone];
    return (
        <div className={`p-3 rounded-xl bg-gradient-to-br ${warn ? 'from-amber-50 to-amber-100/40 ring-1 ring-amber-200' : t.bg} border border-ink-200`}>
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-500 mb-1">
                <span className={warn ? 'text-amber-600' : t.icon}>{icon}</span>
                <span>{label}</span>
            </div>
            <p className={`text-xl font-extrabold font-mono leading-none ${warn ? 'text-amber-700' : 'text-ink-900'}`}>
                {value}
            </p>
        </div>
    );
};

export default LessonSummary;
