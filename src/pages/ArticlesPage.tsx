import React, { useEffect, useState } from 'react';
import { Clock, User, Eye, ThumbsUp } from 'lucide-react';

interface Article {
  id: number;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  category: string;
  readTime: number;
  views: number;
  likes: number;
  image: string;
}

const ArticlesPage: React.FC = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  const articles: Article[] = [
    {
      id: 1,
      title: 'React Hooks: Một hướng dẫn hoàn chỉnh',
      excerpt: 'Tìm hiểu về React Hooks và cách sử dụng chúng để viết các component hiệu quả hơn',
      author: 'John Doe',
      date: '15 Apr 2024',
      category: 'React',
      readTime: 8,
      views: 2500,
      likes: 340,
      image: '📘',
    },
    {
      id: 2,
      title: 'TypeScript Best Practices',
      excerpt: 'Những thực tiễn tốt nhất để viết mã TypeScript sạch và an toàn',
      author: 'Jane Smith',
      date: '12 Apr 2024',
      category: 'TypeScript',
      readTime: 10,
      views: 1850,
      likes: 280,
      image: '📕',
    },
    {
      id: 3,
      title: 'CSS Grid vs Flexbox: Khi nào dùng cái nào?',
      excerpt: 'So sánh CSS Grid và Flexbox, hiểu rõ khi nào nên sử dụng mỗi cái',
      author: 'Mike Johnson',
      date: '10 Apr 2024',
      category: 'CSS',
      readTime: 6,
      views: 3200,
      likes: 450,
      image: '📗',
    },
    {
      id: 4,
      title: 'State Management trong React',
      excerpt: 'So sánh Context API, Redux, Zustand và các giải pháp state management khác',
      author: 'Sarah Williams',
      date: '8 Apr 2024',
      category: 'React',
      readTime: 12,
      views: 2100,
      likes: 320,
      image: '📙',
    },
    {
      id: 5,
      title: 'Web Performance Optimization',
      excerpt: 'Những kỹ thuật để tối ưu hóa hiệu suất website của bạn',
      author: 'John Doe',
      date: '5 Apr 2024',
      category: 'Performance',
      readTime: 11,
      views: 1600,
      likes: 220,
      image: '📘',
    },
    {
      id: 6,
      title: 'Docker cho Developers',
      excerpt: 'Hướng dẫn sử dụng Docker để containerize ứng dụng của bạn',
      author: 'Jane Smith',
      date: '2 Apr 2024',
      category: 'DevOps',
      readTime: 9,
      views: 1400,
      likes: 180,
      image: '📕',
    },
  ];

  const categories = ['Tất cả', 'React', 'TypeScript', 'CSS', 'Performance', 'DevOps'];

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      React: 'bg-blue-50 text-blue-700 border-blue-100',
      TypeScript: 'bg-indigo-50 text-indigo-700 border-indigo-100',
      CSS: 'bg-purple-50 text-purple-700 border-purple-100',
      Performance: 'bg-green-50 text-green-700 border-green-100',
      DevOps: 'bg-orange-50 text-orange-700 border-orange-100',
    };
    return colors[category] || 'bg-slate-100 text-slate-700 border-slate-200';
  };

  // base card classes used throughout
  const baseCard = 'bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(0,0,0,0.08)] hover:border-slate-300 overflow-hidden';
  const featuredEnhance = 'bg-gradient-to-br from-white to-slate-50 shadow-lg scale-[1.01]';

  // helper to compute stagger class
  const staggerClass = (idx: number) =>
    `${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} transition-all duration-500 delay-[${idx * 80}ms]`;

  return (
    <main className="min-h-screen bg-ink-50 relative">
      <div className="absolute inset-0 bg-grid-pattern bg-grid pointer-events-none opacity-50" />
      <div className="relative max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Header */}
        <section className="mb-8 animate-fade-in-up">
          <div className="flex items-center gap-2 text-xs font-mono text-primary-600 mb-2">
            <span className="text-ink-400">~/</span>
            <span>articles</span>
            <span className="inline-block w-1.5 h-3 bg-primary-600 animate-blink" />
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-ink-900 mb-2 sm:mb-3">Bài viết</h1>
          <p className="text-lg text-ink-600">Đọc các bài viết mới nhất về lập trình, công nghệ web, và phát triển phần mềm</p>
        </section>

        {/* Categories Filter */}
        <div className="mb-10 flex flex-wrap gap-3">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                cat === 'Tất cả'
                  ? 'bg-gradient-to-r from-[#06b6d4] to-[#60a5fa] text-white shadow-sm'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Editorial Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* HERO FEATURED (spans 2 columns on md) */}
          <article
            className={`${baseCard} ${featuredEnhance} md:col-span-2 relative h-96 p-0 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} transition-all duration-700`}
            style={{ willChange: 'transform, opacity' }}
          >
            {/* image area */}
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-slate-50 to-white">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-[#e6f3ff] via-transparent to-transparent opacity-40" />
            </div>

            <div className="flex h-full">
              <div className="w-1/2 flex items-end p-8">
                <div className="w-full">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-4 ${getCategoryColor(articles[0].category)} border`}>
                    {articles[0].category}
                  </span>

                  <h2 className="text-3xl md:text-4xl font-semibold text-slate-900 leading-snug mb-3">
                    {articles[0].title}
                  </h2>

                  <p className="text-slate-600 text-base mb-6">{articles[0].excerpt}</p>

                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>{articles[0].author}</span>
                    </div>
                    <span>{articles[0].date}</span>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{articles[0].readTime} phút</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-1/2 p-8 flex items-center justify-center">
                {/* abstract cover */}
                <div className="w-full h-64 rounded-lg flex items-center justify-center bg-gradient-to-br from-[#dbeafe] to-[#f0f9ff] border border-slate-100">
                  <div className="text-6xl">{articles[0].image}</div>
                </div>
              </div>
            </div>
          </article>

          {/* SECONDARY FLOW ROW: 2 small cards + 1 tall side card */}
          <div className="md:col-span-1 flex flex-col gap-6">
            <div className={`${baseCard} p-4 h-40 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} transition-all duration-500`}>
              <div className="flex gap-4 h-full">
                <div className="w-1/3 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[#eef2ff] to-[#f0fdf4] flex items-center justify-center text-2xl">{articles[1].image}</div>
                </div>
                <div className="w-2/3">
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-2 ${getCategoryColor(articles[1].category)} border`}>{articles[1].category}</span>
                  <h3 className="text-lg font-semibold text-slate-900 leading-snug line-clamp-2">{articles[1].title}</h3>
                  <p className="text-sm text-slate-600 mt-2 line-clamp-2">{articles[1].excerpt}</p>
                </div>
              </div>
            </div>

            <div className={`${baseCard} p-4 h-40 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} transition-all duration-600`}>
              <div className="flex gap-4 h-full">
                <div className="w-1/3 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[#fff7ed] to-[#fff1f2] flex items-center justify-center text-2xl">{articles[2].image}</div>
                </div>
                <div className="w-2/3">
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-2 ${getCategoryColor(articles[2].category)} border`}>{articles[2].category}</span>
                  <h3 className="text-lg font-semibold text-slate-900 leading-snug line-clamp-2">{articles[2].title}</h3>
                  <p className="text-sm text-slate-600 mt-2 line-clamp-2">{articles[2].excerpt}</p>
                </div>
              </div>
            </div>

            <div className={`${baseCard} p-6 h-96 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} transition-all duration-700`}>
              <div className="flex flex-col h-full">
                <div className="flex-1">
                  <div className="w-full h-48 rounded-lg mb-4 bg-gradient-to-br from-[#eafff5] to-[#f0f9ff] flex items-center justify-center text-4xl">{articles[3].image}</div>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(articles[3].category)} border mb-2`}>{articles[3].category}</span>
                  <h3 className="text-xl font-semibold text-slate-900 leading-snug">{articles[3].title}</h3>
                </div>

                <div className="mt-4 text-xs text-slate-500 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>{articles[3].author}</span>
                    </div>
                    <span>{articles[3].date}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600">
                    <div className="flex items-center gap-1"><Eye className="w-4 h-4" /> <span>{articles[3].views}</span></div>
                    <div className="flex items-center gap-1 text-red-500"><ThumbsUp className="w-4 h-4" /> <span>{articles[3].likes}</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* THIRD SECTION: Asymmetric grid */}
        <section className="mt-8 grid grid-cols-1 md:grid-cols-6 gap-6">
          <div className={`${baseCard} md:col-span-3 p-6 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} transition-all duration-600`}>
            <div className="flex items-center gap-4">
              <div className="w-36 h-24 rounded-md bg-gradient-to-br from-[#eef2ff] to-[#fff] flex items-center justify-center text-3xl">{articles[4].image}</div>
              <div>
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(articles[4].category)} border`}>{articles[4].category}</span>
                <h4 className="text-xl font-semibold text-slate-900 leading-snug mt-2">{articles[4].title}</h4>
                <p className="text-sm text-slate-600 mt-2 line-clamp-2">{articles[4].excerpt}</p>
              </div>
            </div>
          </div>

          <div className={`${baseCard} md:col-span-2 p-6 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} transition-all duration-700`}>
            <div>
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(articles[5].category)} border`}>{articles[5].category}</span>
              <h4 className="text-lg font-semibold text-slate-900 leading-snug mt-3">{articles[5].title}</h4>
              <p className="text-sm text-slate-600 mt-2 line-clamp-3">{articles[5].excerpt}</p>
            </div>
          </div>

          <div className={`${baseCard} md:col-span-1 p-4 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} transition-all duration-800`}>
            <div className="text-sm text-slate-600">More stories</div>
            <ul className="mt-3 space-y-3 text-sm">
              {articles.slice(0, 3).map((a) => (
                <li key={`more-${a.id}`} className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-md bg-slate-100 flex items-center justify-center text-base">{a.image}</div>
                  <div>
                    <div className="text-slate-900 font-medium">{a.title}</div>
                    <div className="text-xs text-slate-500">{a.date}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* DIVIDER */}
        <div className="mt-12 border-t border-slate-200/60 pt-6">
          <div className="text-sm uppercase text-slate-500 mb-4">Latest stories</div>

          {/* FINAL FEED: hybrid list + cards */}
          <div className="space-y-4">
            {articles.map((article, idx) => (
              <article
                key={`feed-${article.id}`}
                className={`${baseCard} p-4 flex items-center gap-4 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'} transition-all duration-500`}
                style={{ transitionDelay: `${idx * 60}ms` }}
              >
                <div className="w-20 h-14 rounded-md flex-shrink-0 bg-gradient-to-br from-slate-50 to-white flex items-center justify-center text-2xl">{article.image}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-4">
                    <h5 className="text-lg font-semibold text-slate-900 line-clamp-2">{article.title}</h5>
                    <div className="text-xs text-slate-500">{article.date}</div>
                  </div>
                  <p className="text-sm text-slate-600 mt-2 line-clamp-2">{article.excerpt}</p>
                  <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-2"><User className="w-4 h-4" />{article.author}</div>
                    <div className="flex items-center gap-2"><Clock className="w-4 h-4" />{article.readTime} phút</div>
                    <div className="flex items-center gap-2"><Eye className="w-4 h-4" />{article.views}</div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="text-center mt-8">
            <button className="px-8 py-3 bg-gradient-to-r from-[#06b6d4] to-[#60a5fa] text-white rounded-lg hover:brightness-105 transition-all font-medium shadow-sm">
              Xem thêm bài viết
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};


export default ArticlesPage;
