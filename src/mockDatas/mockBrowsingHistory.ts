// Browsing History Mock Data

export interface BrowsingHistoryItem {
    id: string;
    courseTitle: string;
    coursePath: string;
    visitedAt: Date;
    thumbnail: string;
    category: string;
    duration: number; // in minutes
}

export interface ContributionData {
    date: Date;
    count: number; // number of activities on this date
}

export interface PersonalInfo {
    name: string;
    email: string;
    avatar: string;
    role: string;
    bio: string;
    joinDate: Date;
    totalCoursesViewed: number;
    totalCoursesCompleted: number;
    completionRate: number;
    rank: string;
    totalStudyTime: string;
    streak: number; // consecutive days of activity
    points: number;
    skills: Array<{ name: string; progress: number }>;
    achievements: Array<{ name: string; icon?: string }>;
}

export const personalInfo: PersonalInfo = {
    name: 'Alex Johnson',
    email: 'alex.johnson@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    role: 'Frontend Developer',
    bio: 'Passionate learner exploring new technologies and development skills. Specialized in React and modern CSS.',
    joinDate: new Date('2023-06-15'),
    totalCoursesViewed: 23,
    totalCoursesCompleted: 8,
    completionRate: 85,
    rank: 'Gold Learner',
    totalStudyTime: '156h 30m',
    streak: 21,
    points: 4820,
    skills: [
        { name: 'React', progress: 85 },
        { name: 'TypeScript', progress: 70 },
        { name: 'Node.js', progress: 45 },
        { name: 'SQL', progress: 30 },
    ],
    achievements: [
        { name: 'Top 10%' },
        { name: '30-day streak' },
        { name: 'React Pro' },
    ],
};

export const browsingHistory: BrowsingHistoryItem[] = [
    {
        id: '1',
        courseTitle: 'Advanced TypeScript',
        coursePath: '/courses/advanced-typescript',
        visitedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        thumbnail: '📘',
        category: 'Programming',
        duration: 180,
    },
    {
        id: '2',
        courseTitle: 'React Fundamentals',
        coursePath: '/courses/react-fundamentals',
        visitedAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
        thumbnail: '⚛️',
        category: 'Web Development',
        duration: 240,
    },
    {
        id: '3',
        courseTitle: 'JavaScript Async Patterns',
        coursePath: '/courses/js-async',
        visitedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        thumbnail: '🟨',
        category: 'Programming',
        duration: 150,
    },
    {
        id: '4',
        courseTitle: 'Web Design with Tailwind CSS',
        coursePath: '/courses/tailwind-design',
        visitedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        thumbnail: '🎨',
        category: 'Design',
        duration: 120,
    },
    {
        id: '5',
        courseTitle: 'Node.js Backend Development',
        coursePath: '/courses/nodejs-backend',
        visitedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        thumbnail: '🟢',
        category: 'Backend',
        duration: 300,
    },
    {
        id: '6',
        courseTitle: 'Database Design Principles',
        coursePath: '/courses/database-design',
        visitedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
        thumbnail: '🗄️',
        category: 'Database',
        duration: 200,
    },
    {
        id: '7',
        courseTitle: 'Vue.js Essentials',
        coursePath: '/courses/vuejs-essentials',
        visitedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        thumbnail: '💚',
        category: 'Web Development',
        duration: 160,
    },
    {
        id: '8',
        courseTitle: 'Python Data Science',
        coursePath: '/courses/python-data-science',
        visitedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        thumbnail: '🐍',
        category: 'Data Science',
        duration: 280,
    },
    {
        id: '9',
        courseTitle: 'Docker & Kubernetes',
        coursePath: '/courses/docker-k8s',
        visitedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        thumbnail: '🐳',
        category: 'DevOps',
        duration: 220,
    },
    {
        id: '10',
        courseTitle: 'GraphQL API Development',
        coursePath: '/courses/graphql-api',
        visitedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
        thumbnail: '◇',
        category: 'API Development',
        duration: 190,
    },
];

// Generate contribution data for the past year
export const generateContributionData = (): ContributionData[] => {
    const contributions: ContributionData[] = [];
    const today = new Date();

    for (let i = 365; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);

        // Generate random contribution counts (0-5 activities per day)
        const count = Math.floor(Math.random() * 6);

        // Bias towards more contributions on certain patterns
        const dayOfWeek = date.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6 && Math.random() > 0.3) {
            contributions.push({
                date,
                count: Math.min(count + 1, 5),
            });
        } else {
            contributions.push({
                date,
                count,
            });
        }
    }

    return contributions;
};
