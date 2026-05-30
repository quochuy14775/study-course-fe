import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, Variants } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import Cookies from 'js-cookie';
import { authService } from '../services/authService';
import { Mail, Eye, EyeOff, ArrowRight, BookOpen, Award, TrendingUp, Lock } from 'lucide-react';

// ---- Shared animation variants -------------------------------------------
const formContainer: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
};

const formItem: Variants = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 22 } },
};

// ---- Floating light particles drifting upward (pure ambient) --------------
const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    left: `${(i * 53) % 100}%`,
    size: 3 + ((i * 7) % 6),
    delay: (i % 6) * 1.1,
    duration: 9 + (i % 5) * 2.5,
    drift: ((i % 4) - 1.5) * 40,
}));

const FloatingParticles: React.FC = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {PARTICLES.map((p) => (
            <motion.span
                key={p.id}
                className="absolute rounded-full bg-white/40 blur-[1px]"
                style={{ left: p.left, bottom: -20, width: p.size, height: p.size }}
                animate={{
                    y: [0, -800],
                    x: [0, p.drift, 0],
                    opacity: [0, 0.8, 0.8, 0],
                }}
                transition={{ duration: p.duration, delay: p.delay, ease: 'easeInOut', repeat: Infinity }}
            />
        ))}
    </div>
);


