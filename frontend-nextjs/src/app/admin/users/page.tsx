"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { userApi } from '@/services/api';
import { User } from '@/types';
import { toast } from 'react-hot-toast';

export default function AdminUsersPage() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'all' | 'admin' | 'leader' | 'member'>('all');
    const [error, setError] = useState<string | null>(null);

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

    const fetchUsers = async (tab: 'all' | 'admin' | 'leader' | 'member') => {
        try {
            setLoading(true);
            setError(null);
            let data;

            if (tab === 'all') {
                data = await userApi.getAllUsers();
            } else {
                data = await userApi.getUsersByRole(tab);
            }

            if (Array.isArray(data)) {
                setUsers(data);
            } else {
                setError('加载用户数据失败');
                toast.error('加载用户数据失败', { position: 'top-center' });
            }
        } catch (err) {
            // console.error('获取用户数据出错:', err);
            setError('获取用户数据时发生错误');
            toast.error('获取用户数据失败', { position: 'top-center' });
        } finally {
            setLoading(false);
        }
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
                {/* 角色筛选标签页 */}
                <div className="flex border-b mb-6">
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
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {users.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-4 text-center text-gray-500">
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
                                                {user.dance_type || '-'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </main>
    );
} 