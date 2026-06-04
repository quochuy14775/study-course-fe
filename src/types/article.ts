export interface Article {
    id: number;
    title: string;
    slug: string;
    excerpt?: string | null;
    content?: string | null;
    thumbnailUrl?: string | null;
    author?: string | null;
    category?: string | null;
    readTimeMinutes: number;
    viewCount: number;
    likeCount: number;
    isFeatured: boolean;
    isActive: boolean;
    createdBy?: string | null;   // email của người tạo — dùng để check ownership
    createdAt: string;
    updatedAt?: string | null;
}

export interface ArticleRequest {
    title: string;
    slug: string;
    excerpt?: string;
    content?: string;
    thumbnailUrl?: string;
    author?: string;
    category?: string;
    readTimeMinutes?: number;
    isFeatured?: boolean;
    isActive?: boolean;
}
