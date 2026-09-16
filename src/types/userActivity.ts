// Khớp với BE — StudyCourseAPI/DTOs/Responses/User/UserActivityResponse.cs

export interface UserActivityDay {
    /** yyyy-MM-dd (giờ VN) */
    date: string;
    /** Tổng mọi loại hoạt động — dùng tô màu ô contribution */
    count: number;
    lessons: number;
    quizzes: number;
    /** Ghi chú + bình luận + câu hỏi + trả lời */
    posts: number;
    enrollments: number;
    certificates: number;
}

export interface UserActivity {
    /** yyyy-MM-dd hôm nay theo giờ VN */
    today: string;
    /** Tăng dần, phần tử cuối là hôm nay */
    days: UserActivityDay[];
    currentStreak: number;
    longestStreak: number;
    /** Hôm nay đã có hoạt động chưa — false + currentStreak > 0 nghĩa là "còn hôm nay để giữ streak" */
    streakSafeToday: boolean;
    activeDays: number;
    totalActions: number;
    totalLessons: number;
    totalQuizzes: number;
}
