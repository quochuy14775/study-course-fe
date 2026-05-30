import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Sparkles, Loader2 } from "lucide-react";
import { aiService, AiMessage } from "../services/aiService";
import { useAuthStore } from "../stores/authStore";

const SYSTEM_PROMPT =
    "Bạn là trợ lý AI cho nền tảng học lập trình EduHub. Giúp học viên hiểu bài học, trả lời câu hỏi về code, giải thích khái niệm. Trả lời ngắn gọn, thân thiện và rõ ràng. Khi cần đưa ra code mẫu, dùng markdown code block.";

export default function ChatBot() {
    const user = useAuthStore((state) => state.user);
    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.name || user?.email || 'user')}`;

    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<AiMessage[]>([
        { role: "assistant", content: "Xin chào! 👋 Tôi là trợ lý học tập AI. Bạn cần hỗ trợ gì về lập trình?" },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open) {
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
            inputRef.current?.focus();
        }
    }, [open, messages]);

    const handleSend = async () => {
        const text = input.trim();
        if (!text || loading) return;

        setMessages((prev) => [...prev, { role: "user", content: text }]);
        setInput("");
        setLoading(true);

        try {
            const data = await aiService.sendMessage(text, SYSTEM_PROMPT);
            setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
        } catch {
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: "Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau." },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <>
            {/* Floating button */}
            <button
                onClick={() => setOpen((prev) => !prev)}
                className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-600 to-accent-600 text-white shadow-glow-primary hover:shadow-glow-accent hover:scale-110 active:scale-95 flex items-center justify-center transition-all duration-300 ${
                    !open ? 'animate-glow-pulse' : ''
                }`}
                aria-label={open ? "Đóng chat" : "Mở chat"}
            >
                <div className="relative w-6 h-6">
                    <MessageCircle
                        size={24}
                        className={`absolute inset-0 transition-all duration-300 ${open ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}`}
                    />
                    <X
                        size={24}
                        className={`absolute inset-0 transition-all duration-300 ${open ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'}`}
                    />
                </div>
            </button>

            {/* Chat window */}
            {open && (
                <div className="fixed bottom-24 right-3 left-3 sm:left-auto sm:right-6 z-50 sm:w-[380px] md:w-[400px] h-[min(560px,calc(100vh-7rem))] bg-white rounded-3xl shadow-soft-lg flex flex-col border border-ink-200 overflow-hidden animate-fade-in-up">
                    {/* Header */}
                    <div className="relative bg-gradient-to-br from-primary-600 to-accent-600 text-white px-5 py-4 overflow-hidden">
                        <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                        <div className="relative flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                                <Sparkles size={18} className="text-white" />
                            </div>
                            <div>
                                <p className="font-semibold text-sm flex items-center gap-2">
                                    EduHub AI
                                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-code-400 shadow-[0_0_8px_rgb(52,211,153)]" />
                                </p>
                                <p className="text-xs text-white/70 font-mono">Online</p>
                            </div>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gradient-to-b from-ink-50/50 to-white">
                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                className={`flex items-end gap-2 animate-fade-in-up ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                            >
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                                    {msg.role === "user" ? (
                                        <img src={avatarUrl} alt="you" className="w-7 h-7 rounded-lg bg-ink-100" />
                                    ) : (
                                        <div className="w-7 h-7 rounded-lg bg-ink-100 border border-ink-200 flex items-center justify-center">
                                            <Sparkles size={13} className="text-primary-600" />
                                        </div>
                                    )}
                                </div>
                                <div
                                    className={`max-w-[78%] px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                                        msg.role === "user"
                                            ? "bg-gradient-to-br from-primary-600 to-accent-600 text-white rounded-2xl rounded-br-sm shadow-soft"
                                            : "bg-white text-ink-800 border border-ink-200 rounded-2xl rounded-bl-sm shadow-soft"
                                    }`}
                                >
                                    {msg.content}
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="flex items-end gap-2 animate-fade-in">
                                <div className="w-7 h-7 rounded-lg bg-ink-100 border border-ink-200 flex items-center justify-center">
                                    <Sparkles size={13} className="text-primary-600" />
                                </div>
                                <div className="bg-white border border-ink-200 px-4 py-3 rounded-2xl rounded-bl-sm shadow-soft flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* Input */}
                    <div className="px-3 py-3 border-t border-ink-200 bg-white">
                        <div className="flex gap-2 items-center bg-ink-50 rounded-2xl border border-ink-200 focus-within:border-primary-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-primary-500/10 transition-all px-3 py-1.5">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Hỏi bất cứ điều gì về lập trình..."
                                disabled={loading}
                                className="flex-1 bg-transparent text-sm outline-none placeholder:text-ink-400 disabled:opacity-50"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || loading}
                                className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-600 to-accent-600 disabled:from-ink-300 disabled:to-ink-300 text-white flex items-center justify-center hover:scale-105 active:scale-95 disabled:scale-100 transition-transform"
                            >
                                {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                            </button>
                        </div>
                        <p className="text-[10px] text-ink-400 mt-1.5 ml-3 font-mono">
                            Press <kbd className="px-1 py-0.5 bg-ink-100 rounded text-ink-500 border border-ink-200">Enter</kbd> to send
                        </p>
                    </div>
                </div>
            )}
        </>
    );
}
