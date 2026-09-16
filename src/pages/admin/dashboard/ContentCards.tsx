import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Award, ArrowRight, Eye, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { cn } from '../../../lib/cn';
import { DashCard, CardTitle, CardBody, timeAgo, fmtInt } from './shared';
import { useDashboard } from './data';

const scoreVariant = (s: number): 'success' | 'primary' | 'warning' => (s >= 90 ? 'success' : s >= 80 ? 'primary' : 'warning');

export const CertificatesCard: React.FC = () => {
    const navigate = useNavigate();
    const { recentCertificates } = useDashboard();
    return (
        <DashCard className="h-full">
            <CardTitle
                title="Chứng chỉ vừa cấp"
                description="Tự động cấp khi đạt bài kiểm tra cuối khóa"
                action={
                    <Button variant="ghost" size="xs" onClick={() => navigate('/management/certificates')} className="text-primary-600 dark:text-primary-300">
                        Tất cả <ArrowRight className="w-3 h-3" />
                    </Button>
                }
            />
            <CardBody className="pt-3">
                {recentCertificates.length === 0 && <p className="py-8 text-center text-sm text-fg-subtle">Chưa có chứng chỉ nào được cấp.</p>}
                <ul className="divide-y divide-line-2">
                    {recentCertificates.map((c, i) => (
                        <motion.li
                            key={c.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 + i * 0.05 }}
                            className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                        >
                            <img
                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(c.userName)}`}
                                alt=""
                                loading="lazy"
                                className="w-9 h-9 rounded-full bg-surface-2 ring-1 ring-line flex-shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-fg truncate">{c.userName}</p>
                                <p className="text-[11px] text-fg-muted truncate">{c.courseTitle}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                <Badge variant={scoreVariant(c.scorePercentage)} size="sm" className="normal-case tracking-normal">
                                    <Award className="w-3 h-3" /> {c.scorePercentage}
                                </Badge>
                                <span className="text-[10px] text-fg-subtle">{timeAgo(c.issuedAt)}</span>
                            </div>
                        </motion.li>
                    ))}
                </ul>
            </CardBody>
        </DashCard>
    );
};

export const ArticlesCard: React.FC = () => {
    const navigate = useNavigate();
    const { topArticles, source } = useDashboard();
    const max = Math.max(1, ...topArticles.map((a) => a.views));
    return (
        <DashCard className="h-full">
            <CardTitle
                title="Bài viết được đọc nhiều"
                description={source === 'api' ? 'Tổng lượt xem' : 'Lượt xem 30 ngày · so với 30 ngày trước'}
                action={
                    <Button variant="ghost" size="xs" onClick={() => navigate('/articles')} className="text-primary-600 dark:text-primary-300">
                        Bài viết <ArrowRight className="w-3 h-3" />
                    </Button>
                }
            />
            <CardBody className="pt-3">
                {topArticles.length === 0 && <p className="py-8 text-center text-sm text-fg-subtle">Chưa có bài viết nào.</p>}
                <ol className="space-y-2.5">
                    {topArticles.map((a, i) => {
                        const up = (a.deltaPct ?? 0) >= 0;
                        const DIcon = up ? ArrowUpRight : ArrowDownRight;
                        return (
                            <motion.li
                                key={a.id}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 + i * 0.05 }}
                                className="group relative flex items-center gap-3 rounded-lg px-2 py-1.5 -mx-2 hover:bg-surface-2 transition-colors cursor-pointer"
                                onClick={() => navigate('/articles')}
                            >
                                {/* Nền thanh giá trị mờ phía sau — đọc được thứ hạng mà không cần cột riêng */}
                                <span className="absolute inset-y-0 left-0 rounded-lg bg-primary-500/[0.06] dark:bg-primary-500/10 pointer-events-none" style={{ width: `${(a.views / max) * 100}%` }} />
                                <span className="relative w-4 text-[11px] font-semibold text-fg-subtle tabular-nums">{i + 1}</span>
                                <span className="relative flex-1 min-w-0 text-sm text-fg-2 truncate group-hover:text-fg">{a.title}</span>
                                {a.deltaPct != null && (
                                    <span className={cn('relative inline-flex items-center gap-0.5 text-[10px] font-semibold tabular-nums', up ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
                                        <DIcon className="w-3 h-3" />{Math.abs(a.deltaPct)}%
                                    </span>
                                )}
                                <span className="relative inline-flex items-center gap-1 text-xs font-semibold text-fg tabular-nums w-16 justify-end">
                                    <Eye className="w-3 h-3 text-fg-subtle" /> {fmtInt(a.views)}
                                </span>
                            </motion.li>
                        );
                    })}
                </ol>
            </CardBody>
        </DashCard>
    );
};
