'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { FiBook, FiUser } from 'react-icons/fi';

const LeaderLayout = ({ children }: { children: React.ReactNode }) => {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    // 检查用户是否是领队
    React.useEffect(() => {
        if (!isLoading && (!isAuthenticated || (user && user.role !== 'leader'))) {
            router.push('/auth/login');
        }
    }, [isLoading, isAuthenticated, user, router]);

    if (isLoading) {
        return <div className="flex justify-center items-center min-h-screen">加载中...</div>;
    }

    if (!isAuthenticated || (user && user.role !== 'leader')) {
        return null; // 返回空防止一瞬间看到内容
    }

    const navItems = [
        { href: '/leaders/courses', label: '课程管理', icon: <FiBook className="mr-2" /> },
        { href: '/leaders/mytype', label: '我的舞种', icon: <FiUser className="mr-2" /> },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col sm:flex-row sm:items-center mb-8">
                    <h1 className="text-3xl font-bold text-indigo-700">领队管理</h1>
                    <div className="mt-2 sm:mt-0 sm:ml-auto px-4 py-2 bg-indigo-50 rounded-full text-indigo-700 text-sm font-medium">
                        舞种: <span className="capitalize font-semibold">{user?.danceType || '未指定'}</span> | 领队: {user?.name || ''}
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-lg mb-8 overflow-hidden border border-gray-100">
                    <div className="flex overflow-x-auto border-b border-gray-100">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`px-6 py-4 flex items-center whitespace-nowrap transition-all duration-200 ${pathname.startsWith(item.href)
                                    ? 'bg-indigo-50 text-indigo-700 font-medium border-b-2 border-indigo-600'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                {item.icon}
                                {item.label}
                            </Link>
                        ))}
                    </div>
                    <div className="p-6">
                        {children}
                    </div>
                </div>

                <div className="text-center text-gray-500 text-sm mt-8">
                    © {new Date().getFullYear()} 大连理工大学FlexCrew街舞社 - 领队管理端
                </div>
            </div>
        </div>
    );
};

export default LeaderLayout; 