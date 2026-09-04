import type { PaymentMethod } from '../types/payment';

export const paymentMethods: PaymentMethod[] = [
    { id: 'card', label: 'Thẻ ATM / Visa / Mastercard', description: 'Thanh toán qua cổng ngân hàng' },
    { id: 'momo', label: 'Ví MoMo', description: 'Quét mã QR bằng ứng dụng MoMo' },
    { id: 'zalopay', label: 'ZaloPay', description: 'Quét mã QR bằng ứng dụng ZaloPay' },
    { id: 'banking', label: 'Chuyển khoản ngân hàng', description: 'Chuyển khoản trực tiếp, xác nhận trong 5 phút' },
];

export interface PricingPlan {
    id: 'free' | 'pro-monthly' | 'pro-yearly';
    name: string;
    price: number;
    period: string;
    description: string;
    features: string[];
    highlighted?: boolean;
    badge?: string;
}

export const pricingPlans: PricingPlan[] = [
    {
        id: 'free',
        name: 'Miễn phí',
        price: 0,
        period: '',
        description: 'Bắt đầu học với các khóa cơ bản',
        features: ['Truy cập khóa học miễn phí', 'Ghi chú & bình luận', 'Quiz cuối bài'],
    },
    {
        id: 'pro-monthly',
        name: 'Pro — Hàng tháng',
        price: 99000,
        period: '/tháng',
        description: 'Mở khóa toàn bộ khóa học Premium',
        features: ['Tất cả khóa học Premium', 'Test cuối khóa + chứng chỉ', 'Hỗ trợ ưu tiên từ giảng viên', 'Tải tài liệu offline'],
        highlighted: true,
        badge: 'Phổ biến nhất',
    },
    {
        id: 'pro-yearly',
        name: 'Pro — Hàng năm',
        price: 899000,
        period: '/năm',
        description: 'Tiết kiệm hơn 24% so với gói tháng',
        features: ['Tất cả quyền lợi gói Pro tháng', 'Tiết kiệm 24%', 'Chứng chỉ ưu tiên xét duyệt'],
    },
];