function LoginCardContent({ onSwitch }: { onSwitch: () => void }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const token = await authService.login(email, password);
            if (!token) throw new Error('No token received');
            localStorage.setItem('auth-storage', JSON.stringify({ state: { token } }));
            Cookies.set('token', token, { sameSite: 'strict', expires: rememberMe ? 30 : 1 });
            useAuthStore.getState().setToken(token);
            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div variants={formContainer} initial="hidden" animate="show">
            <motion.div variants={formItem} className="mb-8">
                <h2 className="text-4xl font-bold text-slate-900 mb-3">Welcome Back</h2>
                <p className="text-slate-600 text-lg">Sign in to continue your learning journey</p>
            </motion.div>

            <form onSubmit={handleLogin} className="space-y-6">
                <motion.div variants={formItem}>
                    <label htmlFor="login-email" className="block text-sm font-semibold text-slate-900 mb-3">
                        Email Address
                    </label>
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-accent-500 transition-colors" />
                        <input
                            id="login-email"
                            type="email"
                            placeholder="your@email.com"
                            className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-300/50 focus:bg-white transition-all duration-200"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                    </div>
                </motion.div>

                <motion.div variants={formItem}>
                    <div className="flex justify-between items-center mb-3">
                        <label htmlFor="login-password" className="block text-sm font-semibold text-slate-900">
                            Password
                        </label>
                        <Link to="/forgot-password" className="text-sm text-accent-500 hover:text-accent-600 font-medium transition-colors">
                            Forgot?
                        </Link>
                    </div>
                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-accent-500 transition-colors" />
                        <input
                            id="login-password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Enter your password"
                            className="w-full pl-12 pr-12 py-3 rounded-xl border-2 border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-300/50 focus:bg-white transition-all duration-200"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                </motion.div>

                <motion.div variants={formItem} className="flex items-center">
                    <input
                        id="rememberMe"
                        type="checkbox"
                        checked={rememberMe}
                        onChange={e => setRememberMe(e.target.checked)}
                        className="w-5 h-5 rounded-lg border-2 border-slate-300 text-accent-500 focus:ring-2 focus:ring-accent-300/50 cursor-pointer"
                    />
                    <label htmlFor="rememberMe" className="ml-3 text-sm text-slate-700 cursor-pointer font-medium">
                        Remember me for 30 days
                    </label>
                </motion.div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: [0, -8, 8, -5, 5, 0] }}
                        transition={{ duration: 0.4 }}
                        className="bg-red-50/80 border-2 border-red-200 rounded-xl p-4 flex gap-3 backdrop-blur-sm"
                    >
                        <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-red-600 text-sm font-bold">!</span>
                        </div>
                        <p className="text-sm text-red-600 font-medium">{error}</p>
                    </motion.div>
                )}

                <motion.button
                    variants={formItem}
                    type="submit" disabled={loading}
                    whileHover={loading ? undefined : { scale: 1.02, boxShadow: '0 16px 36px rgb(99 102 241 / 0.35)' }}
                    whileTap={loading ? undefined : { scale: 0.97 }}
                    className={`w-full py-3 px-4 rounded-xl font-semibold transition-colors duration-200 flex items-center justify-center gap-2 text-lg ${
                        loading
                            ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-primary-500 to-accent-500 text-white hover:from-primary-600 hover:to-accent-600'
                    }`}>
                    {loading ? (
                        <><div className="w-5 h-5 border-2 border-slate-400 border-t-slate-600 rounded-full animate-spin" /><span>Signing in...</span></>
                    ) : (
                        <motion.span className="flex items-center gap-2">
                            <span>Sign In</span>
                            <motion.span animate={{ x: [0, 4, 0] }} transition={{ duration: 1.4, repeat: Infinity }}>
                                <ArrowRight className="w-5 h-5" />
                            </motion.span>
                        </motion.span>
                    )}
                </motion.button>
            </form>

            <motion.div variants={formItem} className="relative my-7">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t-2 border-slate-200"></div></div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-3 bg-white text-slate-500 font-medium">Or continue with</span>
                </div>
            </motion.div>

            <motion.div variants={formItem} className="grid grid-cols-2 gap-4">
                <motion.button type="button" whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.96 }} className="py-3 px-4 rounded-xl border-2 border-slate-200 bg-slate-50/50 text-slate-700 font-semibold hover:bg-slate-100 hover:border-slate-300 transition-colors flex items-center justify-center gap-2 text-sm">
                    <svg width="18" height="18" viewBox="0 0 48 48" fill="none" className="shrink-0">
                        <path d="M44.5 20H24v8.5h11.9C34.8 33.6 30 37.5 24 37.5c-7.5 0-13.5-6-13.5-13.5S16.5 10.5 24 10.5c3.7 0 6.9 1.4 9.3 3.7l6.2-6.2C36.9 4.3 30.9 2 24 2 12.3 2 2.8 11.5 2.8 23.2S12.3 44.5 24 44.5c11.7 0 21.2-9.5 21.2-21.3 0-1.4-.1-2.7-.9-3.2z" fill="#EA4335"/>
                        <path d="M6.1 14.6l7.1 5.2C15 16.1 19.3 13.5 24 13.5c3.7 0 6.9 1.4 9.3 3.7l6.2-6.2C36.9 4.3 30.9 2 24 2 17.9 2 12.5 5.2 9.3 10.3l-3.2 4.3z" fill="#FBBC05"/>
                        <path d="M24 44.5c6 0 11.4-2.3 15.4-6.1l-7.1-5.8c-2.3 1.8-5.3 2.9-8.3 2.9-6 0-11.1-3.9-13-9.3l-7.3 5.6C6.8 36.9 14.6 44.5 24 44.5z" fill="#34A853"/>
                    </svg>
                    <span className="hidden sm:inline">Google</span>
                </motion.button>
                <motion.button type="button" whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.96 }} className="py-3 px-4 rounded-xl border-2 border-slate-200 bg-slate-50/50 text-slate-700 font-semibold hover:bg-slate-100 hover:border-slate-300 transition-colors flex items-center justify-center gap-2 text-sm">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0">
                        <rect width="24" height="24" rx="4" fill="#1877F2"/>
                        <path d="M15.3 8.5h-1.4c-1.1 0-1.3.5-1.3 1.2v1.7h2.6l-.3 2.6h-2.3V20h-2.8v-6.3H9V11H11v-1.6c0-2 1.2-3.3 3-3.3h1.3v2.4z" fill="#fff"/>
                    </svg>
                    <span className="hidden sm:inline">Facebook</span>
                </motion.button>
            </motion.div>

            <motion.p variants={formItem} className="text-center text-slate-600 text-sm mt-7 font-medium">
                Don't have an account?{' '}
                <button type="button" onClick={onSwitch} className="text-accent-500 hover:text-accent-600 font-bold transition-colors">
                    Sign up
                </button>
            </motion.p>
        </motion.div>
    );
}

