import api from '../lib/axios';
import type { Certificate, CertificateAdmin } from '../types/certificate';

const certificateService = {
    getCertificate: (courseId: number): Promise<Certificate> =>
        api.get(`/courses/${courseId}/certificate`).then(r => r.data),

    // ─── Admin ──────────────────────────────────────────────
    getCertificates: (params?: { courseId?: number; search?: string }): Promise<CertificateAdmin[]> =>
        api.get('/admin/certificates', { params }).then(r => r.data),

    verifyCertificate: (code: string): Promise<CertificateAdmin> =>
        api.get(`/admin/certificates/verify/${code}`).then(r => r.data),

    revokeCertificate: (id: number): Promise<void> =>
        api.delete(`/admin/certificates/${id}`).then(r => r.data),
};

export default certificateService;
