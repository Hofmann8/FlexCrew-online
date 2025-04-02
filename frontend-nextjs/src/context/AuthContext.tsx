"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthContextType, RegisterResponse } from '@/types';
import { authApi } from '@/services/api';

// 创建认证上下文
const AuthContext = createContext<AuthContextType>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    login: async () => false,
    logout: () => { },
    register: async () => null,
    verifyEmail: async () => false,
    resendVerification: async () => false,
    refreshUser: async () => false,
});

// 认证提供者组件
export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // 检查用户是否已经登录（从localStorage和API验证）
    useEffect(() => {
        const checkAuthStatus = async () => {
            try {
                setIsLoading(true);
                console.log('检查认证状态...');

                // 从localStorage获取token和用户信息
                const token = localStorage.getItem('auth_token');
                const savedUserInfo = localStorage.getItem('user_info');

                console.log('本地存储状态:', {
                    hasToken: !!token,
                    hasUserInfo: !!savedUserInfo
                });

                if (!token) {
                    console.log('未找到令牌，清除认证状态');
                    setUser(null);
                    setIsLoading(false);
                    return;
                }

                // 先从本地尝试恢复用户信息，减少API请求
                let userFromStorage = null;
                if (savedUserInfo) {
                    try {
                        userFromStorage = JSON.parse(savedUserInfo);
                        console.log('从本地存储恢复用户信息:', userFromStorage);
                        // 临时设置用户，即使API可能失败也能有基本功能
                        setUser(userFromStorage);
                    } catch (parseError) {
                        console.error('解析本地用户信息失败:', parseError);
                    }
                }

                // 无论是否有本地用户信息，都尝试验证token有效性并获取最新用户信息
                try {
                    console.log('验证令牌并获取最新用户信息...');
                    const userData = await authApi.getCurrentUser();

                    // 处理多种可能的响应格式
                    let validUserData = null;

                    if (userData && userData.id) {
                        validUserData = userData;
                    } else if (userData && userData.data && userData.data.id) {
                        validUserData = userData.data;
                    } else if (userData && userData.user && userData.user.id) {
                        validUserData = userData.user;
                    }

                    if (validUserData) {
                        console.log('API返回有效用户数据，更新状态');
                        // 数据兼容性处理：确保同时有dance_type和danceType字段
                        if (validUserData.danceType && !validUserData.dance_type) {
                            validUserData.dance_type = validUserData.danceType;
                        } else if (validUserData.dance_type && !validUserData.danceType) {
                            validUserData.danceType = validUserData.dance_type;
                        }
                        // 更新localStorage中的用户信息
                        localStorage.setItem('user_info', JSON.stringify(validUserData));
                        setUser(validUserData);
                    } else {
                        console.warn('API未返回有效用户数据，但保留本地用户信息');
                        // 如果API未返回有效数据但我们有本地存储的用户信息，继续使用本地数据
                        // 这样可以避免因API临时问题而导致用户被登出
                        if (!userFromStorage) {
                            console.error('无本地用户信息可用，清除认证状态');
                            localStorage.removeItem('auth_token');
                            localStorage.removeItem('user_info');
                            setUser(null);
                        }
                    }
                } catch (apiError) {
                    console.error('验证令牌API调用失败:', apiError);
                    // API调用失败时，如果有本地用户信息，保持用户登录状态
                    // 这样在网络不稳定时用户体验更好
                    if (!userFromStorage) {
                        console.warn('API失败且无本地用户信息，清除认证状态');
                        localStorage.removeItem('auth_token');
                        localStorage.removeItem('user_info');
                        setUser(null);
                    }
                }
            } catch (error) {
                console.error('认证状态检查失败:', error);
                // 发生严重错误时，清除本地存储
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user_info');
                setUser(null);
            } finally {
                setIsLoading(false);
                console.log('认证状态检查完成');
            }
        };

        checkAuthStatus();

        // 设置自动周期性验证，确保长时间使用时token有效
        const intervalId = setInterval(checkAuthStatus, 30 * 60 * 1000); // 每30分钟检查一次

        // 清理函数
        return () => clearInterval(intervalId);
    }, []);

    // 登录方法
    const login = async (username: string, password: string): Promise<boolean | { userId: number, email: string, emailVerified: false }> => {
        try {
            setIsLoading(true);
            console.log('尝试登录...');

            const response = await authApi.login(username, password);
            console.log('登录响应:', response);

            // 检查是否是邮箱未验证的情况
            if (response.success === false && response.data &&
                response.data.emailVerified === false &&
                response.data.userId && response.data.email) {
                console.log('邮箱未验证，需要完成验证');
                return {
                    userId: response.data.userId,
                    email: response.data.email,
                    emailVerified: false
                };
            }

            // 检查响应格式：可能是各种不同格式
            let token, userData;

            // 尝试解析不同格式的响应数据
            if (response.token && response.user) {
                // 直接返回格式: { token, user }
                token = response.token;
                userData = response.user;
            } else if (response.data && response.data.token && response.data.user) {
                // 嵌套在data属性中: { data: { token, user } }
                token = response.data.token;
                userData = response.data.user;
            } else if (response.success && response.data) {
                // 通用API响应格式: { success: true, data: { token, user } }
                if (response.data.token && response.data.user) {
                    token = response.data.token;
                    userData = response.data.user;
                }
            } else if (typeof response === 'string') {
                // 纯文本格式，可能只是返回了token
                try {
                    // 尝试解析为JSON对象
                    const parsedData = JSON.parse(response);
                    if (parsedData.token) {
                        token = parsedData.token;
                        // 尝试从localStorage获取已存储的用户信息
                        const savedUserInfo = localStorage.getItem('user_info');
                        if (savedUserInfo) {
                            try {
                                userData = JSON.parse(savedUserInfo);
                            } catch (e) {
                                console.error('解析保存的用户信息失败:', e);
                            }
                        }
                    }
                } catch (e) {
                    // 可能就是一个简单的token字符串
                    token = response;
                }
            }

            // 如果我们至少有token，可以尝试获取用户信息
            if (token && !userData) {
                try {
                    // 先保存token以便能够进行认证请求
                    localStorage.setItem('auth_token', token);
                    console.log('令牌已保存，尝试获取用户信息');

                    // 调用API获取用户信息
                    let apiUserData = await authApi.getCurrentUser();

                    // 检查用户数据格式
                    if (apiUserData && !apiUserData.id && apiUserData.data) {
                        apiUserData = apiUserData.data;
                    } else if (apiUserData && apiUserData.user) {
                        apiUserData = apiUserData.user;
                    }

                    if (apiUserData && apiUserData.id) {
                        userData = apiUserData;
                        console.log('成功获取用户信息');
                    } else {
                        console.warn('API返回的用户数据无效');
                    }
                } catch (userInfoError) {
                    console.error('获取用户信息失败:', userInfoError);
                }
            }

            if (token) {
                console.log('登录成功，保存认证信息');
                // 保存token到localStorage
                localStorage.setItem('auth_token', token);

                // 如果有用户数据，也保存起来
                if (userData) {
                    // 数据兼容性处理：确保同时有dance_type和danceType字段
                    if (userData.danceType && !userData.dance_type) {
                        userData.dance_type = userData.danceType;
                    } else if (userData.dance_type && !userData.danceType) {
                        userData.danceType = userData.dance_type;
                    }
                    localStorage.setItem('user_info', JSON.stringify(userData));
                    setUser(userData);
                } else {
                    // 没有用户数据但有token，创建一个最小用户对象
                    console.warn('无用户数据，创建临时用户对象');
                    const minimumUser = {
                        id: 'unknown',
                        username: username,
                        name: username,
                        email: '',
                        role: 'student' as const
                    };
                    localStorage.setItem('user_info', JSON.stringify(minimumUser));
                    setUser(minimumUser);
                }

                return true;
            } else {
                console.error('登录失败，未获取到令牌');
                return false;
            }
        } catch (error) {
            console.error('登录过程发生错误:', error);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    // 登出方法
    const logout = () => {
        console.log('执行登出');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_info');
        setUser(null);
    };

    // 注册方法
    const register = async (username: string, name: string, email: string, password: string): Promise<RegisterResponse | null> => {
        try {
            setIsLoading(true);
            console.log('执行注册...');

            const response = await authApi.register(username, name, email, password);
            console.log('注册响应:', response);

            if (response.success) {
                console.log('注册成功，等待邮箱验证');
                return response.data as RegisterResponse;
            }

            console.error('注册失败:', response.message);
            return null;
        } catch (error) {
            console.error('注册过程发生错误:', error);
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    // 验证邮箱方法
    const verifyEmail = async (userId: number, code: string): Promise<boolean> => {
        try {
            setIsLoading(true);
            console.log('验证邮箱...');

            const response = await authApi.verifyEmail(userId, code);
            console.log('验证邮箱响应:', response);

            if (response.success && response.data && response.data.token) {
                console.log('邮箱验证成功，保存认证信息');

                const token = response.data.token;
                const userData = response.data.user;

                // 保存token和用户信息到localStorage
                localStorage.setItem('auth_token', token);

                if (userData) {
                    // 数据兼容性处理：确保同时有dance_type和danceType字段
                    if (userData.danceType && !userData.dance_type) {
                        userData.dance_type = userData.danceType;
                    } else if (userData.dance_type && !userData.danceType) {
                        userData.danceType = userData.dance_type;
                    }
                    localStorage.setItem('user_info', JSON.stringify(userData));
                    setUser(userData);
                }

                return true;
            }

            console.error('邮箱验证失败:', response.message);
            return false;
        } catch (error) {
            console.error('邮箱验证过程发生错误:', error);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    // 重新发送验证码方法
    const resendVerification = async (email: string): Promise<boolean> => {
        try {
            setIsLoading(true);
            console.log('重新发送验证码...');

            const response = await authApi.resendVerification(email);
            console.log('重新发送验证码响应:', response);

            if (response.success) {
                console.log('验证码已重新发送');
                return true;
            }

            console.error('重新发送验证码失败:', response.message);
            return false;
        } catch (error) {
            console.error('重新发送验证码过程发生错误:', error);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    // 刷新用户信息的方法
    const refreshUser = async (): Promise<boolean> => {
        try {
            console.log('刷新用户信息...');
            const userData = await authApi.getCurrentUser();

            // 处理多种可能的响应格式
            let validUserData = null;

            if (userData && userData.id) {
                validUserData = userData;
            } else if (userData && userData.data && userData.data.id) {
                validUserData = userData.data;
            } else if (userData && userData.user && userData.user.id) {
                validUserData = userData.user;
            }

            if (validUserData) {
                console.log('获取到最新用户信息，更新状态');
                // 数据兼容性处理：确保同时有dance_type和danceType字段
                if (validUserData.danceType && !validUserData.dance_type) {
                    validUserData.dance_type = validUserData.danceType;
                } else if (validUserData.dance_type && !validUserData.danceType) {
                    validUserData.danceType = validUserData.dance_type;
                }
                // 更新localStorage中的用户信息
                localStorage.setItem('user_info', JSON.stringify(validUserData));
                setUser(validUserData);
                return true;
            }
            return false;
        } catch (error) {
            console.error('刷新用户信息失败:', error);
            return false;
        }
    };

    // 判断用户是否已认证
    const isAuthenticated = !!user;

    // 提供上下文值
    const contextValue: AuthContextType = {
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        register,
        verifyEmail,
        resendVerification,
        refreshUser,
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
}

// 自定义Hook，方便使用AuthContext
export const useAuth = () => useContext(AuthContext); 