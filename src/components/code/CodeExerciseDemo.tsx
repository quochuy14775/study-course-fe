import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FlaskConical } from 'lucide-react';
import CodeExercisePanel from './CodeExercisePanel';
import { mockExercises } from '../../mockDatas/mockExercises';
import { cn } from '../../lib/cn';

/**
 * Demo bài tập code trong Learn page — dữ liệu mock, đổi ngôn ngữ để xem runner
 * từng loại. Khi có BE: thay bằng exercise của bài học hiện tại, bỏ bộ chọn.
 */
const CodeExerciseDemo: React.FC<{ onPass?: () => void }> = ({ onPass }) => {
    const [id, setId] = useState(mockExercises[0].id);
    const exercise = mockExercises.find((e) => e.id === id) ?? mockExercises[0];

    return (
        <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="space-y-3"
        >
            <div className="flex flex-wrap items-center gap-3">
                <div>
                    <h2 className="text-sm font-bold text-ink-900 leading-tight">Bài tập thực hành</h2>
                    <p className="font-mono text-[11px] text-ink-400 mt-0.5"><span className="select-none">{'// '}</span>chạy ngay trong trình duyệt, không cần server</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-1.5 h-6 rounded-md border border-amber-200 bg-amber-50 text-amber-700 font-mono text-[11px] font-medium">
                        <FlaskConical className="w-3 h-3" /> demo
                    </span>
                    <div role="tablist" aria-label="Ngôn ngữ demo" className="inline-flex items-center h-8 p-0.5 rounded-lg border border-ink-200 bg-white">
                        {mockExercises.map((e) => {
                            const active = e.id === id;
                            return (
                                <button
                                    key={e.id}
                                    role="tab"
                                    aria-selected={active}
                                    onClick={() => setId(e.id)}
                                    className={cn('relative h-7 px-2.5 rounded-md font-mono text-[11px] font-semibold transition-colors', active ? 'text-white' : 'text-ink-500 hover:text-ink-800')}
                                >
                                    {active && (
                                        <motion.span layoutId="exercise-lang-pill" className="absolute inset-0 rounded-md bg-gradient-to-r from-primary-600 to-accent-600" transition={{ type: 'spring', stiffness: 500, damping: 36 }} />
                                    )}
                                    <span className="relative">{e.fileName.split('.').pop()}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <CodeExercisePanel exercise={exercise} onPass={onPass} />
        </motion.section>
    );
};

export default CodeExerciseDemo;
