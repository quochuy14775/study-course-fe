import type { RoadmapStep, Language, Framework, Course } from '../types/roadmap';

export const ROADMAP_STEPS: RoadmapStep[] = [
    {
        id: 1,
        title: 'Bước 1: HTML & CSS Cơ bản',
        description: 'Nắm vững các kiến thức nền tảng về HTML và CSS',
        topics: ['HTML5 tags', 'CSS selectors', 'Flexbox', 'Grid', 'Responsive Design'],
        difficulty: 'Beginner',
        preselect: { langId: 'js', frameworkId: 'react' },
    },
    {
        id: 2,
        title: 'Bước 2: JavaScript Cơ bản',
        description: 'Học JavaScript từ cơ bản đến nâng cao',
        topics: ['Variables & Data Types', 'Functions', 'DOM Manipulation', 'Events', 'ES6+'],
        difficulty: 'Beginner',
        preselect: { langId: 'js', frameworkId: 'node' },
    },
    {
        id: 3,
        title: 'Bước 3: React Fundamentals',
        description: 'Bắt đầu học React với components, hooks và state management',
        topics: ['Components', 'JSX', 'Hooks', 'State & Props', 'Lifecycle'],
        difficulty: 'Intermediate',
        preselect: { langId: 'js', frameworkId: 'react' },
    },
    {
        id: 4,
        title: 'Bước 4: Advanced React',
        description: 'Nâng cao kỹ năng React với advanced patterns',
        topics: ['Context API', 'Custom Hooks', 'Performance', 'Testing', 'Advanced Patterns'],
        difficulty: 'Advanced',
        preselect: { langId: 'ts', frameworkId: 'react' },
    },
    {
        id: 5,
        title: 'Bước 5: TypeScript & Backend',
        description: 'Học TypeScript và Node.js để phát triển backend',
        topics: ['TypeScript', 'Node.js', 'Express', 'REST APIs', 'Databases'],
        difficulty: 'Advanced',
        preselect: { langId: 'ts', frameworkId: 'nestjs' },
    },
    {
        id: 6,
        title: 'Bước 6: Full Stack Development',
        description: 'Trở thành Full Stack Developer',
        topics: ['Full Stack Architecture', 'Deployment', 'DevOps', 'CI/CD', 'Scaling'],
        difficulty: 'Expert',
        preselect: { langId: 'ts', frameworkId: 'nextjs' },
    },
];

export const LANGUAGES: Language[] = [
    { id: 'js',   label: 'JavaScript', icon: 'ti-brand-javascript' },
    { id: 'ts',   label: 'TypeScript', icon: 'ti-brand-typescript' },
    { id: 'py',   label: 'Python',     icon: 'ti-brand-python' },
    { id: 'java', label: 'Java',       icon: 'ti-coffee' },
    { id: 'go',   label: 'Go',         icon: 'ti-brand-golang' },
    { id: 'rust', label: 'Rust',       icon: 'ti-brand-rust' },
];

export const FRAMEWORKS: Record<string, Framework[]> = {
    js: [
        { id: 'react', label: 'React',   icon: 'ti-brand-react' },
        { id: 'vue',   label: 'Vue',     icon: 'ti-brand-vue' },
        { id: 'node',  label: 'Node.js', icon: 'ti-server' },
        { id: 'nextjs',label: 'Next.js', icon: 'ti-layout' },
    ],
    ts: [
        { id: 'react',  label: 'React + TS', icon: 'ti-brand-react' },
        { id: 'angular',label: 'Angular',    icon: 'ti-brand-angular' },
        { id: 'nestjs', label: 'NestJS',     icon: 'ti-server' },
        { id: 'nextjs', label: 'Next.js',    icon: 'ti-layout' },
    ],
    py: [
        { id: 'django',  label: 'Django',  icon: 'ti-world' },
        { id: 'fastapi', label: 'FastAPI', icon: 'ti-bolt' },
        { id: 'flask',   label: 'Flask',   icon: 'ti-flask' },
        { id: 'pytorch', label: 'PyTorch', icon: 'ti-brain' },
    ],
    java: [
        { id: 'spring',    label: 'Spring Boot', icon: 'ti-leaf' },
        { id: 'quarkus',   label: 'Quarkus',     icon: 'ti-rocket' },
        { id: 'micronaut', label: 'Micronaut',   icon: 'ti-circuit-cell' },
        { id: 'android',   label: 'Android',     icon: 'ti-brand-android' },
    ],
    go: [
        { id: 'gin',   label: 'Gin',   icon: 'ti-server' },
        { id: 'fiber', label: 'Fiber', icon: 'ti-bolt' },
        { id: 'echo',  label: 'Echo',  icon: 'ti-broadcast' },
        { id: 'grpc',  label: 'gRPC',  icon: 'ti-arrows-exchange' },
    ],
    rust: [
        { id: 'actix', label: 'Actix-web',   icon: 'ti-server' },
        { id: 'axum',  label: 'Axum',        icon: 'ti-sitemap' },
        { id: 'wasm',  label: 'WebAssembly', icon: 'ti-world' },
        { id: 'tokio', label: 'Tokio',       icon: 'ti-circuit-battery' },
    ],
};

