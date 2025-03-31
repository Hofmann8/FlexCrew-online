"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthContextType } from '@/types';
import { authApi } from '@/services/api';

// 创建认证上下文
const AuthContext = createContext<AuthContextType>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    login: async () => false,
    logout: () => { },
    register: async () => false,
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
                // 从localStorage获取token
                const token = localStorage.getItem('auth_token');

                if (!token) {
                    setUser(null);
                    return;
                }

                // 验证token有效性并获取用户信息
                const userData = await authApi.getCurrentUser();
                if (userData && userData.id) {
                    setUser(userData);
                } else {
                    // 如果API请求未返回有效用户数据，清除本地存储
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('user_info');
                    setUser(null);
                }
            } catch (error) {
                // 发生错误时，清除本地存储
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user_info');
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuthStatus();
    }, []);

    // 登录方法
    const login = async (username: string, password: string): Promise<boolean> => {
        try {
            setIsLoading(true);

            const response = await authApi.login(username, password);

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
                    // 调用API获取用户信息
                    userData = await authApi.getCurrentUser();

                    // 检查用户数据格式
                    if (userData && !userData.id && userData.data) {
                        userData = userData.data;
                    }
                } catch (userInfoError) {
                }
            }

            if (token) {
                // 保存token到localStorage
                localStorage.setItem('auth_token', token);

                // 如果有用户数据，也保存起来
                if (userData) {
                    localStorage.setItem('user_info', JSON.stringify(userData));
                    setUser(userData);
                } else {
                    // 没有用户数据但有token，创建一个最小用户对象
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
                return false;
            }
        } catch (error) {
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    // 登出方法
    const logout = () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_info');
        setUser(null);
    };

    // 注册方法
    const register = async (username: string, email: string, password: string): Promise<boolean> => {
        try {
            setIsLoading(true);
            const response = await authApi.register(username, email, password);

            if (response.token && response.user) {
                // 保存token和用户信息到localStorage
                localStorage.setItem('auth_token', response.token);
                localStorage.setItem('user_info', JSON.stringify(response.user));
                setUser(response.user);
                return true;
            }
            return false;
        } catch (error) {
            return false;
        } finally {
            setIsLoading(false);
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
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
}

// 自定义Hook，方便使用AuthContext
export const useAuth = () => useContext(AuthContext); 