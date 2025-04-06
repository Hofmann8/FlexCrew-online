"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { User, DANCE_TYPES } from '@/types';
import { toast } from 'react-hot-toast';

// 用户表单数据类型
interface UserFormData {
    username: string;
    name: string;
    email: string;
    password?: string;
    role: 'admin' | 'leader' | 'member';
    dance_type?: string;
}

export default function AdminUsersPage() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'all' | 'admin' | 'leader' | 'member'>('all');
    const [error, setError] = useState<string | null>(null);

    // 模态框状态
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | number | null>(null);

    // 添加舞种列表状态
    const [danceTypes, setDanceTypes] = useState<string[]>([]);
    const [loadingDanceTypes, setLoadingDanceTypes] = useState(false);

    // 表单数据
    const [formData, setFormData] = useState<UserFormData>({
        username: '',
        name: '',
        email: '',
        password: '',
        role: 'member',
        dance_type: ''
    });

    useEffect(() => {
        // 检查是否是管理员
        if (isAuthenticated && user && user.role !== 'admin') {
            toast.error('您没有权限访问此页面', { position: 'top-center' });
            router.push('/');
            return;
        }

        if (!isAuthenticated) {
            router.push('/auth/login?redirect=/admin/users');
            return;
        }

        fetchUsers(activeTab);
    }, [isAuthenticated, user, router, activeTab]);

    // 添加加载舞种列表的函数
    const loadDanceTypes = async () => {
        setLoadingDanceTypes(true);
        try {
            // 从领队数据获取舞种列表
            const leadersData = await api.leaders.getAllLeaders();

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

    // 获取用户列表
    const fetchUsers = async (tab: 'all' | 'admin' | 'leader' | 'member') => {
        try {
            setLoading(true);
            setError(null);

            console.log(`正在获取${tab}用户数据...`);

            let response;
            if (tab === 'all') {
                response = await api.users.getAllUsers();
            } else {
                response = await api.users.getUsersByRole(tab);
            }

            console.log('API响应数据:', response);

            // 处理不同格式的API响应
            if (response && response.success && Array.isArray(response.data)) {
                // 标准格式：{ success: true, data: [...] }
                console.log('成功获取用户数据，数量:', response.data.length);
                setUsers(response.data);
            } else if (response && Array.isArray(response)) {
                // 直接返回数组
                console.log('成功获取用户数据，数量:', response.length);
                setUsers(response);
            } else if (response && typeof response === 'object' && 'data' in response && Array.isArray(response.data)) {
                // 简单对象格式：{ data: [...] }
                console.log('成功获取用户数据，数量:', response.data.length);
                setUsers(response.data);
            } else {
                console.error('无法解析API响应格式:', response);
                setError('加载用户数据失败：无法解析响应格式');
                toast.error('加载用户数据失败', { position: 'top-center' });
            }
        } catch (err) {
            console.error('获取用户数据出错:', err);
            setError(`获取用户数据时发生错误: ${err instanceof Error ? err.message : '未知错误'}`);
            toast.error('获取用户数据失败', { position: 'top-center' });
        } finally {
            setLoading(false);
        }
    };

    // 创建用户
    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            console.log('创建用户数据:', formData);
            const response = await api.users.createUser(formData);

            if (response && response.success) {
                toast.success('用户创建成功', { position: 'top-center' });
                setIsCreateModalOpen(false);
                // 重置表单
                setFormData({
                    username: '',
                    name: '',
                    email: '',
                    password: '',
                    role: 'member',
                    dance_type: ''
                });
                // 刷新用户列表
                fetchUsers(activeTab);
            } else {
                toast.error(response.message || '创建用户失败', { position: 'top-center' });
            }
        } catch (err) {
            console.error('创建用户出错:', err);
            toast.error(`创建用户失败: ${err instanceof Error ? err.message : '未知错误'}`, { position: 'top-center' });
        }
    };

    // 更新用户角色
    const handleUpdateUserRole = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!currentUserId) return;

        try {
            const { role, dance_type } = formData;
            console.log(`更新用户 ${currentUserId} 角色:`, { role, dance_type });

            // 只提供dance_type，不再提供danceType
            const apiData = {
                role,
                dance_type
            };

            const response = await api.users.updateUserRole(String(currentUserId), apiData);

            if (response && response.success) {
                toast.success('用户角色更新成功', { position: 'top-center' });
                setIsEditModalOpen(false);
                setCurrentUserId(null);
                // 刷新用户列表
                fetchUsers(activeTab);
            } else {
                toast.error(response.message || '更新用户角色失败', { position: 'top-center' });
            }
        } catch (err) {
            console.error('更新用户角色出错:', err);
            toast.error(`更新用户角色失败: ${err instanceof Error ? err.message : '未知错误'}`, { position: 'top-center' });
        }
    };

    // 删除用户
    const handleDeleteUser = async () => {
        if (!currentUserId) return;

        try {
            console.log(`删除用户 ${currentUserId}`);
            const response = await api.users.deleteUser(String(currentUserId));

            if (response && response.success) {
                toast.success('用户删除成功', { position: 'top-center' });
                setIsDeleteModalOpen(false);
                setCurrentUserId(null);
                // 刷新用户列表
                fetchUsers(activeTab);
            } else {
                toast.error(response.message || '删除用户失败', { position: 'top-center' });
            }
        } catch (err) {
            console.error('删除用户出错:', err);
            toast.error(`删除用户失败: ${err instanceof Error ? err.message : '未知错误'}`, { position: 'top-center' });
        }
    };

    // 表单输入处理
    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // 修改打开编辑模态框方法，加载舞种列表
    const openEditModal = (userData: User) => {
        setCurrentUserId(userData.id);

        // 处理不同API格式返回的舞种字段
        const dance_type = userData.dance_type || userData.danceType || '';

        setFormData({
            username: userData.username,
            name: userData.name,
            email: userData.email,
            role: userData.role as 'admin' | 'leader' | 'member',
            dance_type
        });

        // 加载舞种列表
        loadDanceTypes();

        setIsEditModalOpen(true);
    };

    // 修改打开创建用户模态框方法，加载舞种列表
    const openCreateModal = () => {
        setFormData({
            username: '',
            name: '',
            email: '',
            password: '',
            role: 'member',
            dance_type: ''
        });

        // 加载舞种列表
        loadDanceTypes();

        setIsCreateModalOpen(true);
    };

    // 打开删除确认模态框
    const openDeleteModal = (userId: string | number) => {
        setCurrentUserId(userId);
        setIsDeleteModalOpen(true);
    };

    // 渲染角色标签
    const renderRoleTag = (role: string) => {
        const roleStyles = {
            admin: 'bg-red-100 text-red-800 border-red-200',
            leader: 'bg-blue-100 text-blue-800 border-blue-200',
            member: 'bg-green-100 text-green-800 border-green-200'
        };

        const roleNames = {
            admin: '超级管理员',
            leader: '舞种领队',
            member: '普通社员'
        };

        return (
            <span className={`text-xs px-2 py-1 rounded-full border ${roleStyles[role as keyof typeof roleStyles]}`}>
                {roleNames[role as keyof typeof roleNames] || role}
            </span>
        );
    };

    // 如果用户未登录或不是管理员，不渲染页面内容
    if (!isAuthenticated || (user && user.role !== 'admin')) {
        return (
            <div className="pt-16 flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
            </div>
        );
    }

    // 舞种类型映射
    const danceTypeNames: Record<string, string> = {
        'breaking': 'Breaking',
        'popping': 'Popping',
        'locking': 'Locking',
        'hiphop': 'Hip-hop',
        'house': 'House',
        'public': '公共课程'
    };

    return (
        <main className="pt-16">
            {/* 用户管理页面顶部 */}
            <div className="bg-black text-white py-16">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-3xl md:text-5xl font-bold mb-4">用户管理</h1>
                    <p className="text-xl max-w-2xl mx-auto">
                        管理系统用户，包括超级管理员、舞种领队和普通社员。
                    </p>
                </div>
            </div>

            {/* 用户管理内容 */}
            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-6">
                    {/* 角色筛选标签页 */}
                    <div className="flex border-b">
                        <button
                            className={`px-4 py-2 font-medium ${activeTab === 'all' ? 'border-b-2 border-yellow-500 text-yellow-500' : 'text-gray-500'}`}
                            onClick={() => setActiveTab('all')}
                        >
                            所有用户
                        </button>
                        <button
                            className={`px-4 py-2 font-medium ${activeTab === 'admin' ? 'border-b-2 border-yellow-500 text-yellow-500' : 'text-gray-500'}`}
                            onClick={() => setActiveTab('admin')}
                        >
                            超级管理员
                        </button>
                        <button
                            className={`px-4 py-2 font-medium ${activeTab === 'leader' ? 'border-b-2 border-yellow-500 text-yellow-500' : 'text-gray-500'}`}
                            onClick={() => setActiveTab('leader')}
                        >
                            舞种领队
                        </button>
                        <button
                            className={`px-4 py-2 font-medium ${activeTab === 'member' ? 'border-b-2 border-yellow-500 text-yellow-500' : 'text-gray-500'}`}
                            onClick={() => setActiveTab('member')}
                        >
                            普通社员
                        </button>
                    </div>

                    {/* 创建用户按钮 */}
                    <button
                        onClick={openCreateModal}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                    >
                        添加用户
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-10">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
                    </div>
                ) : error ? (
                    <div className="text-center py-10 text-red-500">
                        <p>{error}</p>
                        <button
                            onClick={() => fetchUsers(activeTab)}
                            className="mt-4 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
                        >
                            重新加载
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white rounded-lg overflow-hidden">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">用户名</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">姓名</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">邮箱</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">角色</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">舞种</th>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {users.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-4 text-center text-gray-500">
                                            暂无用户数据
                                        </td>
                                    </tr>
                                ) : (
                                    users.map(user => (
                                        <tr key={user.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm">{user.username}</td>
                                            <td className="px-4 py-3 text-sm">{user.name}</td>
                                            <td className="px-4 py-3 text-sm">{user.email}</td>
                                            <td className="px-4 py-3 text-sm">
                                                {renderRoleTag(user.role)}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {user.dance_type || user.danceType || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-right">
                                                <button
                                                    className="text-indigo-600 hover:text-indigo-900 mr-2"
                                                    onClick={() => openEditModal(user)}
                                                >
                                                    编辑
                                                </button>
                                                <button
                                                    className="text-red-600 hover:text-red-900"
                                                    onClick={() => openDeleteModal(user.id)}
                                                >
                                                    删除
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* 创建用户模态框 */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-medium mb-4">创建新用户</h3>
                        <form onSubmit={handleCreateUser}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
                                    <input
                                        type="text"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleFormChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleFormChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleFormChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleFormChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">角色</label>
                                    <select
                                        name="role"
                                        value={formData.role}
                                        onChange={handleFormChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    >
                                        <option value="member">普通社员</option>
                                        <option value="leader">舞种领队</option>
                                        <option value="admin">超级管理员</option>
                                    </select>
                                </div>
                                {formData.role === 'leader' || formData.role === 'member' ? (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">舞种</label>
                                        <select
                                            name="dance_type"
                                            value={formData.dance_type}
                                            onChange={handleFormChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                            disabled={loadingDanceTypes}
                                        >
                                            <option value="">无</option>
                                            {danceTypes.filter(type => type !== 'public').map(type => (
                                                <option key={type} value={type}>
                                                    {danceTypeNames[type] || type}
                                                </option>
                                            ))}
                                        </select>
                                        {loadingDanceTypes && (
                                            <div className="mt-2 text-xs text-gray-500">正在加载舞种数据...</div>
                                        )}
                                    </div>
                                ) : null}
                            </div>
                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    取消
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                                >
                                    创建
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 编辑用户模态框 */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-medium mb-4">编辑用户角色</h3>
                        <form onSubmit={handleUpdateUserRole}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">角色</label>
                                    <select
                                        name="role"
                                        value={formData.role}
                                        onChange={handleFormChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    >
                                        <option value="member">普通社员</option>
                                        <option value="leader">舞种领队</option>
                                        <option value="admin">超级管理员</option>
                                    </select>
                                </div>
                                {formData.role === 'leader' || formData.role === 'member' ? (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">舞种</label>
                                        <select
                                            name="dance_type"
                                            value={formData.dance_type}
                                            onChange={handleFormChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                            disabled={loadingDanceTypes}
                                        >
                                            <option value="">无</option>
                                            {danceTypes.filter(type => type !== 'public').map(type => (
                                                <option key={type} value={type}>
                                                    {danceTypeNames[type] || type}
                                                </option>
                                            ))}
                                        </select>
                                        {loadingDanceTypes && (
                                            <div className="mt-2 text-xs text-gray-500">正在加载舞种数据...</div>
                                        )}
                                    </div>
                                ) : null}
                            </div>
                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    取消
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                                >
                                    更新角色
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 删除用户确认模态框 */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-medium mb-4">确认删除</h3>
                        <p className="text-gray-600 mb-6">您确定要删除此用户吗？此操作不可撤销，用户的所有数据将被永久删除。</p>
                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                取消
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteUser}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                            >
                                确认删除
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
} 