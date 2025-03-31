"use client";

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

// 定义网站的主要部分
const sections = [
    { id: 'hero', label: '首页' },
    { id: 'about', label: '关于我们' },
    { id: 'features-section', label: '特色' }
];

const ScrollIndicator = () => {
    const [activeSection, setActiveSection] = useState('');
    const [isHomePage, setIsHomePage] = useState(false);
    const observersRef = useRef<IntersectionObserver[]>([]);
    const pathname = usePathname();

    // 清理所有观察器
    const cleanupObservers = () => {
        observersRef.current.forEach(observer => observer.disconnect());
        observersRef.current = [];
    };

    // 检测当前页面是否为首页
    useEffect(() => {
        setIsHomePage(pathname === '/');

        // 页面变化时清理观察器
        return cleanupObservers;
    }, [pathname]);

    // 设置交叉观察器监听各部分
    useEffect(() => {
        if (!isHomePage) return;

        // 等待DOM完全加载
        const timer = setTimeout(() => {
            cleanupObservers();

            // 为每个部分创建交叉观察器
            sections.forEach(section => {
                const element = document.getElementById(section.id);
                if (!element) return;

                const observer = new IntersectionObserver(
                    (entries) => {
                        entries.forEach(entry => {
                            // 当元素可见比例超过阈值时设为活动部分
                            if (entry.isIntersecting && entry.intersectionRatio >= 0.3) {
                                setActiveSection(section.id);
                            }
                        });
                    },
                    {
                        root: document.querySelector('.main-container'),
                        rootMargin: "-100px 0px 0px 0px", // 考虑导航栏高度
                        threshold: [0.1, 0.3, 0.5]  // 多个阈值提高精度
                    }
                );

                observer.observe(element);
                observersRef.current.push(observer);
            });

            // 默认激活顶部部分
            if (sections.length > 0) {
                setActiveSection(sections[0].id);
            }
        }, 500); // 稍微延迟以确保DOM已加载

        return () => {
            clearTimeout(timer);
            cleanupObservers();
        };
    }, [isHomePage]);

    // 滚动到指定部分的通用函数
    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        const mainContainer = document.querySelector('.main-container');

        if (!element || !mainContainer) return;

        // 计算元素位置，考虑相对偏移
        const elementRect = element.getBoundingClientRect();
        const containerRect = mainContainer.getBoundingClientRect();

        // 计算当前滚动位置
        const currentScrollTop = mainContainer.scrollTop;

        // 计算目标元素相对于容器的偏移
        const relativeTop = elementRect.top - containerRect.top + currentScrollTop;

        // 减去导航栏高度和一点额外空间
        const navbarOffset = id === 'hero' ? 0 : 100; // 首页不需要偏移，其他部分需要

        mainContainer.scrollTo({
            top: relativeTop - navbarOffset,
            behavior: 'smooth'
        });
    };

    // 仅在首页显示滚动指示器
    if (!isHomePage) return null;

    return (
        <div className="scroll-indicator">
            {sections.map(section => (
                <div
                    key={section.id}
                    className={`scroll-indicator-dot ${activeSection === section.id ? 'active' : ''}`}
                    onClick={() => scrollToSection(section.id)}
                    title={section.label}
                />
            ))}
        </div>
    );
};

export default ScrollIndicator; 