import React from 'react';
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import type { RoadmapStep } from '../types/roadmap';

const DIFFICULTY_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
    Beginner:     { bg: 'bg-code-50',     text: 'text-code-600',    dot: 'bg-code-500' },
    Intermediate: { bg: 'bg-amber-50',    text: 'text-amber-700',   dot: 'bg-amber-500' },
    Advanced:     { bg: 'bg-orange-50',   text: 'text-orange-700',  dot: 'bg-orange-500' },
    Expert:       { bg: 'bg-rose-50',     text: 'text-rose-700',    dot: 'bg-rose-500' },
};

interface RoadmapStepCardProps {
    step: RoadmapStep;
    isLast: boolean;
    onStartLearning: (preselect?: { langId: string; frameworkId: string }) => void;
}

const RoadmapStepCard: React.FC<RoadmapStepCardProps> = ({ step, isLast, onStartLearning }) => {
    const handleClick = () => {
        onStartLearning(step.preselect);
    };

    const diff = DIFFICULTY_STYLES[step.difficulty] ?? { bg: 'bg-ink-100', text: 'text-ink-600', dot: 'bg-ink-400' };

    return (
        <div className="flex gap-3 sm:gap-5">
            {/* Timeline connector */}
            <div className="flex flex-col items-center">
                <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-accent-600 rounded-2xl flex items-center justify-center text-white font-extrabold text-lg shadow-glow-primary flex-shrink-0 font-mono">
                        {step.id}
                    </div>
                    <div className="absolute inset-0 rounded-2xl bg-primary-500/30 blur-xl -z-10" />
                </div>
                {!isLast && (
                    <div className="w-0.5 flex-1 mt-3 bg-gradient-to-b from-primary-400 via-accent-300 to-ink-200 min-h-[80px]" />
                )}
            </div>

            {/* Card */}
            <div className="flex-1 pb-8">
                <div className="card-lift bg-white rounded-2xl border border-ink-200 shadow-soft p-4 sm:p-6 group">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3 gap-3">
                        <h2 className="text-xl font-bold text-ink-900 group-hover:text-primary-700 transition-colors">
                            {step.title}
                        </h2>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${diff.bg} ${diff.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${diff.dot}`} />
                            {step.difficulty}
                        </span>
                    </div>

                    <p className="text-ink-600 mb-5 leading-relaxed">{step.description}</p>

                    {/* Topics */}
                    <div className="mb-5">
                        <h3 className="text-xs uppercase tracking-wider font-semibold text-ink-500 mb-3 flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3" />
                            Các chủ đề
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {step.topics.map((topic) => (
                                <div
                                    key={topic}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-ink-50 border border-ink-100 hover:bg-primary-50 hover:border-primary-200 transition-colors"
                                >
                                    <CheckCircle2 className="w-4 h-4 text-primary-600 flex-shrink-0" />
                                    <span className="text-sm text-ink-700">{topic}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CTA */}
                    <button
                        onClick={handleClick}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-accent-600 text-white text-sm font-semibold rounded-xl hover:shadow-glow-primary active:scale-95 transition-all"
                    >
                        Bắt đầu học
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RoadmapStepCard;
