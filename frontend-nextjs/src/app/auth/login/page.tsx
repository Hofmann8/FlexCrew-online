"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

const LoginPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirect = searchParams?.get('redirect') || '/';
    const { login, isLoading } = useAuth();

    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });

    const [formError, setFormError] = useState('');
    const [emailVerification, setEmailVerification] = useState<{ userId: number, email: string } | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        setEmailVerification(null);

        // 简单表单验证
        if (!formData.username.trim() || !formData.password.trim()) {
            setFormError('用户名和密码不能为空');
            return;
        }

        try {
            const response = await login(formData.username, formData.password);

            if (typeof response === 'boolean' && response) {
                router.push(redirect);
            } else if (typeof response === 'object' && response && !response.emailVerified) {
                // 处理邮箱未验证情况
                setEmailVerification({
                    userId: response.userId,
                    email: response.email
                });
            } else {
                setFormError('登录失败，请检查您的用户名和密码');
            }
        } catch (error) {
            setFormError('登录过程中发生错误，请稍后再试');
        }
    };

    const handleGoToVerify = () => {
        if (emailVerification) {
            router.push(`/auth/verify?userId=${emailVerification.userId}&email=${emailVerification.email}`);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black bg-opacity-95 px-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
                <div className="bg-yellow-500 p-6">
                    <h2 className="text-center text-3xl font-bold text-black">
                        FlexCrew街舞社
                    </h2>
                    <p className="mt-2 text-center text-black">
                        登录您的账户
                    </p>
                </div>

                <div className="p-8">
                    {formError && (
                        <div className="mb-4 bg-red-100 text-red-700 p-3 rounded">
                            {formError}
                        </div>
                    )}

                    {emailVerification && (
                        <div className="mb-4 bg-yellow-100 p-4 rounded-lg">
                            <p className="text-yellow-800 font-medium">邮箱尚未验证</p>
                            <p className="mt-1 text-sm text-yellow-700">
                                您的账号 ({emailVerification.email}) 尚未完成邮箱验证。请验证邮箱后再登录。
                            </p>
                            <button
                                onClick={handleGoToVerify}
                                className="mt-2 w-full bg-yellow-500 hover:bg-yellow-600 text-black font-medium py-2 px-4 rounded text-sm"
                            >
                                去验证邮箱
                            </button>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="mb-6">
                            <label htmlFor="username" className="block text-gray-700 font-medium mb-2">
                                用户名
                            </label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                placeholder="输入您的用户名"
                                required
                            />
                        </div>

                        <div className="mb-6">
                            <div className="flex justify-between mb-2">
                                <label htmlFor="password" className="block text-gray-700 font-medium">
                                    密码
                                </label>
                                <Link href="/auth/forgot-password" className="text-sm text-yellow-600 hover:text-yellow-800">
                                    忘记密码？
                                </Link>
                            </div>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                placeholder="输入您的密码"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-4 rounded-md transition-colors ${isLoading ? 'opacity-70 cursor-not-allowed' : ''
                                }`}
                        >
                            {isLoading ? '登录中...' : '登录'}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-gray-600">
                        还没有账号？{' '}
                        <Link href="/auth/register" className="text-yellow-600 hover:text-yellow-800 font-medium">
                            立即注册
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage; 