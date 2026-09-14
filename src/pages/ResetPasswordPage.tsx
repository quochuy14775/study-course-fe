import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Mail, Lock, KeyRound, Eye, EyeOff, ArrowRight, BookOpen } from 'lucide-react';
import { authService } from '../services/authService';

type ErrorField = 'email' | 'otp' | 'password' | 'confirmPassword' | null;

const FieldTooltip: React.FC<{ show: boolean; message: string }> = ({ show, message }) => (
    <AnimatePresence>
        {show && (
            <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 top-full mt-2 z-20"
            >
                <div className="relative bg-red-600 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-lg max-w-[260px]">
                    {message}
                    <div className="absolute -top-1 left-4 w-2 h-2 bg-red-600 rotate-45" />
                </div>
            </motion.div>
        )}
    </AnimatePresence>
);

const formItem = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 22 } },
};
const formContainer = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [email, setEmail] = useState(searchParams.get('email') ?? '');
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [errorField, setErrorField] = useState<ErrorField>(null);
    const [success, setSuccess] = useState(false);

    const fail = (field: ErrorField, message: string) => {
        setErrorField(field);
        setError(message);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setErrorField(null);

        if (!EMAIL_PATTERN.test(email)) return fail('email', 'Email không đúng định dạng.');
        if (!/^\d{6}$/.test(otp)) return fail('otp', 'Mã OTP phải gồm đúng 6 chữ số.');
        if (password.length < 6) return fail('password', 'Mật khẩu phải có ít nhất 6 ký tự.');
        if (password !== confirmPassword) return fail('confirmPassword', 'Mật khẩu xác nhận không khớp.');

        setLoading(true);
        try {
            await authService.resetPassword(email, otp, password, confirmPassword);
            setSuccess(true);
            setTimeout(() => navigate('/login?reset=done'), 1500);
        } catch (err: any) {
            const msg = err.response?.data;
            const text = Array.isArray(msg) ? msg.join(' ') : (typeof msg === 'string' ? msg : 'Mã OTP không đúng hoặc đã hết hạn.');
            fail('otp', text);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-500 via-accent-500 to-secondary-500 flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                <div className="flex items-center justify-center gap-3 mb-8">
                    <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center">
                        <BookOpen className="w-7 h-7 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white drop-shadow-lg">EduHub</h1>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 22 }}
                    className="bg-white rounded-3xl shadow-2xl p-8"
                >
                    {success ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center"
                        >
                            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                                <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">Đặt lại mật khẩu thành công!</h2>
                            <p className="text-slate-500">Đang chuyển tới trang đăng nhập...</p>
                        </motion.div>
                    ) : (
                        <motion.div variants={formContainer} initial="hidden" animate="show">
                            <motion.div variants={formItem} className="mb-8">
                                <h2 className="text-3xl font-bold text-slate-900 mb-2">Reset password</h2>
                                <p className="text-slate-500 text-sm">
                                    Nhập mã OTP đã gửi tới email của bạn và mật khẩu mới.
                                </p>
                            </motion.div>

                            <form onSubmit={handleSubmit} noValidate className="space-y-5">
                                <motion.div variants={formItem} className="relative z-10">
                                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                                        Email <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-accent-500 transition-colors" />
                                        <input
                                            type="email"
                                            placeholder="you@example.com"
                                            className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-300/50 focus:bg-white transition-all duration-200"
                                            value={email}
                                            onChange={e => { setEmail(e.target.value); if (errorField === 'email') setError(''); }}
                                            required
                                        />
                                        <FieldTooltip show={errorField === 'email'} message={error} />
                                    </div>
                                </motion.div>

                                <motion.div variants={formItem} className="relative z-10">
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="block text-sm font-semibold text-slate-900">
                                            Mã OTP <span className="text-red-500">*</span>
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => navigate('/login?mode=forgot')}
                                            className="text-sm text-accent-500 hover:text-accent-600 font-medium transition-colors"
                                        >
                                            Gửi lại mã OTP
                                        </button>
                                    </div>
                                    <div className="relative group">
                                        <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-accent-500 transition-colors" />
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={6}
                                            placeholder="123456"
                                            className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 tracking-[0.3em] font-semibold focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-300/50 focus:bg-white transition-all duration-200"
                                            value={otp}
                                            onChange={e => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); if (errorField === 'otp') setError(''); }}
                                            required
                                        />
                                        <FieldTooltip show={errorField === 'otp'} message={error} />
                                    </div>
                                </motion.div>

                                <motion.div variants={formItem} className="relative z-10">
                                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                                        Mật khẩu mới <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-accent-500 transition-colors" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Ít nhất 6 ký tự"
                                            className="w-full pl-12 pr-12 py-3 rounded-xl border-2 border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-300/50 focus:bg-white transition-all duration-200"
                                            value={password}
                                            onChange={e => { setPassword(e.target.value); if (errorField === 'password') setError(''); }}
                                            required
                                            minLength={6}
                                        />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                        <FieldTooltip show={errorField === 'password'} message={error} />
                                    </div>
                                </motion.div>

                                <motion.div variants={formItem} className="relative z-10">
                                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                                        Xác nhận mật khẩu <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-accent-500 transition-colors" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Nhập lại mật khẩu mới"
                                            className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-300/50 focus:bg-white transition-all duration-200"
                                            value={confirmPassword}
                                            onChange={e => { setConfirmPassword(e.target.value); if (errorField === 'confirmPassword') setError(''); }}
                                            required
                                        />
                                        <FieldTooltip show={errorField === 'confirmPassword'} message={error} />
                                    </div>
                                </motion.div>

                                <motion.button
                                    variants={formItem}
                                    type="submit"
                                    disabled={loading}
                                    whileHover={loading ? undefined : { scale: 1.02 }}
                                    whileTap={loading ? undefined : { scale: 0.97 }}
                                    className={`w-full py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 text-lg transition-colors ${
                                        loading
                                            ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-primary-500 to-accent-500 text-white hover:from-primary-600 hover:to-accent-600'
                                    }`}
                                >
                                    {loading ? (
                                        <><div className="w-5 h-5 border-2 border-slate-400 border-t-slate-600 rounded-full animate-spin" /><span>Resetting...</span></>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            <span>Reset password</span>
                                            <ArrowRight className="w-5 h-5" />
                                        </span>
                                    )}
                                </motion.button>
                            </form>
                        </motion.div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
