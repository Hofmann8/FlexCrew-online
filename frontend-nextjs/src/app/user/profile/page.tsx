'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { bookingApi } from '@/services/api';
import { Course } from '@/types';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

// 角色映射
const roleNames = {
    'admin': '超级管理员',
    'leader': '舞种领队',
    'member': '普通社员'
};

// 舞种类型映射
const danceTypeNames: Record<string, string> = {
    'breaking': 'Breaking',
    'popping': 'Popping',
    'locking': 'Locking',
    'hiphop': 'Hip-hop',
    'urban': '都市',
    'jazz': '爵士',
    'waacking': 'Waacking',
    'house': 'House',
    'kpop': 'K-pop'
};

export default function UserProfilePage() {
    const router = useRouter();
    const { user, isAuthenticated, logout } = useAuth();
    const [bookings, setBookings] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        // 如果未登录，重定向到登录页面
        if (!isAuthenticated) {
            router.push('/auth/login?redirect=/user/profile');
            return;
        }

        // 只有普通社员需要加载预订信息
        if (user?.role === 'member') {
            loadUserBookings();
        } else {
            setLoading(false);
        }
    }, [isAuthenticated, router, user]);

    const loadUserBookings = async () => {
        try {
            setLoading(true);
            const bookingsData = await bookingApi.getUserBookings();
            setBookings(bookingsData);
        } catch (err) {
            setError('获取预订信息失败');
            toast.error('获取预订信息失败', { position: 'top-center' });
        } finally {
            setLoading(false);
        }
    };

    const handleCancelBooking = async (courseId: string) => {
        try {
            setActionLoading(true);
            const success = await bookingApi.cancelBooking(courseId);

            if (success) {
                // 成功取消预订后，重新加载预订列表
                await loadUserBookings();
                toast.success('成功取消预订', { position: 'top-center' });
            } else {
                setError('取消预订失败，请稍后再试');
                toast.error('取消预订失败，请稍后再试', { position: 'top-center' });
            }
        } catch (err) {
            setError('取消预订失败');
            toast.error('取消预订失败', { position: 'top-center' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    if (!isAuthenticated) {
        return null; // 重定向处理中
    }

    if (loading) {
        return (
            <main className="min-h-screen pt-24 pb-16">
                <div className="container mx-auto px-4 max-w-4xl">
                    <div className="text-center py-10">加载中...</div>
                </div>
            </main>
        );
    }

    // 获取角色名称
    const roleName = roleNames[user?.role as keyof typeof roleNames] || '未知角色';

    // 获取舞种名称（针对领队）
    const danceTypeName = user?.dance_type
        ? (danceTypeNames[user.dance_type] || user.dance_type)
        : '';

    return (
        <main className="min-h-screen pt-24 pb-16">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="p-6 bg-blue-50 border-b border-blue-100">
                        <h1 className="text-2xl font-bold text-gray-800">个人信息</h1>
                    </div>

                    <div className="p-6">
                        <div className="flex flex-col md:flex-row items-start gap-8">
                            <div className="w-full md:w-1/3 flex flex-col items-center">
                                <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center text-5xl text-gray-400 mb-4">
                                    {user?.username.charAt(0).toUpperCase()}
                                </div>
                                <h2 className="text-xl font-semibold mb-1">{user?.username}</h2>
                                <p className="text-gray-500 mb-2">{user?.email}</p>

                                {/* 用户角色信息 */}
                                <div className="mb-4 flex flex-col items-center">
                                    <div className={`px-3 py-1 rounded-full text-sm font-medium mb-2
                                        ${user?.role === 'admin' ? 'bg-red-100 text-red-800' :
                                            user?.role === 'leader' ? 'bg-blue-100 text-blue-800' :
                                                'bg-green-100 text-green-800'}`}>
                                        {roleName}
                                    </div>

                                    {/* 舞种领队显示舞种类型 */}
                                    {user?.role === 'leader' && user?.dance_type && (
                                        <div className="text-sm text-gray-600">
                                            负责舞种: {danceTypeName}
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={handleLogout}
                                    className="w-full py-2 px-4 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                >
                                    退出登录
                                </button>
                            </div>

                            <div className="w-full md:w-2/3">
                                {/* 超级管理员部分 */}
                                {user?.role === 'admin' && (
                                    <div>
                                        <h3 className="text-xl font-semibold mb-4 border-l-4 border-red-500 pl-3">管理功能</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Link
                                                href="/admin/users"
                                                className="block p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-center"
                                            >
                                                <div className="font-medium">用户管理</div>
                                                <div className="text-sm text-gray-500">管理所有用户账号</div>
                                            </Link>
                                        </div>
                                    </div>
                                )}

                                {/* 舞种领队部分 */}
                                {user?.role === 'leader' && user?.dance_type && (
                                    <div>
                                        <h3 className="text-xl font-semibold mb-4 border-l-4 border-blue-500 pl-3">领队功能</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Link
                                                href={`/leaders/${user.dance_type}`}
                                                className="block p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-center"
                                            >
                                                <div className="font-medium">我的舞种</div>
                                                <div className="text-sm text-gray-500">查看{danceTypeName}舞种信息</div>
                                            </Link>
                                        </div>
                                        <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-gray-700">
                                            <p className="mb-2">作为舞种领队，您负责{danceTypeName}舞种的发展。</p>
                                            <p>您不需要预约课程，可以直接参加所有课程。</p>
                                        </div>
                                    </div>
                                )}

                                {/* 普通社员部分 - 课程预约 */}
                                {user?.role === 'member' && (
                                    <div>
                                        <h3 className="text-xl font-semibold mb-4 border-l-4 border-green-500 pl-3">已预订课程</h3>

                                        {error && (
                                            <div className="mb-4 p-3 bg-red-50 text-red-500 rounded">
                                                {error}
                                            </div>
                                        )}

                                        {bookings.length === 0 ? (
                                            <div className="text-center py-8 bg-gray-50 rounded">
                                                <p className="text-gray-500 mb-4">您还没有预订任何课程</p>
                                                <Link
                                                    href="/schedule"
                                                    className="inline-block py-2 px-6 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
                                                >
                                                    浏览课程表
                                                </Link>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 gap-4">
                                                {bookings.map(course => (
                                                    <div key={course.id} className="p-4 border rounded-lg hover:shadow-md transition">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <h4 className="font-semibold mb-1">{course.name}</h4>
                                                                <p className="text-sm text-gray-600">教练: {course.instructor}</p>
                                                                <p className="text-sm text-gray-600">地点: {course.location}</p>
                                                                <p className="text-sm text-gray-600">时间: {course.weekday} {course.originalTimeSlot || course.timeSlot}</p>
                                                                {course.dance_type && (
                                                                    <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-xs rounded">
                                                                        {danceTypeNames[course.dance_type as keyof typeof danceTypeNames] || course.dance_type}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <button
                                                                onClick={() => handleCancelBooking(course.id)}
                                                                disabled={actionLoading}
                                                                className="py-1 px-3 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors disabled:opacity-50"
                                                            >
                                                                {actionLoading ? '取消中...' : '取消预订'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
} 