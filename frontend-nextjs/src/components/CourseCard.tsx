'use client';

import React from 'react';
import { Course } from '@/types';
import { FiCalendar, FiClock, FiMapPin, FiUser, FiUsers } from 'react-icons/fi';

interface CourseCardProps {
    course: Course;
    onEdit: (course: Course) => void;
    onDelete: (courseId: string) => void;
    onAssign?: (course: Course) => void;
    isAdmin: boolean;
}

const CourseCard: React.FC<CourseCardProps> = ({
    course,
    onEdit,
    onDelete,
    onAssign,
    isAdmin
}) => {
    const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

    // 处理删除确认
    const handleDeleteClick = () => {
        setShowDeleteConfirm(true);
    };

    // 取消删除
    const handleCancelDelete = () => {
        setShowDeleteConfirm(false);
    };

    // 确认删除
    const handleConfirmDelete = () => {
        onDelete(course.id);
        setShowDeleteConfirm(false);
    };

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-300">
            <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold text-gray-900 leading-tight mb-2">
                        {course.name}
                    </h3>

                    <div>
                        {course.danceType && (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${course.danceType === 'public'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                {course.danceType === 'public' ? '公共课程' : course.danceType}
                            </span>
                        )}
                    </div>
                </div>

                <div className="mt-3 space-y-2.5">
                    <div className="text-sm text-gray-600 flex items-center">
                        <FiUser className="mr-2 text-yellow-500 flex-shrink-0" />
                        <span className="font-medium mr-1">教师:</span> {course.instructor}
                    </div>

                    <div className="text-sm text-gray-600 flex items-center">
                        <FiMapPin className="mr-2 text-yellow-500 flex-shrink-0" />
                        <span className="font-medium mr-1">地点:</span> {course.location}
                    </div>

                    <div className="text-sm text-gray-600 flex items-center">
                        <FiCalendar className="mr-2 text-yellow-500 flex-shrink-0" />
                        <span className="font-medium mr-1">日期:</span> {course.weekday}
                    </div>

                    <div className="text-sm text-gray-600 flex items-center">
                        <FiClock className="mr-2 text-yellow-500 flex-shrink-0" />
                        <span className="font-medium mr-1">时间:</span> {course.timeSlot}
                    </div>

                    <div className="text-sm text-gray-600 flex items-center">
                        <FiUsers className="mr-2 text-yellow-500 flex-shrink-0" />
                        <span className="font-medium mr-1">容量:</span>
                        <span className={course.bookedCount >= course.maxCapacity ? 'text-red-600 font-medium' : ''}>
                            {course.bookedCount || course.bookedBy?.length || 0}/{course.maxCapacity}
                        </span>
                    </div>

                    {course.description && (
                        <div className="text-sm text-gray-600 mt-3 pt-2 border-t border-gray-100">
                            <span className="font-medium block mb-1">课程简介:</span>
                            <p className="text-gray-700 line-clamp-3">{course.description}</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 flex justify-end space-x-2">
                {isAdmin && onAssign && (
                    <button
                        type="button"
                        onClick={() => onAssign(course)}
                        className="px-3 py-1.5 text-xs font-medium text-yellow-700 bg-yellow-50 rounded-md hover:bg-yellow-100 transition-colors"
                    >
                        分配归属
                    </button>
                )}

                <button
                    type="button"
                    onClick={() => onEdit(course)}
                    className="px-3 py-1.5 text-xs font-medium text-yellow-700 bg-yellow-50 rounded-md hover:bg-yellow-100 transition-colors"
                >
                    编辑
                </button>

                {!showDeleteConfirm ? (
                    <button
                        type="button"
                        onClick={handleDeleteClick}
                        className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
                    >
                        删除
                    </button>
                ) : (
                    <div className="flex space-x-2">
                        <button
                            type="button"
                            onClick={handleCancelDelete}
                            className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                        >
                            取消
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirmDelete}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
                        >
                            确认删除
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CourseCard; 