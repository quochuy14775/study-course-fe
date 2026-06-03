import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Header from './components/Header';
import Sidebar from './components/Sidebar';
import HomePage from './pages/HomePage';
import RoadmapPage from './pages/RoadmapPage';
import ArticlesPage from './pages/ArticlesPage';
import PersonalPage from './pages/PersonalPage';
import AuthPage from './components/AuthPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import SetupAccountPage from './pages/SetupAccountPage';
import CourseManagement from "./pages/admin/course";
import LanguageManagement from "./pages/admin/language";
import FrameworkManagement from "./pages/admin/framework";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import ProtectedRoute from "./components/ProtectedRoute";
import ChatBot from "./components/ChatBot";

import './App.css';
import { useAuthStore } from "./stores/authStore";
import { useUiStore } from "./stores/uiStore";
import LessonManagement from "./pages/admin/course/lesson";
import LearnPage from "./pages/user/course/LearnPage";
import MyCoursesPage from "./pages/user/course/MyCoursesPage";

function ProtectedShell() {
    const collapsed = useUiStore((s) => s.sidebarCollapsed);

    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <div className="flex flex-1 relative">
                <Sidebar />
                <ChatBot />

                {/*
                  Mobile: no sidebar margin (drawer slides over).
                  Desktop: margin matches sidebar width (collapsed 20, expanded 64).
                */}
                <main
                    className={`flex-1 min-w-0 transition-[margin] duration-300 ${
                        collapsed ? 'md:ml-20' : 'md:ml-64'
                    }`}
                >
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/roadmap" element={<RoadmapPage />} />
                        <Route path="/articles" element={<ArticlesPage />} />
                        <Route path="/personal" element={<PersonalPage />} />
                        <Route path="/my-courses" element={<MyCoursesPage />} />

                        {/* Admin only */}
                        <Route
                            path="/management"
                            element={
                                <ProtectedRoute allowedRoles={["Admin"]}>
                                    <CourseManagement />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/management/languages"
                            element={
                                <ProtectedRoute allowedRoles={["Admin"]}>
                                    <LanguageManagement />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/management/frameworks"
                            element={
                                <ProtectedRoute allowedRoles={["Admin"]}>
                                    <FrameworkManagement />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/management/courses/:courseId/lessons"
                            element={
                                <ProtectedRoute allowedRoles={["Admin"]}>
                                    <LessonManagement />
                                </ProtectedRoute>
                            }
                        />
                    </Routes>
                </main>
            </div>
        </div>
    );
}

function App() {
    const setToken = useAuthStore((state) => state.setToken);

    useEffect(() => {
        const raw = localStorage.getItem('auth-storage');
        if (raw) {
            const token = JSON.parse(raw).state?.token;
            if (token) setToken(token);
        }
    }, [setToken]);

    return (
        <Router>
            <ToastContainer
                position="top-right"
                closeButton={false}
                hideProgressBar
                style={{ padding: '16px 16px 0 0', width: 400 }}
            />
            <Routes>
                <Route path="/login" element={<AuthPage />} />
                <Route path="/signup" element={<AuthPage />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />
                <Route path="/setup-account" element={<SetupAccountPage />} />

                {/* Full-screen learn page — no Header/Sidebar */}
                <Route
                    path="/courses/:courseId/learn"
                    element={
                        <ProtectedRoute>
                            <LearnPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/courses/:courseId/learn/:lessonId"
                    element={
                        <ProtectedRoute>
                            <LearnPage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/*"
                    element={
                        <ProtectedRoute>
                            <ProtectedShell />
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </Router>
    );
}

export default App;
