import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import NumberFlow from '@number-flow/react';
import { ArrowUpRight } from 'lucide-react';
import { TiltCard, Delta, Sparkline, container } from './shared';
import { useDashboard } from './data';
import { RANGE_LABEL } from '../../../mockDatas/mockAdminDashboard';

/** Ô KPI — nghiêng 3D theo chuột, số đếm lại mỗi khi đổi khoảng thời gian. */
const KpiRow: React.FC = () => {
    const navigate = useNavigate();
    const { kpis, range } = useDashboard();

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3 sm:gap-4"
        >
            {kpis.map((k) => (
                <TiltCard key={k.id} className="p-4" onClick={k.to ? () => navigate(k.to!) : undefined}>
                    <div className="flex items-start justify-between gap-2">
                        <p className="text-[11px] font-medium text-fg-muted truncate">{k.label}</p>
                        {k.to && (
                            <ArrowUpRight className="w-3.5 h-3.5 text-fg-subtle opacity-0 -translate-y-0.5 translate-x-0.5 transition-all group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0" />
                        )}
                    </div>

                    <NumberFlow
                        value={k.value}
                        suffix={k.suffix ? ` ${k.suffix}` : undefined}
                        format={k.format}
                        locales="vi-VN"
                        className="block mt-1.5 text-[1.6rem] font-bold tracking-tight text-fg leading-none"
                    />

                    <div className="mt-2.5 flex items-end justify-between gap-2">
                        <div className="min-w-0">
                            <Delta pct={k.deltaPct} upIsGood={k.upIsGood} />
                            <p className="text-[10px] text-fg-subtle mt-1 truncate">{k.note ?? `so với ${RANGE_LABEL[range]} trước`}</p>
                        </div>
                        <Sparkline key={`${k.id}-${range}`} data={k.trend} className="flex-shrink-0 -mb-0.5" width={72} height={26} />
                    </div>
                </TiltCard>
            ))}
        </motion.div>
    );
};

export default KpiRow;
