import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertTriangle, XCircle, ArrowRight, TrendingDown, HelpCircle } from 'lucide-react';
import { Tooltip } from '../../../components/ui/Tooltip';
import { cn } from '../../../lib/cn';
import { DashCard, CardTitle, CardBody, Bar, fmtInt } from './shared';
import { useDashboard } from './data';

const Empty: React.FC<{ text: string }> = ({ text }) => (
    <p className="py-8 text-center text-sm text-fg-subtle">{text}</p>
);

/* ── Ngưỡng trạng thái: màu + icon + nhãn (không bao giờ chỉ màu) ── */
const status = (pct: number) =>
    pct >= 80
        ? { icon: CheckCircle2,  label: 'Tốt',       cls: 'text-emerald-600 dark:text-emerald-400', bar: 'rgb(16 185 129)' }
        : pct >= 60
        ? { icon: AlertTriangle, label: 'Cần xem',   cls: 'text-amber-600 dark:text-amber-400',     bar: 'rgb(245 158 11)' }
        : { icon: XCircle,       label: 'Báo động',  cls: 'text-rose-600 dark:text-rose-400',       bar: 'rgb(244 63 94)' };

/** Tỉ lệ đạt bài kiểm tra cuối khóa — cột trạng thái, bấm vào khóa để sửa nội dung. */
export const PassRateCard: React.FC = () => {
    const navigate = useNavigate();
    const { passRates } = useDashboard();
    const avg = passRates.length ? Math.round(passRates.reduce((s, p) => s + p.passRate, 0) / passRates.length) : 0;
    const bad = passRates.filter((p) => p.passRate < 60).length;

    return (
        <DashCard className="h-full">
            <CardTitle
                title="Tỉ lệ đạt test cuối khóa"
                description={passRates.length ? `Trung bình ${avg}% · ${bad} khóa dưới ngưỡng 60%` : 'Cần ít nhất 5 lượt làm bài / khóa'}
            />
            <CardBody>
                {passRates.length === 0 && <Empty text="Chưa đủ lượt làm bài kiểm tra để thống kê." />}
                <ol className="space-y-3">
                    {passRates.map((p, i) => {
                        const s = status(p.passRate);
                        return (
                            <li key={p.courseId}>
                                <button onClick={() => navigate(`/management/courses/${p.courseId}/lessons`)} className="group w-full text-left">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <Tooltip content={s.label} side="left">
                                            <span className={cn('flex-shrink-0', s.cls)} aria-label={s.label}><s.icon className="w-3.5 h-3.5" /></span>
                                        </Tooltip>
                                        <span className="flex-1 min-w-0 text-sm font-medium text-fg-2 truncate transition-colors group-hover:text-primary-600 dark:group-hover:text-primary-300">{p.title}</span>
                                        <span className="text-[11px] text-fg-subtle tabular-nums">{fmtInt(p.attempts)} lượt</span>
                                        <span className={cn('w-10 text-right text-sm font-semibold tabular-nums', s.cls)}>{p.passRate}%</span>
                                    </div>
                                    <Bar pct={p.passRate} color={s.bar} delay={0.15 + i * 0.05} className="ml-[22px] w-auto" height={6} />
                                </button>
                            </li>
                        );
                    })}
                </ol>
            </CardBody>
        </DashCard>
    );
};

