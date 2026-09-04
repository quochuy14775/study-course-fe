import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Crown } from 'lucide-react';
import CheckoutModal from '../components/CheckoutModal';
import { useAuthGuard } from '../hooks/useAuthGuard';
import AuthGuardModal from '../components/AuthGuardModal';
import { pricingPlans, PricingPlan } from '../mockDatas/paymentMock';

const PricingPage: React.FC = () => {
    const { guardOpen, guardAction, closeGuard, requireAuth } = useAuthGuard();
    const [checkoutPlan, setCheckoutPlan] = useState<PricingPlan | null>(null);

    const selectPlan = (plan: PricingPlan) => {
        if (plan.id === 'free') return;
        requireAuth(() => setCheckoutPlan(plan), `nâng cấp gói ${plan.name}`);
    };

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
            <div className="text-center mb-10">
                <h1 className="text-2xl font-extrabold text-ink-900 mb-2">Chọn gói phù hợp với bạn</h1>
                <p className="text-sm text-ink-500">Nâng cấp Pro để mở khóa toàn bộ khóa học Premium và nhận chứng chỉ hoàn thành.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {pricingPlans.map((plan, i) => (
                    <motion.div
                        key={plan.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className={`relative flex flex-col bg-white rounded-2xl p-6 border ${
                            plan.highlighted ? 'border-primary-400 shadow-[0_0_0_2px_rgb(99_102_241/0.15)]' : 'border-ink-200 shadow-soft'
                        }`}
                    >
                        {plan.badge && (
                            <span className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 text-[10px] font-bold px-3 py-1 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 text-white">
                                <Crown className="w-2.5 h-2.5" /> {plan.badge}
                            </span>
                        )}
                        <h3 className="text-sm font-bold text-ink-900 mb-1">{plan.name}</h3>
                        <p className="text-xs text-ink-500 mb-4">{plan.description}</p>
                        <div className="mb-5">
                            <span className="text-2xl font-extrabold text-ink-900">
                                {plan.price === 0 ? 'Miễn phí' : `${plan.price.toLocaleString('vi-VN')}₫`}
                            </span>
                            <span className="text-xs text-ink-400">{plan.period}</span>
                        </div>
                        <div className="space-y-2 mb-6 flex-1">
                            {plan.features.map((f) => (
                                <div key={f} className="flex items-start gap-2 text-xs text-ink-600">
                                    <Check className="w-3.5 h-3.5 text-code-500 flex-shrink-0 mt-0.5" /> {f}
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => selectPlan(plan)}
                            className={`w-full py-2.5 rounded-xl text-xs font-semibold transition-all ${
                                plan.id === 'free'
                                    ? 'bg-ink-100 text-ink-400 cursor-default'
                                    : plan.highlighted
                                        ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-white hover:brightness-105'
                                        : 'bg-ink-900 text-white hover:bg-ink-800'
                            }`}
                        >
                            {plan.id === 'free' ? 'Gói hiện tại' : 'Nâng cấp ngay'}
                        </button>
                    </motion.div>
                ))}
            </div>

            <AuthGuardModal isOpen={guardOpen} onClose={closeGuard} action={guardAction} />
            {checkoutPlan && (
                <CheckoutModal
                    isOpen={!!checkoutPlan}
                    onClose={() => setCheckoutPlan(null)}
                    title={checkoutPlan.name}
                    price={checkoutPlan.price}
                />
            )}
        </div>
    );
};

export default PricingPage;
