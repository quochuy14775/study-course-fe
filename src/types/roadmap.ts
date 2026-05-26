export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
export type CourseLevel = 'Beginner' | 'Intermediate' | 'Advanced';
export type ModalStep = 'language' | 'framework' | 'courses' | 'review';

export interface RoadmapStep {
    id: number;
    title: string;
    description: string;
    topics: string[];
    difficulty: Difficulty;
    preselect?: {
        langId: string;
        frameworkId: string;
    };
}

export interface Language {
    id: string;
    label: string;
    icon: string;
}

export interface Framework {
    id: string;
    label: string;
    icon: string;
}

export interface Course {
    id: string;
    langId: string;
    frameworkId: string;
    title: string;
    description: string;
    level: CourseLevel;
    duration: string;
}

export interface UserRoadmap {
    langId: string;
    frameworkId: string;
    selectedCourseIds: string[];
}