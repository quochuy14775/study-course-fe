import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
    AnimatePresence,
    motion,
    MotionConfig,
    useMotionTemplate,
    useMotionValue,
    useSpring,
    useTransform,
    Variants,
} from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import Cookies from 'js-cookie';
import { authService } from '../services/authService';
import { Mail, Eye, EyeOff, ArrowRight, BookOpen, Award, TrendingUp, Lock, Check, LucideIcon } from 'lucide-react';

// ---- Motion tokens (same feel as PersonalPage) -----------------------------
const spring = { type: 'spring' as const, stiffness: 300, damping: 24, mass: 0.8 };

// Staggered reveal: items rise + un-blur so the form "snaps into focus"
const formContainer: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
};

const formItem: Variants = {
    hidden: { opacity: 0, y: 22, filter: 'blur(8px)' },
    show: {
        opacity: 1, y: 0, filter: 'blur(0px)',
        transition: { type: 'spring', stiffness: 260, damping: 22 },
    },
};

// Directional slide for login <-> register (dir 1 = go to register, -1 = back to login)
const slide: Variants = {
    enter: (dir: number) => ({ x: dir * 72, opacity: 0, scale: 0.97, filter: 'blur(10px)' }),
    center: {
        x: 0, opacity: 1, scale: 1, filter: 'blur(0px)',
        transition: { type: 'spring', stiffness: 240, damping: 26 },
    },
    exit: (dir: number) => ({
        x: dir * -72, opacity: 0, scale: 0.97, filter: 'blur(10px)',
        transition: { duration: 0.26, ease: [0.4, 0, 0.2, 1] },
    }),
};

// Reusable hover for secondary buttons / stat tiles (lift + shadow + slight scale)
const hoverLift = {
    y: -4,
    scale: 1.03,
    boxShadow: '0 14px 30px rgb(15 23 42 / 0.12)',
    transition: spring,
};

