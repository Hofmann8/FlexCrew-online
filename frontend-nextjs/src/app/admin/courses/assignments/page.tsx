'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { CourseAssignment } from '@/types';
import api from '@/services/api';
import Link from 'next/link';

const CourseAssignmentsPage = () => {
    const { user } = useAuth();
    const [assignments, setAssignments] = useState<CourseAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 加载数据
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // 获取课程分配数据
                const response = await api.adminCourses.getCourseAssignments();
                if (response.success && response.data) {
                    setAssignments(response.data);
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

    if (loading) {
        return <div className="flex justify-center items-center min-h-screen">加载中...</div>;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">课程归属管理</h2>
                <Link href="/admin/courses" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    返回课程管理
                </Link>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                    {error}
                </div>
            )}

            {assignments.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">没有找到课程分配数据</p>
                </div>
            ) : (
                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    舞种
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    领队
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    课程数
                                </th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    操作
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {assignments.map((assignment, index) => (
                                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="text-sm font-medium text-gray-900 capitalize">
                                                {assignment.danceType === 'public' ? '公共课程' : assignment.danceType}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {assignment.leaderName || '无领队'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {assignment.courseCount} 门课程
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <Link
                                            href={`/admin/courses?filter=${assignment.danceType}`}
                                            className="text-indigo-600 hover:text-indigo-900"
                                        >
                                            查看课程
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-blue-800 mb-2">课程归属说明</h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-blue-700">
                    <li>公共课程：不属于特定舞种，由管理员直接管理，所有社员均可报名</li>
                    <li>舞种课程：属于特定舞种，由相应的舞种领队管理</li>
                    <li>领队只能管理自己舞种的课程，不能管理其他舞种或公共课程</li>
                    <li>管理员可以管理所有课程，并可以修改课程的归属关系</li>
                </ul>
            </div>
        </div>
    );
};

export default CourseAssignmentsPage; 