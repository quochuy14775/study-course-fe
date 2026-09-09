import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';
import { paymentMethods } from '../mockDatas/paymentMock';
import type { PaymentMethodId } from '../types/payment';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    price: number;
    /** Gọi ngay khi thanh toán xong (trước khi user thấy màn hình success) — dùng để ghi danh. */
    onSuccess?: () => void;
    /** Bấm "Vào học ngay" ở màn hình success. Không truyền thì nút chỉ đóng modal. */
    onEnterCourse?: () => void;
}

/** MOCK: không gọi cổng thanh toán thật — chỉ mô phỏng luồng UI để xem giao diện */
const CheckoutModal: React.FC<Props> = ({ isOpen, onClose, title, price, onSuccess, onEnterCourse }) => {
    const [method, setMethod] = useState<PaymentMethodId>('card');
    const [status, setStatus] = useState<'idle' | 'processing' | 'success'>('idle');

    const reset = () => { setStatus('idle'); setMethod('card'); };
    const close = () => { onClose(); setTimeout(reset, 300); };

    const confirmPayment = () => {
        setStatus('processing');
        setTimeout(() => {
            setStatus('success');
            onSuccess?.();
        }, 1200);
    };

    // Portal thẳng ra body — modal này sẽ được gọi từ trong course card (motion.div có
    // whileHover/overflow-hidden), `fixed` bên trong ancestor có transform bị nhốt trong
    // ancestor đó thay vì phủ viewport nếu không portal ra ngoài.
    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <div className="absolute inset-0 bg-ink-900/60 backdrop-blur-sm" onClick={close} />

                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 40 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                        className="relative w-full sm:max-w-md bg-white sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden"
                    >
                        <button
                            onClick={close}
                            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-ink-100 hover:bg-ink-200 flex items-center justify-center transition-colors"
                        >
                            <X size={15} className="text-ink-500" />
                        </button>

                        {status === 'success' ? (
                            <div className="px-6 pt-10 pb-8 text-center">
                                <CheckCircle2 className="w-12 h-12 text-code-500 mx-auto" />
                                <h2 className="text-xl font-bold text-ink-900 mt-4">Thanh toán thành công</h2>
                                <p className="text-sm text-ink-500 mt-1.5">
                                    Bạn đã mở khóa <span className="font-medium text-ink-700">{title}</span>. Hóa đơn đã được gửi qua email.
                                </p>
                                <button
                                    onClick={() => { close(); onEnterCourse?.(); }}
                                    className="w-full mt-6 py-3 rounded-2xl bg-primary-600 hover:bg-primary-500 text-white font-semibold text-sm transition-all"
                                >
                                    Vào học ngay
                                </button>
                            </div>
                        ) : (
                            <div className="px-6 pt-6 pb-6">
                                <h2 className="text-lg font-bold text-ink-900 mb-1">Xác nhận thanh toán</h2>
                                <p className="text-xs text-ink-500 mb-5">Đây là bản mô phỏng giao diện — chưa kết nối cổng thanh toán thật.</p>

                                <div className="bg-ink-50 rounded-2xl p-4 flex items-center justify-between mb-5">
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-ink-800 truncate">{title}</p>
                                        <p className="text-[11px] text-ink-400">Truy cập trọn đời</p>
                                    </div>
                                    <span className="text-base font-extrabold text-ink-900 flex-shrink-0 ml-3">
                                        {price.toLocaleString('vi-VN')}₫
                                    </span>
                                </div>

                                <p className="text-xs font-semibold text-ink-600 mb-2.5">Chọn phương thức thanh toán</p>
                                <div className="space-y-2 mb-6">
                                    {paymentMethods.map((m) => (
                                        <button
                                            key={m.id}
                                            onClick={() => setMethod(m.id)}
                                            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl border text-left transition-all ${
                                                method === m.id
                                                    ? 'border-primary-400 bg-primary-50'
                                                    : 'border-ink-200 hover:border-primary-200 hover:bg-ink-50'
                                            }`}
                                        >
                                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                                method === m.id ? 'bg-primary-100' : 'bg-ink-100'
                                            }`}>
                                                <CreditCard className={`w-4 h-4 ${method === m.id ? 'text-primary-600' : 'text-ink-400'}`} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold text-ink-800">{m.label}</p>
                                                <p className="text-[11px] text-ink-400">{m.description}</p>
                                            </div>
                                            <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ml-auto ${
                                                method === m.id ? 'border-primary-500 bg-primary-500' : 'border-ink-300'
                                            }`} />
                                        </button>
                                    ))}
                                </div>

                                <motion.button
                                    whileTap={{ scale: 0.97 }}
                                    onClick={confirmPayment}
                                    disabled={status === 'processing'}
                                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-primary-600 to-accent-600 text-white font-semibold text-sm shadow-glow-primary hover:brightness-105 disabled:opacity-60 transition-all"
                                >
                                    {status === 'processing' ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" /> Đang xử lý...
                                        </>
                                    ) : (
                                        `Thanh toán ${price.toLocaleString('vi-VN')}₫`
                                    )}
                                </motion.button>

                                <p className="flex items-center justify-center gap-1.5 text-[11px] text-ink-400 mt-3">
                                    <ShieldCheck className="w-3.5 h-3.5" /> Giao dịch được bảo mật và mã hóa
                                </p>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body,
    );
};

export default CheckoutModal;