// ---- Static glass card: the card itself never moves; only the spotlight glow
// glides after the mouse and a shimmer sweeps across periodically ------------
const SpotlightCard: React.FC<{
    className?: string;
    children: React.ReactNode;
    style?: React.CSSProperties;
}> = ({ className, children, style }) => {
    const x = useMotionValue(0.5);
    const y = useMotionValue(0.5);
    const px = useTransform(useSpring(x, { stiffness: 200, damping: 26 }), [0, 1], ['0%', '100%']);
    const py = useTransform(useSpring(y, { stiffness: 200, damping: 26 }), [0, 1], ['0%', '100%']);
    const spotlight = useMotionTemplate`radial-gradient(380px circle at ${px} ${py}, rgb(139 92 246 / 0.14), transparent 70%)`;

    const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const r = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - r.left) / r.width);
        y.set((e.clientY - r.top) / r.height);
    };
    const reset = () => { x.set(0.5); y.set(0.5); };

    return (
        <motion.div
            onMouseMove={handleMove}
            onMouseLeave={reset}
            style={style}
            initial={{ opacity: 0, filter: 'blur(14px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className={`relative ${className ?? ''}`}
        >
            <motion.div className="pointer-events-none absolute inset-0 z-10 rounded-[inherit]" style={{ background: spotlight }} />
            {/* periodic shimmer sweep */}
            <motion.div
                aria-hidden
                className="pointer-events-none absolute top-0 w-1/3 h-full -skew-x-12 bg-gradient-to-r from-transparent via-white/60 to-transparent"
                animate={{ left: ['-40%', '140%'] }}
                transition={{ duration: 2.8, ease: 'easeInOut', repeat: Infinity, repeatDelay: 5 }}
            />
            {children}
        </motion.div>
    );
};

// ---- Animates its height to match its content (login/register differ) ------
const AutoHeight: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [height, setHeight] = useState<number | 'auto'>('auto');

    useLayoutEffect(() => {
        const el = ref.current;
        if (!el) return;
        setHeight(el.getBoundingClientRect().height);
        const ro = new ResizeObserver(([entry]) => setHeight(entry.contentRect.height));
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    return (
        <motion.div
            initial={false}
            animate={{ height }}
            transition={{ type: 'spring', stiffness: 220, damping: 28 }}
            className="overflow-hidden"
        >
            <div ref={ref} className="relative">{children}</div>
        </motion.div>
    );
};

// ---- Count-up number for the brand stats -----------------------------------
const CountUp: React.FC<{ to: number; suffix?: string; delay?: number }> = ({ to, suffix = '', delay = 0 }) => {
    const mv = useMotionValue(0);
    const sp = useSpring(mv, { stiffness: 60, damping: 20 });
    const [display, setDisplay] = useState('0');

    useEffect(() => {
        const t = setTimeout(() => mv.set(to), delay * 1000);
        return () => clearTimeout(t);
    }, [mv, to, delay]);

    useEffect(() => sp.on('change', (v) => setDisplay(Math.round(v).toLocaleString())), [sp]);

    return <>{display}{suffix}</>;
};

// ---- Input wrapper: icon pop + soft gradient halo on focus -----------------
const Field: React.FC<{ icon: LucideIcon; children: React.ReactNode }> = ({ icon: Icon, children }) => (
    <motion.div className="relative group" whileHover={{ y: -1 }} transition={spring}>
        <div
            aria-hidden
            className="pointer-events-none absolute -inset-[3px] rounded-[16px] bg-gradient-to-r from-primary-500 via-accent-500 to-primary-500 opacity-0 blur-md transition-opacity duration-500 ease-out group-focus-within:opacity-40"
        />
        <div className="relative">
            <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 transition-all duration-300 group-focus-within:text-accent-500 group-focus-within:scale-110" />
            {children}
        </div>
    </motion.div>
);

const inputClass =
    'w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-200 bg-slate-50/60 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-accent-500 focus:bg-white transition-[border-color,background-color] duration-300';

// ---- Primary button: magnetic pull toward cursor + shimmer sweep -----------
const MagneticButton: React.FC<{
    type?: 'submit' | 'button';
    disabled?: boolean;
    className?: string;
    children: React.ReactNode;
    onClick?: () => void;
}> = ({ type = 'button', disabled, className, children, onClick }) => {
    const mx = useMotionValue(0);
    const my = useMotionValue(0);
    const x = useSpring(mx, { stiffness: 220, damping: 18, mass: 0.6 });
    const y = useSpring(my, { stiffness: 220, damping: 18, mass: 0.6 });

    const onMove = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (disabled) return;
        const r = e.currentTarget.getBoundingClientRect();
        mx.set((e.clientX - (r.left + r.width / 2)) * 0.16);
        my.set((e.clientY - (r.top + r.height / 2)) * 0.32);
    };
    const onLeave = () => { mx.set(0); my.set(0); };

    return (
        <motion.button
            type={type}
            disabled={disabled}
            onClick={onClick}
            style={{ x, y }}
            onMouseMove={onMove}
            onMouseLeave={onLeave}
            initial="rest"
            animate="rest"
            whileHover={disabled ? undefined : 'hover'}
            whileTap={disabled ? undefined : 'tap'}
            variants={{
                rest: { scale: 1, boxShadow: '0 10px 24px -8px rgb(99 102 241 / 0.45)' },
                hover: { scale: 1.025, boxShadow: '0 22px 44px -10px rgb(99 102 241 / 0.6)', transition: spring },
                tap: { scale: 0.97 },
            }}
            className={`relative overflow-hidden ${className ?? ''}`}
        >
            <motion.span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                variants={{
                    rest: { x: '-150%', transition: { duration: 0 } },
                    hover: { x: '400%', transition: { duration: 0.75, ease: 'easeInOut' } },
                }}
            />
            <span className="relative flex items-center justify-center gap-2">{children}</span>
        </motion.button>
    );
};

// ---- Animated checkbox (indigo/violet to match the page) --------------------
const RememberCheckbox: React.FC<{ checked: boolean; onChange: (v: boolean) => void }> = ({ checked, onChange }) => (
    <label htmlFor="rememberMe" className="flex items-center gap-3 cursor-pointer select-none group">
        <motion.span
            className={`relative w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors duration-300 ${
                checked ? 'bg-gradient-to-br from-primary-500 to-accent-500 border-transparent' : 'bg-white border-slate-300 group-hover:border-accent-400'
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={spring}
        >
            <input
                id="rememberMe"
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <AnimatePresence>
                {checked && (
                    <motion.span
                        initial={{ scale: 0, rotate: -30 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 30 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                        className="flex"
                    >
                        <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                    </motion.span>
                )}
            </AnimatePresence>
        </motion.span>
        <span className="text-sm text-slate-700 font-medium group-hover:text-slate-900 transition-colors">Remember me for 30 days</span>
    </label>
);

// ---- Tooltip-style field error: overlays below the field instead of pushing layout ----
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

const ErrorBanner: React.FC<{ message: string }> = ({ message }) => (
    <motion.div
        initial={{ opacity: 0, height: 0, x: -10 }}
        animate={{ opacity: 1, height: 'auto', x: [0, -8, 8, -5, 5, 0] }}
        exit={{ opacity: 0, height: 0, transition: { duration: 0.2 } }}
        transition={{ duration: 0.4 }}
        className="overflow-hidden"
    >
        <div className="bg-red-50/80 border-2 border-red-200 rounded-xl p-4 flex gap-3 backdrop-blur-sm">
            <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-red-600 text-sm font-bold">!</span>
            </div>
            <p className="text-sm text-red-600 font-medium">{message}</p>
        </div>
    </motion.div>
);

// Heading with a slow gradient sheen (same trick as PersonalPage h1)
const Heading: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
    <motion.div variants={formItem} className="mb-8">
        <motion.h2
            className="text-4xl font-bold mb-3 bg-gradient-to-r from-slate-900 via-primary-600 to-slate-900 bg-clip-text text-transparent"
            style={{ backgroundSize: '200% auto' }}
            animate={{ backgroundPosition: ['0% center', '200% center'] }}
            transition={{ duration: 7, ease: 'linear', repeat: Infinity }}
        >
            {title}
        </motion.h2>
        <p className="text-slate-600 text-lg">{subtitle}</p>
    </motion.div>
);

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


function LoginCardContent({ onSwitch, onForgot }: { onSwitch: () => void; onForgot: () => void }) {
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
            <Heading title="Welcome Back" subtitle="Sign in to continue your learning journey" />

            <form onSubmit={handleLogin} className="space-y-6">
                <motion.div variants={formItem}>
                    <label htmlFor="login-email" className="block text-sm font-semibold text-slate-900 mb-3">
                        Email Address
                    </label>
                    <Field icon={Mail}>
                        <input
                            id="login-email"
                            type="email"
                            placeholder="your@email.com"
                            className={inputClass}
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                    </Field>
                </motion.div>

                <motion.div variants={formItem}>
                    <div className="flex justify-between items-center mb-3">
                        <label htmlFor="login-password" className="block text-sm font-semibold text-slate-900">
                            Password
                        </label>
                        <button type="button" onClick={onForgot} className="text-sm text-accent-500 hover:text-accent-600 font-medium transition-colors">
                            Forgot?
                        </button>
                    </div>
                    <Field icon={Lock}>
                        <input
                            id="login-password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Enter your password"
                            className={`${inputClass} pr-12`}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                        <motion.button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                            transition={spring}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-accent-500 transition-colors"
                        >
                            <AnimatePresence mode="wait" initial={false}>
                                <motion.span
                                    key={showPassword ? 'off' : 'on'}
                                    initial={{ opacity: 0, rotate: -40, scale: 0.6 }}
                                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                                    exit={{ opacity: 0, rotate: 40, scale: 0.6 }}
                                    transition={{ duration: 0.18 }}
                                    className="flex"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </motion.span>
                            </AnimatePresence>
                        </motion.button>
                    </Field>
                </motion.div>

                <motion.div variants={formItem}>
                    <RememberCheckbox checked={rememberMe} onChange={setRememberMe} />
                </motion.div>

                <AnimatePresence>{error && <ErrorBanner message={error} />}</AnimatePresence>

                <motion.div variants={formItem}>
                    <MagneticButton
                        type="submit" disabled={loading}
                        className={`w-full py-3 px-4 rounded-xl font-semibold transition-colors duration-300 text-lg ${
                            loading
                                ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-primary-500 to-accent-500 text-white hover:from-primary-600 hover:to-accent-600'
                        }`}>
                        {loading ? (
                            <><div className="w-5 h-5 border-2 border-slate-400 border-t-slate-600 rounded-full animate-spin" /><span>Signing in...</span></>
                        ) : (
                            <>
                                <span>Sign In</span>
                                <motion.span animate={{ x: [0, 4, 0] }} transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }} className="flex">
                                    <ArrowRight className="w-5 h-5" />
                                </motion.span>
                            </>
                        )}
                    </MagneticButton>
                </motion.div>
            </form>

            <motion.div variants={formItem} className="relative my-7">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t-2 border-slate-200"></div></div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-3 bg-white text-slate-500 font-medium">Or continue with</span>
                </div>
            </motion.div>

            <motion.div variants={formItem} className="grid grid-cols-2 gap-4">
                <motion.button type="button" whileHover={hoverLift} whileTap={{ scale: 0.96 }} className="py-3 px-4 rounded-xl border-2 border-slate-200 bg-slate-50/50 text-slate-700 font-semibold hover:bg-white hover:border-accent-200 transition-colors duration-300 flex items-center justify-center gap-2 text-sm">
                    <svg width="18" height="18" viewBox="0 0 48 48" fill="none" className="shrink-0">
                        <path d="M44.5 20H24v8.5h11.9C34.8 33.6 30 37.5 24 37.5c-7.5 0-13.5-6-13.5-13.5S16.5 10.5 24 10.5c3.7 0 6.9 1.4 9.3 3.7l6.2-6.2C36.9 4.3 30.9 2 24 2 12.3 2 2.8 11.5 2.8 23.2S12.3 44.5 24 44.5c11.7 0 21.2-9.5 21.2-21.3 0-1.4-.1-2.7-.9-3.2z" fill="#EA4335"/>
                        <path d="M6.1 14.6l7.1 5.2C15 16.1 19.3 13.5 24 13.5c3.7 0 6.9 1.4 9.3 3.7l6.2-6.2C36.9 4.3 30.9 2 24 2 17.9 2 12.5 5.2 9.3 10.3l-3.2 4.3z" fill="#FBBC05"/>
                        <path d="M24 44.5c6 0 11.4-2.3 15.4-6.1l-7.1-5.8c-2.3 1.8-5.3 2.9-8.3 2.9-6 0-11.1-3.9-13-9.3l-7.3 5.6C6.8 36.9 14.6 44.5 24 44.5z" fill="#34A853"/>
                    </svg>
                    <span className="hidden sm:inline">Google</span>
                </motion.button>
                <motion.button type="button" whileHover={hoverLift} whileTap={{ scale: 0.96 }} className="py-3 px-4 rounded-xl border-2 border-slate-200 bg-slate-50/50 text-slate-700 font-semibold hover:bg-white hover:border-accent-200 transition-colors duration-300 flex items-center justify-center gap-2 text-sm">
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
                <motion.div
                    variants={{ hidden: { opacity: 0, scale: 0.4, rotate: -20 }, show: { opacity: 1, scale: 1, rotate: 0, transition: { type: 'spring', stiffness: 320, damping: 16 } } }}
                    className="relative w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6"
                >
                    <motion.span
                        className="absolute inset-0 rounded-full"
                        animate={{ boxShadow: ['0 0 0 0 rgb(34 197 94 / 0.45)', '0 0 0 18px rgb(34 197 94 / 0)'] }}
                        transition={{ duration: 1.8, ease: 'easeOut', repeat: Infinity }}
                    />
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
            <Heading title="Create Account" subtitle="Enter your email to get started" />

            <form onSubmit={handleRegister} className="space-y-5">
                <motion.div variants={formItem}>
                    <label htmlFor="reg-email" className="block text-sm font-semibold text-slate-900 mb-3">
                        Email Address
                    </label>
                    <Field icon={Mail}>
                        <input
                            id="reg-email"
                            type="email"
                            placeholder="your@email.com"
                            className={inputClass}
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                    </Field>
                </motion.div>

                <AnimatePresence>{error && <ErrorBanner message={error} />}</AnimatePresence>

                <motion.div variants={formItem}>
                    <MagneticButton
                        type="submit" disabled={loading}
                        className={`w-full py-3 px-4 rounded-xl font-semibold transition-colors duration-300 text-lg ${
                            loading
                                ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-primary-500 to-accent-500 text-white hover:from-primary-600 hover:to-accent-600'
                        }`}>
                        {loading ? (
                            <><div className="w-5 h-5 border-2 border-slate-400 border-t-slate-600 rounded-full animate-spin" /><span>Sending...</span></>
                        ) : (
                            <>
                                <span>Send Verification Email</span>
                                <motion.span animate={{ x: [0, 4, 0] }} transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }} className="flex">
                                    <ArrowRight className="w-5 h-5" />
                                </motion.span>
                            </>
                        )}
                    </MagneticButton>
                </motion.div>
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

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ForgotCardContent({ onSwitch }: { onSwitch: () => void }) {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [sent, setSent] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!EMAIL_PATTERN.test(email)) {
            setError('Email không đúng định dạng.');
            return;
        }

        setLoading(true);
        try {
            await authService.forgotPassword(email);
            setSent(true);
        } catch (err: any) {
            const msg = err.response?.data;
            if (Array.isArray(msg)) setError(msg.join(' '));
            else setError(typeof msg === 'string' ? msg : 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (sent) {
        return (
            <motion.div variants={formContainer} initial="hidden" animate="show" className="flex flex-col items-center text-center py-8">
                <motion.div
                    variants={{ hidden: { opacity: 0, scale: 0.4, rotate: -20 }, show: { opacity: 1, scale: 1, rotate: 0, transition: { type: 'spring', stiffness: 320, damping: 16 } } }}
                    className="relative w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6"
                >
                    <motion.span
                        className="absolute inset-0 rounded-full"
                        animate={{ boxShadow: ['0 0 0 0 rgb(34 197 94 / 0.45)', '0 0 0 18px rgb(34 197 94 / 0)'] }}
                        transition={{ duration: 1.8, ease: 'easeOut', repeat: Infinity }}
                    />
                    <Mail className="w-10 h-10 text-green-500" />
                </motion.div>
                <motion.h2 variants={formItem} className="text-2xl font-bold text-slate-900 mb-3">Check your email</motion.h2>
                <motion.p variants={formItem} className="text-slate-600 mb-2">
                    Nếu email <span className="font-semibold text-accent-600">{email}</span> tồn tại, chúng tôi đã gửi mã OTP.
                </motion.p>
                <motion.p variants={formItem} className="text-sm text-slate-500 mb-8">
                    Mã có hiệu lực trong 10 phút. Nhập mã trên trang đặt lại mật khẩu để tiếp tục.
                </motion.p>
                <motion.div variants={formItem} className="w-full">
                    <MagneticButton
                        type="button"
                        onClick={() => navigate(`/reset-password?email=${encodeURIComponent(email)}`)}
                        className="w-full py-3 px-4 rounded-xl font-semibold text-lg bg-gradient-to-r from-primary-500 to-accent-500 text-white hover:from-primary-600 hover:to-accent-600"
                    >
                        <span>Tôi đã có mã OTP</span>
                        <ArrowRight className="w-5 h-5" />
                    </MagneticButton>
                </motion.div>
                <motion.p variants={formItem} className="text-slate-600 text-sm font-medium mt-6">
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
            <Heading title="Forgot password?" subtitle="Enter your email to receive a reset OTP" />

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
                <motion.div variants={formItem} className="relative z-10">
                    <label htmlFor="forgot-email" className="block text-sm font-semibold text-slate-900 mb-3">
                        Email Address
                    </label>
                    <Field icon={Mail}>
                        <input
                            id="forgot-email"
                            type="email"
                            placeholder="your@email.com"
                            className={inputClass}
                            value={email}
                            onChange={e => { setEmail(e.target.value); if (error) setError(''); }}
                            required
                        />
                        <FieldTooltip show={!!error} message={error} />
                    </Field>
                </motion.div>

                <motion.div variants={formItem}>
                    <MagneticButton
                        type="submit" disabled={loading}
                        className={`w-full py-3 px-4 rounded-xl font-semibold transition-colors duration-300 text-lg ${
                            loading
                                ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-primary-500 to-accent-500 text-white hover:from-primary-600 hover:to-accent-600'
                        }`}>
                        {loading ? (
                            <><div className="w-5 h-5 border-2 border-slate-400 border-t-slate-600 rounded-full animate-spin" /><span>Sending...</span></>
                        ) : (
                            <>
                                <span>Send OTP</span>
                                <motion.span animate={{ x: [0, 4, 0] }} transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }} className="flex">
                                    <ArrowRight className="w-5 h-5" />
                                </motion.span>
                            </>
                        )}
                    </MagneticButton>
                </motion.div>
            </form>

            <motion.p variants={formItem} className="text-center text-slate-600 text-sm mt-7 font-medium">
                Remembered your password?{' '}
                <button type="button" onClick={onSwitch} className="text-accent-500 hover:text-accent-600 font-bold transition-colors">
                    Sign in
                </button>
            </motion.p>
        </motion.div>
    );
}

const BRAND_STATS = [
    { value: 10, suffix: 'K+', label: 'LEARNERS' },
    { value: 500, suffix: '+', label: 'COURSES' },
    { value: 98, suffix: '%', label: 'HAPPY' },
];

export default function AuthPage() {
    const location = useLocation();
    const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(() => {
        if (location.pathname === '/signup') return 'register';
        if (new URLSearchParams(location.search).get('mode') === 'forgot') return 'forgot';
        return 'login';
    });
    // register/forgot slide in from the right, login slides back in from the left
    const [direction, setDirection] = useState(mode === 'register' ? 1 : -1);
    const goTo = (next: 'login' | 'register' | 'forgot', dir: number) => {
        setDirection(dir);
        setMode(next);
    };

    return (
        <MotionConfig reducedMotion="user">
        <div className="min-h-screen bg-gradient-to-br from-primary-600 via-accent-500 to-accent-800 flex relative overflow-hidden">
            {/* Slowly drifting gradient mesh keeps the backdrop alive */}
            <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{
                    backgroundImage:
                        'radial-gradient(at 20% 20%, rgb(129 140 248 / 0.55) 0px, transparent 50%), radial-gradient(at 80% 30%, rgb(192 132 252 / 0.45) 0px, transparent 50%), radial-gradient(at 50% 90%, rgb(67 56 202 / 0.6) 0px, transparent 55%)',
                    backgroundSize: '160% 160%',
                }}
                animate={{ backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'] }}
                transition={{ duration: 22, ease: 'easeInOut', repeat: Infinity }}
            />

            {/* Soft light blobs (clipped so the root never gains scrollable overflow) */}
            <div className="absolute inset-0 opacity-25 overflow-hidden">
                <motion.div
                    className="absolute -top-40 -right-40 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl"
                    animate={{ x: [0, -60, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
                    transition={{ duration: 14, ease: 'easeInOut', repeat: Infinity }}
                />
                <motion.div
                    className="absolute -bottom-40 -left-40 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl"
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
                        variants={{ hidden: { opacity: 0, scale: 0.5, rotate: -20, filter: 'blur(10px)' }, show: { opacity: 1, scale: 1, rotate: 0, filter: 'blur(0px)', transition: { type: 'spring', stiffness: 200, damping: 14 } } }}
                    >
                        <motion.div
                            className="w-24 h-24 rounded-3xl bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-xl border-2 border-white/40 flex items-center justify-center shadow-2xl"
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 4, ease: 'easeInOut', repeat: Infinity }}
                            whileHover={{ scale: 1.12, rotate: 6, boxShadow: '0 0 0 12px rgb(255 255 255 / 0.12), 0 24px 48px rgb(30 27 75 / 0.35)', transition: spring }}
                        >
                            <BookOpen className="w-12 h-12 text-white" />
                        </motion.div>
                    </motion.div>

                    <motion.div
                        className="text-center mb-8"
                        variants={{ hidden: { opacity: 0, y: 24, filter: 'blur(8px)' }, show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { type: 'spring', stiffness: 220, damping: 22 } } }}
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
                                variants={{ hidden: { opacity: 0, scale: 0.4, y: 12 }, show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 400, damping: 16 } } }}
                                whileHover={{ scale: 1.18, rotate: 8, y: -4, backgroundColor: 'rgb(255 255 255 / 0.28)', boxShadow: '0 12px 28px rgb(30 27 75 / 0.3)', transition: spring }}
                                whileTap={{ scale: 0.95 }}
                                className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center cursor-pointer"
                            >
                                <Icon className="w-6 h-6 text-white" />
                            </motion.div>
                        ))}
                    </div>

                    <div className="flex gap-8 text-center">
                        {BRAND_STATS.map((s, i) => (
                            <React.Fragment key={s.label}>
                                {i > 0 && <div className="w-px bg-white/20"></div>}
                                <motion.div
                                    variants={{ hidden: { opacity: 0, y: 16, filter: 'blur(6px)' }, show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { type: 'spring', stiffness: 240, damping: 22 } } }}
                                    whileHover={{ scale: 1.12, y: -3, transition: spring }}
                                    className="cursor-default"
                                >
                                    <p className="text-3xl font-black text-white drop-shadow-lg tabular-nums">
                                        <CountUp to={s.value} suffix={s.suffix} delay={0.6 + i * 0.15} />
                                    </p>
                                    <p className="text-xs text-white/70 mt-1 font-semibold">{s.label}</p>
                                </motion.div>
                            </React.Fragment>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Right Side - Form Card */}
            <div className="flex-1 lg:flex-[0.6] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 relative z-10">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <motion.div
                        className="lg:hidden mb-10 text-center"
                        initial={{ opacity: 0, y: -16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ type: 'spring', stiffness: 220, damping: 22 }}
                    >
                        <div className="flex items-center justify-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center">
                                <BookOpen className="w-7 h-7 text-white" />
                            </div>
                            <h1 className="text-3xl font-bold text-white drop-shadow-lg">EduHub</h1>
                        </div>
                    </motion.div>

                    {/* Static glass card; content cross-slides between login and register */}
                    <SpotlightCard
                        className="bg-white/95 backdrop-blur-xl rounded-3xl border border-white/30 overflow-hidden lg:bg-white/90"
                        style={{ boxShadow: '0 30px 60px -12px rgb(30 27 75 / 0.45)' }}
                    >
                        <AutoHeight>
                            <AnimatePresence mode="popLayout" initial={false} custom={direction}>
                                <motion.div
                                    key={mode}
                                    custom={direction}
                                    variants={slide}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    className="w-full p-8"
                                >
                                    {mode === 'login' && (
                                        <LoginCardContent
                                            onSwitch={() => goTo('register', 1)}
                                            onForgot={() => goTo('forgot', 1)}
                                        />
                                    )}
                                    {mode === 'register' && <RegisterCardContent onSwitch={() => goTo('login', -1)} />}
                                    {mode === 'forgot' && <ForgotCardContent onSwitch={() => goTo('login', -1)} />}
                                </motion.div>
                            </AnimatePresence>
                        </AutoHeight>
                    </SpotlightCard>

                    {/* Footer */}
                    <motion.p
                        className="text-center text-xs text-white/80 mt-7 drop-shadow-md"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.9, duration: 0.6 }}
                    >
                        By signing in, you agree to our{' '}
                        <Link to="/terms" className="text-white/95 hover:underline font-medium">Terms of Service</Link>
                        {' '}and{' '}
                        <Link to="/privacy" className="text-white/95 hover:underline font-medium">Privacy Policy</Link>
                    </motion.p>
                </div>
            </div>
        </div>
        </MotionConfig>
    );
}
