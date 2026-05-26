import React, { Suspense, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import Cookies from 'js-cookie';
import { authService } from '../services/authService';
import { Lock, Mail, Eye, EyeOff, ArrowRight, BookOpen, Award, TrendingUp } from 'lucide-react';

function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');


    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const token = await authService.login(email, password);
            if (!token) throw new Error('No token received');

            // Lưu localStorage (quan trọng để reload vẫn login)
            localStorage.setItem(
                "auth-storage",
                JSON.stringify({
                    state: { token }
                })
            );

            // Lưu cookie (optional)
            Cookies.set('token', token, {
                secure: true,
                sameSite: 'strict',
                expires: rememberMe ? 30 : undefined
            });

            // 👉 CHỈ cần gọi cái này (store sẽ tự decode)
            useAuthStore.getState().setToken(token);

            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-500 via-accent-500 to-secondary-500 flex relative overflow-hidden">
            {/* Animated gradient background overlay */}
            <div className="absolute inset-0 opacity-30">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-white rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
            </div>

            {/* Left Side - Brand Visual Hero Section */}
            <div className="hidden lg:flex flex-[0.4] relative overflow-hidden items-center justify-center p-12 z-10">                {/* Decorative floating shapes - Abstract visual branding */}
                <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                    {/* Large floating circle - bottom right */}
                    <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full bg-white/10 backdrop-blur-md border border-white/20 animate-pulse"></div>

                    {/* Medium floating circle - top left */}
                    <div className="absolute -top-32 -left-32 w-48 h-48 rounded-full bg-white/10 backdrop-blur-md border border-white/20 animate-pulse" style={{animationDelay: '1s'}}></div>

                    {/* Small floating circle - center right */}
                    <div className="absolute top-1/3 -right-16 w-32 h-32 rounded-full bg-white/5 backdrop-blur-md border border-white/15"></div>

                    {/* Accent diagonal line */}
                    <div className="absolute top-1/4 left-1/4 w-96 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent rotate-45"></div>
                </div>

                {/* Content Container - Centered Visual Elements */}
                <div className="relative z-10 flex flex-col items-center justify-center h-full w-full">
                    {/* Logo with Icon - Large and prominent */}
                    <div className="mb-12 animate-in fade-in duration-700">
                        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-xl border-2 border-white/40 flex items-center justify-center shadow-2xl hover:from-white/40 hover:to-white/15 transition-all duration-500 hover:scale-110">
                            <BookOpen className="w-12 h-12 text-white" />
                        </div>
                    </div>

                    {/* Brand Name - Large Typography */}
                    <div className="text-center mb-8">
                        <h1 className="text-6xl font-black text-white drop-shadow-xl mb-2">EduHub</h1>
                        <p className="text-lg text-white/80 font-semibold tracking-widest drop-shadow-lg">LEARN. GROW. SUCCEED</p>
                    </div>

                    {/* Visual Icon Grid - 4 minimal icons representing core values */}
                    <div className="grid grid-cols-2 gap-6 mb-12">
                        <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center hover:bg-white/25 transition-all duration-300 hover:scale-110">
                            <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center hover:bg-white/25 transition-all duration-300 hover:scale-110">
                            <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center hover:bg-white/25 transition-all duration-300 hover:scale-110">
                            <Award className="w-6 h-6 text-white" />
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center hover:bg-white/25 transition-all duration-300 hover:scale-110">
                            <BookOpen className="w-6 h-6 text-white" />
                        </div>
                    </div>

                    {/* Minimal Stats - Visual focus */}
                    <div className="flex gap-8 text-center">
                        <div className="animate-in fade-in duration-700" style={{animationDelay: '0.1s'}}>
                            <p className="text-3xl font-black text-white drop-shadow-lg">10K+</p>
                            <p className="text-xs text-white/70 mt-1 font-semibold">LEARNERS</p>
                        </div>
                        <div className="w-px bg-white/20"></div>
                        <div className="animate-in fade-in duration-700" style={{animationDelay: '0.2s'}}>
                            <p className="text-3xl font-black text-white drop-shadow-lg">500+</p>
                            <p className="text-xs text-white/70 mt-1 font-semibold">COURSES</p>
                        </div>
                        <div className="w-px bg-white/20"></div>
                        <div className="animate-in fade-in duration-700" style={{animationDelay: '0.3s'}}>
                            <p className="text-3xl font-black text-white drop-shadow-lg">98%</p>
                            <p className="text-xs text-white/70 mt-1 font-semibold">HAPPY</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
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

                    {/* Form Card - Glass Morphism */}
                    <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-8 lg:bg-white/90">
                        {/* Header */}
                        <div className="mb-8">
                            <h2 className="text-4xl font-bold text-slate-900 mb-3">Welcome Back</h2>
                            <p className="text-slate-600 text-lg">Sign in to continue your learning journey</p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleLogin} className="space-y-6">
                            {/* Email Field */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-semibold text-slate-900 mb-3">
                                    Email Address
                                </label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-accent-500 transition-colors" />
                                    <input
                                        id="email"
                                        type="email"
                                        placeholder="your@email.com"
                                        className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-300/50 focus:bg-white transition-all duration-200"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <label htmlFor="password" className="block text-sm font-semibold text-slate-900">
                                        Password
                                    </label>
                                    <Link to="/forgot-password" className="text-sm text-accent-500 hover:text-accent-600 font-medium transition-colors">
                                        Forgot?
                                    </Link>
                                </div>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-accent-500 transition-colors" />
                                    <input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter your password"
                                        className="w-full pl-12 pr-12 py-3 rounded-xl border-2 border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-300/50 focus:bg-white transition-all duration-200"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Remember Me */}
                            <div className="flex items-center">
                                <input
                                    id="rememberMe"
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="w-5 h-5 rounded-lg border-2 border-slate-300 text-accent-500 focus:ring-2 focus:ring-accent-300/50 cursor-pointer"
                                />
                                <label htmlFor="rememberMe" className="ml-3 text-sm text-slate-700 cursor-pointer font-medium">
                                    Remember me for 30 days
                                </label>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="bg-red-50/80 border-2 border-red-200 rounded-xl p-4 flex gap-3 backdrop-blur-sm">
                                    <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-red-600 text-sm font-bold">!</span>
                                    </div>
                                    <p className="text-sm text-red-600 font-medium">{error}</p>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 text-lg ${
                                    loading
                                        ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-primary-500 to-accent-500 text-white hover:shadow-2xl hover:from-primary-600 hover:to-accent-600 active:scale-95'
                                }`}
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-slate-400 border-t-slate-600 rounded-full animate-spin" />
                                        <span>Signing in...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Sign In</span>
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="relative my-7">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t-2 border-slate-200"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-3 bg-white text-slate-500 font-medium">Or continue with</span>
                            </div>
                        </div>

                        {/* Social Login Buttons */}
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                className="py-3 px-4 rounded-xl border-2 border-slate-200 bg-slate-50/50 text-slate-700 font-semibold hover:bg-slate-100 hover:border-slate-300 transition-all flex items-center justify-center gap-2 text-sm"
                            >
                                <span>🔵</span>
                                <span className="hidden sm:inline">Google</span>
                            </button>
                            <button
                                type="button"
                                className="py-3 px-4 rounded-xl border-2 border-slate-200 bg-slate-50/50 text-slate-700 font-semibold hover:bg-slate-100 hover:border-slate-300 transition-all flex items-center justify-center gap-2 text-sm"
                            >
                                <span>🟦</span>
                                <span className="hidden sm:inline">Microsoft</span>
                            </button>
                        </div>

                        {/* Sign Up Link */}
                        <p className="text-center text-slate-600 text-sm mt-7 font-medium">
                            Don't have an account?{' '}
                            <Link to="/signup" className="text-accent-500 hover:text-accent-600 font-bold transition-colors">
                                Sign up
                            </Link>
                        </p>
                    </div>

                    {/* Footer Info */}
                    <p className="text-center text-xs text-white/80 mt-7 drop-shadow-md">
                        By signing in, you agree to our{' '}
                        <Link to="/terms" className="text-white/95 hover:underline font-medium">
                            Terms of Service
                        </Link>
                        {' '}and{' '}
                        <Link to="/privacy" className="text-white/95 hover:underline font-medium">
                            Privacy Policy
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-primary-500 via-accent-500 to-secondary-500 flex items-center justify-center">
                <div className="text-white/80 text-lg font-semibold drop-shadow-lg">Loading...</div>
            </div>
        }>
            <LoginForm />
        </Suspense>
    );
}