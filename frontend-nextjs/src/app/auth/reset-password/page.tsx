"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

// 创建一个内部组件来使用 useSearchParams
const ResetPasswordContent = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { resetPassword, isLoading } = useAuth();

    const [formData, setFormData] = useState({
        userId: '',
        code: '',
        newPassword: '',
        confirmPassword: '',
    });

    const [formError, setFormError] = useState('');
    const [emailValue, setEmailValue] = useState('');
    const [success, setSuccess] = useState(false);

    // 从URL参数中获取userId和email
    useEffect(() => {
        if (searchParams) {
            const userId = searchParams.get('userId');
            const email = searchParams.get('email');

            if (userId) {
                setFormData(prev => ({ ...prev, userId }));
            }

            if (email) {
                setEmailValue(decodeURIComponent(email));
            }
        }
    }, [searchParams]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');

        // 表单验证
        if (!formData.code.trim()) {
            setFormError('请输入验证码');
            return;
        }

        if (!formData.newPassword) {
            setFormError('请输入新密码');
            return;
        }

        if (formData.newPassword.length < 6) {
            setFormError('新密码长度不能少于6个字符');
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            setFormError('两次输入的密码不一致');
            return;
        }

        try {
            // 确保userId是数值类型
            const userId = parseInt(formData.userId, 10);

            if (isNaN(userId)) {
                setFormError('用户ID无效，请返回上一步重试');
                return;
            }

            const result = await resetPassword(userId, formData.code, formData.newPassword);

            if (result) {
                setSuccess(true);
                // 成功后3秒跳转到首页
                setTimeout(() => {
                    router.push('/');
                }, 3000);
            } else {
                setFormError('密码重置失败，请检查验证码是否正确');
            }
        } catch (error) {
            console.error('重置密码过程出错:', error);
            setFormError('重置过程中出错，请稍后再试');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black bg-opacity-95 px-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
                <div className="bg-yellow-500 p-6">
                    <h2 className="text-center text-3xl font-bold text-black">
                        重置密码
                    </h2>
                    <p className="mt-2 text-center text-black">
                        请输入验证码和新密码
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
                                <p className="font-medium">密码重置成功！</p>
                                <p className="mt-1 text-sm">
                                    您的密码已成功重置，正在为您跳转到首页...
                                </p>
                            </div>

                            <Link
                                href="/"
                                className="w-full inline-block text-center bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-4 rounded-md transition-colors"
                            >
                                立即前往首页
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            {emailValue && (
                                <div className="mb-6 p-3 bg-blue-50 rounded-lg">
                                    <p className="text-sm text-blue-800">
                                        重置 <span className="font-medium">{emailValue}</span> 的密码
                                    </p>
                                </div>
                            )}

                            <div className="mb-6">
                                <label htmlFor="code" className="block text-gray-700 font-medium mb-2">
                                    验证码
                                </label>
                                <input
                                    type="text"
                                    id="code"
                                    name="code"
                                    value={formData.code}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                    placeholder="请输入邮箱验证码"
                                    required
                                />
                                <p className="mt-1 text-sm text-gray-500">
                                    输入我们发送到您邮箱的6位验证码
                                </p>
                            </div>

                            <div className="mb-6">
                                <label htmlFor="newPassword" className="block text-gray-700 font-medium mb-2">
                                    新密码
                                </label>
                                <input
                                    type="password"
                                    id="newPassword"
                                    name="newPassword"
                                    value={formData.newPassword}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                    placeholder="请输入新密码"
                                    required
                                />
                                <p className="mt-1 text-sm text-gray-500">
                                    密码长度不少于6个字符
                                </p>
                            </div>

                            <div className="mb-6">
                                <label htmlFor="confirmPassword" className="block text-gray-700 font-medium mb-2">
                                    确认新密码
                                </label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                    placeholder="请再次输入新密码"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-4 rounded-md transition-colors ${isLoading ? 'opacity-70 cursor-not-allowed' : ''
                                    }`}
                            >
                                {isLoading ? '提交中...' : '重置密码'}
                            </button>
                        </form>
                    )}

                    {!success && (
                        <div className="mt-6 flex justify-center space-x-4">
                            <Link href="/auth/forgot-password" className="text-yellow-600 hover:text-yellow-800 font-medium">
                                重新获取验证码
                            </Link>
                            <span className="text-gray-300">|</span>
                            <Link href="/auth/login" className="text-yellow-600 hover:text-yellow-800 font-medium">
                                返回登录
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// 主页面组件使用 Suspense 包裹内部组件
const ResetPasswordPage = () => {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-black bg-opacity-95">
                <div className="text-white text-xl">加载中...</div>
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
};

export default ResetPasswordPage; 