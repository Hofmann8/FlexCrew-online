"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

const RegisterPage = () => {
    const router = useRouter();
    const { register, isLoading } = useAuth();

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    const [formError, setFormError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');

        // 表单验证
        if (!formData.username.trim() || !formData.email.trim() ||
            !formData.password.trim() || !formData.confirmPassword.trim()) {
            setFormError('所有字段都是必填的');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setFormError('两次输入的密码不一致');
            return;
        }

        // 邮箱格式验证
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setFormError('请输入有效的邮箱地址');
            return;
        }

        try {
            // 执行注册
            const success = await register(
                formData.username,
                formData.email,
                formData.password
            );

            if (success) {
                // 注册成功，重定向到登录页面
                router.push('/auth/login?registered=true');
            } else {
                setFormError('注册失败，请稍后再试');
            }
        } catch (error: any) {
            setFormError(error.message || '注册过程中发生错误');
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
                        创建新账户
                    </p>
                </div>

                <div className="p-8">
                    {formError && (
                        <div className="mb-4 bg-red-100 text-red-700 p-3 rounded">
                            {formError}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
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
                                placeholder="请设置您的用户名"
                                required
                            />
                        </div>

                        <div className="mb-4">
                            <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
                                邮箱
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                placeholder="请输入您的邮箱地址"
                                required
                            />
                        </div>

                        <div className="mb-4">
                            <label htmlFor="password" className="block text-gray-700 font-medium mb-2">
                                密码
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                placeholder="请设置您的密码"
                                required
                            />
                        </div>

                        <div className="mb-6">
                            <label htmlFor="confirmPassword" className="block text-gray-700 font-medium mb-2">
                                确认密码
                            </label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                placeholder="请再次输入密码"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-4 rounded-md transition-colors ${isLoading ? 'opacity-70 cursor-not-allowed' : ''
                                }`}
                        >
                            {isLoading ? '注册中...' : '注册'}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-gray-600">
                        已有账号？{' '}
                        <Link href="/auth/login" className="text-yellow-600 hover:text-yellow-800 font-medium">
                            立即登录
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage; 