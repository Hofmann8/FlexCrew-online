"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

const VerifyEmailPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { verifyEmail, resendVerification, isLoading } = useAuth();

    const [userId, setUserId] = useState<number | null>(null);
    const [email, setEmail] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [countdown, setCountdown] = useState(600); // 10分钟倒计时
    const [canResend, setCanResend] = useState(false);

    useEffect(() => {
        // 从URL参数获取用户ID和邮箱
        const userIdParam = searchParams.get('userId');
        const emailParam = searchParams.get('email');

        if (userIdParam) {
            setUserId(parseInt(userIdParam, 10));
        }

        if (emailParam) {
            setEmail(emailParam);
        }

        // 如果没有必要的参数，重定向到注册页面
        if (!userIdParam || !emailParam) {
            router.push('/auth/register');
        }
    }, [searchParams, router]);

    useEffect(() => {
        // 倒计时逻辑
        if (countdown > 0) {
            const timer = setTimeout(() => {
                setCountdown(prev => prev - 1);
            }, 1000);

            return () => clearTimeout(timer);
        } else {
            setCanResend(true);
        }
    }, [countdown]);

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!verificationCode.trim()) {
            setError('请输入验证码');
            return;
        }

        if (!userId) {
            setError('无效的用户ID');
            return;
        }

        try {
            const result = await verifyEmail(userId, verificationCode);
            if (result) {
                setSuccess('邮箱验证成功！正在跳转到主页...');
                // 延迟2秒后跳转到首页
                setTimeout(() => {
                    router.push('/');
                }, 2000);
            } else {
                setError('验证码错误或已过期');
            }
        } catch (error: any) {
            setError(error.message || '验证过程中发生错误');
        }
    };

    const handleResendCode = async () => {
        if (!email) {
            setError('无效的邮箱地址');
            return;
        }

        try {
            const result = await resendVerification(email);
            if (result) {
                setSuccess('验证码已重新发送到您的邮箱，请查收');
                setCountdown(600); // 重置倒计时
                setCanResend(false);
            } else {
                setError('重新发送验证码失败，请稍后再试');
            }
        } catch (error: any) {
            setError(error.message || '重新发送验证码过程中发生错误');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black bg-opacity-95 px-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
                <div className="bg-yellow-500 p-6">
                    <h2 className="text-center text-3xl font-bold text-black">
                        验证您的邮箱
                    </h2>
                    <p className="mt-2 text-center text-black">
                        请输入发送到您邮箱的验证码
                    </p>
                </div>

                <div className="p-8">
                    {error && (
                        <div className="mb-4 bg-red-100 text-red-700 p-3 rounded">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-4 bg-green-100 text-green-700 p-3 rounded">
                            {success}
                        </div>
                    )}

                    <div className="mb-4 bg-blue-50 p-4 rounded-lg">
                        <p className="text-blue-800">
                            验证码已发送至：<span className="font-semibold">{email}</span>
                        </p>
                        <p className="mt-2 text-sm text-blue-600">
                            请查收邮件并在下方输入验证码。验证码有效期为10分钟。
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="mb-6">
                            <label htmlFor="verificationCode" className="block text-gray-700 font-medium mb-2">
                                验证码
                            </label>
                            <input
                                type="text"
                                id="verificationCode"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                placeholder="请输入6位数验证码"
                                required
                            />
                            <div className="mt-2 flex justify-between items-center">
                                <span className="text-sm text-gray-500">
                                    验证码有效期: {formatTime(countdown)}
                                </span>
                                <button
                                    type="button"
                                    onClick={handleResendCode}
                                    disabled={!canResend || isLoading}
                                    className={`text-sm ${canResend ? 'text-yellow-600 hover:text-yellow-800' : 'text-gray-400'}`}
                                >
                                    {canResend ? '重新发送验证码' : '等待倒计时结束'}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-4 rounded-md transition-colors ${isLoading ? 'opacity-70 cursor-not-allowed' : ''
                                }`}
                        >
                            {isLoading ? '验证中...' : '验证邮箱'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <Link href="/auth/login" className="text-yellow-600 hover:text-yellow-800 font-medium">
                            返回登录
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmailPage; 