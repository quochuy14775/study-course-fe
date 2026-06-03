import React from 'react';
import { toast, ToastOptions, cssTransition } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastConfig {
    icon: React.ReactNode;
    gradient: string;
    bar: string;
    iconColor: string;
    title: string;
    autoClose: number;
}

const CONFIG: Record<ToastType, ToastConfig> = {
    success: {
        icon: <CheckCircle2 size={16} strokeWidth={2.5} />,
        gradient: 'from-code-500/10 via-transparent',
        bar: 'from-code-400 via-code-500 to-code-600',
        iconColor: 'text-code-500',
        title: 'Thành công',
        autoClose: 3000,
    },
    error: {
        icon: <XCircle size={16} strokeWidth={2.5} />,
        gradient: 'from-rose-500/10 via-transparent',
        bar: 'from-rose-400 via-rose-500 to-rose-600',
        iconColor: 'text-rose-500',
        title: 'Lỗi',
        autoClose: 4000,
    },
    warning: {
        icon: <AlertTriangle size={16} strokeWidth={2.5} />,
        gradient: 'from-amber-500/10 via-transparent',
        bar: 'from-amber-400 via-amber-500 to-amber-600',
        iconColor: 'text-amber-500',
        title: 'Cảnh báo',
        autoClose: 3500,
    },
    info: {
        icon: <Info size={16} strokeWidth={2.5} />,
        gradient: 'from-primary-500/10 via-transparent',
        bar: 'from-primary-400 via-accent-500 to-accent-600',
        iconColor: 'text-primary-500',
        title: 'Thông báo',
        autoClose: 3000,
    },
};

interface Props {
    type: ToastType;
    message: string;
    toastId: string | number;
}

const CustomToastContent: React.FC<Props> = ({ type, message, toastId }) => {
    const cfg = CONFIG[type];

    return (
        <div className="flex items-center gap-3 w-full relative overflow-hidden">

            {/* Background gradient */}
            <div className={`absolute inset-0 bg-gradient-to-r ${cfg.gradient} to-transparent pointer-events-none`} />

            {/* Shimmer sweep on enter */}
            <div className="toast-shimmer absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none z-20" />

            {/* Left bar */}
            <div className={`toast-bar-slide absolute left-0 top-0 bottom-0 w-[3px] rounded-full bg-gradient-to-b ${cfg.bar}`} />

            {/* Icon */}
            <div className={`toast-icon-pop flex-shrink-0 ${cfg.iconColor} flex items-center justify-center ml-2 relative z-10`}>
                {cfg.icon}
            </div>

            {/* Text */}
            <div className="toast-text-in flex-1 min-w-0 pt-1 relative z-10">
                <p className="text-[10px] font-bold text-ink-400 uppercase tracking-widest mb-0.5 font-mono">
                    {cfg.title}
                </p>
                <p className="text-sm font-medium text-ink-800 leading-snug">{message}</p>
            </div>

            {/* Close */}
            <button
                onClick={() => toast.dismiss(toastId)}
                className="flex-shrink-0 p-1.5 rounded-lg text-ink-300 hover:text-ink-600 hover:bg-ink-100 transition-all relative z-10 mt-0.5"
            >
                <X size={13} />
            </button>

            {/* Progress bar */}
            <div
                className={`absolute bottom-0 left-0 h-[2px] bg-gradient-to-r ${cfg.bar} opacity-70 origin-left`}
                style={{
                    animation: `toast-progress ${cfg.autoClose}ms linear forwards`,
                }}
            />
        </div>
    );
};


const ToastTransition = cssTransition({
    enter: 'toast-anim-enter',
    exit: 'toast-anim-exit',
});

const baseOptions: ToastOptions = {
    position: 'top-right',
    hideProgressBar: true,
    closeButton: false,
    transition: ToastTransition,
    className: () =>
        'relative flex items-start bg-white/95 backdrop-blur-sm border border-ink-200/80 rounded-2xl shadow-soft-lg px-3 py-3 mb-2 overflow-hidden',
};

const make = (type: ToastType) =>
    (message: string, options?: ToastOptions) =>
        toast(({ toastProps }) => (
            <CustomToastContent type={type} message={message} toastId={toastProps.toastId} />
        ), { ...baseOptions, autoClose: CONFIG[type].autoClose, ...options });

export const showToast = {
    success: make('success'),
    error:   make('error'),
    warning: make('warning'),
    info:    make('info'),
};