function RegisterCardContent({ onSwitch }: { onSwitch: () => void }) {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [sent, setSent] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await authService.register(email);
            setSent(true);
        } catch (err: any) {
            const msg = err.response?.data;
            if (Array.isArray(msg)) setError(msg.join(' '));
            else setError(typeof msg === 'string' ? msg : 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (sent) {
        return (
            <motion.div variants={formContainer} initial="hidden" animate="show" className="flex flex-col items-center text-center py-8">
                <motion.div variants={formItem} className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
                    <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                </motion.div>
                <motion.h2 variants={formItem} className="text-2xl font-bold text-slate-900 mb-3">Check your email</motion.h2>
                <motion.p variants={formItem} className="text-slate-600 mb-2">
                    We sent a verification link to
                </motion.p>
                <motion.p variants={formItem} className="font-semibold text-accent-600 mb-6">{email}</motion.p>
                <motion.p variants={formItem} className="text-sm text-slate-500 mb-8">
                    Click the link in the email to verify your account, then you'll be asked to set up your username and password.
                </motion.p>
                <motion.p variants={formItem} className="text-slate-600 text-sm font-medium">
                    Already have an account?{' '}
                    <button type="button" onClick={onSwitch} className="text-accent-500 hover:text-accent-600 font-bold transition-colors">
                        Sign in
                    </button>
                </motion.p>
            </motion.div>
        );
    }

    return (
        <motion.div variants={formContainer} initial="hidden" animate="show">
            <motion.div variants={formItem} className="mb-8">
                <h2 className="text-4xl font-bold text-slate-900 mb-3">Create Account</h2>
                <p className="text-slate-600 text-lg">Enter your email to get started</p>
            </motion.div>

            <form onSubmit={handleRegister} className="space-y-5">
                <motion.div variants={formItem}>
                    <label htmlFor="reg-email" className="block text-sm font-semibold text-slate-900 mb-3">
                        Email Address
                    </label>
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-accent-500 transition-colors" />
                        <input
                            id="reg-email"
                            type="email"
                            placeholder="your@email.com"
                            className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-300/50 focus:bg-white transition-all duration-200"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                    </div>
                </motion.div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: [0, -8, 8, -5, 5, 0] }}
                        transition={{ duration: 0.4 }}
                        className="bg-red-50/80 border-2 border-red-200 rounded-xl p-4 flex gap-3 backdrop-blur-sm"
                    >
                        <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-red-600 text-sm font-bold">!</span>
                        </div>
                        <p className="text-sm text-red-600 font-medium">{error}</p>
                    </motion.div>
                )}

                <motion.button
                    variants={formItem}
                    type="submit" disabled={loading}
                    whileHover={loading ? undefined : { scale: 1.02, boxShadow: '0 16px 36px rgb(99 102 241 / 0.35)' }}
                    whileTap={loading ? undefined : { scale: 0.97 }}
                    className={`w-full py-3 px-4 rounded-xl font-semibold transition-colors duration-200 flex items-center justify-center gap-2 text-lg ${
                        loading
                            ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-primary-500 to-accent-500 text-white hover:from-primary-600 hover:to-accent-600'
                    }`}>
                    {loading ? (
                        <><div className="w-5 h-5 border-2 border-slate-400 border-t-slate-600 rounded-full animate-spin" /><span>Sending...</span></>
                    ) : (
                        <motion.span className="flex items-center gap-2">
                            <span>Send Verification Email</span>
                            <motion.span animate={{ x: [0, 4, 0] }} transition={{ duration: 1.4, repeat: Infinity }}>
                                <ArrowRight className="w-5 h-5" />
                            </motion.span>
                        </motion.span>
                    )}
                </motion.button>
            </form>

            <motion.p variants={formItem} className="text-center text-slate-600 text-sm mt-7 font-medium">
                Already have an account?{' '}
                <button type="button" onClick={onSwitch} className="text-accent-500 hover:text-accent-600 font-bold transition-colors">
                    Sign in
                </button>
            </motion.p>
        </motion.div>
    );
}

