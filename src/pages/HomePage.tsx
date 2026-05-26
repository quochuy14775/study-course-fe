import React, { useEffect, useState } from 'react';
import CourseSection from "./user/course/CourseSection";
import { freeCourses, premiumCourses, slides } from "../mockDatas/mockCourses";
import { Sparkles, TrendingUp, Users, Zap } from "lucide-react";

const HomePage: React.FC = () => {
    const [index, setIndex] = useState(0);
    const [isHover, setIsHover] = useState(false);

    useEffect(() => {
        if (isHover) return;
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % slides.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [isHover]);

    const stats = [
        { icon: Users, label: 'Học viên', value: '12K+' },
        { icon: TrendingUp, label: 'Khóa học', value: '500+' },
        { icon: Sparkles, label: 'Đánh giá', value: '4.9' },
        { icon: Zap, label: 'Hoàn thành', value: '98%' },
    ];

    return (
        <main className="min-h-screen bg-ink-50 relative">
            {/* Subtle grid background */}
            <div className="absolute inset-0 bg-grid-pattern bg-grid pointer-events-none opacity-60" />

            <div className="relative max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
                {/* Hero Section */}
                <section className="mb-10 animate-fade-in-up">
                    <div
                        className="relative overflow-hidden rounded-2xl sm:rounded-3xl h-[200px] sm:h-[260px] lg:h-[280px] shadow-soft-lg border border-ink-200"
                        onMouseEnter={() => setIsHover(true)}
                        onMouseLeave={() => setIsHover(false)}
                    >
                        {/* Slides */}
                        <div
                            className="flex transition-transform duration-700 ease-out h-full"
                            style={{ transform: `translateX(-${index * 100}%)` }}
                        >
                            {slides.map((slide, i) => (
                                <div
                                    key={i}
                                    className="min-w-full h-full flex items-center px-5 sm:px-10 lg:px-14 relative overflow-hidden"
                                    style={{
                                        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #6366f1 100%)',
                                        backgroundSize: '200% 200%',
                                    }}
                                >
                                    {/* Decorative blobs */}
                                    <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
                                    <div className="absolute -bottom-32 -left-10 w-80 h-80 bg-accent-400/20 rounded-full blur-3xl" />

                                    {/* Code-style decorator */}
                                    <div className="absolute top-6 right-8 font-mono text-xs text-white/40 hidden lg:block">
                                        <span className="text-white/30">$</span> learn --next
                                    </div>

                                    <div className="relative z-10 max-w-2xl text-white">
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-xs font-medium mb-4">
                                            <Sparkles className="w-3 h-3" />
                                            <span>Khám phá ngay</span>
                                        </div>
                                        <h1 className="text-xl sm:text-3xl lg:text-4xl font-extrabold mb-2 sm:mb-3 leading-tight drop-shadow-md">
                                            {slide.title}
                                        </h1>
                                        <p className="text-sm sm:text-base lg:text-lg text-white/85 leading-relaxed line-clamp-2">{slide.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Dots */}
                        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
                            {slides.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setIndex(i)}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${
                                        i === index ? 'w-8 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/70'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>
                </section>

                {/* Stats */}
                <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
                    {stats.map((stat, i) => (
                        <div
                            key={stat.label}
                            className="card-lift bg-white border border-ink-200 rounded-2xl p-5 shadow-soft animate-fade-in-up"
                            style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'backwards' }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center">
                                    <stat.icon className="w-5 h-5 text-primary-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-extrabold text-ink-900 leading-none font-mono">{stat.value}</p>
                                    <p className="text-xs text-ink-500 mt-1">{stat.label}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </section>

                {/* Free Courses */}
                <div className="animate-fade-in-up" style={{ animationDelay: '200ms', animationFillMode: 'backwards' }}>
                    <CourseSection
                        title="Khóa học miễn phí"
                        subtitle="Bắt đầu học tập mà không cần chi tiêu"
                        courses={freeCourses}
                        variant="free"
                    />
                </div>

                {/* Premium Courses */}
                <div className="animate-fade-in-up" style={{ animationDelay: '300ms', animationFillMode: 'backwards' }}>
                    <CourseSection
                        title="Khóa học cao cấp"
                        subtitle="Các khóa học chất lượng cao cho những ai muốn phát triển"
                        courses={premiumCourses}
                        variant="pro"
                    />
                </div>
            </div>
        </main>
    );
};

export default HomePage;
