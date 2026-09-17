import React from 'react';
import { Level, type CourseLevelLabel } from '../../../types/course';
import { cn } from '../../../lib/cn';

/** Màu + số "vạch" cho từng cấp độ — dùng chung cho filter, vé khóa học, badge. */
export const LEVEL_META: Record<CourseLevelLabel, { meter: 1 | 2 | 3; color: string }> = {
    Beginner:     { meter: 1, color: '#10B981' },
    Intermediate: { meter: 2, color: '#F59E0B' },
    Advanced:     { meter: 3, color: '#F43F5E' },
};

export const LEVELS = Object.keys(LEVEL_META) as CourseLevelLabel[];

/** BE trả string ("Beginner"); code cũ có thể còn truyền số enum → quy về label. */
export const toLevelLabel = (l: unknown): CourseLevelLabel => {
    if (typeof l === 'string' && l in LEVEL_META) return l as CourseLevelLabel;
    if (typeof l === 'number') return (Level[l] as CourseLevelLabel) ?? 'Beginner';
    return 'Beginner';
};

/**
 * "Thanh tín hiệu" cấp độ: 3 vạch cao dần, tô màu tới mức tương ứng.
 * `muted` để vạch chưa tô mờ hơn (dùng trên nút chưa chọn).
 */
export const LevelMeter: React.FC<{ level: CourseLevelLabel; className?: string; muted?: boolean }> = ({ level, className, muted }) => {
    const { meter, color } = LEVEL_META[level];
    return (
        <span className={cn('inline-flex items-end gap-[2px] h-[11px]', className)} aria-hidden>
            {[1, 2, 3].map((i) => (
                <span
                    key={i}
                    className={cn('w-[3px] rounded-[1px] transition-colors', i > meter && (muted ? 'bg-fg-subtle/30' : 'bg-fg-subtle/50'))}
                    style={{ height: `${i * 3 + 2}px`, background: i <= meter ? color : undefined }}
                />
            ))}
        </span>
    );
};