export default function AuthPage() {
    const location = useLocation();
    const [mode, setMode] = useState<'login' | 'register'>(
        location.pathname === '/signup' ? 'register' : 'login'
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-500 via-accent-500 to-secondary-500 flex relative overflow-hidden">
            {/* Animated gradient background overlay */}
            <div className="absolute inset-0 opacity-30">
                <motion.div
                    className="absolute -top-40 -right-40 w-80 h-80 bg-white rounded-full mix-blend-multiply filter blur-3xl"
                    animate={{ x: [0, -60, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
                    transition={{ duration: 14, ease: 'easeInOut', repeat: Infinity }}
                />
                <motion.div
                    className="absolute -bottom-40 -left-40 w-80 h-80 bg-white rounded-full mix-blend-multiply filter blur-3xl"
                    animate={{ x: [0, 70, 0], y: [0, -40, 0], scale: [1, 1.25, 1] }}
                    transition={{ duration: 18, ease: 'easeInOut', repeat: Infinity }}
                />
            </div>

            {/* Ambient floating particles across the whole screen */}
            <FloatingParticles />

            {/* Left Side - Brand Visual */}
            <div className="hidden lg:flex flex-[0.4] relative overflow-hidden items-center justify-center p-12 z-10">
                <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                    <motion.div
                        className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full bg-white/10 backdrop-blur-md border border-white/20"
                        animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
                        transition={{ duration: 6, ease: 'easeInOut', repeat: Infinity }}
                    />
                    <motion.div
                        className="absolute -top-32 -left-32 w-48 h-48 rounded-full bg-white/10 backdrop-blur-md border border-white/20"
                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.9, 0.5] }}
                        transition={{ duration: 7, ease: 'easeInOut', repeat: Infinity, delay: 1 }}
                    />
                    {/* Slowly rotating dashed ring */}
                    <motion.div
                        className="absolute top-1/3 -right-16 w-32 h-32 rounded-full border-2 border-dashed border-white/20"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 30, ease: 'linear', repeat: Infinity }}
                    />
                    {/* Large counter-rotating ring */}
                    <motion.div
                        className="absolute top-1/2 left-1/2 w-[34rem] h-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10"
                        animate={{ rotate: -360 }}
                        transition={{ duration: 60, ease: 'linear', repeat: Infinity }}
                    >
                        <span className="absolute -top-1.5 left-1/2 w-3 h-3 -translate-x-1/2 rounded-full bg-white/50 blur-[1px]" />
                        <span className="absolute top-1/2 -right-1.5 w-2 h-2 -translate-y-1/2 rounded-full bg-white/40" />
                    </motion.div>
                    {/* Sweeping diagonal light beam */}
                    <motion.div
                        className="absolute top-1/4 left-0 w-96 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent rotate-45 origin-left"
                        animate={{ opacity: [0, 0.8, 0], x: [-50, 120, 300] }}
                        transition={{ duration: 5, ease: 'easeInOut', repeat: Infinity, repeatDelay: 2 }}
                    />
                </div>

                <motion.div
                    className="relative z-10 flex flex-col items-center justify-center h-full w-full"
                    variants={{ show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } } }}
                    initial="hidden"
                    animate="show"
                >
                    <motion.div
                        className="mb-12"
                        variants={{ hidden: { opacity: 0, scale: 0.5, rotate: -20 }, show: { opacity: 1, scale: 1, rotate: 0, transition: { type: 'spring', stiffness: 200, damping: 14 } } }}
                    >
                        <motion.div
                            className="w-24 h-24 rounded-3xl bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-xl border-2 border-white/40 flex items-center justify-center shadow-2xl"
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 4, ease: 'easeInOut', repeat: Infinity }}
                            whileHover={{ scale: 1.12, rotate: 6 }}
                        >
                            <BookOpen className="w-12 h-12 text-white" />
                        </motion.div>
                    </motion.div>

                    <motion.div
                        className="text-center mb-8"
                        variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                    >
                        <motion.h1
                            className="text-6xl font-black text-white drop-shadow-xl mb-2 bg-gradient-to-r from-white via-white/70 to-white bg-clip-text"
                            style={{ backgroundSize: '200% auto', WebkitBackgroundClip: 'text' }}
                            animate={{ backgroundPosition: ['0% center', '200% center'] }}
                            transition={{ duration: 6, ease: 'linear', repeat: Infinity }}
                        >
                            EduHub
                        </motion.h1>
                        <p className="text-lg text-white/80 font-semibold tracking-widest drop-shadow-lg">LEARN. GROW. SUCCEED</p>
                    </motion.div>

                    <div className="grid grid-cols-2 gap-6 mb-12">
                        {[BookOpen, TrendingUp, Award, BookOpen].map((Icon, i) => (
                            <motion.div
                                key={i}
                                variants={{ hidden: { opacity: 0, scale: 0.4 }, show: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 400, damping: 16 } } }}
                                whileHover={{ scale: 1.18, rotate: 8, backgroundColor: 'rgb(255 255 255 / 0.25)' }}
                                className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center"
                            >
                                <Icon className="w-6 h-6 text-white" />
                            </motion.div>
                        ))}
                    </div>

                    <div className="flex gap-8 text-center">
                        {[['10K+', 'LEARNERS'], ['500+', 'COURSES'], ['98%', 'HAPPY']].map(([num, label], i) => (
                            <React.Fragment key={label}>
                                {i > 0 && <div className="w-px bg-white/20"></div>}
                                <motion.div
                                    variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}
                                    whileHover={{ scale: 1.1 }}
                                >
                                    <p className="text-3xl font-black text-white drop-shadow-lg">{num}</p>
                                    <p className="text-xs text-white/70 mt-1 font-semibold">{label}</p>
                                </motion.div>
                            </React.Fragment>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Right Side - Sliding Form Card */}
            <div className="flex-1 lg:flex-[0.6] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 relative z-10">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden mb-10 text-center">
                        <div className="flex items-center justify-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center">
                                <BookOpen className="w-7 h-7 text-white" />
                            </div>
                            <h1 className="text-3xl font-bold text-white drop-shadow-lg">EduHub</h1>
                        </div>
                    </div>

                    {/* Form Card with sliding content */}
                    <motion.div
                        initial={{ opacity: 0, y: 30, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 22 }}
                        className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 overflow-hidden lg:bg-white/90"
                    >
                        <div
                            className="flex transition-transform duration-500 ease-in-out"
                            style={{
                                width: '200%',
                                transform: mode === 'login' ? 'translateX(0)' : 'translateX(-50%)',
                            }}
                        >
                            <div className="w-1/2 p-8">
                                <LoginCardContent onSwitch={() => setMode('register')} />
                            </div>
                            <div className="w-1/2 p-8">
                                <RegisterCardContent onSwitch={() => setMode('login')} />
                            </div>
                        </div>
                    </motion.div>

                    {/* Footer */}
                    <p className="text-center text-xs text-white/80 mt-7 drop-shadow-md">
                        By signing in, you agree to our{' '}
                        <Link to="/terms" className="text-white/95 hover:underline font-medium">Terms of Service</Link>
                        {' '}and{' '}
                        <Link to="/privacy" className="text-white/95 hover:underline font-medium">Privacy Policy</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
