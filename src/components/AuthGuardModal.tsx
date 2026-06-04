import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, X, BookOpen, Map, Star } from 'lucide-react';

interface AuthGuardModalProps {
    isOpen: boolean;
    onClose: () => void;
    action?: string;
}

const PERKS = [
    { icon: BookOpen, text: 'Truy cập hàng trăm khóa học miễn phí' },
    { icon: Map,      text: 'Tạo lộ trình học tập cá nhân hóa'      },
    { icon: Star,     text: 'Theo dõi tiến độ & nhận chứng chỉ'     },
];

const AuthGuardModal: React.FC<AuthGuardModalProps> = ({
    isOpen,
    onClose,
    action = 'thực hiện hành động này',
}) => {
    const navigate = useNavigate();
    const goLogin  = () => { onClose(); navigate('/login');  };
    const goSignup = () => { onClose(); navigate('/signup'); };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-ink-900/60 backdrop-blur-sm" onClick={onClose} />

                    {/* Sheet / Modal */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 40 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                        className="relative w-full sm:max-w-md bg-white sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden"
                    >
                        {/* Drag handle — mobile only */}
                        <div className="sm:hidden flex justify-center pt-3 pb-1">
                            <div className="w-10 h-1 rounded-full bg-ink-200" />
                        </div>

                        {/* Close btn */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-ink-100 hover:bg-ink-200 flex items-center justify-center transition-colors"
                        >
                            <X size={15} className="text-ink-500" />
                        </button>

                        {/* ── Hero section ── */}
                        <div className="relative overflow-hidden px-6 pt-6 pb-8">
                            {/* Blobs */}
                            <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-primary-100 blur-3xl opacity-60 pointer-events-none" />
                            <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-accent-100 blur-3xl opacity-60 pointer-events-none" />

                            {/* Avatar stack — illustrative */}
                            <div className="relative z-10 flex items-center gap-3 mb-5">
                                <div className="flex -space-x-2.5">
                                    {['A','B','C','D'].map((s, i) => (
                                        <div
                                            key={i}
                                            className="w-9 h-9 rounded-full border-2 border-white shadow-sm overflow-hidden bg-gradient-to-br from-primary-200 to-accent-200 flex items-center justify-center text-xs font-bold text-primary-700"
                                            style={{ zIndex: 4 - i }}
                                        >
                                            <img
                                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${s}`}
                                                alt=""
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-ink-500 font-medium">
                                    <span className="font-bold text-ink-800">12,000+</span> học viên đang học cùng
                                </p>
                            </div>

                            <h2 className="relative z-10 text-2xl font-extrabold text-ink-900 leading-tight mb-2">
                                Tham gia để tiếp tục
                            </h2>
                            <p className="relative z-10 text-sm text-ink-500 leading-relaxed">
                                Đăng nhập hoặc tạo tài khoản để <span className="font-medium text-ink-700">{action}</span>.
                            </p>
                        </div>

                        {/* ── Perks list ── */}
                        <div className="px-6 pb-5">
                            <div className="space-y-2.5">
                                {PERKS.map(({ icon: Icon, text }) => (
                                    <div key={text} className="flex items-center gap-3">
                                        <div className="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                                            <Icon size={14} className="text-primary-600" />
                                        </div>
                                        <span className="text-sm text-ink-600">{text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ── CTA buttons ── */}
                        <div className="px-6 pb-6 space-y-2.5">
                            <motion.button
                                whileHover={{ scale: 1.015 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={goSignup}
                                className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl bg-gradient-to-r from-primary-600 to-accent-600 text-white font-semibold text-sm shadow-glow-primary hover:brightness-105 transition-all"
                            >
                                <UserPlus size={16} />
                                Tạo tài khoản miễn phí
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.015 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={goLogin}
                                className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl border-2 border-ink-200 text-ink-700 font-semibold text-sm hover:border-primary-300 hover:bg-primary-50/50 hover:text-primary-700 transition-all"
                            >
                                <LogIn size={16} />
                                Đăng nhập
                            </motion.button>
                        </div>

                        {/* Safe-area spacer for mobile */}
                        <div className="sm:hidden h-2" />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default AuthGuardModal;
