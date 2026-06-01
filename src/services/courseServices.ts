import api from "../lib/axios";
import { buildODataQuery, ODataParams } from "../types/odata";
import type {
    Course,
    CourseDetail,
    CourseListResponse,
    CourseMutationResponse,
    CourseRequest,
    CourseSuggestion,
} from "../types/course";
import {
    Skill,
    SkillListResponse,
    SkillMutationResponse,
    SkillRequest
} from "../types/skill";

// ────────────────────────────────────────────────────────────
// Endpoints (must match BE CoursesController route "api/Courses")
// ────────────────────────────────────────────────────────────

const BASE = "/Courses";
const SKILL_BASE = "/Skills";

const courseService = {
    /** GET /api/Courses with OData query */
    getCourses: async (params?: ODataParams): Promise<CourseListResponse> => {
        const query = params ? buildODataQuery(params) : "$count=true";
        const response = await api.get<CourseListResponse>(`${BASE}?${query}`);
        return response.data;
    },

    /** GET /api/Courses/{id} — returns detail with tagIds */
    getCourseById: async (courseId: string | number): Promise<CourseDetail> => {
        const response = await api.get<CourseDetail>(`${BASE}/${courseId}`);
        return response.data;
    },

    /** POST /api/Courses — create */
    createCourse: async (data: CourseRequest): Promise<Course> => {
        const response = await api.post<CourseMutationResponse>(BASE, data);
        return response.data.data;
    },

    /** PUT /api/Courses/{id} — update */
    updateCourse: async (id: string | number, data: CourseRequest): Promise<Course> => {
        const response = await api.put<CourseMutationResponse>(`${BASE}/${id}`, data);
        return response.data.data;
    },

    /** PUT /api/Courses/delete — bulk soft-delete */
    deleteCourses: async (ids: Array<string | number>): Promise<{ success: boolean; deleted: number }> => {
        const numericIds = ids.map((i) => Number(i));
        const response = await api.put(`${BASE}/delete`, numericIds);
        return response.data;
    },

    /** PUT /api/Courses/disable — bulk disable */
    disableCourses: async (ids: Array<string | number>): Promise<void> => {
        const numericIds = ids.map((i) => Number(i));
        await api.put(`${BASE}/disable`, numericIds);
    },

    /** PUT /api/Courses/enable — bulk enable */
    enableCourses: async (ids: Array<string | number>): Promise<void> => {
        const numericIds = ids.map((i) => Number(i));
        await api.put(`${BASE}/enable`, numericIds);
    },

    /** GET /api/Courses/suggest?keyword= — autocomplete */
    suggestCourses: async (keyword: string): Promise<CourseSuggestion[]> => {
        const response = await api.get<CourseSuggestion[]>(`${BASE}/suggest?keyword=${keyword}`);
        return response.data;
    },

    // ────────────────────────────────────────────────────────────
    // Skill Management (Admin)
    // ────────────────────────────────────────────────────────────

    /** GET /api/Skills with OData query */
    getSkills: async (params?: ODataParams): Promise<SkillListResponse> => {
        const query = params ? buildODataQuery(params) : "$count=true";
        const response = await api.get<SkillListResponse>(`${SKILL_BASE}?${query}`);
        return response.data;
    },

    /** GET /api/Skills/{id} */
    getSkillById: async (id: number): Promise<Skill> => {
        const response = await api.get<Skill>(`${SKILL_BASE}/${id}`);
        return response.data;
    },

    /** POST /api/Skills — create */
    createSkill: async (data: SkillRequest): Promise<Skill> => {
        const response = await api.post<SkillMutationResponse>(SKILL_BASE, data);
        return response.data.data;
    },

    /** PUT /api/Skills/{id} — update */
    updateSkill: async (id: number, data: SkillRequest): Promise<Skill> => {
        const response = await api.put<SkillMutationResponse>(`${SKILL_BASE}/${id}`, data);
        return response.data.data;
    },

    /** DELETE /api/Skills/{id} */
    deleteSkill: async (id: number): Promise<{ success: boolean }> => {
        const response = await api.delete(`${SKILL_BASE}/${id}`);
        return response.data;
    }
};

export default courseService;
