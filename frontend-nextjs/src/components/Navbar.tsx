"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const { user, isAuthenticated, logout } = useAuth();

    // 处理菜单切换
    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
        // 关闭用户菜单（如果打开）
        if (isUserMenuOpen) setIsUserMenuOpen(false);
    };

    // 处理用户菜单切换
    const toggleUserMenu = (e: React.MouseEvent) => {
        e.stopPropagation(); // 阻止事件冒泡
        setIsUserMenuOpen(!isUserMenuOpen);
        // 关闭主菜单（如果打开）
        if (isMenuOpen) setIsMenuOpen(false);
    };

    // 监听滚动事件，控制导航栏样式
    useEffect(() => {
        const handleScroll = () => {
            // 获取滚动容器
            const scrollContainer = document.querySelector('.main-container');
            if (!scrollContainer) return;

            if (scrollContainer.scrollTop > 30) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };

        // 获取滚动容器并添加事件监听
        const scrollContainer = document.querySelector('.main-container');
        if (scrollContainer) {
            scrollContainer.addEventListener('scroll', handleScroll);
        }

        // 组件卸载时移除事件监听
        return () => {
            if (scrollContainer) {
                scrollContainer.removeEventListener('scroll', handleScroll);
            }
        };
    }, []);

    // 关闭菜单点击外部区域
    useEffect(() => {
        const handleClickOutside = () => {
            if (isMenuOpen) setIsMenuOpen(false);
            if (isUserMenuOpen) setIsUserMenuOpen(false);
        };

        // 只有当菜单打开时才添加点击事件监听器
        if (isMenuOpen || isUserMenuOpen) {
            document.addEventListener('click', handleClickOutside);
        }

        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [isMenuOpen, isUserMenuOpen]);

    // 处理登出
    const handleLogout = () => {
        logout();
        router.push('/');
        setIsUserMenuOpen(false);
    };

    // 处理点击Home链接，滚动到顶部
    const handleHomeClick = (e: React.MouseEvent) => {
        // 仅在当前页面是首页时处理
        if (pathname === '/') {
            e.preventDefault();
            const scrollContainer = document.querySelector('.main-container');
            if (scrollContainer) {
                scrollContainer.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            }
            // 关闭菜单
            setIsMenuOpen(false);
        }
    };

    return (
        <nav
            className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-black shadow-md py-2' : 'bg-black bg-opacity-80 py-4'
                }`}
        >
            <div className="container mx-auto px-4 flex justify-between items-center">
                {/* 品牌Logo */}
                <Link href="/" onClick={handleHomeClick} className="flex items-center">
                    <Image
                        src={`${process.env.NEXT_PUBLIC_COS_BASE_URL}/pages%2Fhome%2Flogo-icon.png`}
                        alt="街舞社Logo"
                        width={40}
                        height={40}
                        className="mr-2"
                        referrerPolicy="origin"
                    />
                    <span className="font-bold text-xl text-white">
                        大连理工大学街舞社
                    </span>
                </Link>

                {/* 桌面菜单 */}
                <div className="hidden md:flex items-center space-x-6">
                    <Link
                        href="/"
                        onClick={handleHomeClick}
                        className="text-white hover:text-yellow-400 transition duration-300"
                    >
                        首页
                    </Link>
                    <Link
                        href="/schedule"
                        className="text-white hover:text-yellow-400 transition duration-300"
                    >
                        课程表
                    </Link>

                    {isAuthenticated ? (
                        <div className="relative" onClick={(e) => e.stopPropagation()}>
                            <button
                                onClick={toggleUserMenu}
                                className="flex items-center text-white hover:text-yellow-400 transition duration-300"
                            >
                                <span className="mr-1">{user?.username}</span>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className={`h-4 w-4 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 9l-7 7-7-7"
                                    />
                                </svg>
                            </button>

                            {/* 用户下拉菜单 */}
                            {isUserMenuOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                                    <Link
                                        href="/user/profile"
                                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        onClick={() => setIsUserMenuOpen(false)}
                                    >
                                        个人信息
                                    </Link>

                                    {/* 管理员菜单项 */}
                                    {user?.role === 'admin' && (
                                        <>
                                            <Link
                                                href="/admin/users"
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                onClick={() => setIsUserMenuOpen(false)}
                                            >
                                                用户管理
                                            </Link>
                                            <Link
                                                href="/admin/courses"
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                onClick={() => setIsUserMenuOpen(false)}
                                            >
                                                课程管理
                                            </Link>
                                        </>
                                    )}

                                    {/* 舞种领队菜单项 */}
                                    {user?.role === 'leader' && user?.dance_type && (
                                        <>
                                            <Link
                                                href="/leaders/courses"
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                onClick={() => setIsUserMenuOpen(false)}
                                            >
                                                课程管理
                                            </Link>
                                            <Link
                                                href="/leaders/mytype"
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                onClick={() => setIsUserMenuOpen(false)}
                                            >
                                                我的舞种
                                            </Link>
                                        </>
                                    )}

                                    <button
                                        onClick={handleLogout}
                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        退出登录
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            <Link
                                href="/auth/login"
                                className="text-white border border-white px-4 py-1 rounded hover:bg-yellow-500 hover:text-black hover:border-yellow-500 transition duration-300"
                            >
                                登录
                            </Link>
                            <Link
                                href="/auth/register"
                                className="bg-yellow-500 text-black px-4 py-1 rounded hover:bg-yellow-600 transition duration-300"
                            >
                                注册
                            </Link>
                        </>
                    )}
                </div>

                {/* 移动端菜单按钮 */}
                <div className="md:hidden flex items-center">
                    {isAuthenticated && (
                        <button
                            onClick={toggleUserMenu}
                            className="mr-4 text-white"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-6 w-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                            </svg>
                        </button>
                    )}

                    <button
                        onClick={toggleMenu}
                        className="text-white"
                    >
                        {isMenuOpen ? (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-6 w-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        ) : (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-6 w-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 6h16M4 12h16M4 18h16"
                                />
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            {/* 移动端下拉菜单 */}
            {isMenuOpen && (
                <div className="md:hidden bg-black shadow-lg">
                    <div className="container mx-auto px-4 py-2">
                        <Link
                            href="/"
                            onClick={handleHomeClick}
                            className="block py-2 text-white hover:text-yellow-400"
                        >
                            首页
                        </Link>
                        <Link
                            href="/schedule"
                            className="block py-2 text-white hover:text-yellow-400"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            课程表
                        </Link>
                        {!isAuthenticated && (
                            <>
                                <Link
                                    href="/auth/login"
                                    className="block py-2 text-white hover:text-yellow-400"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    登录
                                </Link>
                                <Link
                                    href="/auth/register"
                                    className="block py-2 text-white hover:text-yellow-400"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    注册
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* 移动端用户菜单 */}
            {isUserMenuOpen && isAuthenticated && (
                <div className="md:hidden bg-black shadow-lg">
                    <div className="container mx-auto px-4 py-2">
                        <div className="py-2 border-b border-gray-700">
                            <div className="font-medium text-white">{user?.username}</div>
                            <div className="text-sm text-gray-400">{user?.email}</div>
                            <div className="text-xs text-yellow-500 mt-1">
                                {user?.role === 'admin' && '超级管理员'}
                                {user?.role === 'leader' && `舞种领队 (${user.dance_type})`}
                                {user?.role === 'member' && '普通社员'}
                            </div>
                        </div>
                        <Link
                            href="/user/profile"
                            className="block py-2 text-white hover:text-yellow-400"
                            onClick={() => setIsUserMenuOpen(false)}
                        >
                            个人信息
                        </Link>

                        {/* 管理员菜单项 */}
                        {user?.role === 'admin' && (
                            <>
                                <Link
                                    href="/admin/users"
                                    className="block py-2 text-white hover:text-yellow-400"
                                    onClick={() => setIsUserMenuOpen(false)}
                                >
                                    用户管理
                                </Link>
                                <Link
                                    href="/admin/courses"
                                    className="block py-2 text-white hover:text-yellow-400"
                                    onClick={() => setIsUserMenuOpen(false)}
                                >
                                    课程管理
                                </Link>
                            </>
                        )}

                        {/* 舞种领队菜单项 */}
                        {user?.role === 'leader' && user?.dance_type && (
                            <>
                                <Link
                                    href="/leaders/courses"
                                    className="block py-2 text-white hover:text-yellow-400"
                                    onClick={() => setIsUserMenuOpen(false)}
                                >
                                    课程管理
                                </Link>
                                <Link
                                    href="/leaders/mytype"
                                    className="block py-2 text-white hover:text-yellow-400"
                                    onClick={() => setIsUserMenuOpen(false)}
                                >
                                    我的舞种
                                </Link>
                            </>
                        )}

                        <button
                            onClick={handleLogout}
                            className="block w-full text-left py-2 text-white hover:text-yellow-400"
                        >
                            退出登录
                        </button>
                    </div>
                </div>
            )}
        </nav>
    );
} 