/** Bài học học viên bỏ dở nhiều nhất — vị trí trong khóa + % rơi. */
export const DropOffCard: React.FC = () => {
    const navigate = useNavigate();
    const { dropOffs } = useDashboard();
    return (
        <DashCard className="h-full">
            <CardTitle
                title="Điểm rơi trong khóa"
                description="Bài học có nhiều học viên dừng lại nhất"
                action={<span className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-300 flex items-center justify-center"><TrendingDown className="w-4 h-4" /></span>}
            />
            <CardBody>
                {dropOffs.length === 0 && <Empty text="Chưa đủ dữ liệu tiến độ để tìm điểm rơi." />}
                <ol className="space-y-2">
                    {dropOffs.map((d, i) => (
                        <motion.li
                            key={`${d.courseId}-${d.lessonIndex}`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 + i * 0.06, duration: 0.35 }}
                        >
                            <button
                                onClick={() => navigate(`/management/courses/${d.courseId}/lessons`)}
                                className="group w-full flex items-center gap-3 rounded-xl px-2.5 py-2 -mx-2.5 text-left transition-colors hover:bg-surface-2"
                            >
                                <span className="flex-shrink-0 w-11 text-center">
                                    <span className="block text-base font-bold tabular-nums text-rose-600 dark:text-rose-400 leading-none">{d.dropPct}%</span>
                                    <span className="block text-[9px] uppercase tracking-wider text-fg-subtle mt-0.5">rơi</span>
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-fg truncate">{d.lessonTitle}</p>
                                    <p className="text-[11px] text-fg-muted truncate">{d.title}</p>
                                    {/* Vị trí bài trong khóa */}
                                    <div className="mt-1.5 flex items-center gap-2">
                                        <div className="flex-1 h-1 rounded-full bg-surface-2 relative overflow-hidden">
                                            <div className="absolute inset-y-0 left-0 rounded-full bg-fg-subtle/40" style={{ width: `${(d.lessonIndex / d.lessonTotal) * 100}%` }} />
                                            <span className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-surface" style={{ left: `calc(${(d.lessonIndex / d.lessonTotal) * 100}% - 4px)` }} />
                                        </div>
                                        <span className="text-[10px] text-fg-subtle tabular-nums flex-shrink-0">bài {d.lessonIndex}/{d.lessonTotal}</span>
                                    </div>
                                </div>
                                <ArrowRight className="w-3.5 h-3.5 text-fg-subtle opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0 flex-shrink-0" />
                            </button>
                        </motion.li>
                    ))}
                </ol>
            </CardBody>
        </DashCard>
    );
};

/** Câu hỏi quiz bị sai nhiều nhất — dấu hiệu đề sai hoặc bài giảng thiếu. */
export const HardQuestionsCard: React.FC = () => {
    const { hardQuestions } = useDashboard();
    return (
    <DashCard className="h-full">
        <CardTitle
            title="Câu hỏi sai nhiều nhất"
            description="Xem lại đề hoặc bổ sung bài giảng · 90 ngày"
            action={<span className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-300 flex items-center justify-center"><HelpCircle className="w-4 h-4" /></span>}
        />
        <CardBody className="pt-2">
            {hardQuestions.length === 0 && <Empty text="Chưa đủ lượt làm quiz để thống kê." />}
            <table className="w-full text-xs">
                <thead className="text-fg-subtle">
                    <tr>
                        <th className="text-left font-medium py-2 pr-2">Câu hỏi</th>
                        <th className="text-right font-medium py-2 px-2 whitespace-nowrap">% sai</th>
                        <th className="text-right font-medium py-2 pl-2 whitespace-nowrap hidden sm:table-cell">Lượt</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-line-2">
                    {hardQuestions.map((q, i) => (
                        <motion.tr
                            key={q.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 + i * 0.05 }}
                            className="group hover:bg-surface-2/60 transition-colors"
                        >
                            <td className="py-2 pr-2">
                                <p className="text-fg font-medium leading-snug line-clamp-1">{q.question}</p>
                                <p className="text-[10px] text-fg-subtle mt-0.5 truncate">{q.course}</p>
                            </td>
                            <td className="py-2 px-2 text-right align-top">
                                <span className={cn('inline-block min-w-[40px] text-center rounded-md px-1.5 py-0.5 font-semibold tabular-nums',
                                    q.wrongPct >= 60 ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300')}>
                                    {q.wrongPct}%
                                </span>
                            </td>
                            <td className="py-2 pl-2 text-right align-top text-fg-muted tabular-nums hidden sm:table-cell">{fmtInt(q.attempts)}</td>
                        </motion.tr>
                    ))}
                </tbody>
            </table>
        </CardBody>
    </DashCard>
    );
};
