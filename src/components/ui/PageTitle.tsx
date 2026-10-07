import React from 'react';

/** Tiêu đề trang kiểu dev: breadcrumb mono `~/path` + con trỏ nhấp nháy, tiêu đề đậm, slot bên phải. */
export const PageTitle: React.FC<{ path: string; title: string; subtitle?: string; right?: React.ReactNode }> = ({ path, title, subtitle, right }) => (
    <section>
        <div className="flex items-center gap-1 font-mono text-xs text-primary-600 dark:text-primary-300 mb-1.5">
            <span className="text-fg-subtle">~/</span>{path}
            <span className="inline-block w-1.5 h-3 ml-0.5 bg-primary-600 dark:bg-primary-300 animate-blink" aria-hidden />
        </div>
        <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-fg">{title}</h1>
                {subtitle && <p className="text-sm text-fg-muted mt-0.5">{subtitle}</p>}
            </div>
            {right}
        </div>
    </section>
);
