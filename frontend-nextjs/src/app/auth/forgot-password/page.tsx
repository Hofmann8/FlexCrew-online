"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

const ForgotPasswordPage = () => {
    const router = useRouter();
    const { forgotPassword, isLoading } = useAuth();
    const [email, setEmail] = useState('');
    const [formError, setFormError] = useState('');
    const [success, setSuccess] = useState(false);
    const [userId, setUserId] = useState<number | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');

        // 表单验证
        if (!email.trim()) {
            setFormError('请输入邮箱地址');
            return;
        }

        // 验证是否为大连理工大学邮箱
        if (!email.endsWith('@mail.dlut.edu.cn') && !email.endsWith('@dlut.edu.cn')) {
            setFormError('请输入大连理工大学邮箱（@mail.dlut.edu.cn 或 @dlut.edu.cn）');
            return;
        }

        try {
            // 通过上下文发送忘记密码请求
            const result = await forgotPassword(email);

            if (result) {
                // 如果result是对象类型，包含userId
                if (typeof result === 'object' && result.userId) {
                    setUserId(result.userId);
                }

                setSuccess(true);
            } else {
                setFormError('发送验证码失败，请稍后再试');
            }
        } catch (error) {
            console.error('重置密码过程出错:', error);
            setFormError('发送过程中出错，请稍后再试');
        }
    };

    const handleGoToReset = () => {
        if (userId) {
            router.push(`/auth/reset-password?userId=${userId}&email=${encodeURIComponent(email)}`);
        } else {
            router.push(`/auth/reset-password?email=${encodeURIComponent(email)}`);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black bg-opacity-95 px-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
                <div className="bg-yellow-500 p-6">
                    <h2 className="text-center text-3xl font-bold text-black">
                        忘记密码
                    </h2>
                    <p className="mt-2 text-center text-black">
                        请输入您的注册邮箱，我们将发送验证码
                    </p>
                </div>

                <div className="p-8">
                    {formError && (
                        <div className="mb-4 bg-red-100 text-red-700 p-3 rounded">
                            {formError}
                        </div>
                    )}

                    {success ? (
                        <div className="text-center">
                            <div className="mb-4 bg-green-100 text-green-700 p-4 rounded-lg">
                                <p className="font-medium">验证码已发送</p>
                                <p className="mt-1 text-sm">
                                    我们已向 {email} 发送了密码重置验证码，有效期为10分钟。
                                </p>
                            </div>

                            <button
                                onClick={handleGoToReset}
                                className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-4 rounded-md transition-colors mb-4"
                            >
                                前往重置密码
                            </button>

                            <p className="text-sm text-gray-600">
                                没有收到验证码？请检查您的垃圾邮件文件夹或
                                <button
                                    onClick={handleSubmit}
                                    className="text-yellow-600 hover:text-yellow-800 font-medium ml-1"
                                >
                                    重新发送
                                </button>
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div className="mb-6">
                                <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
                                    电子邮箱
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                    placeholder="请输入您的大连理工大学邮箱"
                                    required
                                />
                                <p className="mt-1 text-sm text-gray-500">
                                    我们将向此邮箱发送密码重置验证码
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-4 rounded-md transition-colors ${isLoading ? 'opacity-70 cursor-not-allowed' : ''
                                    }`}
                            >
                                {isLoading ? '发送中...' : '发送验证码'}
                            </button>
                        </form>
                    )}

                    <div className="mt-6 flex justify-center space-x-4">
                        <Link href="/auth/login" className="text-yellow-600 hover:text-yellow-800 font-medium">
                            返回登录
                        </Link>
                        <span className="text-gray-300">|</span>
                        <Link href="/auth/register" className="text-yellow-600 hover:text-yellow-800 font-medium">
                            注册新账号
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage; 