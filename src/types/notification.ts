export type NotificationType = 0 | 1 | 2 | 3; // Info | Success | Warning | Error

export interface AppNotification {
    id: number;
    message: string;
    type: NotificationType;
    linkUrl?: string | null;
    isRead: boolean;
    createdAt: string;
}
