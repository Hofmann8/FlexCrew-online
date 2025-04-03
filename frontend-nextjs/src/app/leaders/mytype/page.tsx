"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { FiUser, FiCalendar, FiMapPin, FiClock } from 'react-icons/fi';
import { Course } from '@/types';

// 舞种类型的中文名称映射
const danceTypeNames: Record<string, string> = {
    'breaking': 'Breaking',
    'popping': 'Popping',
    'locking': 'Locking',
    'hiphop': 'Hip-hop',
    'urban': '都市',
    'jazz': '爵士',
    'waacking': 'Waacking',
    'house': 'House',
    'kpop': 'K-pop',
    'public': '公共课程'
};

export default function MyDanceTypePage() {
    const { user } = useAuth();
    const danceTypeStr = user?.dance_type || '';
    const danceTypeName = danceTypeNames[danceTypeStr] || danceTypeStr;

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [danceMembers, setDanceMembers] = useState<any[]>([]);
    const [recentCourses, setRecentCourses] = useState<Course[]>([]);

    useEffect(() => {
        const fetchDanceData = async () => {
            setLoading(true);
            setError(null);
            try {
                if (!danceTypeStr) {
                    setError('未能获取您的舞种信息');
                    setLoading(false);
                    return;
                }

                // 1. 获取舞种成员
                const membersResponse = await api.users.getUsersByDanceType(danceTypeStr);
                if (membersResponse.success && membersResponse.data) {
                    setDanceMembers(membersResponse.data);
                }

                // 2. 获取所有课程
                const coursesResponse = await api.adminCourses.getAllCourses();
                if (coursesResponse.success && coursesResponse.data) {
                    // 筛选属于当前舞种的课程
                    const typeCoursesAll = coursesResponse.data.filter(
                        (course: Course) => course.danceType === danceTypeStr
                    );

                    // 按照日期排序，获取最近的10节课
                    const sortedCourses = typeCoursesAll.sort((a: Course, b: Course) => {
                        // 如果使用课程日期字段
                        if (a.courseDate && b.courseDate) {
                            return new Date(b.courseDate).getTime() - new Date(a.courseDate).getTime();
                        }
                        // 如果使用星期几字段，则不做精确排序
                        return 0;
                    });

                    // 获取最近10节课
                    const recent = sortedCourses.slice(0, 10);

                    // 获取这些课程的详细信息，包括预约人员
                    const detailedCourses = await Promise.all(
                        recent.map(async (course: Course) => {
                            try {
                                const detailResponse = await api.courses.getCourseById(course.id);
                                return detailResponse.success && detailResponse.data ? detailResponse.data : course;
                            } catch (err) {
                                console.error(`获取课程 ${course.id} 详情失败:`, err);
                                return course;
                            }
                        })
                    );

                    setRecentCourses(detailedCourses);
                }
            } catch (err) {
                console.error('加载舞种数据时出错:', err);
                setError('加载数据时出错，请刷新页面重试');
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchDanceData();
        }
    }, [user, danceTypeStr]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-500 border-r-transparent"></div>
                    <p className="mt-2 text-gray-600">正在加载数据...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* 舞种信息标题 */}
            <div className="flex flex-col md:flex-row md:items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900 mb-2 md:mb-0">
                    {danceTypeName} 舞种管理
                </h1>
                <div className="text-sm text-gray-600">
                    领队: <span className="font-medium">{user?.name}</span>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            {/* 舞种成员列表 */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <div className="px-6 py-4 bg-indigo-50 border-b border-indigo-100">
                    <h2 className="text-lg font-semibold text-indigo-800 flex items-center">
                        <FiUser className="mr-2" />
                        舞种成员 ({danceMembers.length})
                    </h2>
                </div>
                <div className="divide-y divide-gray-200">
                    {danceMembers.length === 0 ? (
                        <p className="px-6 py-4 text-gray-500 text-center">暂无成员加入该舞种</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            姓名
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            用户名
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            邮箱
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            角色
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            注册时间
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {danceMembers.map((member) => (
                                        <tr key={member.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {member.name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-500">
                                                    {member.username}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-500">
                                                    {member.email}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${member.role === 'leader'
                                                    ? 'bg-indigo-100 text-indigo-800'
                                                    : 'bg-green-100 text-green-800'
                                                    }`}>
                                                    {member.role === 'leader' ? '领队' : '社员'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(member.created_at).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* 近期课程预约情况 */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <div className="px-6 py-4 bg-indigo-50 border-b border-indigo-100">
                    <h2 className="text-lg font-semibold text-indigo-800 flex items-center">
                        <FiCalendar className="mr-2" />
                        近期课程预约情况
                    </h2>
                </div>
                <div className="divide-y divide-gray-200">
                    {recentCourses.length === 0 ? (
                        <p className="px-6 py-4 text-gray-500 text-center">暂无课程安排</p>
                    ) : (
                        <div className="space-y-4 p-4">
                            {recentCourses.map((course) => (
                                <div key={course.id} className="bg-gray-50 rounded-lg p-4">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-3">
                                        <h3 className="text-base font-semibold text-gray-900 mb-1 md:mb-0">
                                            {course.name}
                                        </h3>
                                        <div className="flex items-center text-sm">
                                            <span className="mr-3 flex items-center">
                                                <FiClock className="mr-1 text-yellow-500" />
                                                {course.timeSlot}
                                            </span>
                                            <span className="flex items-center">
                                                <FiMapPin className="mr-1 text-yellow-500" />
                                                {course.location}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center text-sm text-gray-600 mb-3">
                                        <span className="mr-2">教师: {course.instructor}</span>
                                        <span>|</span>
                                        <span className="mx-2">预约: {course.bookedCount || (course.bookedBy?.length || 0)}/{course.maxCapacity}</span>
                                        <span>|</span>
                                        <span className="ml-2">日期: {course.courseDate || course.weekday}</span>
                                    </div>

                                    <div className="bg-white rounded border border-gray-200 p-3">
                                        <h4 className="font-medium text-sm text-gray-700 mb-2">预约名单：</h4>
                                        {!course.bookedBy || course.bookedBy.length === 0 ? (
                                            <p className="text-sm text-gray-500 italic">暂无人预约</p>
                                        ) : (
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1">
                                                {course.bookedBy.map((booking: any) => (
                                                    <div key={booking.id || booking.userId} className="text-sm">
                                                        {booking.name || booking.userName || '未知用户'}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}