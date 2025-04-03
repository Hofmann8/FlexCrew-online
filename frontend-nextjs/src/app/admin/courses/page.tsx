'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import CourseForm from '@/components/CourseForm';
import CourseCard from '@/components/CourseCard';
import { Course, CourseFormData, User } from '@/types';
import api from '@/services/api';

const AdminCourses = () => {
    const { user } = useAuth();
    const [courses, setCourses] = useState<Course[]>([]);
    const [leaders, setLeaders] = useState<User[]>([]);
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
                const coursesResponse = await api.adminCourses.getAllCourses();
                if (coursesResponse.success && coursesResponse.data) {
                    setCourses(coursesResponse.data);
                }

                // 获取领队数据
                const leadersResponse = await api.users.getUsersByRole('leader');
                if (leadersResponse.success && leadersResponse.data) {
                    setLeaders(leadersResponse.data);
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
            const response = await api.adminCourses.createCourse(data);
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
            const response = await api.adminCourses.updateCourse(currentCourse.id, data);
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

    // 课程分类
    const groupedCourses = courses.reduce((acc, course) => {
        const type = course.danceType || 'unsorted';
        if (!acc[type]) {
            acc[type] = [];
        }
        acc[type].push(course);
        return acc;
    }, {} as Record<string, Course[]>);

    if (loading) {
        return <div className="flex justify-center items-center min-h-screen">加载中...</div>;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">课程管理</h2>
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

            {courses.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">没有找到课程，点击"创建新课程"按钮添加</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* 公共课程 */}
                    {groupedCourses['public'] && groupedCourses['public'].length > 0 && (
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-4">公共课程</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {groupedCourses['public'].map(course => (
                                    <CourseCard
                                        key={course.id}
                                        course={course}
                                        onEdit={handleEditClick}
                                        onDelete={handleDeleteCourse}
                                        isAdmin={true}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 各舞种课程 */}
                    {Object.entries(groupedCourses)
                        .filter(([key]) => key !== 'public' && key !== 'unsorted')
                        .map(([danceType, danceTypeCourses]) => (
                            <div key={danceType}>
                                <h3 className="text-lg font-medium text-gray-900 mb-4 capitalize">
                                    {danceType} 课程
                                    <span className="ml-2 text-sm text-gray-500">
                                        ({danceTypeCourses.length}门)
                                    </span>
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {danceTypeCourses.map(course => (
                                        <CourseCard
                                            key={course.id}
                                            course={course}
                                            onEdit={handleEditClick}
                                            onDelete={handleDeleteCourse}
                                            isAdmin={true}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}

                    {/* 未分类课程 */}
                    {groupedCourses['unsorted'] && groupedCourses['unsorted'].length > 0 && (
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-4">未分类课程</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {groupedCourses['unsorted'].map(course => (
                                    <CourseCard
                                        key={course.id}
                                        course={course}
                                        onEdit={handleEditClick}
                                        onDelete={handleDeleteCourse}
                                        isAdmin={true}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
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
                            isAdmin={true}
                            leaders={leaders}
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
                                courseDate: currentCourse.courseDate || '',
                                timeSlot: currentCourse.timeSlot,
                                maxCapacity: currentCourse.maxCapacity,
                                description: currentCourse.description || '',
                                danceType: currentCourse.danceType || '',
                                leaderId: currentCourse.leaderId || ''
                            }}
                            onSubmit={handleUpdateCourse}
                            onCancel={() => {
                                setIsEditModalOpen(false);
                                setCurrentCourse(null);
                            }}
                            isAdmin={true}
                            leaders={leaders}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCourses; 