export const COURSES: Course[] = [
    { id: 'c1',  langId: 'js', frameworkId: 'react',   title: 'React 18 complete guide',       description: 'Hooks, context, suspense, và concurrent features từ zero đến production.',          level: 'Beginner',     duration: '24h' },
    { id: 'c2',  langId: 'js', frameworkId: 'react',   title: 'React + Redux Toolkit',         description: 'State management với modern Redux patterns và RTK Query.',                          level: 'Intermediate',  duration: '16h' },
    { id: 'c3',  langId: 'js', frameworkId: 'vue',     title: 'Vue 3 Composition API',         description: 'Build reactive UIs với composition API và Pinia store.',                            level: 'Beginner',     duration: '20h' },
    { id: 'c4',  langId: 'js', frameworkId: 'node',    title: 'Node.js REST APIs',             description: 'Thiết kế và deploy production-grade REST APIs với Express và MongoDB.',            level: 'Intermediate',  duration: '18h' },
    { id: 'c5',  langId: 'js', frameworkId: 'nextjs',  title: 'Full-stack Next.js 14',         description: 'App router, server components, streaming và deployment trên Vercel.',               level: 'Intermediate',  duration: '22h' },
    { id: 'c6',  langId: 'ts', frameworkId: 'react',   title: 'React với TypeScript',          description: 'Type-safe component design patterns, generics và strict mode.',                     level: 'Intermediate',  duration: '14h' },
    { id: 'c7',  langId: 'ts', frameworkId: 'angular', title: 'Angular 17 fundamentals',       description: 'Components, services, routing, RxJS observables và standalone APIs.',              level: 'Beginner',     duration: '26h' },
    { id: 'c8',  langId: 'ts', frameworkId: 'nestjs',  title: 'Backend APIs với NestJS',       description: 'Modular architecture, guards, interceptors, Prisma ORM và Swagger.',               level: 'Advanced',     duration: '20h' },
    { id: 'c9',  langId: 'ts', frameworkId: 'nextjs',  title: 'Next.js 14 Full-stack TS',      description: 'Server Actions, tRPC, Prisma và deployment pipeline hoàn chỉnh.',                  level: 'Advanced',     duration: '28h' },
    { id: 'c10', langId: 'py', frameworkId: 'django',  title: 'Django web development',        description: 'ORM, views, templates, REST framework và deployment lên AWS.',                     level: 'Beginner',     duration: '30h' },
    { id: 'c11', langId: 'py', frameworkId: 'fastapi', title: 'FastAPI microservices',         description: 'Async endpoints, Pydantic schemas, OAuth2, Docker và Kubernetes.',                 level: 'Intermediate',  duration: '18h' },
    { id: 'c12', langId: 'py', frameworkId: 'flask',   title: 'Flask cho APIs',                description: 'Blueprints, SQLAlchemy, JWT auth và deployment trên Railway.',                     level: 'Beginner',     duration: '12h' },
    { id: 'c13', langId: 'py', frameworkId: 'pytorch', title: 'Deep learning với PyTorch',     description: 'Tensors, autograd, CNNs, transformers và model deployment.',                       level: 'Advanced',     duration: '40h' },
    { id: 'c14', langId: 'java', frameworkId: 'spring',label: 'Spring Boot mastery',           description: 'REST APIs, Spring Security, JPA, microservices và reactive streams.',              level: 'Intermediate',  duration: '32h' } as unknown as Course,
    { id: 'c15', langId: 'go',   frameworkId: 'gin',   title: 'Go REST APIs với Gin',          description: 'Routing, middleware, GORM, JWT và containerized deployment.',                       level: 'Intermediate',  duration: '16h' },
    { id: 'c16', langId: 'rust', frameworkId: 'actix', title: 'Web services trong Rust',       description: 'Actix-web handlers, async I/O, PostgreSQL với SQLx và error handling.',            level: 'Advanced',     duration: '24h' },
];