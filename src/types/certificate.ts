// Khớp với DTOs bên BE (StudyCourseAPI) — api/courses/{courseId}/certificate

export interface Certificate {
    id: number;
    courseId: number;
    courseTitle: string;
    userName: string;
    issuedAt: string;
    certificateCode: string;
    scorePercentage: number;
}

/** Admin listing — thêm thông tin định danh học viên. api/admin/certificates */
export interface CertificateAdmin extends Certificate {
    userId: number;
    userEmail?: string | null;
}
