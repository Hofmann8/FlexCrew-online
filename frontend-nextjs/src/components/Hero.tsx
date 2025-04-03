"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const Hero = () => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [scrollOffset, setScrollOffset] = useState(0);

    useEffect(() => {
        // 页面加载动画
        setIsLoaded(true);

        // 监听滚动事件
        const handleScroll = () => {
            const scrollContainer = document.querySelector('.main-container');
            if (scrollContainer) {
                const scrollPosition = scrollContainer.scrollTop;
                setScrollOffset(scrollPosition * 0.5); // 视差效果
                if (scrollPosition > 100) {
                    setIsScrolled(true);
                } else {
                    setIsScrolled(false);
                }
            }
        };

        const scrollContainer = document.querySelector('.main-container');
        if (scrollContainer) {
            scrollContainer.addEventListener('scroll', handleScroll);
            return () => scrollContainer.removeEventListener('scroll', handleScroll);
        }
    }, []);

    // 平滑滚动到指定元素，增强版
    const scrollToElement = (elementId: string) => {
        // 获取目标元素和滚动容器
        const targetElement = document.getElementById(elementId);
        const scrollContainer = document.querySelector('.main-container');
        const heroElement = document.getElementById('hero');

        if (!targetElement || !scrollContainer || !heroElement) {
            return;
        }

        // 为"关于我们"部分计算精确的滚动位置
        if (elementId === 'about') {
            // 获取Hero元素的高度
            const heroHeight = heroElement.getBoundingClientRect().height;

            // 使用固定的导航栏高度(56px)，即滚动后的高度，而不是动态获取
            // 这样可以确保计算准确，不受当前导航栏状态影响
            const fixedNavbarHeight = 56; // 滚动后的导航栏高度

            // 计算滚动位置：Hero的高度减去导航栏的高度，这样导航栏底部将正好与Hero底部对齐
            const scrollToPosition = heroHeight - fixedNavbarHeight;

            scrollContainer.scrollTo({
                top: scrollToPosition,
                behavior: 'smooth'
            });
            return;
        }

        // 对于其他元素使用原有的计算逻辑
        // 计算所有影响滚动位置的因素
        // 1. 导航栏高度
        const navbar = document.querySelector('nav');
        const navbarHeight = navbar ? navbar.getBoundingClientRect().height : 80; // 默认80px

        // 2. 目标元素的完整位置信息
        const targetRect = targetElement.getBoundingClientRect();
        const containerRect = scrollContainer.getBoundingClientRect();

        // 3. 当前滚动位置
        const currentScrollTop = scrollContainer.scrollTop;

        // 4. 计算目标元素相对于容器顶部的偏移量
        const relativeTop = targetRect.top - containerRect.top + currentScrollTop;

        // 5. 其他元素的额外偏移量（如果有需要）
        const additionalOffset = 0;

        // 最终滚动位置 = 相对位置 - 导航栏高度 + 额外偏移
        const scrollToPosition = relativeTop - navbarHeight + additionalOffset;

        // 执行滚动
        scrollContainer.scrollTo({
            top: scrollToPosition,
            behavior: 'smooth'
        });
    };

    return (
        <div id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">
            {/* 背景大合照 - 视差效果 */}
            <div className="absolute inset-0 z-0 pointer-events-none" style={{ transform: `translateY(${scrollOffset}px)` }}>
                <Image
                    src={`${process.env.NEXT_PUBLIC_COS_BASE_URL}/pages%2Fhome%2Fgroup-photo.jpg`}
                    alt="FlexCrew团体照"
                    fill
                    priority
                    referrerPolicy="origin"
                    className="object-cover brightness-50"
                />
            </div>

            <div className="container mx-auto px-4 z-10 text-center text-white">
                <div className={`mb-8 flex justify-center transition-all duration-1000 ease-out transform ${isLoaded ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'}`}>
                    {/* 社徽展示 - 添加入场和悬停动画 */}
                    <div className="w-40 h-40 relative group">
                        <Image
                            src={`${process.env.NEXT_PUBLIC_COS_BASE_URL}/pages%2Fhome%2Flogo.png`}
                            alt="FlexCrew社徽"
                            fill
                            referrerPolicy="origin"
                            className="object-contain transition-all duration-500 group-hover:scale-110"
                        />
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full opacity-0 group-hover:opacity-30 blur-md transition-opacity duration-500"></div>
                    </div>
                </div>

                <h1 className={`text-4xl md:text-6xl font-bold mb-4 transition-all duration-1000 delay-300 ease-out transform ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                    大连理工大学FlexCrew街舞社
                </h1>

                <p className={`text-xl md:text-2xl mb-8 max-w-3xl mx-auto transition-all duration-1000 delay-500 ease-out transform ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                    热爱舞蹈，释放激情，展现自我
                </p>

                <div className={`flex flex-col sm:flex-row gap-4 justify-center transition-all duration-1000 delay-700 ease-out transform ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                    <Link
                        href="/schedule"
                        className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-8 rounded-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                    >
                        查看课程表
                    </Link>
                    <button
                        onClick={() => scrollToElement('about')}
                        className="border-2 border-white hover:bg-white hover:text-black font-bold py-3 px-8 rounded-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 relative z-20 cursor-pointer"
                    >
                        了解更多
                    </button>
                </div>

                {/* 向下滚动指示器 */}
                <div className={`absolute bottom-10 left-1/2 transform -translate-x-1/2 transition-all duration-1000 delay-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
                    <button
                        onClick={() => scrollToElement('about')}
                        className="inline-block animate-bounce focus:outline-none relative z-20 cursor-pointer"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Hero; 