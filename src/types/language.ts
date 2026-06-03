export interface FrameworkSummary {
    id: number;
    name: string;
    slug: string;
    iconUrl?: string | null;
}

export interface Language {
    id: number;
    name: string;
    slug: string;
    iconUrl?: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt?: string | null;
    frameworks: FrameworkSummary[];
}

export interface LanguageSummary {
    id: number;
    name: string;
    slug: string;
    iconUrl?: string | null;
}

export interface LanguageRequest {
    name: string;
    slug: string;
    iconUrl?: string | null;
    isActive: boolean;
    frameworkIds?: number[];
}
