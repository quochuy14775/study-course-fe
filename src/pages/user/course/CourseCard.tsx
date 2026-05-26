import React, {useState} from 'react';
import {Course, Level} from "../../../types/course";



interface CourseCardProps {
    course: Course;
    variant: 'free' | 'pro';
}

const CourseCard: React.FC<CourseCardProps> = ({course, variant}) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isAdded, setIsAdded] = useState(false);

    const handleEnroll = () => {
        if (variant === 'free') {
            console.log(`Enrolled in: ${course.title}`);
            setIsAdded(true);
            setTimeout(() => setIsAdded(false), 2000);
        }
    };

    const handlePurchase = () => {
        console.log(`Purchased: ${course.title}`);
        setIsAdded(true);
        setTimeout(() => setIsAdded(false), 2000);
    };

    const handleAddToWishlist = () => {
        console.log(`Added to wishlist: ${course.title}`);
    };

    const getLevelColor = (level: Level | string) => {
        const levelStr = typeof level === 'string' ? level : (Level as any)[level];
        switch (levelStr) {
            case 'Beginner':
                return 'bg-green-100 text-green-800';
            case 'Intermediate':
                return 'bg-yellow-100 text-yellow-800';
            case 'Advanced':
                return 'bg-purple-100 text-purple-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getRatingColor = (rating: number) => {
        if (rating >= 4.8) return 'text-yellow-400';
        if (rating >= 4.5) return 'text-yellow-400';
        return 'text-gray-400';
    };

    return (
        <div
            className={`relative  bg-white rounded-3xl shadow-md hover:shadow-2xl transition-shadow duration-300 overflow-hidden flex flex-col h-[31rem] ${
                variant === 'pro' && course.isFeatured ? 'ring-2 ring-[#fb7185]' : ''
            }`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Featured Badge */}
            {variant === 'pro' && course.isFeatured && (
                <div className="bg-gradient-to-r from-[#fb7185] to-[#f97316] text-white px-3 py-1 text-xs font-bold">
                    ⭐ FEATURED
                </div>
            )}

            {/* Course Image/Icon */}
            <div
                className="bg-gradient-to-br from-blue-50 to-indigo-50 h-48 flex items-center justify-center text-7xl overflow-hidden">
                {course.imageUrl}
            </div>

            {/* Course Content */}
            <div
                className={`p-5 transition-all duration-500 ease-in-out overflow-hidden bg-white flex flex-col ${
                    isHovered ? 'h-[100%]' : 'h-[60%]'
                }`}
            >
                {/* Level Badge */}
                <div className="mb-3">
         <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getLevelColor(course.level)}`}>
            {typeof course.level === 'string' ? course.level : (Level as any)[course.level]}
          </span>
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{course.title}</h3>

                {/* Description */}
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{course.description}</p>


                {/* Rating and Students */}
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                        <div className="flex">
                            {[...Array(5)].map((_, i) => (
                                <span key={i} className={`text-lg ${getRatingColor(course.rating)}`}>
                  ★
                </span>
                            ))}
                        </div>
                        <span className="text-sm font-semibold text-gray-800">{course.rating}</span>
                    </div>
                    {/*<span className="text-xs text-gray-500">{course.students.toLocaleString()} students</span>*/}
                </div>

                {/* Price and Actions */}
                <div className="flex items-center justify-between">
                    <div>
                        {variant === 'free' ? (
                            <div className="text-2xl font-bold text-green-600">FREE</div>
                        ) : (
                            <div className="text-2xl font-bold text-gray-900">${course.price}</div>
                        )}
                    </div>

                    <div className="flex gap-2">
                        {/* Wishlist Button */}
                        <button
                            onClick={handleAddToWishlist}
                            className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                            title="Add to wishlist"
                        >
                            ♡
                        </button>

                        {/* Enroll/Purchase Button */}
                        {variant === 'free' ? (
                            <button
                                onClick={handleEnroll}
                                className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                                    isAdded
                                        ? 'bg-green-500 text-white'
                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                            >
                                {isAdded ? '✓ Enrolled' : 'Enroll Free'}
                            </button>
                        ) : (
                            <button
                                onClick={handlePurchase}
                                className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                                    isAdded
                                        ? 'bg-green-500 text-white'
                                        : 'bg-gradient-to-r from-[#fb7185] to-[#06b6d4] text-white hover:brightness-105'
                                }`}
                            >
                                {isAdded ? '✓ Added' : 'Buy Now'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Hover Effect - Additional Info (expands into reserved space) */}
            <div
                className={`absolute bottom-0 left-0 w-full px-5 pb-4 pt-3
    bg-gradient-to-t from-white via-white to-transparent
    transition-all duration-500 ease-in-out
    ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full'}
  `}
            >
                <div className="text-sm text-gray-700">
                    <p className="font-semibold mb-1">What you'll learn:</p>
                    <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                        <li>Master core concepts</li>
                        <li>Build real projects</li>
                        <li>Get certification</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default CourseCard;
