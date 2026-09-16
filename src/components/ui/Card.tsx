import React from 'react';
import { cn } from '../../lib/cn';

/** Khối nội dung chuẩn: nền surface, viền line, bo 2xl. */
export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn('rounded-2xl border border-line bg-surface shadow-card', className)}
            {...props}
        />
    ),
);
Card.displayName = 'Card';

interface CardHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
    title: React.ReactNode;
    description?: React.ReactNode;
    /** Nút / control bên phải tiêu đề */
    action?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ title, description, action, className, ...props }) => (
    <div className={cn('flex items-start justify-between gap-3 px-5 pt-5', className)} {...props}>
        <div className="min-w-0">
            <h3 className="text-sm font-semibold text-fg leading-tight">{title}</h3>
            {description && <p className="text-xs text-fg-muted mt-1">{description}</p>}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
    </div>
);

export const CardBody: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
    <div className={cn('px-5 pb-5', className)} {...props} />
);
