'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { bookingApi, userApi, leaderApi } from '@/services/api';
import { Course, DANCE_TYPES } from '@/types';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { FiUser, FiMail, FiTag, FiEdit, FiLock, FiCalendar, FiMapPin, FiClock, FiUsers } from 'react-icons/fi';

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
    'house': 'House',
    'public': '公共课程'
};

export default function UserProfilePage() {
    const router = useRouter();
    const { user, isAuthenticated, logout, refreshUser } = useAuth();
    const [bookings, setBookings] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    // 模态框状态
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isDanceTypeModalOpen, setIsDanceTypeModalOpen] = useState(false);

    // 密码表单
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // 舞种表单
    const [danceTypeForm, setDanceTypeForm] = useState({
        dance_type: user?.dance_type || ''
    });

    // 添加舞种列表状态
    const [danceTypes, setDanceTypes] = useState<string[]>([]);
    const [loadingDanceTypes, setLoadingDanceTypes] = useState(false);

    useEffect(() => {
        // 如果未登录，重定向到登录页面
        if (!isAuthenticated) {
            router.push('/auth/login?redirect=/user/profile');
            return;
        }

        // 加载预订信息
        if (user?.role === 'member') {
            loadUserBookings();
        } else {
            setLoading(false);
        }

        // 初始化舞种表单
        if (user) {
            setDanceTypeForm({
                dance_type: user.dance_type || user.danceType || ''
            });
        }
    }, [isAuthenticated, router, user]);

    const loadUserBookings = async () => {
        try {
            setLoading(true);
            const response = await bookingApi.getUserBookings();

            // 后端已经按时间倒序排序，直接取前10条记录即可
            const bookingsData = Array.isArray(response) ? response.slice(0, 10) : [];
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

    // 密码表单处理
    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswordForm(prev => ({ ...prev, [name]: value }));
    };

    // 舞种表单处理
    const handleDanceTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setDanceTypeForm(prev => ({ ...prev, [name]: value }));
    };

    // 修改密码提交
    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 表单验证
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast.error('两次输入的新密码不一致', { position: 'top-center' });
            return;
        }

        try {
            setActionLoading(true);
            const response = await userApi.changePassword(
                passwordForm.currentPassword,
                passwordForm.newPassword
            );

            if (response && response.success) {
                toast.success('密码修改成功', { position: 'top-center' });
                setIsPasswordModalOpen(false);
                // 重置表单
                setPasswordForm({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
            } else {
                toast.error(response?.message || '密码修改失败', { position: 'top-center' });
            }
        } catch (err) {
            console.error('修改密码出错:', err);
            toast.error('密码修改失败，请检查当前密码是否正确', { position: 'top-center' });
        } finally {
            setActionLoading(false);
        }
    };

    // 添加加载舞种列表的函数
    const loadDanceTypes = async () => {
        setLoadingDanceTypes(true);
        try {
            // 从领队数据获取舞种列表
            const leadersData = await leaderApi.getAllLeaders();

            // 从领队数据中提取舞种类型
            const types = new Set<string>();

            // 确保leadersData是数组
            if (Array.isArray(leadersData)) {
                leadersData.forEach((leader: any) => {
                    // 考虑两种可能的属性名
                    const type = leader.dance_type || leader.danceType;
                    if (type) {
                        types.add(type);
                    }
                });
            } else if (leadersData.data && Array.isArray(leadersData.data)) {
                // 处理可能的包装在data属性中的数据
                leadersData.data.forEach((leader: any) => {
                    const type = leader.dance_type || leader.danceType;
                    if (type) {
                        types.add(type);
                    }
                });
            }

            // 添加公共课程选项
            types.add('public');

            setDanceTypes(Array.from(types));
        } catch (err) {
            console.error('获取舞种数据失败:', err);
            // 出错时使用默认舞种列表
            setDanceTypes(['breaking', 'popping', 'locking', 'hiphop', 'house', 'public']);
        } finally {
            setLoadingDanceTypes(false);
        }
    };

    // 打开舞种模态框时加载舞种列表
    const openDanceTypeModal = () => {
        setIsDanceTypeModalOpen(true);
        loadDanceTypes();
    };

    // 修改舞种提交
    const handleDanceTypeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user || !user.id) return;

        try {
            setActionLoading(true);

            // 只提供dance_type参数，不需要提供role参数
            const apiData = {
                dance_type: danceTypeForm.dance_type
            };

            const response = await userApi.updateUserRole(String(user.id), apiData);

            if (response && response.success) {
                toast.success('舞种更新成功', { position: 'top-center' });
                setIsDanceTypeModalOpen(false);

                // 使用refreshUser方法刷新用户信息，而不是刷新整个页面
                await refreshUser();
            } else {
                toast.error(response?.message || '舞种更新失败', { position: 'top-center' });
            }
        } catch (err) {
            console.error('更新舞种出错:', err);
            toast.error('舞种更新失败', { position: 'top-center' });
        } finally {
            setActionLoading(false);
        }
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

    // 获取舞种名称
    const danceTypeName = user?.dance_type
        ? (danceTypeNames[user.dance_type] || user.dance_type)
        : (user?.danceType
            ? (danceTypeNames[user.danceType] || user.danceType)
            : '');

    return (
        <main className="min-h-screen pt-24 pb-16 bg-gray-50">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg shadow-lg overflow-hidden mb-8">
                    <div className="p-8 text-white">
                        <h1 className="text-3xl font-bold mb-6">个人中心</h1>
                        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-5xl text-white shadow-lg">
                                {user?.username.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold mb-2">{user?.name}</h2>
                                <div className="space-y-3">
                                    <div className="flex items-center">
                                        <FiUser className="mr-2 text-yellow-400" />
                                        <span>{user?.username}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <FiMail className="mr-2 text-yellow-400" />
                                        <span>{user?.email}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <FiTag className="mr-2 text-yellow-400" />
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium
                                            ${user?.role === 'admin' ? 'bg-red-500 text-white' :
                                                user?.role === 'leader' ? 'bg-blue-500 text-white' :
                                                    'bg-green-500 text-white'}`}>
                                            {roleName}
                                        </span>
                                        {user?.role === 'leader' && danceTypeName && (
                                            <span className="ml-2 bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-medium">
                                                {danceTypeName}
                                            </span>
                                        )}
                                        {user?.role === 'member' && danceTypeName && (
                                            <span className="ml-2 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                                                {danceTypeName}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* 左侧栏 - 账户设置 */}
                    <div className="md:col-span-1">
                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            <div className="p-4 bg-gray-50 border-b">
                                <h3 className="text-lg font-semibold text-gray-800">账户设置</h3>
                            </div>
                            <div className="p-5 space-y-4">
                                {/* 修改密码按钮 */}
                                <button
                                    onClick={() => setIsPasswordModalOpen(true)}
                                    className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <div className="flex items-center">
                                        <FiLock className="mr-3 text-yellow-500" />
                                        <span className="font-medium">修改密码</span>
                                    </div>
                                    <FiEdit className="text-gray-400" />
                                </button>

                                {/* 修改舞种按钮 - 仅对普通社员可见 */}
                                {user?.role === 'member' && (
                                    <button
                                        onClick={openDanceTypeModal}
                                        className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <div className="flex items-center">
                                            <FiTag className="mr-3 text-yellow-500" />
                                            <span className="font-medium">修改舞种偏好</span>
                                        </div>
                                        <FiEdit className="text-gray-400" />
                                    </button>
                                )}

                                {/* 登出按钮 */}
                                <button
                                    onClick={handleLogout}
                                    className="w-full p-3 mt-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                >
                                    退出登录
                                </button>
                            </div>
                        </div>

                        {/* 角色特定功能 */}
                        {user?.role !== 'member' && (
                            <div className="bg-white rounded-lg shadow-md overflow-hidden mt-6">
                                <div className="p-4 bg-gray-50 border-b">
                                    <h3 className="text-lg font-semibold text-gray-800">
                                        {user?.role === 'admin' ? '管理员功能' : '领队功能'}
                                    </h3>
                                </div>
                                <div className="p-5">
                                    {user?.role === 'admin' && (
                                        <div className="space-y-3">
                                            <Link
                                                href="/admin/users"
                                                className="block p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                                            >
                                                <div className="font-medium">用户管理</div>
                                                <div className="text-sm text-gray-500 mt-1">管理所有用户账号</div>
                                            </Link>
                                            <Link
                                                href="/admin/courses"
                                                className="block p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                                            >
                                                <div className="font-medium">课程管理</div>
                                                <div className="text-sm text-gray-500 mt-1">管理所有课程</div>
                                            </Link>
                                        </div>
                                    )}

                                    {user?.role === 'leader' && user?.dance_type && (
                                        <div className="space-y-3">
                                            <Link
                                                href={`/leaders/${user.dance_type}`}
                                                className="block p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                                            >
                                                <div className="font-medium">我的舞种</div>
                                                <div className="text-sm text-gray-500 mt-1">查看 {danceTypeName} 舞种信息</div>
                                            </Link>
                                            <Link
                                                href="/leaders/courses"
                                                className="block p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                                            >
                                                <div className="font-medium">课程管理</div>
                                                <div className="text-sm text-gray-500 mt-1">管理我的课程</div>
                                            </Link>

                                            <div className="mt-4 p-4 bg-blue-50 rounded-lg text-sm text-gray-700">
                                                <p className="mb-2">作为舞种领队，您负责 {danceTypeName} 舞种的发展。</p>
                                                <p>您不需要预约课程，可以直接参加所有课程。</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 右侧栏 - 已预约课程 */}
                    <div className="md:col-span-2">
                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            <div className="p-4 bg-gray-50 border-b">
                                <h3 className="text-lg font-semibold text-gray-800">
                                    已预约课程
                                    <span className="text-sm font-normal text-gray-500 ml-2">
                                        (最近10条)
                                    </span>
                                </h3>
                            </div>

                            <div className="p-5">
                                {error && (
                                    <div className="mb-4 p-3 bg-red-50 text-red-500 rounded">
                                        {error}
                                    </div>
                                )}

                                {bookings.length === 0 ? (
                                    <div className="text-center py-10 bg-gray-50 rounded-lg">
                                        <p className="text-gray-500 mb-4">您还没有预订任何课程</p>
                                        <Link
                                            href="/schedule"
                                            className="inline-block py-2 px-6 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                                        >
                                            浏览课程表
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {bookings.map(course => (
                                            <div key={course.id} className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all">
                                                <div className="flex flex-col md:flex-row justify-between">
                                                    <div className="flex-1">
                                                        <h4 className="font-bold text-lg text-gray-800 mb-2">{course.name}</h4>
                                                        <div className="space-y-2">
                                                            <div className="flex items-center text-gray-600">
                                                                <FiUser className="mr-2 text-yellow-500" />
                                                                <span>教练: {course.instructor}</span>
                                                            </div>
                                                            <div className="flex items-center text-gray-600">
                                                                <FiMapPin className="mr-2 text-yellow-500" />
                                                                <span>地点: {course.location}</span>
                                                            </div>
                                                            <div className="flex items-center text-gray-600">
                                                                <FiCalendar className="mr-2 text-yellow-500" />
                                                                <span>日期: {course.courseDate || course.weekday}</span>
                                                            </div>
                                                            <div className="flex items-center text-gray-600">
                                                                <FiClock className="mr-2 text-yellow-500" />
                                                                <span>时间: {course.timeSlot}</span>
                                                            </div>
                                                            {(course.dance_type || course.danceType) && (
                                                                <span className="inline-block mt-2 px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
                                                                    {danceTypeNames[course.dance_type || course.danceType || ''] || course.dance_type || course.danceType}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="mt-4 md:mt-0 md:ml-4 flex items-start">
                                                        <button
                                                            onClick={() => handleCancelBooking(course.id)}
                                                            disabled={actionLoading}
                                                            className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                                                        >
                                                            {actionLoading ? '取消中...' : '取消预订'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 修改密码模态框 */}
            {isPasswordModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-xl font-medium mb-4">修改密码</h3>
                        <form onSubmit={handlePasswordSubmit}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">当前密码</label>
                                    <input
                                        type="password"
                                        name="currentPassword"
                                        value={passwordForm.currentPassword}
                                        onChange={handlePasswordChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">新密码</label>
                                    <input
                                        type="password"
                                        name="newPassword"
                                        value={passwordForm.newPassword}
                                        onChange={handlePasswordChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">确认新密码</label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={passwordForm.confirmPassword}
                                        onChange={handlePasswordChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                    />
                                </div>
                                <div className="flex justify-end">
                                    <Link
                                        href="/auth/forgot-password"
                                        onClick={() => setIsPasswordModalOpen(false)}
                                        className="text-sm text-yellow-600 hover:text-yellow-800"
                                    >
                                        忘记密码？
                                    </Link>
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setIsPasswordModalOpen(false)}
                                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    取消
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 disabled:opacity-50"
                                >
                                    {actionLoading ? '提交中...' : '确认修改'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 修改舞种模态框 */}
            {isDanceTypeModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-xl font-medium mb-4">修改舞种偏好</h3>
                        <form onSubmit={handleDanceTypeSubmit}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">舞种</label>
                                    <select
                                        name="dance_type"
                                        value={danceTypeForm.dance_type}
                                        onChange={handleDanceTypeChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                        disabled={loadingDanceTypes}
                                    >
                                        <option value="">无舞种偏好</option>
                                        {danceTypes.filter(type => type !== 'public').map(type => (
                                            <option key={type} value={type}>{danceTypeNames[type] || type}</option>
                                        ))}
                                    </select>
                                    {loadingDanceTypes && (
                                        <div className="mt-2 text-xs text-gray-500">正在加载舞种数据...</div>
                                    )}
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setIsDanceTypeModalOpen(false)}
                                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    取消
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 disabled:opacity-50"
                                >
                                    {actionLoading ? '提交中...' : '确认修改'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
} 