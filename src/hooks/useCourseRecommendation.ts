import { useState, useCallback } from 'react';
import type { ModalStep, UserRoadmap } from '../types/roadmap';

// ---------------------------------------------------------------------------
// Mock: simulate a persisted user roadmap (null = first-time user)
// Replace with real API / context call when ready
// ---------------------------------------------------------------------------
const MOCK_SAVED_ROADMAP: UserRoadmap | null = null;
// To test "returning user" flow, swap the line above with something like:
// const MOCK_SAVED_ROADMAP: UserRoadmap = {
//   langId: 'ts',
//   frameworkId: 'react',
//   selectedCourseIds: ['c6'],
// };

interface UseCourseRecommendationReturn {
    isModalOpen: boolean;
    currentStep: ModalStep;
    selectedLangId: string | null;
    selectedFrameworkId: string | null;
    selectedCourseIds: Set<string>;
    savedRoadmap: UserRoadmap | null;
    openModal: (preselect?: { langId: string; frameworkId: string }) => void;
    closeModal: () => void;
    setLanguage: (langId: string) => void;
    setFramework: (frameworkId: string) => void;
    toggleCourse: (courseId: string) => void;
    goToStep: (step: ModalStep) => void;
    goNextStep: () => void;
    goPrevStep: () => void;
    handleAccept: () => void;
    resetModal: () => void;
}

const STEP_ORDER: ModalStep[] = ['language', 'framework', 'courses', 'review'];

export function useCourseRecommendation(): UseCourseRecommendationReturn {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState<ModalStep>('language');
    const [selectedLangId, setSelectedLangId] = useState<string | null>(null);
    const [selectedFrameworkId, setSelectedFrameworkId] = useState<string | null>(null);
    const [selectedCourseIds, setSelectedCourseIds] = useState<Set<string>>(new Set());
    const [savedRoadmap, setSavedRoadmap] = useState<UserRoadmap | null>(MOCK_SAVED_ROADMAP);

    const openModal = useCallback(
        (preselect?: { langId: string; frameworkId: string }) => {
            if (preselect) {
                setSelectedLangId(preselect.langId);
                setSelectedFrameworkId(preselect.frameworkId);
                setSelectedCourseIds(new Set());
                setCurrentStep('courses');
            } else {
                setSelectedLangId(null);
                setSelectedFrameworkId(null);
                setSelectedCourseIds(new Set());
                setCurrentStep('language');
            }
            setIsModalOpen(true);
        },
        [],
    );

    const closeModal = useCallback(() => setIsModalOpen(false), []);

    const resetModal = useCallback(() => {
        setSelectedLangId(null);
        setSelectedFrameworkId(null);
        setSelectedCourseIds(new Set());
        setCurrentStep('language');
        setIsModalOpen(true);
    }, []);

    const setLanguage = useCallback((langId: string) => {
        setSelectedLangId(langId);
        setSelectedFrameworkId(null);
        setSelectedCourseIds(new Set());
    }, []);

    const setFramework = useCallback((frameworkId: string) => {
        setSelectedFrameworkId(frameworkId);
        setSelectedCourseIds(new Set());
    }, []);

    const toggleCourse = useCallback((courseId: string) => {
        setSelectedCourseIds((prev) => {
            const next = new Set(prev);
            if (next.has(courseId)) next.delete(courseId);
            else next.add(courseId);
            return next;
        });
    }, []);

    const goToStep = useCallback((step: ModalStep) => setCurrentStep(step), []);

    const goNextStep = useCallback(() => {
        setCurrentStep((prev) => {
            const idx = STEP_ORDER.indexOf(prev);
            return STEP_ORDER[Math.min(idx + 1, STEP_ORDER.length - 1)];
        });
    }, []);

    const goPrevStep = useCallback(() => {
        setCurrentStep((prev) => {
            const idx = STEP_ORDER.indexOf(prev);
            return STEP_ORDER[Math.max(idx - 1, 0)];
        });
    }, []);

    const handleAccept = useCallback(() => {
        if (!selectedLangId || !selectedFrameworkId) return;
        const roadmap: UserRoadmap = {
            langId: selectedLangId,
            frameworkId: selectedFrameworkId,
            selectedCourseIds: Array.from(selectedCourseIds),
        };
        // TODO: persist via API / global state
        setSavedRoadmap(roadmap);
        setIsModalOpen(false);
    }, [selectedLangId, selectedFrameworkId, selectedCourseIds]);

    return {
        isModalOpen,
        currentStep,
        selectedLangId,
        selectedFrameworkId,
        selectedCourseIds,
        savedRoadmap,
        openModal,
        closeModal,
        setLanguage,
        setFramework,
        toggleCourse,
        goToStep,
        goNextStep,
        goPrevStep,
        handleAccept,
        resetModal,
    };
}