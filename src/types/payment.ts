// MOCK: chưa nối cổng thanh toán thật — dùng để dựng giao diện checkout

export type PaymentMethodId = 'card' | 'momo' | 'zalopay' | 'banking';

export interface PaymentMethod {
    id: PaymentMethodId;
    label: string;
    description: string;
}

export interface Order {
    id: string;
    courseId: number;
    courseTitle: string;
    amount: number;
    paymentMethod: PaymentMethodId;
    status: 'success' | 'failed';
    createdAt: string;
}
