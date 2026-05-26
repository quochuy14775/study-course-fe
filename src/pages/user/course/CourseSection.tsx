import React from 'react';
import CourseCard from './CourseCard';
import {Course} from "../../../types/course";



interface CourseSectionProps {
  title: string;
  subtitle: string;
  courses: Course[];
  variant: 'free' | 'pro';
}

const CourseSection: React.FC<CourseSectionProps> = ({ title, subtitle, courses, variant }) => {
  return (
    <section className="mb-16">
      {/* Section Header */}
      <div className="mb-10">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">{title}</h2>
        <p className="text-lg text-slate-600">{subtitle}</p>
        {variant === 'pro' && (
          <div className="mt-2 inline-block">
            <span className="px-3 py-1 bg-gradient-to-r from-[#fb7185] to-[#f97316] text-white text-xs font-bold rounded-full">
              PREMIUM ✨
            </span>
          </div>
        )}
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} variant={variant} />
        ))}
      </div>
    </section>
  );
};

export default CourseSection;

