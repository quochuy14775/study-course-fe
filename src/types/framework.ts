export interface LanguageSummary {
    id: number;
    name: string;
    slug: string;
    iconUrl?: string | null;
}

export interface Framework {
    id: number;
    name: string;
    slug: string;
    iconUrl?: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt?: string | null;
    languages: LanguageSummary[];
}

export interface FrameworkSummary {
    id: number;
    name: string;
    slug: string;
    iconUrl?: string | null;
}

export interface FrameworkRequest {
    name: string;
    slug: string;
    iconUrl?: string | null;
    isActive: boolean;
    languageIds?: number[];
}
