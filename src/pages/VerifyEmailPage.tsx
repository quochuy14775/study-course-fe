import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authService } from '../services/authService';

export default function VerifyEmailPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        const email = searchParams.get('email');
        const token = searchParams.get('token');

        if (!email || !token) {
            setErrorMsg('Invalid verification link.');
            setStatus('error');
            return;
        }

        authService.verifyEmail(email, token)
            .then(() => {
                setStatus('success');
                setTimeout(() => {
                    navigate(`/setup-account?email=${encodeURIComponent(email)}`);
                }, 1500);
            })
            .catch((err: any) => {
                const msg = err.response?.data;
                if (Array.isArray(msg)) setErrorMsg(msg.join(' '));
                else setErrorMsg(typeof msg === 'string' ? msg : 'Verification failed. The link may have expired.');
                setStatus('error');
            });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-500 via-accent-500 to-secondary-500 flex items-center justify-center px-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center"
            >
                {status === 'verifying' && (
                    <>
                        <div className="w-16 h-16 border-4 border-accent-200 border-t-accent-500 rounded-full animate-spin mx-auto mb-6" />
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Verifying your email...</h2>
                        <p className="text-slate-500">Please wait a moment.</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Email verified!</h2>
                        <p className="text-slate-500">Redirecting you to set up your account...</p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Verification failed</h2>
                        <p className="text-slate-500 mb-6">{errorMsg}</p>
                        <button
                            onClick={() => navigate('/login')}
                            className="px-6 py-2 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold"
                        >
                            Back to Login
                        </button>
                    </>
                )}
            </motion.div>
        </div>
    );
}
