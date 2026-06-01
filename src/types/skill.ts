// filepath: d:\Project\study-course\src\types\skill.ts

export interface Skill {
    id: number;
    name: string;
    description?: string | null;
    iconUrl?: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt?: string | null;
}

export interface CourseSkill {
    skillId: number;
    skillName: string;
    contributionPercentage: number;
}

export interface SkillRequest {
    name: string;
    description?: string | null;
    iconUrl?: string | null;
    isActive: boolean;
}

export interface CourseSkillRequest {
    skillId: number;
    contributionPercentage: number;
}

export interface SkillListResponse {
    count: number;
    value: Skill[];
}

export interface SkillMutationResponse {
    success: boolean;
    message: string;
    data: Skill;
}

