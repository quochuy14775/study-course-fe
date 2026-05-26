import api from "../lib/axios";
import { buildODataQuery, ODataParams } from "../types/odata";
import type {
    Lesson,
    LessonListResponse,
    LessonRequest,
    LessonReorderItem,
    LessonsCreateResponse,
    LessonMutationResponse,
    LessonsDeleteResponse,
    LessonsReorderResponse,
} from "../types/lesson";

// ────────────────────────────────────────────────────────────
// Endpoints (must match BE LessonsController route
//  "api/Courses/{courseId}/Lessons")
// ────────────────────────────────────────────────────────────

const base = (courseId: number | string) => `/Courses/${courseId}/Lessons`;

const lessonService = {
    /** GET /api/Courses/{courseId}/Lessons — OData list, optional chapter filter */
    getLessons: async (
        courseId: number | string,
        params?: ODataParams & { chapterId?: number },
    ): Promise<LessonListResponse> => {
        const odataParts: string[] = [];
        if (params) {
            const odata = buildODataQuery({
                top: params.top,
                skip: params.skip,
                filter: params.filter,
                orderby: params.orderby,
                count: params.count,
            });
            if (odata) odataParts.push(odata);
            if (params.chapterId !== undefined)
                odataParts.push(`chapterId=${params.chapterId}`);
        } else {
            odataParts.push("$count=true");
        }
        const url = `${base(courseId)}?${odataParts.join("&")}`;
        const response = await api.get<LessonListResponse>(url);
        return response.data;
    },

    /** GET /api/Courses/{courseId}/Lessons/{id} */
    getLessonById: async (courseId: number | string, id: number | string): Promise<Lesson> => {
        const response = await api.get<Lesson>(`${base(courseId)}/${id}`);
        return response.data;
    },

    /** POST /api/Courses/{courseId}/Lessons — bulk create (BE accepts an array) */
    createLessons: async (
        courseId: number | string,
        payloads: LessonRequest[],
    ): Promise<Lesson[]> => {
        const response = await api.post<LessonsCreateResponse>(base(courseId), payloads);
        return response.data.data;
    },

    /** PUT /api/Courses/{courseId}/Lessons/{id} — update single */
    updateLesson: async (
        courseId: number | string,
        id: number | string,
        payload: LessonRequest,
    ): Promise<Lesson> => {
        const response = await api.put<LessonMutationResponse>(`${base(courseId)}/${id}`, payload);
        return response.data.data;
    },

    /** PUT /api/Courses/{courseId}/Lessons/delete — bulk soft-delete */
    deleteLessons: async (
        courseId: number | string,
        ids: Array<number | string>,
    ): Promise<LessonsDeleteResponse> => {
        const numericIds = ids.map((i) => Number(i));
        const response = await api.put<LessonsDeleteResponse>(
            `${base(courseId)}/delete`,
            numericIds,
        );
        return response.data;
    },

    /** PUT /api/Courses/{courseId}/Lessons/disable — bulk */
    disableLessons: async (
        courseId: number | string,
        ids: Array<number | string>,
    ): Promise<void> => {
        const numericIds = ids.map((i) => Number(i));
        await api.put(`${base(courseId)}/disable`, numericIds);
    },

    /** PUT /api/Courses/{courseId}/Lessons/enable — bulk */
    enableLessons: async (
        courseId: number | string,
        ids: Array<number | string>,
    ): Promise<void> => {
        const numericIds = ids.map((i) => Number(i));
        await api.put(`${base(courseId)}/enable`, numericIds);
    },

    /** PUT /api/Courses/{courseId}/Lessons/reorder — drag-drop persistence */
    reorderLessons: async (
        courseId: number | string,
        items: LessonReorderItem[],
    ): Promise<LessonsReorderResponse> => {
        const response = await api.put<LessonsReorderResponse>(
            `${base(courseId)}/reorder`,
            items,
        );
        return response.data;
    },
};

export default lessonService;
