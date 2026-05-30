import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, User, Eye, EyeOff, ArrowRight, BookOpen } from 'lucide-react';
import { authService } from '../services/authService';

const formItem = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 22 } },
};
const formContainer = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

export default function SetupAccountPage() {
    const [searchParams] = useSearchParams();
    const email = searchParams.get('email') ?? '';
    const navigate = useNavigate();

    const [username, setUsername] = useState('');
    const [fullName, setFullName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        setLoading(true);
        try {
            await authService.setupAccount(email, username, password, fullName || undefined);
            navigate('/login?setup=done');
        } catch (err: any) {
            const msg = err.response?.data;
            if (Array.isArray(msg)) setError(msg.join(' '));
            else setError(typeof msg === 'string' ? msg : 'Setup failed. Please try again.');
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
                    <motion.div variants={formContainer} initial="hidden" animate="show">
                        <motion.div variants={formItem} className="mb-8">
                            <h2 className="text-3xl font-bold text-slate-900 mb-2">Set up your account</h2>
                            <p className="text-slate-500 text-sm">
                                Email: <span className="font-semibold text-accent-600">{email}</span>
                            </p>
                        </motion.div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <motion.div variants={formItem}>
                                <label className="block text-sm font-semibold text-slate-900 mb-2">
                                    Username <span className="text-red-500">*</span>
                                </label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-accent-500 transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Choose a username"
                                        className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-300/50 focus:bg-white transition-all duration-200"
                                        value={username}
                                        onChange={e => setUsername(e.target.value)}
                                        required
                                    />
                                </div>
                            </motion.div>

                            <motion.div variants={formItem}>
                                <label className="block text-sm font-semibold text-slate-900 mb-2">
                                    Full Name <span className="text-slate-400 font-normal">(optional)</span>
                                </label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-accent-500 transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Your full name"
                                        className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-300/50 focus:bg-white transition-all duration-200"
                                        value={fullName}
                                        onChange={e => setFullName(e.target.value)}
                                    />
                                </div>
                            </motion.div>

                            <motion.div variants={formItem}>
                                <label className="block text-sm font-semibold text-slate-900 mb-2">
                                    Password <span className="text-red-500">*</span>
                                </label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-accent-500 transition-colors" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Create a password (min 6 chars)"
                                        className="w-full pl-12 pr-12 py-3 rounded-xl border-2 border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-300/50 focus:bg-white transition-all duration-200"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        required
                                        minLength={6}
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </motion.div>

                            <motion.div variants={formItem}>
                                <label className="block text-sm font-semibold text-slate-900 mb-2">
                                    Confirm Password <span className="text-red-500">*</span>
                                </label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-accent-500 transition-colors" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Repeat your password"
                                        className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-300/50 focus:bg-white transition-all duration-200"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </motion.div>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex gap-3"
                                >
                                    <span className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 text-red-600 text-xs font-bold mt-0.5">!</span>
                                    <p className="text-sm text-red-600 font-medium">{error}</p>
                                </motion.div>
                            )}

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
                                    <><div className="w-5 h-5 border-2 border-slate-400 border-t-slate-600 rounded-full animate-spin" /><span>Setting up...</span></>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <span>Complete Setup</span>
                                        <ArrowRight className="w-5 h-5" />
                                    </span>
                                )}
                            </motion.button>
                        </form>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}
