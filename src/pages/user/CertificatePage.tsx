import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Award, Download, Share2, Link2, ShieldCheck, Lock } from 'lucide-react';
import { showToast } from '../../components/CustomToast';
import certificateService from '../../services/certificateService';
import type { Certificate } from '../../types/certificate';

const CertificatePage: React.FC = () => {
    const { courseId } = useParams<{ courseId: string }>();
    const navigate = useNavigate();
    const [cert, setCert] = useState<Certificate | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        if (!courseId) return;
        setLoading(true);
        certificateService.getCertificate(Number(courseId))
            .then(setCert)
            .catch(() => setNotFound(true))
            .finally(() => setLoading(false));
    }, [courseId]);

    const notReady = () => showToast.info('Tính năng tải PDF / chia sẻ sẽ có trong bản cập nhật tới.');

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <motion.div
                className="w-10 h-10 rounded-full border-2 border-primary-500 border-t-transparent"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            />
        </div>
    );

    if (notFound || !cert) return (
        <div className="max-w-md mx-auto px-4 py-16 text-center">
            <Lock className="w-10 h-10 text-ink-300 mx-auto mb-4" />
            <h1 className="text-lg font-bold text-ink-900 mb-1.5">Chưa có chứng chỉ</h1>
            <p className="text-sm text-ink-500 mb-6">Bạn cần hoàn thành bài test cuối khóa để nhận chứng chỉ cho khóa học này.</p>
            <button
                onClick={() => navigate(-1)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-primary-600 hover:bg-primary-500 transition-all"
            >
                Quay lại
            </button>
        </div>
    );

    const issuedDate = new Date(cert.issuedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' });

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-1.5 text-xs font-medium text-ink-500 hover:text-primary-600 transition-colors"
            >
                <ArrowLeft className="w-3.5 h-3.5" /> Quay lại
            </button>

            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="relative bg-white rounded-3xl border-2 border-amber-200 shadow-soft-lg overflow-hidden"
            >
                <div className="absolute inset-0 pointer-events-none opacity-[0.04]" style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, #000 1px, transparent 0)',
                    backgroundSize: '18px 18px',
                }} />
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 via-primary-500 to-accent-500" />

                <div className="relative px-8 sm:px-14 py-12 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-6">
                        <Award className="w-8 h-8 text-amber-500" />
                    </div>

                    <p className="text-xs font-bold tracking-[0.2em] text-ink-400 uppercase mb-3">Chứng chỉ hoàn thành khóa học</p>

                    <h1 className="text-3xl sm:text-4xl font-extrabold text-ink-900 mb-1" style={{ fontFamily: 'Georgia, serif' }}>
                        {cert.userName}
                    </h1>
                    <p className="text-sm text-ink-500 mb-6">đã hoàn thành xuất sắc khóa học</p>

                    <h2 className="text-xl sm:text-2xl font-bold text-primary-700 mb-8">{cert.courseTitle}</h2>

                    <div className="flex items-center justify-center gap-8 flex-wrap mb-8">
                        <div>
                            <p className="text-[11px] text-ink-400 uppercase tracking-wide">Điểm bài test cuối khóa</p>
                            <p className="text-lg font-bold text-code-600">{cert.scorePercentage}%</p>
                        </div>
                        <div className="w-px h-8 bg-ink-200" />
                        <div>
                            <p className="text-[11px] text-ink-400 uppercase tracking-wide">Ngày cấp</p>
                            <p className="text-lg font-bold text-ink-800">{issuedDate}</p>
                        </div>
                        <div className="w-px h-8 bg-ink-200" />
                        <div>
                            <p className="text-[11px] text-ink-400 uppercase tracking-wide">Mã chứng chỉ</p>
                            <p className="text-lg font-bold text-ink-800 font-mono">{cert.certificateCode}</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-center gap-1.5 text-xs text-ink-400">
                        <ShieldCheck className="w-3.5 h-3.5 text-code-500" />
                        Xác thực tại eduhub.vn/verify/{cert.certificateCode}
                    </div>
                </div>
            </motion.div>

            <div className="flex items-center justify-center gap-3 flex-wrap">
                <button
                    onClick={notReady}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-primary-600 hover:bg-primary-500 transition-all"
                >
                    <Download className="w-3.5 h-3.5" /> Tải PDF
                </button>
                <button
                    onClick={notReady}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-ink-600 border border-ink-200 hover:bg-ink-50 transition-all"
                >
                    <Share2 className="w-3.5 h-3.5" /> Chia sẻ
                </button>
                <button
                    onClick={notReady}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-ink-600 border border-ink-200 hover:bg-ink-50 transition-all"
                >
                    <Link2 className="w-3.5 h-3.5" /> Thêm vào LinkedIn
                </button>
            </div>
        </div>
    );
};

export default CertificatePage;
