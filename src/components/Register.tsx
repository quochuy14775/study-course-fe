import React, { useState } from 'react';
import { authService } from '../services/authService';
import { BookOpen } from 'lucide-react';

export default function RegisterPage({ onSwitchToLogin }: { onSwitchToLogin?: () => void }) {
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
            else setError(typeof msg === 'string' ? msg : 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    if (sent) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-primary-500 via-accent-500 to-secondary-500 flex items-center justify-center p-6">
                <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Check your email</h2>
                    <p className="text-slate-500 mb-1">We sent a verification link to</p>
                    <p className="font-semibold text-accent-600 mb-6">{email}</p>
                    <p className="text-sm text-slate-500 mb-6">
                        Click the link to verify your account, then you'll be asked to set up your username and password.
                    </p>
                    <button type="button" onClick={onSwitchToLogin} className="text-accent-500 font-medium hover:text-accent-600 transition-colors text-sm">
                        Back to Sign in
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-500 via-accent-500 to-secondary-500 flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-8">
                <div className="flex items-center gap-3 mb-6 justify-center">
                    <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center">
                        <BookOpen className="w-7 h-7 text-slate-900" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-slate-700">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full mt-2 p-3 rounded-xl border-2 border-slate-200 focus:outline-none focus:border-accent-500"
                        />
                    </div>

                    {error && <div className="text-red-600 text-sm font-medium">{error}</div>}

                    <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold disabled:opacity-60">
                        {loading ? 'Sending...' : 'Send Verification Email'}
                    </button>
                </form>

                <p className="text-center text-sm text-slate-600 mt-4">
                    Already have an account?{' '}
                    <button type="button" onClick={onSwitchToLogin} className="text-accent-500 font-medium hover:text-accent-600 transition-colors">
                        Sign in
                    </button>
                </p>
            </div>
        </div>
    );
}
