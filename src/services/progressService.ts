import api from '../lib/axios';

const progressService = {
    markComplete: (lessonId: number): Promise<void> =>
        api.post(`/lessons/${lessonId}/progress/complete`).then(r => r.data),

    getCourseProgress: (courseId: number): Promise<number[]> =>
        api.get(`/courses/${courseId}/progress`).then(r => r.data),
};

export default progressService;
