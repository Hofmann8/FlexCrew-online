'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import CourseForm from '@/components/CourseForm';
import CourseCard from '@/components/CourseCard';
import { Course, CourseFormData } from '@/types';
import api from '@/services/api';

const LeaderCoursesPage = () => {
    const { user } = useAuth();
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 模态框状态
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [currentCourse, setCurrentCourse] = useState<Course | null>(null);

    // 加载数据
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // 获取课程数据
                const response = await api.adminCourses.getAllCourses();
                if (response.success && response.data) {
                    setCourses(response.data);
                }
            } catch (err) {
                setError('加载数据时出错');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // 创建课程
    const handleCreateCourse = async (data: CourseFormData) => {
        try {
            // 领队创建的课程自动设置为自己的舞种和领队ID
            const courseData = {
                ...data,
                danceType: user?.dance_type || '',
                leaderId: user?.id || ''
            };

            const response = await api.adminCourses.createCourse(courseData);
            if (response.success && response.data) {
                setCourses(prev => [...prev, response.data]);
                setIsCreateModalOpen(false);
            }
        } catch (err) {
            throw err;
        }
    };

    // 更新课程
    const handleUpdateCourse = async (data: CourseFormData) => {
        if (!currentCourse) return;

        try {
            // 领队更新的课程需要保持原有的舞种和领队ID
            const courseData = {
                ...data,
                danceType: currentCourse.danceType,
                leaderId: currentCourse.leaderId
            };

            const response = await api.adminCourses.updateCourse(currentCourse.id, courseData);
            if (response.success && response.data) {
                setCourses(prev =>
                    prev.map(course =>
                        course.id === currentCourse.id ? response.data : course
                    )
                );
                setIsEditModalOpen(false);
                setCurrentCourse(null);
            }
        } catch (err) {
            throw err;
        }
    };

    // 删除课程
    const handleDeleteCourse = async (courseId: string) => {
        try {
            const response = await api.adminCourses.deleteCourse(courseId);
            if (response.success) {
                setCourses(prev => prev.filter(course => course.id !== courseId));
            }
        } catch (err) {
            setError('删除课程时出错');
            console.error(err);
        }
    };

    // 编辑课程
    const handleEditClick = (course: Course) => {
        setCurrentCourse(course);
        setIsEditModalOpen(true);
    };

    // 过滤出领队可以管理的课程
    const manageableCourses = courses.filter(course =>
        course.danceType === user?.dance_type ||
        course.leaderId === user?.id
    );

    if (loading) {
        return <div className="flex justify-center items-center min-h-screen">加载中...</div>;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">我的课程管理</h2>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    创建新课程
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                    {error}
                </div>
            )}

            {manageableCourses.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">您当前没有管理的课程，点击"创建新课程"按钮添加</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {manageableCourses.map(course => (
                        <CourseCard
                            key={course.id}
                            course={course}
                            onEdit={handleEditClick}
                            onDelete={handleDeleteCourse}
                            isAdmin={false}
                        />
                    ))}
                </div>
            )}

            {/* 创建课程模态框 */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">创建新课程</h2>
                        <CourseForm
                            onSubmit={handleCreateCourse}
                            onCancel={() => setIsCreateModalOpen(false)}
                            isAdmin={false}
                            userDanceType={user?.dance_type || ''}
                        />
                    </div>
                </div>
            )}

            {/* 编辑课程模态框 */}
            {isEditModalOpen && currentCourse && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">编辑课程</h2>
                        <CourseForm
                            initialData={{
                                name: currentCourse.name,
                                instructor: currentCourse.instructor,
                                location: currentCourse.location,
                                weekday: currentCourse.weekday,
                                timeSlot: currentCourse.timeSlot,
                                maxCapacity: currentCourse.maxCapacity,
                                description: currentCourse.description || '',
                                // 领队不能修改课程归属
                                danceType: user?.dance_type || '',
                                leaderId: user?.id || ''
                            }}
                            onSubmit={handleUpdateCourse}
                            onCancel={() => {
                                setIsEditModalOpen(false);
                                setCurrentCourse(null);
                            }}
                            isAdmin={false}
                            userDanceType={user?.dance_type || ''}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeaderCoursesPage; 